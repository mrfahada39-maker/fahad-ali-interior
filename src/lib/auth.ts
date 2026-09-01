import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { sessionRole } from '@/lib/enums';
import { shouldSkipEmailVerification } from '@/lib/email-verification';

const isProduction = process.env.NODE_ENV === 'production';
const isLocalAuth =
  (process.env.NEXTAUTH_URL ?? '').includes('localhost') ||
  (process.env.NEXTAUTH_URL ?? '').includes('127.0.0.1');

/** True only when both Google OAuth env vars are filled with real values */
export const isGoogleOAuthEnabled =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes('your-google') &&
  !process.env.GOOGLE_CLIENT_SECRET.includes('your-google');

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const user = await db.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
      });

      if (!user?.password) {
        return null; // OAuth user trying credentials
      }

      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
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
        let dbUser: any = null;

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
            console.error(`Google OAuth DB sync attempt ${attempt} failed:`, err);
            if (attempt === 3) {
              user.id = user.id || `google_${Date.now()}`;
              (user as { role?: string }).role = 'CUSTOMER';
              return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        if (dbUser) {
          user.id = dbUser.id;
          (user as { role?: string }).role = sessionRole(dbUser.role);
        }
        return true;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      // Only re-fetch role from DB on explicit session.update() triggers
      if (trigger === 'update' && token.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (dbUser) {
            token.role = sessionRole(dbUser.role);
          }
        } catch {
          // Silently ignore DB errors — keep existing token role
        }
      }
      return token;
    },
    async session({ session, token }) {
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
