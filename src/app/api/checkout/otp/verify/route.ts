import { NextRequest, NextResponse } from 'next/server';
import {
  verifyOtpChallengeToken,
  signVerifiedPhoneToken,
  normalizePakistaniPhone,
} from '@/lib/phone-otp';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`otp_verify_ip:${ip}`, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts from this connection. Please wait.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : '';
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    if (!phone || !otp || !token) {
      return NextResponse.json(
        { error: 'Phone number, 6-digit OTP code, and verification token are required.' },
        { status: 400 }
      );
    }

    const check = verifyOtpChallengeToken(phone, otp, token);
    if (!check.valid) {
      return NextResponse.json(
        { error: check.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    const normPhone = normalizePakistaniPhone(phone);
    const verifiedPhoneToken = signVerifiedPhoneToken(normPhone);

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully via WhatsApp.',
      verifiedPhoneToken,
      normalizedPhone: normPhone,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to verify OTP code. Please try again.' },
      { status: 500 }
    );
  }
}
