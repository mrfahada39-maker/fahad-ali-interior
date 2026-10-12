import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  ApiDispatchContext,
  DbMessageRecord,
  DbOrderRecord,
  DbReviewRecord,
  DbUserRecord,
  getUserFromSessionOrToken,
  requireAdmin,
} from './shared';

export async function handleCustomerAdminDetailRoutes(
  ctx: ApiDispatchContext
): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

  // 8.4 GET /admin/customers/:id
  const customerIdMatch =
    normalizedSegment.match(/^admin\/customers\/([^/]+)$/) ||
    segment.match(/^(?:v1\/)?admin\/customers\/([^/]+)$/);
  if (
    method === 'GET' &&
    customerIdMatch &&
    !['stats', 'analytics', 'export', 'bulk-action'].includes(customerIdMatch[1])
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const id = customerIdMatch[1];
    const u = (await db.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        orders: {
          where: { deletedAt: null },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
        reviews: { where: { deletedAt: null }, include: { product: true } },
        messages: { orderBy: { createdAt: 'desc' } },
      },
    })) as DbUserRecord | null;

    if (!u) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const totalSpent = (u.orders || []).reduce(
      (sum: number, o: DbOrderRecord) => sum + Number(o.totalAmount || 0),
      0
    );
    const orderCount = (u.orders || []).length;
    const avgOrderVal = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;

    const dynamicTier =
      totalSpent >= 500000 || orderCount >= 10
        ? 'PLATINUM'
        : totalSpent >= 200000 || orderCount >= 5
          ? 'GOLD'
          : totalSpent >= 40000 || orderCount >= 2
            ? 'SILVER'
            : 'BRONZE';
    const resolvedPhone =
      u.phone && !u.phone.includes('0000000')
        ? u.phone
        : u.orders?.[0]?.shippingPhone || null;

    return NextResponse.json({
      id: u.id,
      name: u.name || 'Valued Customer',
      email: u.email,
      phone: resolvedPhone,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      emailVerified: u.createdAt,
      lockedUntil: u.lockedUntil,
      loginAttempts: 0,
      bio: 'VIP Client of Fahad Ali Interior',
      avatar: null,
      language: 'en',
      darkMode: false,
      segment: dynamicTier === 'PLATINUM' || dynamicTier === 'GOLD' ? 'VIP' : 'Regular',
      loyaltyTier: dynamicTier,
      loyaltyPoints: Math.floor(totalSpent / 1000),
      tags: [
        dynamicTier === 'PLATINUM'
          ? 'Royal VIP'
          : dynamicTier === 'GOLD'
            ? 'High Value'
            : 'Active',
        'Verified',
      ],
      lastLoginAt: u.updatedAt,
      lastActivityAt: u.updatedAt,
      dataRetentionDate: null,
      isBlocked: Boolean(u.lockedUntil && new Date(u.lockedUntil) > new Date()),
      totalSpent,
      averageOrderValue: avgOrderVal,
      lifetimeValue: totalSpent,
      addresses: [
        {
          id: 'addr_1',
          name: u.name || 'Customer',
          phone: u.phone || '+92 300 0000000',
          address: 'Gulberg III',
          city: 'Lahore',
          province: 'Punjab',
          isDefault: true,
        },
      ],
      orders: (u.orders || []).map((o: DbOrderRecord) => ({
        id: o.id,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod || 'COD',
        createdAt: o.createdAt,
      })),
      reviews: (u.reviews || []).map((r: DbReviewRecord) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment || '',
        status: r.status,
        createdAt: r.createdAt,
        product: { name: r.product?.name || 'Furniture Item' },
      })),
      wishlistItems: [],
      messages: (u.messages || []).map((m: DbMessageRecord) => ({
        id: m.id,
        text: m.text,
        sender: m.sender || 'user',
        createdAt: m.createdAt,
      })),
      customerNotes: [],
      loginHistory: [
        {
          id: 'log_1',
          ip: '127.0.0.1',
          device: 'Desktop Chrome',
          location: 'Lahore, Pakistan',
          success: true,
          createdAt: u.updatedAt,
        },
      ],
      _count: {
        orders: (u.orders || []).length,
        reviews: (u.reviews || []).length,
        wishlistItems: 0,
        messages: (u.messages || []).length,
        notifications: 0,
      },
    });
  }

  // 8.5 PATCH /admin/customers/:id/lock
  const customerLockMatch =
    normalizedSegment.match(/^admin\/customers\/([^/]+)\/lock$/) ||
    segment.match(/^(?:v1\/)?admin\/customers\/([^/]+)\/lock$/);
  if (method === 'PATCH' && customerLockMatch) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const id = customerLockMatch[1];
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const block = Boolean(body.block);
    const lockedUntil = block
      ? new Date(Date.now() + (Number(body.durationMinutes) || 1440) * 60 * 1000)
      : null;

    await db.user.update({
      where: { id },
      data: { lockedUntil },
    });

    return NextResponse.json({ success: true, isBlocked: block, lockedUntil });
  }

  // 8.6 PATCH /admin/customers/:id/segment
  const customerSegmentMatch =
    normalizedSegment.match(/^admin\/customers\/([^/]+)\/segment$/) ||
    segment.match(/^(?:v1\/)?admin\/customers\/([^/]+)\/segment$/);
  if (method === 'PATCH' && customerSegmentMatch) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const id = customerSegmentMatch[1];
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const validSegments = ['VIP', 'HIGH_VALUE', 'REPEAT', 'NEW', 'INACTIVE', 'AT_RISK', 'BLOCKED'] as const;
    const rawSeg = String(body.segment || '').trim().toUpperCase();
    if (validSegments.includes(rawSeg as (typeof validSegments)[number])) {
      await db.user.update({
        where: { id },
        data: { segment: rawSeg as (typeof validSegments)[number] },
      });
    }

    return NextResponse.json({ success: true });
  }

  // 8.7 POST /admin/customers/:id/notes
  const customerNotesMatch =
    normalizedSegment.match(/^admin\/customers\/([^/]+)\/notes$/) ||
    segment.match(/^(?:v1\/)?admin\/customers\/([^/]+)\/notes$/);
  if (method === 'POST' && customerNotesMatch) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const id = customerNotesMatch[1];
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const authorId = user?.id || id;

    const note = await db.customerNote.create({
      data: {
        user: { connect: { id } },
        author: { connect: { id: authorId } },
        text: String(body.text || 'Admin Note'),
        priority: String(body.priority || 'NORMAL').toUpperCase() as
          | 'LOW'
          | 'NORMAL'
          | 'HIGH'
          | 'URGENT',
      },
    });

    return NextResponse.json(note);
  }

  // 8.8 PATCH /admin/customers/bulk-action
  if (
    method === 'PATCH' &&
    (normalizedSegment === 'admin/customers/bulk-action' ||
      segment === 'admin/customers/bulk-action' ||
      segment === 'v1/admin/customers/bulk-action')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const ids: string[] = Array.isArray(body.ids) ? (body.ids as string[]) : [];
    const action: string = String(body.action || '');

    if (ids.length > 0) {
      if (action === 'block') {
        await db.user.updateMany({
          where: { id: { in: ids } },
          data: { lockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        });
      } else if (action === 'verify') {
        await db.user.updateMany({
          where: { id: { in: ids } },
          data: { emailVerified: new Date() },
        });
      } else if (action === 'delete') {
        await db.user.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: new Date() },
        });
      }
    }

    return NextResponse.json({ success: true, count: ids.length });
  }

  return null;
}
