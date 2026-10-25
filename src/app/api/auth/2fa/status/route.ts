import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSessionOrToken } from '@/lib/api-handlers/shared';
import { db } from '@/lib/db';
import { maskPakistaniPhone } from '@/lib/phone-otp';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) {
      return NextResponse.json({
        enabled: false,
        phone: null,
        maskedPhone: null,
        authenticated: false,
      });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { totpEnabled: true, phone: true, email: true },
    });

    const phone = dbUser?.phone || null;
    return NextResponse.json({
      enabled: Boolean(dbUser?.totpEnabled),
      phone,
      maskedPhone: phone ? maskPakistaniPhone(phone) : null,
      authenticated: true,
    });
  } catch (err) {
    return NextResponse.json({
      enabled: false,
      phone: null,
      maskedPhone: null,
      error: (err as Error)?.message || 'Failed to fetch status',
    });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
