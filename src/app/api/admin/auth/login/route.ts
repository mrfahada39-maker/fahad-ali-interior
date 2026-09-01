import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
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

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid executive credentials' }, { status: 401 });
    }

    const roleUpper = String(user.role).toUpperCase();
    if (roleUpper !== 'ADMIN' && roleUpper !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const token = `direct_admin_${user.id}_${Date.now()}`;

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

    // Set persistent admin session cookie (30 days)
    res.cookies.set('fai_admin_token', token, {
      path: '/',
      httpOnly: false,
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
