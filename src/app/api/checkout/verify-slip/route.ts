import { NextRequest, NextResponse } from 'next/server';
import { PaymentVerifier } from '@/lib/ai/payment-verifier';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { getVerifiedUser } from '@/lib/admin-auth';
import { verifyGuestOrderToken } from '@/lib/guest-order';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface TargetOrderInfo {
  id: string;
  userId: string | null;
  shippingEmail: string | null;
  totalAmount: unknown;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`slip_verify:${ip}`, 'upload');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.error || 'Too many verification attempts. Please wait.' },
      { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
    );
  }

  let orderId = '';
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const slipBase64 = typeof body.slipBase64 === 'string' ? body.slipBase64 : '';
    orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const expectedAmount = body.expectedAmount;
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : 'ONLINE_BANK';
    const selectedBank = typeof body.selectedBank === 'string' ? body.selectedBank : 'Meezan Bank';

    if (!slipBase64) {
      return NextResponse.json({ error: 'Slip image is required' }, { status: 400 });
    }

    const verifiedUser = await getVerifiedUser(req).catch(() => null);

    let targetOrder: TargetOrderInfo | null = null;
    if (orderId && orderId !== 'STANDALONE_AUDIT') {
      targetOrder = await db.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, shippingEmail: true, totalAmount: true },
      }).catch((dbErr) => {
        logger.error('Database error checking order for slip verification:', dbErr, { orderId });
        return null;
      });
    }

    if (verifiedUser) {
      // Authenticated session:
      // If targeting a specific order, user must be an admin or the order owner
      if (orderId && orderId !== 'STANDALONE_AUDIT') {
        if (!targetOrder) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const isAdmin = verifiedUser.role === 'ADMIN' || verifiedUser.role === 'SUPER_ADMIN';
        const isOwner = Boolean(
          (targetOrder.userId && targetOrder.userId === verifiedUser.id) ||
          (targetOrder.shippingEmail &&
            verifiedUser.email &&
            targetOrder.shippingEmail.toLowerCase() === verifiedUser.email.toLowerCase())
        );

        if (!isAdmin && !isOwner) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    } else {
      // Unauthenticated session:
      // Requires an existing order and an order-bound guest HMAC token
      if (!orderId || orderId === 'STANDALONE_AUDIT') {
        return NextResponse.json(
          { error: 'Authentication or valid order token required' },
          { status: 401 }
        );
      }

      const orderToken =
        req.headers.get('x-order-token') ||
        req.headers.get('x-guest-token') ||
        (typeof body.guestToken === 'string' ? body.guestToken : '') ||
        (typeof body.orderToken === 'string' ? body.orderToken : '') ||
        (typeof body.token === 'string' ? body.token : '');

      if (!orderToken) {
        return NextResponse.json(
          { error: 'Authentication or valid order token required' },
          { status: 401 }
        );
      }

      const orderEmail = targetOrder?.shippingEmail || '';
      const isTokenValid = Boolean(
        targetOrder &&
        orderEmail &&
        verifyGuestOrderToken(targetOrder.id, orderEmail, orderToken)
      );

      if (!isTokenValid) {
        return NextResponse.json(
          { error: 'Invalid or unauthorized order' },
          { status: 401 }
        );
      }
    }

    const calculatedExpectedAmount =
      expectedAmount !== undefined && expectedAmount !== null && expectedAmount !== ''
        ? Number(expectedAmount)
        : (targetOrder?.totalAmount ? Number(targetOrder.totalAmount) : 0);

    const audit = await PaymentVerifier.verifyScreenshot({
      orderId: targetOrder?.id || orderId || 'STANDALONE_AUDIT',
      screenshotUrlOrBase64: slipBase64,
      expectedAmount: Number.isNaN(calculatedExpectedAmount) ? 0 : calculatedExpectedAmount,
      paymentMethod,
      selectedBank,
    });

    return NextResponse.json({ success: true, audit });
  } catch (error: unknown) {
    logger.error('Slip verification unexpected failure:', error, { orderId });
    return NextResponse.json(
      { error: 'Slip verification could not be completed. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
