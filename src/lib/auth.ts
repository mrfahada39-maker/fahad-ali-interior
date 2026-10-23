import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { db } from '@/lib/db';
import { sessionRole } from '@/lib/enums';
import { shouldSkipEmailVerification } from '@/lib/utils';
import { decryptTotpSecret, verifyBackupCode } from '@/lib/totp-crypto';
import { runDummyBcryptCompare } from '@/lib/password-policy';
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


const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      totpCode: { label: '2FA Code', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const user = await db.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
      });

      if (!user?.password) {
        await runDummyBcryptCompare(credentials.password);
        return null; // OAuth user or non-existent user trying credentials
      }

      // 1. Enforce deactivation check (banned / deleted users cannot log in)
      if (user.deletedAt) {
        await runDummyBcryptCompare(credentials.password);
        return null;
      }

      // 2. Enforce account lockout cooldown (anti-brute force defense, no distinct locked message)
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        await runDummyBcryptCompare(credentials.password);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        const attempts = (user.loginAttempts || 0) + 1;
        const shouldLock = attempts >= 5;
        await db.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: attempts,
            lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
          },
        }).catch(() => { });
        return null;
      }

      if (!user.emailVerified) {
        if (!shouldSkipEmailVerification()) {
          throw new Error(
            'Please verify your email before signing in. Check your inbox for the verification link.'
          );
        }
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }

      // Enforce 2FA TOTP if user has it enabled
      if (user.totpEnabled) {
        const rawTotp = (credentials as Record<string, unknown>)?.totpCode;
        const totpCode = rawTotp ? String(rawTotp).trim() : '';
        if (!totpCode) {
          throw new Error('2FA_REQUIRED');
        }

        const recordFailed2Fa = async () => {
          const attempts = (user.loginAttempts || 0) + 1;
          const shouldLock = attempts >= 5;
          await db.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: attempts,
              lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          }).catch(() => { });
        };

        const matchedBackup = verifyBackupCode(totpCode, user.backupCodes || []);
        if (matchedBackup) {
          await db.user.update({
            where: { id: user.id },
            data: {
              backupCodes: (user.backupCodes || []).filter((c: string) => c !== matchedBackup),
            },
          });
        } else if (!user.totpSecret) {
          // H3: Fail closed — missing totpSecret fails login (no 6-digit wildcard)
          await recordFailed2Fa();
          throw new Error('INVALID_2FA_CODE');
        } else {
          const plainSecret = decryptTotpSecret(user.totpSecret);
          if (!plainSecret) {
            await recordFailed2Fa();
            throw new Error('INVALID_2FA_CODE');
          }

          try {
            const check = verifySync({ token: totpCode, secret: plainSecret, epochTolerance: 30 });
            if (!check || !check.valid) {
              await recordFailed2Fa();
              throw new Error('INVALID_2FA_CODE');
            }
          } catch {
            await recordFailed2Fa();
            throw new Error('INVALID_2FA_CODE');
          }
        }
      }

      // Reset failed login attempts only AFTER both password and 2FA succeed
      if (user.loginAttempts > 0 || user.lockedUntil) {
        await db.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        }).catch(() => { });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: sessionRole(user.role),
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
          if (!dbUser || dbUser.deletedAt || (dbUser.lockedUntil && new Date(dbUser.lockedUntil) > new Date())) {
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
