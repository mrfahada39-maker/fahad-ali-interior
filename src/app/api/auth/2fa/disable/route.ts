import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSessionOrToken } from '@/lib/api-handlers/shared';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`2fa_disable:${ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many attempts. Please wait a moment.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true, totpEnabled: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If password is required and provided, verify it
    if (dbUser.password && password) {
      const isMatch = await bcrypt.compare(password, dbUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect account password.' }, { status: 400 });
      }
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        totpEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      disabled: true,
      enabled: false,
      message: 'Two-Step Verification has been disabled.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Failed to disable 2-step verification.' },
      { status: 500 }
    );
  }
}
