import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@prisma/client';

interface SessionUser {
  id?: string;
  email?: string;
  role?: string;
}

async function getUserFromSessionOrToken(req: NextRequest): Promise<SessionUser | null> {
  const adminCookie = req.cookies.get('fai_admin_token')?.value;
  const authHeader = req.headers.get('authorization') || req.headers.get('x-enterprise-token') || adminCookie;
  if (authHeader && authHeader.includes('fai_token_')) {
    const match = authHeader.match(/fai_token_([^_]+)_([^_]+)_([a-f0-9]+)/);
    if (match) {
      const [, userId, timestampStr, signature] = match;
      const timestamp = parseInt(timestampStr, 10);
      const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
      if (!isNaN(timestamp) && (Date.now() - timestamp) < maxAgeMs) {
        const secret = process.env.NEXTAUTH_SECRET;
        if (secret && secret.length >= 32) {
          const expectedSig = crypto.createHmac('sha256', secret).update(userId + ':' + timestamp).digest('hex');
          try {
            if (crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
              const dbUser = await db.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true },
              });
              if (dbUser) {
                return {
                  id: dbUser.id,
                  email: dbUser.email,
                  role: String(dbUser.role).toUpperCase(),
                };
              }
            }
          } catch {}
        }
      }
    }
  }

  try {
    const isHttps = req.url.startsWith('https://') || process.env.NODE_ENV === 'production';
    const token =
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps })) ||
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }));
    if (token) {
      return {
        id: token.id as string,
        email: token.email as string,
        role: String(token.role ?? '').toUpperCase(),
      };
    }
  } catch {}

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        id: (session.user as any).id,
        email: session.user.email || undefined,
        role: String((session.user as any).role ?? '').toUpperCase(),
      };
    }
  } catch {}

  return null;
}

function requireAdmin(user: SessionUser | null): boolean {
  if (!user?.role) return false;
  const r = user.role.toUpperCase();
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
    },
  });
}

// GET /api/admin/orders
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const orders = await db.order.findMany({
      where: { deletedAt: null },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = orders.map((o: any) => ({
      ...o,
      discount: Number(o.discount),
      gst: Number(o.gst),
      totalAmount: Number(o.totalAmount),
      subtotal: Number(o.subtotal),
      items: (o.items || []).map((it: any) => ({
        ...it,
        price: Number(it.price),
      })),
    }));

    return NextResponse.json({ success: true, data: formatted, orders: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

// PUT /api/admin/orders
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body?.id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.status) {
      const rawStatus = String(body.status).trim().toUpperCase();
      const validStatuses: Record<string, OrderStatus> = {
        PENDING: 'PENDING',
        PROCESSING: 'PROCESSING',
        SHIPPED: 'SHIPPED',
        DELIVERED: 'DELIVERED',
        CANCELLED: 'CANCELLED',
        CANCELED: 'CANCELLED',
      };
      if (validStatuses[rawStatus]) {
        updateData.status = validStatuses[rawStatus];
      }
    }

    if (body.paymentStatus) {
      const rawPayment = String(body.paymentStatus).trim().toUpperCase();
      const validPaymentStatuses: Record<string, PaymentStatus> = {
        PENDING: 'PENDING',
        PAID: 'PAID',
        FAILED: 'FAILED',
        AWAITING_VERIFICATION: 'AWAITING_VERIFICATION',
        VERIFICATION: 'AWAITING_VERIFICATION',
        REFUNDED: 'REFUNDED',
      };
      if (validPaymentStatuses[rawPayment]) {
        updateData.paymentStatus = validPaymentStatuses[rawPayment];
      }
    }

    if (body.trackingNumber !== undefined) {
      updateData.trackingNumber = body.trackingNumber;
    }

    const updated = await db.order.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      ...updated,
      totalAmount: Number(updated.totalAmount),
      subtotal: Number(updated.subtotal),
      discount: Number(updated.discount),
      gst: Number(updated.gst),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}

export const PATCH = PUT;

// DELETE /api/admin/orders
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const searchId = req.nextUrl.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    const id = searchId || body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await db.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    }).catch(async () => {
      await db.order.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete order' }, { status: 500 });
  }
}
