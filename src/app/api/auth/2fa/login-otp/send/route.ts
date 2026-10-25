import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOtpToPhone, maskPakistaniPhone, generate6DigitOtp } from '@/lib/phone-otp';
import { createPhoneOtpSecret } from '@/lib/totp-crypto';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`login_2fa_otp:${ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many verification code requests. Please wait a moment.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    const channel = body?.channel === 'SMS' ? 'SMS' : 'WHATSAPP';

    if (!email) {
      return NextResponse.json({ error: 'Account email is required.' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { email },
      select: { id: true, email: true, phone: true, totpEnabled: true },
    });

    if (!user || !user.totpEnabled) {
      return NextResponse.json({ error: '2-Step verification is not active for this account.' }, { status: 400 });
    }

    if (!user.phone) {
      return NextResponse.json(
        { error: 'No registered mobile number on account. Please contact support.' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP and store HMAC-signed challenge in totpSecret
    const otp = generate6DigitOtp();
    const phoneOtpSecret = createPhoneOtpSecret(user.id, otp);

    await db.user.update({
      where: { id: user.id },
      data: {
        totpSecret: phoneOtpSecret,
      },
    });

    const result = await sendOtpToPhone(user.phone, channel, 'Sign-In Security', otp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: result.channel,
      cooldownSeconds: result.cooldownSeconds,
      maskedPhone: maskPakistaniPhone(user.phone),
      devCode: (result as { devCode?: string }).devCode,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Failed to dispatch login verification code.' },
      { status: 500 }
    );
  }
}
