import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
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
        const verifyRecord = await db.emailVerificationToken.findFirst({
          where: {
            userId: existingUser.id,
            tokenHash: { endsWith: cleanCode },
            expiresAt: { gt: new Date() },
          },
        });

        if (verifyRecord) {
          user = existingUser;
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
