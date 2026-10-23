import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { safeApiErrorResponse } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { createOrderSchema, updateOrderStatusSchema } from '@/lib/validations/api-schemas';
import {
  evaluateCoupon,
  findActivePromo,
  findCouponByCode,
  normalizeCouponCode,
} from '@/lib/coupons';
import {
  generateGuestOrderToken,
  verifyGuestOrderToken,
  sanitizeOrderForGuest,
} from '@/lib/guest-order';
import {
  ApiDispatchContext,
  DbOrderItemRecord,
  DbOrderRecord,
  getUserFromSessionOrToken,
  requireAdmin,
} from './shared';
import { PaymentVerifier } from '@/lib/ai/payment-verifier';
import { WhatsAppService } from '@/lib/whatsapp';

export async function handleOrderRoutes(ctx: ApiDispatchContext): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

  // 2.1 GET /orders or /v1/orders
  if (method === 'GET' && (segment === 'orders' || segment === 'v1/orders')) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view orders.' },
        { status: 401 }
      );
    }

    const isAdmin = requireAdmin(user);
    const whereCondition = isAdmin ? { deletedAt: null } : { userId: user.id, deletedAt: null };

    const orders = (await db.order
      .findMany({
        where: whereCondition,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      .catch(() => [])) as DbOrderRecord[];

    const formatted = orders.map((o: DbOrderRecord) => ({
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

    return NextResponse.json({ orders: formatted });
  }

  // 2.3 GET /orders/my-orders or /v1/orders/my-orders
  if (method === 'GET' && (segment === 'orders/my-orders' || segment === 'v1/orders/my-orders')) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) {
      return NextResponse.json([]);
    }
    const orders = (await db.order
      .findMany({
        where: { userId: user.id, deletedAt: null },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => [])) as DbOrderRecord[];
    const formatted = orders.map((o: DbOrderRecord) => ({
      ...o,
      totalAmount: Number(o.totalAmount),
      items: (o.items || []).map((i: DbOrderItemRecord) => ({ ...i, price: Number(i.price) })),
    }));
    return NextResponse.json(formatted);
  }

  // 2.4 Wishlist Endpoints
  if (segment === 'wishlist' || segment === 'v1/wishlist') {
    const user = await getUserFromSessionOrToken(req);
    if (method === 'GET') {
      if (!user?.id) return NextResponse.json([]);
      const items = await db.wishlistItem
        .findMany({
          where: { userId: user.id },
          include: { product: true },
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []);
      return NextResponse.json(items);
    }
    if (method === 'POST') {
      if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json().catch(() => ({}));
      if (!body.productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 });
      }
      const item = await db.wishlistItem
        .create({
          data: { userId: user.id, productId: body.productId },
          include: { product: true },
        })
        .catch(() => null);
      return NextResponse.json(item || { success: true });
    }
    if (method === 'DELETE') {
      if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const id = req.nextUrl.searchParams.get('id');
      const productId = req.nextUrl.searchParams.get('productId');
      if (id) {
        await db.wishlistItem.deleteMany({ where: { id, userId: user.id } }).catch(() => { });
      } else if (productId) {
        await db.wishlistItem.deleteMany({ where: { userId: user.id, productId } }).catch(() => { });
      }
      return NextResponse.json({ success: true });
    }
  }

  // 2.5 GET /coupons/active or /v1/coupons/active (Active promotional coupon lookup)
  if (
    method === 'GET' &&
    (normalizedSegment === 'coupons/active' ||
      segment === 'coupons/active' ||
      segment === 'v1/coupons/active')
  ) {
    const activeCoupon = await findActivePromo();
    return NextResponse.json({ activeCoupon });
  }

  // 2.6 POST /coupons/validate or /orders/validate-coupon (Server-side coupon validation)
  if (
    method === 'POST' &&
    (normalizedSegment === 'coupons/validate' ||
      normalizedSegment === 'orders/validate-coupon' ||
      segment === 'coupons/validate' ||
      segment === 'v1/coupons/validate' ||
      segment === 'orders/validate-coupon' ||
      segment === 'v1/orders/validate-coupon')
  ) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const code = normalizeCouponCode(body.code || body.couponCode || body.coupon);
    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Please enter a coupon code.' },
        { status: 400 }
      );
    }

    const subtotal = body.subtotal !== undefined ? Number(body.subtotal) || 0 : undefined;
    const result = evaluateCoupon(await findCouponByCode(code), subtotal);
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  }

  // 2.92 POST /orders or /v1/orders (Create Order / Checkout)
  if (method === 'POST' && (segment === 'orders' || segment === 'v1/orders')) {
    const user = await getUserFromSessionOrToken(req);
    const body = await req.json().catch(() => ({}));

    let targetUserId = user?.id;
    if (!targetUserId) {
      const rawEmail = (body.shippingEmail || body.shippingInfo?.email || body.email || '')
        .trim()
        .toLowerCase();
      if (!rawEmail || !rawEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Please provide a valid shipping email address to complete your order.' },
          { status: 400 }
        );
      }

      // H1: Guest checkout must NOT attach an order to an existing user found by shippingEmail.
      const SYSTEM_GUEST_EMAIL = 'guest-checkout@system.fahadali.local';
      let guestSystemUser = await db.user
        .findUnique({
          where: { email: SYSTEM_GUEST_EMAIL },
        })
        .catch(() => null);

      if (!guestSystemUser) {
        guestSystemUser = await db.user
          .create({
            data: {
              id: 'guest_system_account',
              email: SYSTEM_GUEST_EMAIL,
              name: 'Guest Customer',
              phone: '',
              role: 'USER',
              password: null,
              lockedUntil: new Date('2099-01-01'),
            },
          })
          .catch(() => null);
      }
      targetUserId = guestSystemUser?.id || 'guest_system_account';
    }

    const parsedOrder = createOrderSchema.safeParse(body);
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!parsedOrder.success || rawItems.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item.' },
        { status: 400 }
      );
    }

    const formattedItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
    }> = [];

    for (const item of rawItems) {
      const itemObj = (item || {}) as Record<string, unknown>;
      const rawId = String(itemObj.productId || itemObj.id || '').trim();
      if (!rawId) {
        return NextResponse.json(
          { error: 'Product ID is required for all order items.' },
          { status: 400 }
        );
      }

      const rawQty = itemObj.quantity;
      const quantity = Number(rawQty);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return NextResponse.json(
          { error: 'Quantity must be an integer between 1 and 20.' },
          { status: 400 }
        );
      }

      const dbProd = await db.product.findFirst({
        where: { id: rawId, deletedAt: null },
      });

      if (!dbProd) {
        return NextResponse.json(
          { error: `Product not found or unavailable: ${rawId}` },
          { status: 400 }
        );
      }

      formattedItems.push({
        productId: dbProd.id,
        name: dbProd.name,
        price: Number(dbProd.price),
        quantity,
        image: dbProd.image || '',
      });
    }

    const subtotal = formattedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = 0;

    let verifiedDiscount = 0;
    let appliedCoupon: {
      id: string;
      code: string;
      maxUses: number;
      usedCount: number;
    } | null = null;
    const couponCode = (body.couponCode || body.coupon)?.toString()?.trim()?.toUpperCase();

    if (couponCode) {
      const dbCoupon = await db.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!dbCoupon) {
        return NextResponse.json({ error: 'Invalid or inactive coupon code.' }, { status: 400 });
      }

      const isExpired = dbCoupon.expiresAt && new Date(dbCoupon.expiresAt) < new Date();
      if (isExpired) {
        return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
      }

      const isMaxedOut = dbCoupon.maxUses > 0 && dbCoupon.usedCount >= dbCoupon.maxUses;
      if (isMaxedOut) {
        return NextResponse.json(
          { error: 'This coupon has reached its maximum usage limit.' },
          { status: 400 }
        );
      }

      const meetsMinAmount = subtotal >= Number(dbCoupon.minOrderAmount || 0);
      if (!meetsMinAmount) {
        return NextResponse.json(
          {
            error: `Minimum order amount of Rs. ${Number(dbCoupon.minOrderAmount).toLocaleString()} required for this coupon.`,
          },
          { status: 400 }
        );
      }

      appliedCoupon = dbCoupon;
      if (dbCoupon.discountType === 'PERCENTAGE') {
        verifiedDiscount = Math.round((subtotal * Number(dbCoupon.discount)) / 100);
      } else {
        verifiedDiscount = Number(dbCoupon.discount);
      }
    }

    const discount = Math.min(subtotal, Math.max(0, verifiedDiscount));
    const totalAmount = Math.max(0, subtotal + gst - discount);

    const rawMethod = String(body.paymentMethod || 'COD').toUpperCase();
    let validPaymentMethod: 'COD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK' = 'COD';
    if (rawMethod.includes('JAZZ')) validPaymentMethod = 'JAZZCASH';
    else if (rawMethod.includes('EASY')) validPaymentMethod = 'EASYPAISA';
    else if (
      rawMethod.includes('BANK') ||
      rawMethod.includes('RAAST') ||
      rawMethod.includes('CARD')
    )
      validPaymentMethod = 'BANK';
    else validPaymentMethod = 'COD';

    const shippingInfo = body.shippingInfo || {};
    const shippingName =
      body.shippingName || shippingInfo.name || body.name || 'Valued Customer';
    const shippingPhone =
      body.shippingPhone || shippingInfo.phone || body.phone || '+92 300 0000000';
    const shippingEmail = body.shippingEmail || shippingInfo.email || body.email || '';
    const shippingAddress =
      body.shippingAddress || shippingInfo.address || body.address || 'Lahore, Pakistan';
    const shippingCity = body.shippingCity || shippingInfo.city || body.city || 'Lahore';
    const shippingProvince =
      body.shippingProvince || shippingInfo.province || body.province || 'Punjab';
    const shippingNotes = body.shippingNotes || shippingInfo.notes || body.notes || '';

    let newOrder: {
      id: string;
      shippingName: string | null;
      shippingEmail: string | null;
      shippingPhone: string | null;
      shippingAddress: string | null;
      shippingCity: string | null;
      paymentMethod: string | null;
      totalAmount: unknown;
      subtotal: unknown;
      gst: unknown;
      discount: unknown;
      items: Array<{ price: unknown;[key: string]: unknown }>;
    };

    try {
      const runTx = db.$transaction.bind(db) as unknown as <T>(
        fn: (tx: typeof db) => Promise<T>,
        options?: { maxWait?: number; timeout?: number }
      ) => Promise<T>;
      newOrder = await runTx(
        async (tx) => {
          for (const item of formattedItems) {
            const stockUpdate = await tx.product.updateMany({
              where: {
                id: item.productId,
                deletedAt: null,
                stockCount: { gte: item.quantity },
              },
              data: {
                stockCount: { decrement: item.quantity },
              },
            });

            if (stockUpdate.count === 0) {
              throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
            }
          }

          if (appliedCoupon?.id) {
            const couponCondition: Record<string, unknown> = {
              id: appliedCoupon.id,
              isActive: true,
              deletedAt: null,
            };
            if (appliedCoupon.maxUses > 0) {
              couponCondition.usedCount = { lt: appliedCoupon.maxUses };
            }

            const couponUpdate = await tx.coupon.updateMany({
              where: couponCondition,
              data: { usedCount: { increment: 1 } },
            });

            if (couponUpdate.count === 0) {
              throw new Error(
                'COUPON_LIMIT_REACHED:Coupon usage limit reached or coupon no longer valid.'
              );
            }
          }

          const order = await tx.order.create({
            data: {
              user: { connect: { id: targetUserId } },
              shippingName,
              shippingPhone,
              shippingEmail: shippingEmail || 'customer@fahadaliinterior.com',
              shippingAddress,
              shippingCity,
              shippingProvince,
              shippingNotes,
              paymentMethod: validPaymentMethod,
              paymentScreenshot: body.paymentScreenshot || null,
              couponCode: appliedCoupon?.code || null,
              subtotal,
              gst,
              discount,
              totalAmount,
              status: 'PENDING',
              paymentStatus: validPaymentMethod !== 'COD' || body.paymentScreenshot ? 'AWAITING_VERIFICATION' : 'PENDING',
              items: {
                create: formattedItems,
              },
            },
            include: { items: true },
          });

          await tx.auditLog
            .create({
              data: {
                userId: targetUserId,
                action: 'ORDER_PLACED',
                entity: 'Order',
                entityId: order.id,
                metadata: {
                  totalAmount: Number(totalAmount),
                  itemCount: formattedItems.length,
                  paymentMethod: validPaymentMethod,
                },
              },
            })
            .catch(() => null);

          return order;
        },
        { maxWait: 15000, timeout: 25000 }
      );
    } catch (txError: unknown) {
      const msg = txError instanceof Error ? txError.message : String(txError || '');
      if (msg.startsWith('INSUFFICIENT_STOCK:')) {
        const prodName = msg.split(':')[1] || 'one of the selected items';
        return NextResponse.json(
          {
            error: `Insufficient stock for "${prodName}". Please adjust quantity or select another item.`,
          },
          { status: 400 }
        );
      }
      if (msg.startsWith('COUPON_LIMIT_REACHED:')) {
        return NextResponse.json(
          { error: 'This coupon has reached its maximum usage limit or is no longer valid.' },
          { status: 400 }
        );
      }
      logger.error('[Order Placement Transaction Failed]:', txError);
      throw txError;
    }

    // ── Asynchronous Background Processing: AI Screenshot Verifier, WhatsApp Admin Alert & Email ──
    const runPostOrderTasks = async () => {
      if (body.paymentScreenshot || validPaymentMethod !== 'COD') {
        try {
          const audit = await PaymentVerifier.verifyScreenshot({
            orderId: newOrder.id,
            screenshotUrlOrBase64: body.paymentScreenshot || '',
            expectedAmount: Number(totalAmount),
            paymentMethod: validPaymentMethod,
            selectedBank: String(body.selectedBank || ''),
          });

          if (audit.transactionId) {
            await db.order
              .update({
                where: { id: newOrder.id },
                data: { paymentGatewayRef: audit.transactionId },
              })
              .catch(() => null);
          }

          await db.auditLog
            .create({
              data: {
                userId: targetUserId,
                action: 'AI_PAYMENT_AUDIT',
                entity: 'Order',
                entityId: newOrder.id,
                metadata: {
                  verdict: audit.verdict,
                  confidence: audit.confidence,
                  amountMatches: audit.amountMatches,
                  isDuplicateTid: audit.isDuplicateTid,
                  extractedAmount: audit.extractedAmount,
                  transactionId: audit.transactionId,
                  summaryUrdu: audit.summaryUrdu,
                },
              },
            })
            .catch(() => null);

          // Send WhatsApp alert to Admin phone with the 3 Native Interactive Buttons
          await WhatsAppService.sendAdminOrderVerificationAlert({
            order: {
              ...newOrder,
              totalAmount: Number(newOrder.totalAmount || totalAmount),
              paymentScreenshot:
                typeof body.paymentScreenshot === 'string' ? body.paymentScreenshot : null,
              items: formattedItems,
            },
            audit,
          });
        } catch (auditErr) {
          logger.warn('[Payment Verifier & WhatsApp Dispatch Exception]:', {
            detail: String(auditErr),
          });
        }
      }

      await sendOrderConfirmationEmail({
        orderId: newOrder.id,
        customerName: newOrder.shippingName || shippingName,
        customerEmail: newOrder.shippingEmail || shippingEmail,
        customerPhone: newOrder.shippingPhone || shippingPhone,
        shippingAddress: newOrder.shippingAddress || shippingAddress,
        shippingCity: newOrder.shippingCity || shippingCity,
        paymentMethod: newOrder.paymentMethod || validPaymentMethod,
        items: formattedItems,
        subtotal,
        gst,
        discount,
        totalAmount,
        couponCode: appliedCoupon?.code || null,
      }).catch((err) => logger.error('[SMTP BACKGROUND ERROR]', err));
    };

    // Execute background jobs without delaying customer response
    runPostOrderTasks().catch((err) =>
      logger.error('[Post-Order Background Tasks Error]:', err)
    );

    if (user?.id && shippingInfo?.saveAddress !== false && shippingAddress) {
      const existingAddr = await db.address
        ?.findFirst({
          where: {
            userId: user.id,
            address: shippingAddress,
            city: shippingCity,
            deletedAt: null,
          },
        })
        ?.catch(() => null);
      if (!existingAddr) {
        const count =
          (await db.address?.count({ where: { userId: user.id, deletedAt: null } })?.catch(() => 0)) ?? 0;
        await db.address
          ?.create({
            data: {
              userId: user.id,
              name: shippingName,
              phone: shippingPhone,
              address: shippingAddress,
              city: shippingCity,
              province: shippingProvince,
              isDefault: count === 0,
            },
          })
          ?.catch(() => null);
      }
    }

    if (targetUserId) {
      await db.notification
        ?.create({
          data: {
            userId: targetUserId,
            title: `Order #${newOrder.id.slice(-6).toUpperCase()} Placed`,
            desc: `Your order of PKR ${Number(newOrder.totalAmount).toLocaleString()} has been received and is currently PENDING.`,
            type: 'order',
            isNew: true,
          },
        })
        ?.catch(() => { });
    }

    const guestTrackingToken = newOrder.shippingEmail
      ? generateGuestOrderToken(newOrder.id, newOrder.shippingEmail)
      : undefined;

    return NextResponse.json({
      success: true,
      guestTrackingToken,
      order: {
        ...newOrder,
        guestTrackingToken,
        totalAmount: Number(newOrder.totalAmount),
        subtotal: Number(newOrder.subtotal),
        gst: Number(newOrder.gst),
        discount: Number(newOrder.discount),
        items: newOrder.items.map((i) => ({ ...i, price: Number(i.price) })),
      },
    });
  }

  // 2.25 POST or GET /orders/track (Guest or authenticated order tracking lookup)
  if (
    normalizedSegment === 'orders/track' ||
    segment === 'orders/track' ||
    segment === 'v1/orders/track'
  ) {
    let orderId = '';
    let email = '';
    let token = '';

    if (method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      orderId = String(body.orderId || body.id || '').trim();
      email = String(body.email || body.shippingEmail || '').trim().toLowerCase();
      token = String(body.token || body.guestToken || '').trim();
    } else if (method === 'GET') {
      const searchParams = req.nextUrl.searchParams;
      orderId = String(searchParams.get('orderId') || searchParams.get('id') || '').trim();
      email = String(searchParams.get('email') || '').trim().toLowerCase();
      token = String(searchParams.get('token') || searchParams.get('guestToken') || '').trim();
    } else {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const cleanOrderId = decodeURIComponent(orderId).replace(/^[#\s]+/, '').trim();
    if (!cleanOrderId || cleanOrderId.length < 4) {
      return NextResponse.json({ error: 'Valid Order ID (minimum 4 characters) is required for tracking.' }, { status: 400 });
    }

    const order = (await db.order.findFirst({
      where: {
        OR: [
          { id: cleanOrderId },
          ...(cleanOrderId.length >= 6 ? [{ id: { endsWith: cleanOrderId, mode: 'insensitive' as const } }] : []),
          { id: { equals: cleanOrderId, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      include: {
        items: true,
      },
    })) as DbOrderRecord | null;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const user = await getUserFromSessionOrToken(req);
    const isAdmin = requireAdmin(user);
    const isOwner = Boolean(user?.id && order.userId === user.id);
    const orderEmail = (order.shippingEmail || '').trim().toLowerCase();
    const isEmailMatch = Boolean(email && orderEmail && email === orderEmail);
    const isTokenMatch = Boolean(
      token &&
      orderEmail &&
      (verifyGuestOrderToken(order.id, orderEmail, token) ||
        verifyGuestOrderToken(cleanOrderId, orderEmail, token))
    );

    if (!isAdmin && !isOwner && !isEmailMatch && !isTokenMatch) {
      return NextResponse.json(
        { error: 'Forbidden. Order verification failed. Please enter the email address used at checkout.' },
        { status: 403 }
      );
    }

    const sanitized = sanitizeOrderForGuest(order);
    return NextResponse.json({
      success: true,
      order: sanitized,
      data: sanitized,
      ...sanitized,
    });
  }

  // 2.3 GET /orders/:id or /v1/orders/:id
  if (
    method === 'GET' &&
    (segment.startsWith('orders/') || segment.startsWith('v1/orders/')) &&
    segment !== 'orders/track' &&
    segment !== 'v1/orders/track' &&
    normalizedSegment !== 'orders/track'
  ) {
    const rawOrderId = segment.split('/').pop() || '';
    const orderId = decodeURIComponent(rawOrderId).replace(/^[#\s]+/, '').trim();
    const order = (await db.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          ...(orderId.length >= 6 ? [{ id: { endsWith: orderId, mode: 'insensitive' as const } }] : []),
          { id: { equals: orderId, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })) as DbOrderRecord | null;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const user = await getUserFromSessionOrToken(req);
    const isAdmin = requireAdmin(user);
    const isOwner = Boolean(user?.id && order.userId === user.id);

    // Guest verification fallback
    const searchParams = req.nextUrl.searchParams;
    const guestEmail = (searchParams.get('email') || '').trim().toLowerCase();
    const guestToken = (searchParams.get('token') || searchParams.get('guestToken') || '').trim();
    const orderEmail = (order.shippingEmail || '').trim().toLowerCase();
    const isEmailMatch = Boolean(guestEmail && orderEmail && guestEmail === orderEmail);
    const isTokenMatch = Boolean(
      guestToken &&
      orderEmail &&
      (verifyGuestOrderToken(order.id, orderEmail, guestToken) ||
        verifyGuestOrderToken(orderId, orderEmail, guestToken))
    );

    if (!isAdmin && !isOwner) {
      if (!isEmailMatch && !isTokenMatch) {
        if (guestEmail || guestToken) {
          return NextResponse.json(
            { error: 'Forbidden. Invalid order verification details.' },
            { status: 403 }
          );
        }
        if (!user?.id) {
          return NextResponse.json(
            { error: 'Unauthorized. Please sign in or provide guest email/token to view this order.' },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: 'Forbidden. Access denied to this order.' },
          { status: 403 }
        );
      }

      // Guest access confirmed: return strictly sanitized order without sensitive user details
      const sanitized = sanitizeOrderForGuest(order);
      return NextResponse.json({
        success: true,
        order: sanitized,
        data: sanitized,
        ...sanitized,
        isGuestTrack: true,
      });
    }

    const formattedOrder = {
      ...order,
      discount: Number(order.discount),
      gst: Number(order.gst),
      subtotal: Number(order.subtotal),
      totalAmount: Number(order.totalAmount),
      total: Number(order.totalAmount),
      items: (order.items || []).map((item: DbOrderItemRecord) => ({
        ...item,
        price: Number(item.price),
      })),
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder,
      data: formattedOrder,
      ...formattedOrder,
    });
  }

  // 11. PUT & PATCH /admin/orders
  if (
    (method === 'PUT' || method === 'PATCH') &&
    (normalizedSegment === 'admin/orders' ||
      /^admin\/orders\/[^/]+$/.test(normalizedSegment) ||
      segment === 'admin/orders' ||
      segment === 'v1/admin/orders')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateOrderStatusSchema.safeParse(rawBody);
    if (!parsed.success || !rawBody?.id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (rawBody.status) {
      const rawStatus = String(rawBody.status).trim().toUpperCase();
      const validStatuses: Record<string, string> = {
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

    if (rawBody.paymentStatus) {
      const rawPayment = String(rawBody.paymentStatus).trim().toUpperCase();
      const validPaymentStatuses: Record<string, string> = {
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

    if (rawBody.trackingNumber !== undefined) updateData.trackingNumber = rawBody.trackingNumber;

    try {
      const updated = await db.order.update({
        where: { id: rawBody.id },
        data: updateData,
      });

      if (updated.userId && (updateData.status || updateData.paymentStatus)) {
        const shortId = updated.id.slice(-6).toUpperCase();
        const statusDesc = updateData.status
          ? `Your order #${shortId} status is now ${updated.status}.`
          : `Payment status for order #${shortId} is now ${updated.paymentStatus}.`;
        await db.notification
          ?.create({
            data: {
              userId: updated.userId,
              title: `Order #${shortId} ${updateData.status ? String(updated.status) : 'Payment Updated'}`,
              desc: statusDesc,
              type: 'order',
              isNew: true,
            },
          })
          ?.catch(() => { });
      }

      return NextResponse.json({
        success: true,
        ...updated,
        totalAmount: Number(updated.totalAmount),
        subtotal: Number(updated.subtotal),
        discount: Number(updated.discount),
        gst: Number(updated.gst),
      });
    } catch (err: unknown) {
      return safeApiErrorResponse(err, 'Failed to update order', 400, req);
    }
  }

  return null;
}
