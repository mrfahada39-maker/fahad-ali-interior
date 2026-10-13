/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { getSiteUrl, shouldSkipEmailVerification } from '@/lib/utils';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { validatePasswordStrength, runDummyBcryptCompare } from '@/lib/password-policy';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`register:${ip}`, 'register');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many registration attempts. Please wait a minute and try again.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.error },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await runDummyBcryptCompare(password);
      return NextResponse.json(
        { error: 'An account with this email already exists or is unavailable' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const skipVerification = shouldSkipEmailVerification();

    const user = await db.user.create({
      data: {
        name: name?.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
        password: hashedPassword,
        role: 'USER',
        emailVerified: skipVerification ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!skipVerification) {
      try {
        const code = crypto.randomInt(100000, 1000000).toString();
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.emailVerificationToken.create({
          data: {
            userId: user.id,
            tokenHash: `${tokenHash}:${code}`,
            expiresAt,
          },
        });

        const siteUrl = getSiteUrl();
        const verifyUrl = `${siteUrl}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

        const emailSent = await sendVerificationEmail({
          to: user.email,
          name: user.name || 'Valued Client',
          verifyUrl,
          code,
        });

        if (!emailSent.success) {
          logger.warn('[VERIFICATION_EMAIL_FAILED] Auto-verifying user to prevent lockout:', {
            userId: user.id,
            email: user.email,
            error: emailSent.error,
          });
          await db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }
      } catch (err) {
        logger.error('Failed to send verification email upon registration:', err);
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        }).catch(() => {});
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: skipVerification
          ? 'Account created successfully'
          : 'Account created! Please check your email to verify your account.',
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[REGISTRATION_ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
