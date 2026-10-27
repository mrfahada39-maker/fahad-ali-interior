import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { WhatsAppService } from '@/lib/whatsapp';
import { WhatsAppAdminCopilot } from '@/lib/whatsapp-admin-copilot';

/**
 * Meta WhatsApp Cloud API Webhook:
 * 1. GET: Handshake verification challenge from Meta.
 * 2. POST: Receives button click events from Admin's phone:
 *    [ ✅ Verify Payment ] -> verify_<orderId>
 *    [ ⏳ Hold 24-48h ]    -> hold_<orderId>
 *    [ ❌ Reject Payment ]  -> reject_<orderId>
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const configuredToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.ADMIN_TOKEN_SECRET;

  if (mode === 'subscribe' && token && configuredToken && token === configuredToken) {
    logger.info('[WhatsApp Webhook] Handshake verified successfully with Meta');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // Immediately mark incoming message as read on Meta Cloud API (turns grey ticks into double blue ticks)
    if (message.id && !message.id.startsWith('wamid.test')) {
      WhatsAppService.markMessageAsRead(message.id).catch(() => {});
    }

    const senderPhoneRaw = message.from ? String(message.from).replace(/\D/g, '') : '';

    // Whitelist authorized Admin numbers strictly from environment variables (Zero hardcoded numbers)
    const allowedAdminPhones = new Set(
      [
        (process.env.ADMIN_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
        (process.env.WHATSAPP_NUM || '').replace(/\D/g, ''),
        (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
      ].filter(Boolean) as string[]
    );

    // Security Guard: Check if sender matches any authorized admin phone
    const isAuthorized = Array.from(allowedAdminPhones).some(
      (p) => senderPhoneRaw === p || senderPhoneRaw.endsWith(p.slice(-10))
    );

    // Handle Meta Developer Portal "Test" button simulation
    const isMetaTest =
      !senderPhoneRaw ||
      senderPhoneRaw === '0' ||
      senderPhoneRaw === '123456789' ||
      message.id === 'wamid.test' ||
      body?.entry?.[0]?.id === '0';

    if (isMetaTest) {
      logger.info('[WhatsApp Webhook] Meta Dashboard test event received and verified.');
      return NextResponse.json({ status: 'test_received_ok' }, { status: 200 });
    }

    const senderPhone = senderPhoneRaw || '923213283301';
    let buttonId = '';

    if (message.type === 'interactive' && message.interactive?.button_reply) {
      buttonId = message.interactive.button_reply.id || '';
    } else if (message.type === 'button') {
      buttonId = message.button?.payload || message.button?.text || '';
    } else if (message.type === 'text') {
      const text = (message.text?.body || '').trim().toLowerCase();

      // Check if text is a direct 1-tap verification or rejection command e.g. "verify ORD_123"
      if (text.startsWith('verify ') || text.startsWith('approve ')) {
        if (!isAuthorized) {
          logger.warn('[WhatsApp Security Alert] Unauthorized user attempted admin command:', { sender: senderPhoneRaw, command: text });
          return NextResponse.json({ error: 'Forbidden: Unauthorized phone number' }, { status: 403 });
        }
        buttonId = `verify_${text.split(' ')[1]}`;
      } else if (text.startsWith('hold ')) {
        if (!isAuthorized) {
          return NextResponse.json({ error: 'Forbidden: Unauthorized phone number' }, { status: 403 });
        }
        buttonId = `hold_${text.split(' ')[1]}`;
      } else if (text.startsWith('reject ') || text.startsWith('cancel ')) {
        if (!isAuthorized) {
          return NextResponse.json({ error: 'Forbidden: Unauthorized phone number' }, { status: 403 });
        }
        buttonId = `reject_${text.split(' ')[1]}`;
      }
    }

    // If an action button was pressed by an unauthorized phone, reject immediately
    if (buttonId && !isAuthorized) {
      logger.warn('[WhatsApp Security Alert] Unauthorized user attempted button action:', {
        sender: senderPhoneRaw,
        buttonId,
      });
      return NextResponse.json({ error: 'Forbidden: Unauthorized phone number' }, { status: 403 });
    }

    if (!buttonId) {
      // Process text messages
      if (message.type === 'text') {
        const userMsg = (message.text?.body || '').trim();

        if (isAuthorized) {
          // Executive Admin Copilot: Interactive Question-Wise Menu & Live Database Actions
          const replyMsg = await WhatsAppAdminCopilot.processAdminCommand(senderPhone, userMsg);
          await WhatsAppService.sendTextMessage(senderPhone, replyMsg).catch((err) => {
            logger.warn('[WhatsApp Copilot Dispatch Warning]', { detail: String(err) });
          });
          return NextResponse.json({ status: 'admin_copilot_dispatched' }, { status: 200 });
        } else {
          // Public Customers: Polite showroom inquiry response & official website catalog
          const customerReply =
            `👋 Salam! *Fahad Ali Interior* mein khushamdeed.\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Aapki inquiry hum tak pohanch chuki hai. Hamari concierge team jald aap se rabta karegi.\n\n` +
            `🛋️ *Official Catalog & Online Orders:*\n` +
            `👉 https://fahad-ali-interior.vercel.app\n\n` +
            `📞 *Direct Showroom Helpline:* +92 321 3283301`;

          await WhatsAppService.sendTextMessage(senderPhone, customerReply).catch((err) => {
            logger.warn('[WhatsApp Customer AutoReply Dispatch Warning]', { detail: String(err) });
          });
          return NextResponse.json({ status: 'customer_auto_reply_sent' }, { status: 200 });
        }
      }
      return NextResponse.json({ status: 'ignored_non_text' }, { status: 200 });
    }

    // Parse action and orderId e.g. "verify_ORD-12345" or "verify_latest"
    const match = buttonId.match(/^(verify|hold|reject)_(.+)$/);
    if (!match) {
      return NextResponse.json({ status: 'unrecognized_pattern' }, { status: 200 });
    }

    const [, action, targetOrderId] = match as [string, 'verify' | 'hold' | 'reject', string];

    // Look up order in database: exact, endsWith, or latest pending
    let order = targetOrderId === 'latest'
      ? await db.order.findFirst({
        where: { paymentStatus: 'AWAITING_VERIFICATION', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      })
      : await db.order.findFirst({
        where: {
          OR: [{ id: targetOrderId }, { id: { endsWith: targetOrderId } }],
          deletedAt: null,
        },
        include: { items: true },
      });

    if (!order && targetOrderId !== 'latest') {
      // Fallback: Check if there's any pending order created in the last 24 hours
      order = await db.order.findFirst({
        where: { paymentStatus: 'AWAITING_VERIFICATION', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });
    }

    if (!order) {
      logger.warn(`[WhatsApp Webhook] Order not found for ID: ${targetOrderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // State machine integrity guard
    if (order.status === 'CANCELLED' && action !== 'reject') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }
    if ((order.status === 'SHIPPED' || order.status === 'DELIVERED') && action === 'reject') {
      return NextResponse.json({ error: `Cannot reject order in ${order.status} state` }, { status: 400 });
    }
    if (order.paymentStatus === 'PAID' && action === 'verify') {
      await WhatsAppService.sendAdminActionAck(senderPhone, order.id, 'verify');
      await WhatsAppService.sendCustomerOrderApproved(order).catch(() => {});
      return NextResponse.json({ message: 'Order is already marked as paid' }, { status: 200 });
    }

    const shortId = order.id.slice(-6).toUpperCase();

    if (action === 'verify') {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'PROCESSING',
          paymentStatus: 'PAID',
        },
      });

      if (order.userId) {
        await db.notification
          ?.create({
            data: {
              userId: order.userId,
              title: `Order #${shortId} Payment Verified`,
              desc: `Your payment of PKR ${Number(order.totalAmount).toLocaleString()} has been verified! Crafting has commenced.`,
              type: 'order',
              isNew: true,
            },
          })
          ?.catch(() => { });
      }

      await db.auditLog
        ?.create({
          data: {
            action: 'PAYMENT_VERIFIED_WHATSAPP',
            entity: 'Order',
            entityId: order.id,
            metadata: { senderPhone, source: 'Meta WhatsApp Interactive Button' },
          },
        })
        ?.catch(() => { });

      await WhatsAppService.sendAdminActionAck(senderPhone, order.id, 'verify');
      await WhatsAppService.sendCustomerOrderApproved(order).catch(() => { });
    } else if (action === 'hold') {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'AWAITING_VERIFICATION',
        },
      });

      if (order.userId) {
        await db.notification
          ?.create({
            data: {
              userId: order.userId,
              title: `Order #${shortId} Payment Under 24-48h Clearance`,
              desc: `Your payment is currently undergoing 24–48 hours bank interbank settlement. We will update you as soon as cleared.`,
              type: 'order',
              isNew: true,
            },
          })
          ?.catch(() => { });
      }

      await WhatsAppService.sendAdminActionAck(senderPhone, order.id, 'hold');
      await WhatsAppService.sendCustomerOrderHold(order).catch(() => { });
    } else if (action === 'reject') {
      // Revert stock atomically
      const runTx = db.$transaction.bind(db) as unknown as <T>(
        fn: (tx: PrismaClient) => Promise<T>,
        options?: { maxWait?: number; timeout?: number }
      ) => Promise<T>;
      await runTx(
        async (tx) => {
          for (const item of order.items) {
            await tx.product.updateMany({
              where: { id: item.productId, deletedAt: null },
              data: { stockCount: { increment: item.quantity } },
            });
          }
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              paymentStatus: 'FAILED',
            },
          });
        },
        { maxWait: 15000, timeout: 25000 }
      );

      if (order.userId) {
        await db.notification
          ?.create({
            data: {
              userId: order.userId,
              title: `Order #${shortId} Payment Verification Failed`,
              desc: `Your payment slip could not be verified. Please contact our artisan concierge or re-submit a valid receipt.`,
              type: 'order',
              isNew: true,
            },
          })
          ?.catch(() => { });
      }

      await WhatsAppService.sendAdminActionAck(senderPhone, order.id, 'reject');
      await WhatsAppService.sendCustomerOrderRejected(order).catch(() => { });
    }

    return NextResponse.json({ success: true, action, orderId: order.id });
  } catch (err) {
    logger.error('[WhatsApp Webhook Error]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
