import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { getSiteUrl } from '@/lib/site-url';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset link and code have been sent.',
      });
    }

    // Generate secure 6-digit OTP code & hex token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean old tokens and save new token
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    }).catch(() => {});

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: `${tokenHash}:${code}`,
        expiresAt,
      },
    });

    const siteUrl = getSiteUrl();
    const resetUrl = `${siteUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || 'Valued Client',
      resetUrl,
      code,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been sent to your email.',
    });
  } catch (error: any) {
    console.error('[FORGOT PASSWORD ERROR]', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
