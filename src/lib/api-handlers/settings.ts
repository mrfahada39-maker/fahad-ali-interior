import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { BUSINESS_CONTACT } from '@/lib/contact-config';
import {
  listRecycleBinItems,
  restoreFromRecycleBin,
  permanentlyDeleteFromRecycleBin,
  emptyRecycleBin,
  RecycleBinEntityType,
} from '@/lib/recycle-bin';
import { updateSettingsSchema } from '@/lib/validations/api-schemas';
import {
  ApiDispatchContext,
  DbCategoryRecord,
  DbMessageRecord,
  DbOrderItemRecord,
  DbOrderRecord,
  DbProductRecord,
  DbReviewRecord,
  DbUserRecord,
  fallbackCategories,
  getUserFromSessionOrToken,
  requireAdmin,
} from './shared';

export async function handleSettingsAndBundleRoutes(
  ctx: ApiDispatchContext
): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

  // 0. GET /health or /api/v1/health
  if (method === 'GET' && (segment === 'health' || segment === 'v1/health')) {
    const user = await getUserFromSessionOrToken(req).catch(() => null);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { status: 'healthy' },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Health-Status': 'PASS',
          },
        }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        services: {
          database: { status: 'connected' },
          api: { status: 'operational' },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Health-Status': 'PASS',
        },
      }
    );
  }

  // 3. GET /admin/dashboard-bundle
  if (
    method === 'GET' &&
    (segment === 'admin/dashboard-bundle' || segment === 'v1/admin/dashboard-bundle')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }

    const [products, orders, users, settingsRaw, reviews, inquiries, usersWithMessages] =
      await Promise.all([
        db.product.findMany({ where: { deletedAt: null } }),
        db.order.findMany({
          where: { deletedAt: null },
          include: {
            items: true,
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        db.user.findMany({ where: { deletedAt: null } }),
        db.settings.findFirst().catch(() => null),
        db.review
          .findMany({
            where: { deletedAt: null },
            include: {
              product: { select: { id: true, name: true, image: true, price: true } },
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
          .catch(() => []),
        db.inquiry.findMany({ where: { deletedAt: null } }).catch(() => []),
        db.user
          .findMany({
            where: { messages: { some: {} } },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              messages: {
                orderBy: { createdAt: 'asc' },
                select: { id: true, text: true, sender: true, createdAt: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          })
          .catch(() => []),
      ]);

    const settings = settingsRaw || {
      id: 'default',
      siteName: 'Fahad Ali Interior',
      adminEmail: BUSINESS_CONTACT.adminEmail,
      contactPhone: BUSINESS_CONTACT.phone,
      storeAddress: BUSINESS_CONTACT.address,
      currency: 'PKR',
    };

    const messageThreads = (usersWithMessages as DbUserRecord[]).map((u: DbUserRecord) => ({
      id: u.id,
      name: u.name || 'Valued Client',
      email: u.email,
      phone: u.phone || '',
      messages: (u.messages || []).map((m: DbMessageRecord) => ({
        id: m.id,
        text: m.text,
        sender: m.sender || 'user',
        createdAt: m.createdAt,
      })),
    }));

    const formattedProducts = (products as DbProductRecord[]).map((p: DbProductRecord) => ({
      ...p,
      price: Number(p.price),
    }));

    const formattedOrders = (orders as DbOrderRecord[]).map((o: DbOrderRecord) => ({
      ...o,
      discount: Number(o.discount),
      gst: Number(o.gst),
      totalAmount: Number(o.totalAmount),
      subtotal: Number(o.subtotal),
      items: (o.items || []).map((it: DbOrderItemRecord) => ({
        ...it,
        price: Number(it.price),
      })),
      user: o.user || null,
    }));

    const totalRevenue = formattedOrders.reduce(
      (sum: number, o) => sum + Number(o.totalAmount),
      0
    );
    const orderCount = formattedOrders.length;
    const userCount = users.length;
    const productCount = formattedProducts.length;

    const stats = {
      totalRevenue,
      orderCount,
      userCount,
      productCount,
    };

    const revenueByMonth: Record<string, number> = {};
    formattedOrders.forEach((o) => {
      const date = new Date(o.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(o.totalAmount);
    });

    const categoryCounts: Record<string, number> = {};
    formattedProducts.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      _count: { category: count },
    }));

    const analytics = {
      revenueByMonth,
      categoryDistribution,
    };

    const formattedCustomers = (users as DbUserRecord[]).map((u: DbUserRecord) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      stats,
      products: formattedProducts,
      orders: formattedOrders,
      customers: formattedCustomers,
      users: formattedCustomers,
      messages: messageThreads,
      reviews,
      inquiries,
      siteSettings: settings,
      analytics,
      account: {
        name: 'Fahad Ali',
        email: BUSINESS_CONTACT.adminEmail,
        phone: BUSINESS_CONTACT.phone,
      },
    });
  }

  // 3.1 GET /public/home-bundle
  if (
    method === 'GET' &&
    (segment === 'public/home-bundle' || segment === 'v1/public/home-bundle')
  ) {
    const [
      products,
      categories,
      settings,
      approvedReviewsCount,
      completedOrders,
      uniqueCustomers,
      allProductsCount,
      productGroups,
      approvedReviewsList,
    ] = await Promise.all([
      db.product.findMany({ where: { deletedAt: null }, take: 12, orderBy: { createdAt: 'desc' } }),
      db.category.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } }).catch(() => []),
      db.settings.findFirst().catch(() => null),
      db.review.count({ where: { deletedAt: null, status: 'APPROVED' } }).catch(() => 0),
      db.order.count({ where: { deletedAt: null } }).catch(() => 0),
      db.user.count({ where: { deletedAt: null } }).catch(() => 0),
      db.product.count({ where: { deletedAt: null } }).catch(() => 0),
      db.product
        .groupBy({
          by: ['category'],
          where: { deletedAt: null },
          _count: { id: true },
        })
        .catch(() => []),
      db.review
        .findMany({
          where: { deletedAt: null, status: 'APPROVED' },
          include: {
            product: { select: { id: true, name: true, image: true, category: true } },
            user: { select: { id: true, name: true, avatar: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
        .catch(() => []),
    ]);

    const categoryCountMap = new Map<string, number>();
    for (const group of productGroups) {
      if (group.category) {
        categoryCountMap.set(group.category.trim().toLowerCase(), group._count.id);
      }
    }

    const formattedProducts = (products as DbProductRecord[]).map((p: DbProductRecord) => ({
      ...p,
      price: Number(p.price),
    }));

    const formattedCategories = (categories as DbCategoryRecord[]).map((c: DbCategoryRecord) => {
      const cleanName = (c.name || '').trim().toLowerCase();
      const liveCount = categoryCountMap.get(cleanName) ?? 0;
      return {
        name: c.name,
        count: liveCount,
        image: c.image || '/cat-thumb-sofas-2x.webp',
        description: c.description || 'Solid Sheesham Wood',
        items:
          liveCount > 0
            ? `${liveCount} ${liveCount === 1 ? 'Item' : 'Items'} Available`
            : 'Collection Available',
      };
    });

    const formattedReviews = ((approvedReviewsList || []) as DbReviewRecord[]).map(
      (r: DbReviewRecord) => ({
        id: r.id,
        customerName:
          r.customerName ||
          r.user?.name ||
          (r.user?.email ? r.user.email.split('@')[0] : 'Verified Patron'),
        rating: Number(r.rating) || 5,
        comment: r.comment || '',
        image: r.image || null,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        product: {
          id: r.product?.id,
          name: r.product?.name || 'Handcrafted Solid Sheesham',
          image: r.product?.image || null,
        },
        user: {
          name: r.user?.name || r.customerName || 'Verified Patron',
          image: r.user?.avatar || null,
        },
      })
    );

    return NextResponse.json(
      {
        stats: {
          products: allProductsCount || products.length,
          approvedReviews: approvedReviewsCount,
          completedOrders,
          uniqueCustomers,
        },
        products: formattedProducts,
        categories:
          formattedCategories.length > 0
            ? formattedCategories
            : fallbackCategories.map((c) => ({
                name: c.name,
                count: 0,
                image: null,
                description: '',
              })),
        reviews: formattedReviews,
        settings: settings
          ? {
              siteName: settings.siteName || 'Fahad Ali Interior',
              contactPhone: settings.contactPhone || BUSINESS_CONTACT.phone,
              adminEmail:
                settings.adminEmail &&
                !/@(gmail|yahoo|hotmail)\.com$/i.test(settings.adminEmail)
                  ? settings.adminEmail
                  : BUSINESS_CONTACT.supportEmail,
              storeAddress: settings.storeAddress || BUSINESS_CONTACT.address,
              socialInstagram: settings.socialInstagram || '',
              socialFacebook: settings.socialFacebook || '',
              socialWhatsapp: settings.socialWhatsapp || BUSINESS_CONTACT.whatsapp,
              foundedYear: settings.foundedYear || '2020',
              currency: settings.currency || 'PKR',
            }
          : {
              siteName: 'Fahad Ali Interior',
              contactPhone: BUSINESS_CONTACT.phone,
              adminEmail: BUSINESS_CONTACT.supportEmail,
              storeAddress: BUSINESS_CONTACT.address,
              socialInstagram: '',
              socialFacebook: '',
              socialWhatsapp: BUSINESS_CONTACT.whatsapp,
              foundedYear: '2020',
              currency: 'PKR',
            },
        banners: [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }

  // 3.2 GET /public/stats
  if (method === 'GET' && (segment === 'public/stats' || segment === 'v1/public/stats')) {
    const [approvedReviews, completedOrders, uniqueCustomers, products] = await Promise.all([
      db.review.count({ where: { deletedAt: null } }).catch(() => 0),
      db.order.count({ where: { deletedAt: null } }).catch(() => 0),
      db.user.count({ where: { deletedAt: null } }).catch(() => 0),
      db.product.count({ where: { deletedAt: null } }).catch(() => 0),
    ]);

    return NextResponse.json({
      approvedReviews,
      completedOrders,
      uniqueCustomers,
      products,
    });
  }

  // 11.0 GET /public/settings, /v1/public/settings, /settings, /admin/settings
  if (
    method === 'GET' &&
    (normalizedSegment === 'public/settings' ||
      segment === 'public/settings' ||
      segment === 'v1/public/settings' ||
      normalizedSegment === 'settings' ||
      segment === 'settings' ||
      segment === 'v1/settings' ||
      normalizedSegment === 'admin/settings' ||
      segment === 'admin/settings' ||
      segment === 'v1/admin/settings')
  ) {
    const isAdminSettingsRoute =
      normalizedSegment === 'admin/settings' ||
      segment === 'admin/settings' ||
      segment === 'v1/admin/settings';

    if (isAdminSettingsRoute) {
      const user = await getUserFromSessionOrToken(req);
      if (!requireAdmin(user)) {
        return NextResponse.json(
          { error: 'Forbidden. Executive admin credentials required.' },
          { status: 403 }
        );
      }
    }
    const existing = await db.settings.findFirst().catch(() => null);
    const defaultSettings = {
      id: 'singleton',
      siteName: 'Fahad Ali Interior',
      adminEmail: BUSINESS_CONTACT.adminEmail,
      contactPhone: BUSINESS_CONTACT.phone,
      storeAddress: BUSINESS_CONTACT.address,
      currency: 'PKR',
      socialInstagram: 'https://instagram.com/fahadaliinterior',
      socialFacebook: 'https://facebook.com/fahadaliinterior',
      socialWhatsapp: BUSINESS_CONTACT.whatsapp,
      foundedYear: '2020',
      themeFontFamily: 'Playfair Display',
      themeBgColor: '#FAF7F2',
      themeSurfaceColor: '#FFFFFF',
      themeBorderColor: '#EAE5DF',
      themeDarkColor: '#1A1A1A',
      themeMutedColor: '#8A8682',
      themeAccentColor: '#2C251F',
    };
    const resolvedSettings = existing
      ? {
          ...existing,
          adminEmail: isAdminSettingsRoute
            ? existing.adminEmail
            : existing.adminEmail &&
                !/@(gmail|yahoo|hotmail)\.com$/i.test(existing.adminEmail)
              ? existing.adminEmail
              : BUSINESS_CONTACT.supportEmail,
        }
      : defaultSettings;

    return NextResponse.json(resolvedSettings, {
      headers: {
        'Cache-Control': isAdminSettingsRoute
          ? 'private, no-store, no-cache, must-revalidate'
          : 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  }

  // 11.1 PUT & POST /admin/settings
  if (
    (method === 'PUT' || method === 'POST') &&
    (normalizedSegment === 'admin/settings' ||
      segment === 'admin/settings' ||
      segment === 'v1/admin/settings')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateSettingsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid settings payload' },
        { status: 400 }
      );
    }
    const body = parsed.data;
    const existing = await db.settings.findFirst();
    let updated;
    if (existing) {
      updated = await db.settings.update({
        where: { id: existing.id },
        data: {
          siteName: body.siteName ?? existing.siteName,
          contactPhone: body.contactPhone ?? existing.contactPhone,
          adminEmail: body.adminEmail ?? existing.adminEmail,
          storeAddress: body.storeAddress ?? existing.storeAddress,
          socialInstagram: body.socialInstagram ?? existing.socialInstagram,
          socialFacebook: body.socialFacebook ?? existing.socialFacebook,
          socialWhatsapp: body.socialWhatsapp ?? existing.socialWhatsapp,
          foundedYear: body.foundedYear ?? existing.foundedYear,
          currency: body.currency ?? existing.currency,
          bankName: body.bankName ?? existing.bankName,
          accountTitle: body.accountTitle ?? existing.accountTitle,
          accountNumber: body.accountNumber ?? existing.accountNumber,
          iban: body.iban ?? existing.iban,
          jazzcashNumber: body.jazzcashNumber ?? existing.jazzcashNumber,
          easypaisaNumber: body.easypaisaNumber ?? existing.easypaisaNumber,
        },
      });
    } else {
      updated = await db.settings.create({
        data: {
          siteName: body.siteName || 'Fahad Ali Interior',
          contactPhone: body.contactPhone || BUSINESS_CONTACT.phone,
          adminEmail: body.adminEmail || BUSINESS_CONTACT.adminEmail,
          storeAddress: body.storeAddress || BUSINESS_CONTACT.address,
          socialInstagram: body.socialInstagram || '',
          socialFacebook: body.socialFacebook || '',
          socialWhatsapp: body.socialWhatsapp || BUSINESS_CONTACT.whatsapp,
          foundedYear: body.foundedYear || '2024',
          currency: body.currency || 'PKR',
          bankName: body.bankName || process.env.NEXT_PUBLIC_BANK_NAME || 'Meezan Bank Limited',
          accountTitle: body.accountTitle || process.env.NEXT_PUBLIC_BANK_ACCOUNT_TITLE || 'FAHAD ALI INTERIOR',
          accountNumber: body.accountNumber || process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '',
          iban: body.iban || process.env.NEXT_PUBLIC_BANK_IBAN || '',
          jazzcashNumber: body.jazzcashNumber || process.env.NEXT_PUBLIC_JAZZCASH_NUMBER || '',
          easypaisaNumber: body.easypaisaNumber || process.env.NEXT_PUBLIC_EASYPAISA_NUMBER || '',
        },
      });
    }
    return NextResponse.json(updated);
  }

  // 23. Admin Recycle Bin (GET, POST, DELETE /admin/recycle-bin)
  if (
    normalizedSegment === 'admin/recycle-bin' ||
    /^admin\/recycle-bin\/.*$/.test(normalizedSegment) ||
    segment === 'admin/recycle-bin' ||
    segment === 'v1/admin/recycle-bin'
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }

    if (method === 'GET') {
      const { searchParams } = new URL(req.url);
      const entityType =
        (searchParams.get('entityType') as RecycleBinEntityType | 'ALL') || 'ALL';
      const search = searchParams.get('search') || undefined;
      const skip = parseInt(searchParams.get('skip') || '0', 10);
      const take = parseInt(searchParams.get('take') || '50', 10);

      const result = await listRecycleBinItems({
        entityType,
        search,
        skip,
        take,
      });

      return NextResponse.json({ success: true, ...result });
    }

    if (method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { action, id } = body;

      if (action === 'restore' || (!action && id)) {
        if (!id) {
          return NextResponse.json(
            { error: 'Recycle bin item ID is required' },
            { status: 400 }
          );
        }
        const result = await restoreFromRecycleBin(id, user?.id);
        try {
          revalidatePath('/', 'layout');
        } catch {}
        return NextResponse.json(result);
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (method === 'DELETE') {
      const { searchParams } = new URL(req.url);
      const body = await req.json().catch(() => ({}));
      const id = searchParams.get('id') || body?.id;
      const action = searchParams.get('action') || body?.action;
      const entityType = (searchParams.get('entityType') || body?.entityType) as
        | RecycleBinEntityType
        | undefined;
      const all = searchParams.get('all') === 'true' || body?.all === true;

      if (id && action !== 'empty') {
        const result = await permanentlyDeleteFromRecycleBin(id, user?.id);
        return NextResponse.json(result);
      }

      if (all || action === 'empty' || entityType) {
        const result = await emptyRecycleBin(entityType, user?.id);
        return NextResponse.json(result);
      }

      return NextResponse.json(
        { error: 'Provide item id or specify empty/all action' },
        { status: 400 }
      );
    }
  }

  return null;
}
