import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSessionOrToken } from '@/lib/api-handlers/shared';
import { db } from '@/lib/db';
import { verifyOtpChallengeToken, normalizePakistaniPhone, maskPakistaniPhone } from '@/lib/phone-otp';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`2fa_verify_otp:${ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many verification attempts. Please wait a moment.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    const channel = body?.channel === 'SMS' ? 'SMS' : 'WHATSAPP';

    if (!phone || !token || !code) {
      return NextResponse.json(
        { error: 'Phone number, verification token, and 6-digit code are required.' },
        { status: 400 }
      );
    }

    const normPhone = normalizePakistaniPhone(phone);
    const verification = verifyOtpChallengeToken(normPhone, code, token);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid 6-digit verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    const user = await getUserFromSessionOrToken(req);
    if (user?.id) {
      await db.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: true,
          phone: normPhone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      enabled: true,
      channel,
      phone: normPhone,
      maskedPhone: maskPakistaniPhone(normPhone),
      message: 'Two-Step Verification activated successfully! Your account is now secured.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
