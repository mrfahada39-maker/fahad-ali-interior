import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
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
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'This email is already verified! You can log in.',
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    }).catch(() => {});

    await db.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: `${tokenHash}:${code}`,
        expiresAt,
      },
    });

    const siteUrl = getSiteUrl();
    const verifyUrl = `${siteUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    await sendVerificationEmail({
      to: user.email,
      name: user.name || 'Valued Client',
      verifyUrl,
      code,
    });

    return NextResponse.json({
      success: true,
      message: 'A new verification email with link and code has been sent!',
    });
  } catch (error: any) {
    console.error('[RESEND VERIFICATION ERROR]', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
