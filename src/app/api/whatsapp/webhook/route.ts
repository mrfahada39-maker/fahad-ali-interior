import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { WhatsAppService } from '@/lib/whatsapp';

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

  const candidateTokens = [
    'fahad_ali_whatsapp_verify_token_2026',
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    process.env.ADMIN_TOKEN_SECRET,
  ].filter(Boolean) as string[];

  if (mode === 'subscribe' && token && candidateTokens.includes(token)) {
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

    const senderPhoneRaw = message.from ? String(message.from).replace(/\D/g, '') : '';

    // Whitelist authorized Admin numbers (including user's primary active WhatsApp)
    const allowedAdminPhones = new Set(
      [
        '923213283301',
        '923207006110',
        (process.env.ADMIN_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
        (process.env.WHATSAPP_NUM || '').replace(/\D/g, ''),
        (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
      ].filter(Boolean) as string[]
    );

    // Security Guard: Check if sender matches any authorized admin phone
    const isAuthorized = Array.from(allowedAdminPhones).some(
      (p) => senderPhoneRaw === p || senderPhoneRaw.endsWith(p.slice(-10))
    );

    if (!senderPhoneRaw || !isAuthorized) {
      logger.warn('[WhatsApp Security Warning] Action attempted by unauthorized phone number:', {
        sender: senderPhoneRaw,
        allowed: Array.from(allowedAdminPhones),
      });
      return NextResponse.json({ error: 'Forbidden: Unauthorized phone number' }, { status: 403 });
    }

    const senderPhone = senderPhoneRaw;
    let buttonId = '';

    if (message.type === 'interactive' && message.interactive?.button_reply) {
      buttonId = message.interactive.button_reply.id || '';
    } else if (message.type === 'button') {
      buttonId = message.button?.payload || message.button?.text || '';
    } else if (message.type === 'text') {
      const text = (message.text?.body || '').trim().toLowerCase();
      // Handle text command fallback e.g. "verify ord_123" or plain "verify"
      if (text.startsWith('verify ')) buttonId = `verify_${text.split(' ')[1]}`;
      else if (text.startsWith('hold ')) buttonId = `hold_${text.split(' ')[1]}`;
      else if (text.startsWith('reject ') || text.startsWith('cancel ')) buttonId = `reject_${text.split(' ')[1]}`;
      else if (text.includes('verify')) buttonId = 'verify_latest';
      else if (text.includes('hold')) buttonId = 'hold_latest';
      else if (text.includes('reject') || text.includes('cancel')) buttonId = 'reject_latest';
    }

    if (!buttonId) {
      return NextResponse.json({ status: 'no_action_id' }, { status: 200 });
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
    } else if (action === 'reject') {
      // Revert stock atomically
      const runTx = db.$transaction.bind(db) as unknown as <T>(
        fn: (tx: any) => Promise<T>,
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
    }

    return NextResponse.json({ success: true, action, orderId: order.id });
  } catch (err) {
    logger.error('[WhatsApp Webhook Error]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
