/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { validatePasswordStrength, runDummyBcryptCompare } from '@/lib/password-policy';
import { revokeAllUserTokensAsync } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`reset_pw:${ip}`, 'register');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many reset attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { token, code, email, password } = body;

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.error }, { status: 400 });
    }

    let user = null;

    // Method 1: Token verification from email link
    if (token) {
      const cleanToken = String(token).trim();
      const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');
      const resetRecord = await db.passwordResetToken.findFirst({
        where: {
          tokenHash: { startsWith: tokenHash },
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });

      if (resetRecord && resetRecord.user) {
        user = resetRecord.user;
      }
    }

    // Method 2: 6-digit code verification
    if (!user && email && code) {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = String(code).trim().replace(/\D/g, '');

      const existingUser = await db.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser) {
        if (existingUser.lockedUntil && new Date(existingUser.lockedUntil) > new Date()) {
          await runDummyBcryptCompare(password);
          return NextResponse.json({ error: 'Invalid or expired password reset link/code. Please request a new one.' }, { status: 400 });
        }

        const resetRecord = await db.passwordResetToken.findFirst({
          where: {
            userId: existingUser.id,
            tokenHash: { endsWith: cleanCode },
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (resetRecord) {
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
          if (shouldLock) {
            await db.passwordResetToken.deleteMany({ where: { userId: existingUser.id } }).catch(() => {});
          }
        }
      }
    }

    if (!user) {
      await runDummyBcryptCompare(password);
      return NextResponse.json(
        { error: 'Invalid or expired password reset link/code. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password securely (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset tokens
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Invalidate all active user sessions and refresh tokens to prevent session hijacking
    await Promise.all([
      revokeAllUserTokensAsync(user.id).catch(() => {}),
      Promise.resolve(db.session?.deleteMany?.({ where: { userId: user.id } })).catch(() => {}),
      Promise.resolve(db.refreshToken?.deleteMany?.({ where: { userId: user.id } })).catch(() => {}),
      Promise.resolve(db.passwordResetToken?.deleteMany?.({ where: { userId: user.id } })).catch(() => {}),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated! You can now log in.',
    });
  } catch (error: any) {
    logger.error('[RESET PASSWORD ERROR]', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
