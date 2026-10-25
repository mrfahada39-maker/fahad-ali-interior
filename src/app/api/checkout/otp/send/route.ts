import { NextRequest, NextResponse } from 'next/server';
import { sendOtpToPhone } from '@/lib/phone-otp';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`otp_send_ip:${ip}`, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests from this connection. Please wait.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';

    if (!phone) {
      return NextResponse.json(
        { error: 'Valid Pakistani mobile number is required.' },
        { status: 400 }
      );
    }

    const result = await sendOtpToPhone(phone);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        result.channel === 'WHATSAPP'
          ? '6-digit verification code sent to your WhatsApp number.'
          : 'Verification code generated.',
      token: result.token,
      cooldownSeconds: result.cooldownSeconds,
      channel: result.channel,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process verification code. Please try again.' },
      { status: 500 }
    );
  }
}
