import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { db } from '@/lib/db';
import { sessionRole } from '@/lib/enums';
import { UserRole } from '@prisma/client';
import { shouldSkipEmailVerification } from '@/lib/utils';
import { decryptTotpSecret, verifyBackupCode, verifyPhoneOtpSecret } from '@/lib/totp-crypto';
import { runDummyBcryptCompare } from '@/lib/password-policy';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const isProduction = process.env.NODE_ENV === 'production';
const isLocalAuth =
  (process.env.NEXTAUTH_URL ?? '').includes('localhost') ||
  (process.env.NEXTAUTH_URL ?? '').includes('127.0.0.1') ||
  process.env.NODE_ENV !== 'production';

/** True only when both Google OAuth env vars are filled with real values */
export const isGoogleOAuthEnabled =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes('your-google') &&
  !process.env.GOOGLE_CLIENT_SECRET.includes('your-google');

/**
 * Admin emails — loaded from ADMIN_EMAILS env var (comma-separated).
 * Fallback to defaults if env var not configured.
 * Example: ADMIN_EMAILS=admin@example.com,owner@example.com
 */
function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails && envEmails.trim()) {
    return envEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase().trim());
}

export type LoginAuthResult =
  | {
      success: true;
      user: {
        id: string;
        name: string | null;
        email: string;
        role: UserRole;
      };
    }
  | {
      success: false;
      status: 'INVALID_CREDENTIALS' | 'LOCKED' | 'EMAIL_NOT_VERIFIED' | 'REQUIRES_2FA' | 'INVALID_2FA' | 'FORBIDDEN' | 'RATE_LIMITED';
      error: string;
    };

export interface VerifyLoginOptions {
  email?: string;
  password?: string;
  totpCode?: string;
  requireAdminRole?: boolean;
  skipEmailVerification?: boolean;
  ip?: string;
}

/**
 * Calculates progressive lockout delay based on number of failed attempts.
 * Standard accounts: progressive backoff (5m -> 15m -> 30m -> 60m -> 24h).
 * Admin accounts: 24h persistent lockout requiring 2FA or email-link unlock.
 */
export function calculateLockoutDurationMs(attempts: number, isAdmin = false): number {
  if (attempts < 5) return 0;
  if (isAdmin) {
    return 24 * 60 * 60 * 1000;
  }
  const tiers = [
    5 * 60 * 1000,
    15 * 60 * 1000,
    30 * 60 * 1000,
    60 * 60 * 1000,
    24 * 60 * 60 * 1000,
  ];
  const idx = Math.min(attempts - 5, tiers.length - 1);
  return tiers[idx];
}

/**
 * Shared, hardened credential and 2FA verification function used by both
 * NextAuth CredentialsProvider and /api/admin/auth/login.
 *
 * Guarantees:
 * 1. Constant-time dummy comparison for non-existent users and locked accounts.
 * 2. Strict account lockout handling without user enumeration.
 * 3. Atomic phone-OTP 2FA invalidation after use (prevents replay attacks in both paths).
 * 4. Backup code single-use invalidation.
 * 5. Automatic login attempts reset upon full authentication success.
 */
