import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, code, email, password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    let user = null;

    // Method 1: Token verification from email link
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const resetRecord = await db.passwordResetToken.findFirst({
        where: {
          tokenHash: { startsWith: tokenHash },
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (resetRecord && resetRecord.user) {
        user = resetRecord.user;
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
        const resetRecord = await db.passwordResetToken.findFirst({
          where: {
            userId: existingUser.id,
            tokenHash: { endsWith: cleanCode },
            expiresAt: { gt: new Date() },
          },
        });

        if (resetRecord) {
          user = existingUser;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset link/code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset tokens
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated! You can now log in.',
    });
  } catch (error: any) {
    console.error('[RESET PASSWORD ERROR]', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
