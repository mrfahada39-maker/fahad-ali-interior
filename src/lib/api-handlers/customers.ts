import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAddressSchema, updateProfileSchema } from '@/lib/validations/api-schemas';
import {
  ApiDispatchContext,
  DbNotificationRecord,
  DbOrderItemRecord,
  DbOrderRecord,
  DbProductRecord,
  getUserFromSessionOrToken,
} from './shared';
import { handleCustomerAdminListRoutes } from './customers-admin';
import { handleCustomerAdminDetailRoutes } from './customers-admin-details';

export async function handleCustomerRoutes(ctx: ApiDispatchContext): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

  // 2.2 GET /user/stats or /v1/user/stats
  if (method === 'GET' && (segment === 'user/stats' || segment === 'v1/user/stats')) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) {
      return NextResponse.json({
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        wishlistCount: 0,
        orderCount: 0,
      });
    }
    const [orderCount, orders, wishlistCount] = await Promise.all([
      db.order.count({ where: { userId: user.id, deletedAt: null } }).catch(() => 0),
      db.order
        .findMany({
          where: { userId: user.id, deletedAt: null },
          select: { totalAmount: true },
        })
        .catch(() => []),
      db.wishlistItem.count({ where: { userId: user.id } }).catch(() => 0),
    ]);
    const totalSpent = (orders as DbOrderRecord[]).reduce(
      (sum: number, o: DbOrderRecord) => sum + Number(o.totalAmount || 0),
      0
    );
    const loyaltyPoints = Math.floor(totalSpent / 1000);
    return NextResponse.json({
      totalOrders: orderCount,
      orderCount,
      totalSpent,
      loyaltyPoints,
      wishlistCount,
    });
  }

  // 2.6 User Addresses
  if (
    segment === 'user/addresses' ||
    segment === 'v1/user/addresses' ||
    segment.includes('user/addresses')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (method === 'GET') {
      if (!user?.id) return NextResponse.json([]);
      const addresses = await db.address
        .findMany({
          where: { userId: user.id, deletedAt: null },
          orderBy: { isDefault: 'desc' },
        })
        .catch(() => []);
      return NextResponse.json(addresses);
    }
    if (method === 'POST') {
      if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const rawBody = await req.json().catch(() => ({}));
      const parsed = createAddressSchema.safeParse(rawBody);
      const body = parsed.success ? parsed.data : rawBody;

      if (body.isDefault) {
        await db.address
          .updateMany({
            where: { userId: user.id },
            data: { isDefault: false },
          })
          .catch(() => {});
      }

      const newAddr = await db.address.create({
        data: {
          userId: user.id,
          name: body.name || user.email || 'Valued Client',
          phone: body.phone || '+92 300 0000000',
          address: body.address || '',
          city: body.city || 'Lahore',
          province: body.province || 'Punjab',
          isDefault: Boolean(body.isDefault),
        },
      });
      return NextResponse.json(newAddr);
    }
    if (method === 'DELETE') {
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to remove this address.' },
          { status: 401 }
        );
      }
      const rawId = req.nextUrl.searchParams.get('id') || segment.split('/').pop();
      const id = rawId && rawId !== 'addresses' ? rawId : null;
      if (!id) {
        return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
      }
      await db.address.deleteMany({ where: { id, userId: user.id } }).catch(() => {});
      return NextResponse.json({ success: true });
    }
  }

  // 2.7 User Profile
  if (segment === 'user/profile' || segment === 'v1/user/profile') {
    const user = await getUserFromSessionOrToken(req);
    if (method === 'GET') {
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized. Please sign in to view your profile.' },
          { status: 401 }
        );
      }
      const fullUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          bio: true,
          avatar: true,
          createdAt: true,
        },
      });
      return NextResponse.json(fullUser || user);
    }
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (method === 'PUT' || method === 'PATCH') {
      const rawBody = await req.json().catch(() => ({}));
      const parsed = updateProfileSchema.safeParse(rawBody);
      const body = parsed.success ? parsed.data : rawBody;
      const updated = await db.user.update({
        where: { id: user.id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.bio !== undefined && { bio: body.bio }),
          ...(body.avatar !== undefined && { avatar: body.avatar }),
        },
        select: { id: true, name: true, email: true, phone: true, bio: true, avatar: true },
      });
      return NextResponse.json(updated);
    }
  }

  // 2.4 GET /user/dashboard-bundle or /v1/user/dashboard-bundle
  if (
    method === 'GET' &&
    (segment === 'user/dashboard-bundle' || segment === 'v1/user/dashboard-bundle')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your dashboard.' },
        { status: 401 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: user.id } }).catch(() => null);
    if (!targetUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const targetUserId = targetUser.id;

    const orders = (await db.order
      .findMany({
        where: { userId: targetUserId, deletedAt: null },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => [])) as DbOrderRecord[];

    const formattedOrders = orders.map((o: DbOrderRecord) => ({
      ...o,
      discount: Number(o.discount),
      gst: Number(o.gst),
      subtotal: Number(o.subtotal),
      totalAmount: Number(o.totalAmount),
      total: Number(o.totalAmount),
      items: (o.items || []).map((item: DbOrderItemRecord) => ({
        ...item,
        price: Number(item.price),
      })),
    }));

    const reviews = await db.review
      .findMany({
        where: { userId: targetUserId, deletedAt: null },
      })
      .catch(() => []);

    const messages = await db.message
      .findMany({
        where: { userId: targetUserId },
      })
      .catch(() => []);

    const products = (await db.product
      .findMany({
        where: { deletedAt: null },
        take: 12,
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => [])) as DbProductRecord[];

    const formattedProducts = products.map((p: DbProductRecord) => ({
      ...p,
      price: Number(p.price),
    }));

    const totalSpent = formattedOrders.reduce(
      (sum: number, o) => sum + Number(o.totalAmount),
      0
    );
    const completedOrders = formattedOrders.filter((o) => o.status === 'DELIVERED').length;

    const userAddresses = await db.address
      .findMany({
        where: { userId: targetUserId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);

    return NextResponse.json({
      stats: {
        totalOrders: formattedOrders.length,
        orderCount: formattedOrders.length,
        completedOrders,
        activeTickets: messages.length,
        totalSpent,
        loyaltyPoints: Math.floor(totalSpent / 1000),
      },
      orders: formattedOrders,
      wishlist: [],
      profile: {
        name: targetUser?.name || 'Fahad Customer',
        email: targetUser?.email || 'customer@fahad-ali-interior.com',
        phone: targetUser?.phone || '+92 300 0000000',
        bio: targetUser?.bio || 'Valued VIP Member of Fahad Ali Interior',
      },
      addresses: userAddresses,
      messages,
      reviews,
      products: {
        products: formattedProducts,
      },
    });
  }

  // 8. Admin Customer routes delegation
  if (
    segment.includes('admin/customers') ||
    normalizedSegment.includes('admin/customers')
  ) {
    const listRes = await handleCustomerAdminListRoutes(ctx);
    if (listRes) return listRes;

    const detailRes = await handleCustomerAdminDetailRoutes(ctx);
    if (detailRes) return detailRes;
  }

  // 14. GET /user/notifications or /customers/notifications
  if (
    method === 'GET' &&
    (normalizedSegment === 'user/notifications' ||
      normalizedSegment === 'users/notifications' ||
      normalizedSegment === 'customers/notifications' ||
      segment === 'user/notifications' ||
      segment === 'v1/user/notifications' ||
      segment === 'customers/notifications' ||
      segment === 'v1/customers/notifications')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json({ notifications: [], unreadCount: 0 });
    const notifications = (await db.notification
      .findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      .catch(() => [])) as DbNotificationRecord[];
    const unreadCount = notifications.filter((n: DbNotificationRecord) => n.isNew).length;
    return NextResponse.json({ notifications, unreadCount });
  }

  // 15. POST /users/notifications/read or /customers/notifications/read
  if (
    method === 'POST' &&
    (normalizedSegment === 'users/notifications/read' ||
      normalizedSegment === 'user/notifications/read' ||
      normalizedSegment === 'customers/notifications/read' ||
      segment === 'users/notifications/read' ||
      segment === 'v1/users/notifications/read' ||
      segment === 'customers/notifications/read' ||
      segment === 'v1/customers/notifications/read')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json({ success: true });
    await db.notification
      .updateMany({
        where: { userId: user.id, isNew: true },
        data: { isNew: false },
      })
      .catch(() => {});
    return NextResponse.json({ success: true });
  }

  return null;
}
