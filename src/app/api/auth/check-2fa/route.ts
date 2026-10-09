import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * H3: /api/auth/check-2fa must not reveal whether an email has 2FA enabled
 * (anti-enumeration & anti-oracle defense).
 * Rate limiting is enforced and a generic response is returned.
 * Real 2FA enforcement is handled securely during credential authentication.
 */
async function handleCheck2Fa(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`check_2fa:${ip}`, 'login');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  return NextResponse.json({
    requires2fa: false,
    message: 'Two-factor authentication requirements are verified during primary credentials sign-in.',
  });
}

export async function GET(req: NextRequest) {
  return handleCheck2Fa(req);
}

export async function POST(req: NextRequest) {
  return handleCheck2Fa(req);
}
