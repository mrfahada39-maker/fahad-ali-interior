import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PrismaClient } from '@prisma/client';
import { verifyOrderActionToken } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getVerifiedAdmin } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`order_action:${ip}`, 'api');
  if (!rl.allowed) {
    return new NextResponse(
      renderHtmlPage('Too Many Requests', 'Rate limit exceeded. Please wait a minute and try again.', 'error'),
      { status: 429, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('id') || '';
  const action = searchParams.get('action') || '';
  const token = searchParams.get('token') || '';

  if (!orderId || !action || !token) {
    return new NextResponse(renderHtmlPage('Invalid Request', 'Missing required verification parameters.', 'error'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!['verify', 'hold', 'reject'].includes(action)) {
    return new NextResponse(renderHtmlPage('Invalid Action', 'Action must be verify, hold, or reject.', 'error'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Cryptographic token verification or authenticated admin session
  const isValid = verifyOrderActionToken(orderId, action, token);
  const isAdminSession = !isValid && (await getVerifiedAdmin(req).catch(() => null));
  if (!isValid && !isAdminSession) {
    return new NextResponse(
      renderHtmlPage('Security Token Expired or Invalid', 'This 1-Tap authorization link is either expired or tampered.', 'error'),
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  try {
    const order = await db.order.findFirst({
      where: {
        OR: [{ id: orderId }, { id: { endsWith: orderId } }],
        deletedAt: null,
      },
      include: { items: true },
    });

    if (!order) {
      return new NextResponse(renderHtmlPage('Order Not Found', `No active order found with ID: ${orderId}`, 'error'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const shortId = order.id.slice(-6).toUpperCase();
    const amount = Number(order.totalAmount).toLocaleString();

    // State machine integrity checks
    if (order.status === 'CANCELLED' && action !== 'reject') {
      return new NextResponse(
        renderHtmlPage(
          'Order Already Cancelled',
          `Order #${shortId} was previously cancelled and closed.`,
          'warning',
          shortId,
          amount,
          'cancelled'
        ),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    if ((order.status === 'SHIPPED' || order.status === 'DELIVERED') && action === 'reject') {
      return new NextResponse(
        renderHtmlPage(
          'Cannot Cancel Finalized Order',
          `Order #${shortId} has already been ${order.status}. Stock cannot be returned.`,
          'error',
          shortId,
          amount,
          order.status
        ),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    if (order.paymentStatus === 'PAID' && action === 'verify') {
      return new NextResponse(
        renderHtmlPage(
          'Order Already Verified',
          `Order #${shortId} has already been verified and paid.`,
          'success',
          shortId,
          amount,
          'paid'
        ),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

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
              desc: `Your payment of PKR ${amount} has been verified! Crafting has commenced.`,
              type: 'order',
              isNew: true,
            },
          })
          ?.catch(() => {});
      }

      await db.auditLog
        ?.create({
          data: {
            action: 'PAYMENT_VERIFIED_1TAP_LINK',
            entity: 'Order',
            entityId: order.id,
            metadata: { source: 'WhatsApp 1-Tap Link', orderId: order.id },
          },
        })
        ?.catch(() => {});

      return new NextResponse(
        renderHtmlPage(
          'Payment Verified Successfully!',
          `Order #${shortId} (PKR ${amount}) is now marked as <strong>PAID & PROCESSING</strong>. Client has been notified.`,
          'success',
          shortId,
          amount
        ),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (action === 'hold') {
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
              title: `Order #${shortId} Under 24-48h Clearance`,
              desc: `Your payment is currently undergoing 24–48 hours bank interbank settlement. We will update you as soon as cleared.`,
              type: 'order',
              isNew: true,
            },
          })
          ?.catch(() => {});
      }

      return new NextResponse(
        renderHtmlPage(
          'Order Placed On 24-48h Hold',
          `Order #${shortId} has been put on hold. Client notified that bank settlement verification is pending.`,
          'warning',
          shortId,
          amount
        ),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (action === 'reject') {
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
          ?.catch(() => {});
      }

      return new NextResponse(
        renderHtmlPage(
          'Order Rejected & Cancelled',
          `Order #${shortId} was rejected. Payment marked as <strong>FAILED</strong> and stock inventory has been restored.`,
          'error',
          shortId,
          amount
        ),
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return new NextResponse('Action Completed', { status: 200 });
  } catch (err) {
    logger.error('[Order Action Link Error]', err);
    return new NextResponse(renderHtmlPage('Internal Server Error', 'An unexpected error occurred while updating the order.', 'error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function renderHtmlPage(
  title: string,
  message: string,
  type: 'success' | 'warning' | 'error',
  orderRef?: string,
  amount?: string,
  actionName?: string
): string {
  const isSuccess = type === 'success';
  const isWarning = type === 'warning';
  const icon = isSuccess ? '✓' : isWarning ? '⏳' : '✕';
  const color = isSuccess ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444';
  const bgLight = isSuccess ? '#ECFDF5' : isWarning ? '#FFFBEB' : '#FEF2F2';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Fahad Ali Interior</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #FAF7F2;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1F1612;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #ffffff;
      border: 1px solid #E7DDD0;
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 440px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(44,30,24,0.06);
    }
    .badge-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${bgLight};
      color: ${color};
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      border: 2px solid ${color}40;
    }
    h1 {
      font-size: 20px;
      font-weight: 900;
      margin: 0 0 12px 0;
      color: #1F1612;
      font-family: Georgia, serif;
    }
    p {
      font-size: 13px;
      line-height: 1.6;
      color: #6B5B52;
      margin: 0 0 24px 0;
    }
    .details {
      background: #FCFAF7;
      border: 1px solid #EFE8DD;
      border-radius: 16px;
      padding: 14px 18px;
      margin-bottom: 24px;
      text-align: left;
      font-size: 12px;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .details-row:last-child {
      margin-bottom: 0;
    }
    .btn {
      display: inline-block;
      background: #8C6239;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: bold;
      font-size: 12px;
      padding: 12px 24px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge-icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${
      orderRef
        ? `
    <div class="details">
      <div class="details-row">
        <span style="color:#8C6239;font-weight:bold;">Order ID:</span>
        <span style="font-weight:900;">#${orderRef}</span>
      </div>
      <div class="details-row">
        <span style="color:#8C6239;font-weight:bold;">Settlement:</span>
        <span style="font-weight:900;">PKR ${amount}</span>
      </div>
      <div class="details-row">
        <span style="color:#8C6239;font-weight:bold;">Status:</span>
        <span style="color:${color};font-weight:900;text-transform:uppercase;">${actionName || type}</span>
      </div>
    </div>`
        : ''
    }
    <a href="/admin" class="btn">Return to Admin Terminal</a>
  </div>
</body>
</html>`;
}
