import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSessionOrToken } from '@/lib/api-handlers/shared';
import { db } from '@/lib/db';
import { sendOtpToPhone, maskPakistaniPhone, normalizePakistaniPhone } from '@/lib/phone-otp';
import { isValidPakistaniPhone } from '@/lib/pakistan-localization';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`2fa_send_otp:${ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many OTP requests. Please wait a moment.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const user = await getUserFromSessionOrToken(req);
    const body = await req.json().catch(() => ({}));
    const channel = body?.channel === 'SMS' ? 'SMS' : 'WHATSAPP';
    let targetPhone = typeof body?.phone === 'string' ? body.phone.trim() : '';

    if (!targetPhone && user?.id) {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { phone: true },
      });
      targetPhone = dbUser?.phone || '';
    }

    if (!targetPhone) {
      return NextResponse.json(
        {
          error:
            'Registered mobile number not found. Please enter your Pakistani mobile number (e.g. 0300 1234567).',
        },
        { status: 400 }
      );
    }

    if (!isValidPakistaniPhone(targetPhone)) {
      return NextResponse.json(
        {
          error:
            'Please enter a valid 11-digit Pakistani mobile number (e.g. 0300 1234567 or +92 300 1234567).',
        },
        { status: 400 }
      );
    }

    const normPhone = normalizePakistaniPhone(targetPhone);
    const result = await sendOtpToPhone(normPhone, channel, '2-Step Verification');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      channel: result.channel,
      cooldownSeconds: result.cooldownSeconds,
      maskedPhone: maskPakistaniPhone(normPhone),
      phone: normPhone,
      devCode: (result as { devCode?: string }).devCode,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
