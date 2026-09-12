import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`verify_email:${ip}`, 'register');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many verification attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { token, code, email } = body;

    let user = null;

    // Method 1: Verification token from URL link
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const verifyRecord = await db.emailVerificationToken.findFirst({
        where: {
          tokenHash: { startsWith: tokenHash },
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (verifyRecord && verifyRecord.user) {
        user = verifyRecord.user;
      }
    }

    // Method 2: 6-digit code verification
    if (!user && email && code) {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = String(code).trim();

      const existingUser = await db.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        if (existingUser.lockedUntil && new Date(existingUser.lockedUntil) > new Date()) {
          return NextResponse.json({ error: 'Account temporarily locked due to failed attempts. Please try again later.' }, { status: 423 });
        }

        const verifyRecord = await db.emailVerificationToken.findFirst({
          where: {
            userId: existingUser.id,
            tokenHash: { endsWith: cleanCode },
            expiresAt: { gt: new Date() },
          },
        });

        if (verifyRecord) {
          user = existingUser;
        } else {
          const attempts = (existingUser.loginAttempts || 0) + 1;
          const shouldLock = attempts >= 5;
          await db.user.update({
            where: { id: existingUser.id },
            data: {
              loginAttempts: attempts,
              lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          });
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link/code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Update user status
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    await db.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Your email address has been successfully verified! You can now log in.',
    });
  } catch (error: any) {
    console.error('[VERIFY EMAIL ERROR]', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
