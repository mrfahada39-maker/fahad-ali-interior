import { NextRequest, NextResponse } from 'next/server';
import { broadcastPushNotification, sendPushNotification } from '@/lib/push-notifications';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const isHttps = req.url.startsWith('https://') || process.env.NODE_ENV === 'production';
    const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps })) ||
                  (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }));
    const role = String(token?.role ?? '').toUpperCase();
    const adminCookie = req.cookies.get('fai_admin_token')?.value;
    const isAdminToken = Boolean(adminCookie && adminCookie.includes('fai_token_'));

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && !isAdminToken) {
      return NextResponse.json({ error: 'Unauthorized. Admin role required to broadcast push notifications.' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const payload = {
      title: body.title,
      body: body.body,
      icon: body.icon || '/icons/icon-192.png',
      badge: body.badge || '/icons/icon-192.png',
      url: body.url || '/',
      data: body.data || {},
    };

    if (body.userId) {
      const subscriptions = await db.pushSubscription.findMany({
        where: { userId: body.userId },
      });

      let sent = 0;
      let failed = 0;
      for (const sub of subscriptions) {
        const ok = await sendPushNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        if (ok) sent++;
        else failed++;
      }

      return NextResponse.json({ success: true, target: 'user', sent, failed });
    }

    const result = await broadcastPushNotification(payload);
    return NextResponse.json({ success: true, target: 'broadcast', ...result });
  } catch (error) {
    console.error('[PUSH_SEND_ERROR]', error);
    return NextResponse.json({ error: 'Failed to send push notifications' }, { status: 500 });
  }
}
