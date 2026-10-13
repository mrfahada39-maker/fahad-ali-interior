import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { revokeAdminTokenAsync } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const raw =
      req.headers.get('authorization') ||
      req.headers.get('x-enterprise-token') ||
      req.cookies.get('fai_admin_token')?.value;

    if (raw) {
      await revokeAdminTokenAsync(raw);
    }

    const res = NextResponse.json({
      success: true,
      message: 'Executive admin session successfully revoked and logged out.',
    });

    // Clear fai_admin_token cookie with immediate expiration
    res.cookies.set('fai_admin_token', '', {
      path: '/',
      httpOnly: true,
      secure: req.url.startsWith('https://') || process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      expires: new Date(0),
    });

    return res;
  } catch (error) {
    logger.error('[ADMIN_AUTH_LOGOUT_ERROR]', error);
    return NextResponse.json({ error: 'Server logout error' }, { status: 500 });
  }
}
