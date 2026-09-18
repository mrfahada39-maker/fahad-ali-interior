import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => null);

    if (!body || !body.endpoint || !body.keys) {
      return NextResponse.json({ error: 'Invalid push subscription payload' }, { status: 400 });
    }

    const endpoint = String(body.endpoint);
    const keys = body.keys;
    const userId = (session?.user as any)?.id || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID or authenticated session required to subscribe to push notifications' }, { status: 401 });
    }

    const subscription = await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        endpoint,
        keys,
      },
      update: {
        userId,
        keys,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('[PUSH_SUBSCRIBE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to register push subscription' }, { status: 500 });
  }
}
