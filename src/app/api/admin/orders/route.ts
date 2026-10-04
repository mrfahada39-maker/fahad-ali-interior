import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { moveToRecycleBin } from '@/lib/recycle-bin';

import { getVerifiedAdmin } from '@/lib/admin-auth';

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
    const user = await getVerifiedAdmin(req);
    if (!user) {
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
    const user = await getVerifiedAdmin(req);
    if (!user) {
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
    const user = await getVerifiedAdmin(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const searchId = req.nextUrl.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    const id = searchId || body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const existing = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (existing) {
      await moveToRecycleBin({
        entityType: 'ORDER',
        entityId: existing.id,
        name: `Order #${existing.id.slice(-6).toUpperCase()} (${existing.shippingName || 'Customer'})`,
        payload: existing,
        deletedBy: user?.email || user?.id || null,
      });

      await db.order.delete({ where: { id } }).catch(async () => {
        await db.order.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      });
    }

    return NextResponse.json({ success: true, deletedId: id, archivedToRecycleBin: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete order' }, { status: 500 });
  }
}