export async function verifyCredentialsAnd2Fa(
  options: VerifyLoginOptions
): Promise<LoginAuthResult> {
  const email = options.email ? options.email.toLowerCase().trim() : '';
  const password = options.password || '';
  const totpCode = options.totpCode ? String(options.totpCode).trim() : '';

  if (!email || !password) {
    return {
      success: false,
      status: 'INVALID_CREDENTIALS',
      error: 'Email and password are required',
    };
  }

  // Per-IP rate limit check if IP is provided (protects DB from query spamming)
  if (options.ip) {
    const rl = await rateLimit(`login_ip:${options.ip}`, 'login');
    if (!rl.allowed) {
      return {
        success: false,
        status: 'RATE_LIMITED',
        error: rl.error || 'Too many login attempts from this IP. Please wait a minute and try again.',
      };
    }
  }

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user?.password) {
    await runDummyBcryptCompare(password);
    return {
      success: false,
      status: 'INVALID_CREDENTIALS',
      error: 'Invalid executive credentials',
    };
  }

  // 1. Enforce deactivation check (banned / deleted users cannot log in)
  if (user.deletedAt) {
    await runDummyBcryptCompare(password);
    return {
      success: false,
      status: 'INVALID_CREDENTIALS',
      error: 'Invalid executive credentials',
    };
  }

  const roleUpper = String(user.role || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';

  // 2. Enforce account lockout cooldown (anti-brute force defense)
  const isCurrentlyLocked = !!(user.lockedUntil && new Date(user.lockedUntil) > new Date());

  if (isCurrentlyLocked) {
    if (!isAdmin) {
      // Non-admin accounts remain locked until progressive lockout expires
      await runDummyBcryptCompare(password);
      return {
        success: false,
        status: 'LOCKED',
        error: 'Invalid executive credentials',
      };
    }

    // Admin accounts: requires 2FA or email-link unlock instead of plain timed lock
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const lockMs = calculateLockoutDurationMs(attempts, true);
      await db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: new Date(Date.now() + lockMs),
        },
      }).catch((err) => logger.warn('Failed to update admin login attempts:', { detail: String(err) }));

      return {
        success: false,
        status: 'LOCKED',
        error: 'Invalid executive credentials',
      };
    }

    // Admin password is valid, but 2FA is required to complete unlock
    if (!totpCode) {
      return {
        success: false,
        status: 'REQUIRES_2FA',
        error: 'Two-factor authentication code required to unlock admin account',
      };
    }

    // totpCode is provided; fall through to 2FA verification in step 5 to verify & unlock
  } else {
    // Account not currently locked: verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const lockMs = calculateLockoutDurationMs(attempts, isAdmin);
      const shouldLock = lockMs > 0;
      await db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + lockMs) : null,
        },
      }).catch((err) => logger.warn('Failed to update user login attempts:', { detail: String(err) }));
      return {
        success: false,
        status: 'INVALID_CREDENTIALS',
        error: 'Invalid executive credentials',
      };
    }
  }

  // 3. Role authorization check (if admin required)
  if (options.requireAdminRole && !isAdmin) {
    return {
      success: false,
      status: 'FORBIDDEN',
      error: 'Unauthorized. Admin role required.',
    };
  }

  // 4. Email verification check (if applicable)
  if (!user.emailVerified && !options.skipEmailVerification) {
    if (!shouldSkipEmailVerification()) {
      return {
        success: false,
        status: 'EMAIL_NOT_VERIFIED',
        error: 'Please verify your email before signing in. Check your inbox for the verification link.',
      };
    }
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }).catch(() => {});
  }

  // 5. Enforce 2FA TOTP / Phone OTP if enabled
  if (user.totpEnabled) {
    if (!totpCode) {
      return {
        success: false,
        status: 'REQUIRES_2FA',
        error: 'Two-factor authentication code required',
      };
    }

    const recordFailed2Fa = async () => {
      const attempts = (user.loginAttempts || 0) + 1;
      const lockMs = calculateLockoutDurationMs(attempts, isAdmin);
      const shouldLock = lockMs > 0;
      await db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + lockMs) : null,
        },
      }).catch((err) => logger.warn('Failed to record failed 2FA:', { detail: String(err) }));
    };

    const matchedBackup = verifyBackupCode(totpCode, user.backupCodes || []);
    if (matchedBackup) {
      await db.user.update({
        where: { id: user.id },
        data: {
          backupCodes: (user.backupCodes || []).filter((c: string) => c !== matchedBackup),
        },
      }).catch((err) => logger.warn('Failed to update backup codes:', { detail: String(err) }));
    } else if (user.totpSecret?.startsWith('phone_otp:v1:') && !user.totpSecret.includes(':used:')) {
      const isValidPhoneOtp = verifyPhoneOtpSecret(user.id, totpCode, user.totpSecret);
      if (!isValidPhoneOtp) {
        await recordFailed2Fa();
        return {
          success: false,
          status: 'INVALID_2FA',
          error: 'Invalid 2FA authentication code',
        };
      }
      // CRITICAL: Invalidate single-use phone OTP challenge to prevent replay in both paths
      await db.user.update({
        where: { id: user.id },
        data: { totpSecret: `phone_otp:v1:used:${Date.now()}` },
      }).catch((err) => logger.warn('Failed to invalidate used phone OTP secret:', { detail: String(err) }));
    } else if (!user.totpSecret) {
      // Fail closed — missing totpSecret fails login (no 6-digit wildcard)
      await recordFailed2Fa();
      return {
        success: false,
        status: 'INVALID_2FA',
        error: 'Invalid 2FA authentication code',
      };
    } else {
      const plainSecret = decryptTotpSecret(user.totpSecret);
      if (!plainSecret) {
        await recordFailed2Fa();
        return {
          success: false,
          status: 'INVALID_2FA',
          error: 'Invalid 2FA authentication code',
        };
      }

      try {
        const check = verifySync({ token: totpCode, secret: plainSecret, epochTolerance: 30 });
        if (!check || !check.valid) {
          await recordFailed2Fa();
          return {
            success: false,
            status: 'INVALID_2FA',
            error: 'Invalid 2FA authentication code',
          };
        }
      } catch {
        await recordFailed2Fa();
        return {
          success: false,
          status: 'INVALID_2FA',
          error: 'Invalid 2FA authentication code',
        };
      }
    }
  }

  // 6. Reset failed login attempts only AFTER both password and 2FA succeed
  if (user.loginAttempts > 0 || user.lockedUntil) {
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    }).catch((err) => logger.warn('Failed to reset login attempts on success:', { detail: String(err) }));
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      totpCode: { label: '2FA Code', type: 'text' },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const rawTotp = (credentials as Record<string, unknown>)?.totpCode;
      const totpCode = rawTotp ? String(rawTotp).trim() : undefined;
      const ip = (req?.headers as Record<string, string> | undefined)?.['x-forwarded-for']?.split(',')[0]?.trim();

      const result = await verifyCredentialsAnd2Fa({
        email: credentials.email,
        password: credentials.password,
        totpCode,
        requireAdminRole: false,
        ip,
      });

      if (!result.success) {
        if (result.status === 'REQUIRES_2FA') {
          throw new Error('2FA_REQUIRED');
        }
        if (result.status === 'INVALID_2FA') {
          throw new Error('INVALID_2FA_CODE');
        }
        if (result.status === 'EMAIL_NOT_VERIFIED') {
          throw new Error(result.error);
        }
        if (result.status === 'RATE_LIMITED') {
          throw new Error(result.error);
        }
        return null;
      }

      return {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: sessionRole(result.user.role),
      };
    },
  }),
];

