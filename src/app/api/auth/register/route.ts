import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { getSiteUrl, shouldSkipEmailVerification } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

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

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password cannot exceed 128 characters' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const skipVerification = shouldSkipEmailVerification();

    const user = await db.user.create({
      data: {
        name: name?.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
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
        const code = Math.floor(100000 + Math.random() * 900000).toString();
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

        await sendVerificationEmail({
          to: user.email,
          name: user.name || 'Valued Client',
          verifyUrl,
          code,
        });
      } catch (err) {
        console.error('Failed to send verification email upon registration:', err);
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
    return NextResponse.json(
      { error: error?.message || 'Failed to register account' },
      { status: 500 }
    );
  }
}
