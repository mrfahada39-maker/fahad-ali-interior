import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getAdminTokenSecret } from '@/lib/admin-auth';
import { verifyCredentialsAnd2Fa } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`admin_login:${ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error || 'Too many login attempts. Please wait a minute and try again.' },
        { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const totpCode =
      body?.totpCode !== undefined && body?.totpCode !== null
        ? String(body.totpCode).trim()
        : undefined;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const authResult = await verifyCredentialsAnd2Fa({
      email,
      password,
      totpCode,
      requireAdminRole: true,
      skipEmailVerification: true,
      ip,
    });

    if (!authResult.success) {
      if (authResult.status === 'RATE_LIMITED') {
        return NextResponse.json({ error: authResult.error }, { status: 429 });
      }
      if (authResult.status === 'REQUIRES_2FA') {
        return NextResponse.json(
          { requires2fa: true, message: authResult.error },
          { status: 200 }
        );
      }
      if (authResult.status === 'FORBIDDEN') {
        return NextResponse.json({ error: authResult.error }, { status: 403 });
      }
      if (authResult.status === 'LOCKED') {
        return NextResponse.json({ error: authResult.error }, { status: 423 });
      }
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const secret = getAdminTokenSecret();
    if (!secret || secret.length < 32) {
      return NextResponse.json(
        { error: 'Authentication security error: ADMIN_TOKEN_SECRET is invalid or missing.' },
        { status: 500 }
      );
    }

    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${authResult.user.id}:${timestamp}`)
      .digest('hex');
    const token = `fai_token_${authResult.user.id}_${timestamp}_${signature}`;

    const res = NextResponse.json({
      success: true,
      // Token intentionally NOT returned in response body — set in httpOnly cookie only
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name || 'Executive Admin',
        role: 'ADMIN',
      },
    });

    // Set secure persistent admin session cookie (24 hours strict limit)
    res.cookies.set('fai_admin_token', token, {
      path: '/',
      httpOnly: true,
      secure: req.url.startsWith('https://') || process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    logger.error('[ADMIN_AUTH_LOGIN_ERROR]', error);
    return NextResponse.json({ error: 'Server authentication error' }, { status: 500 });
  }
}