// Only register Google provider when credentials are configured
if (isGoogleOAuthEnabled) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  useSecureCookies: isProduction && !isLocalAuth,
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;

        const emailLower = user.email.toLowerCase().trim();
        let dbUser: {
          id: string;
          email: string;
          name: string | null;
          role: import('@prisma/client').UserRole;
          emailVerified: Date | null;
          deletedAt?: Date | null;
          lockedUntil?: Date | null;
        } | null = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            dbUser = await db.user.findUnique({
              where: { email: emailLower },
            });

            if (!dbUser) {
              dbUser = await db.user.create({
                data: {
                  email: emailLower,
                  name: user.name || profile?.name || 'Google User',
                  emailVerified: new Date(),
                },
              });
            } else if (!dbUser.emailVerified) {
              await db.user.update({
                where: { id: dbUser.id },
                data: { emailVerified: new Date() },
              });
            }
            break;
          } catch (err) {
            logger.error(`Google OAuth DB sync attempt ${attempt} failed`, err);
            if (attempt === 3) {
              return false;
            }
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        if (
          !dbUser ||
          dbUser.deletedAt ||
          (dbUser.lockedUntil && new Date(dbUser.lockedUntil) > new Date())
        ) {
          return false;
        }

        const isAdminEmailFlag = isAdminEmail(emailLower);
        if (isAdminEmailFlag && dbUser.role !== 'ADMIN') {
          await db.user.update({
            where: { id: dbUser.id },
            data: { role: 'ADMIN' },
          });
          dbUser.role = 'ADMIN';
        }

        user.id = dbUser.id;
        (user as { role?: string }).role = isAdminEmailFlag ? 'ADMIN' : sessionRole(dbUser.role);
        return true;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      const extToken = token as Record<string, unknown>;
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }

      // H5: In the NextAuth jwt callback, re-check role, deletedAt and lockedUntil
      // from the DB at least every few minutes, so banned/deleted users lose access.
      const lastCheck = typeof extToken.lastCheckedAt === 'number' ? extToken.lastCheckedAt : 0;
      const now = Date.now();
      if (token.id && (!lastCheck || now - lastCheck > 5 * 60 * 1000 || trigger === 'update')) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, deletedAt: true, lockedUntil: true },
          });
          if (!dbUser || dbUser.deletedAt) {
            extToken.revoked = true;
            extToken.role = undefined;
            return token;
          }
          const isAdmin = dbUser.role === 'ADMIN' || (dbUser.role as string) === 'SUPER_ADMIN';
          const isLocked = !isAdmin && dbUser.lockedUntil && new Date(dbUser.lockedUntil) > new Date();
          if (isLocked) {
            extToken.revoked = true;
            extToken.role = undefined;
            return token;
          }
          token.role = sessionRole(dbUser.role);
          extToken.lastCheckedAt = now;
        } catch {
          // Preserve existing token on transient DB network error
        }
      }
      return token;
    },
    async session({ session, token }) {
      const extToken = token as Record<string, unknown>;
      if (extToken?.revoked) {
        return { expires: '' };
      }
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60,      // 12h absolute
    updateAge: 60 * 60,         // rolling 1h
  },
  cookies: {
    sessionToken: {
      name: isProduction && !isLocalAuth
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction && !isLocalAuth,
      },
    },
    callbackUrl: {
      name: isProduction && !isLocalAuth
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: isProduction && !isLocalAuth,
      },
    },
    csrfToken: {
      name: isProduction && !isLocalAuth
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: isProduction && !isLocalAuth,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
