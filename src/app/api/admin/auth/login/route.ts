import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`admin_login:${ip}`, 'login');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please wait a minute and try again.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const email = body?.email?.toLowerCase()?.trim();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid executive credentials' }, { status: 401 });
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).` },
        { status: 423 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const shouldLock = attempts >= 5;
      await db.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      return NextResponse.json({ error: 'Invalid executive credentials' }, { status: 401 });
    }

    // Reset failed attempts on success
    if (user.loginAttempts > 0 || user.lockedUntil) {
      await db.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      });
    }

    const roleUpper = String(user.role).toUpperCase();
    if (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      return NextResponse.json({ error: 'Authentication security error: NEXTAUTH_SECRET is invalid or missing.' }, { status: 500 });
    }
    const timestamp = Date.now();
    const signature = crypto.createHmac('sha256', secret).update(`${user.id}:${timestamp}`).digest('hex');
    const token = `fai_token_${user.id}_${timestamp}_${signature}`;

    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Executive Admin',
        role: 'ADMIN',
      },
    });

    // Set secure persistent admin session cookie (30 days)
    res.cookies.set('fai_admin_token', token, {
      path: '/',
      httpOnly: true,
      secure: req.url.startsWith('https://') || process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error('[ADMIN_AUTH_LOGIN_ERROR]', error);
    return NextResponse.json({ error: 'Server authentication error' }, { status: 500 });
  }
}
