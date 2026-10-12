/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';

export function getGuestSecret(): string {
  return (
    process.env.ADMIN_TOKEN_SECRET ||
    process.env.AI_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'fai-guest-order-secret-2026'
  );
}

/**
 * Generates a tamper-proof HMAC guest tracking token for an order ID + email.
 */
export function generateGuestOrderToken(orderId: string, email: string): string {
  const normId = (orderId || '').trim().toLowerCase();
  const normEmail = (email || '').trim().toLowerCase();
  return crypto
    .createHmac('sha256', getGuestSecret())
    .update(`${normId}:${normEmail}`)
    .digest('hex');
}

/**
 * Verifies a guest tracking token using constant-time comparison.
 */
export function verifyGuestOrderToken(orderId: string, email: string, token: string): boolean {
  if (!orderId || !email || !token) return false;
  try {
    const expected = generateGuestOrderToken(orderId, email);
    const tokenBuf = Buffer.from(token);
    const expBuf = Buffer.from(expected);
    if (tokenBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Sanitizes order data for guest view to strictly prevent leaking
 * other users' account details, internal notes, or sensitive fields.
 */
export function sanitizeOrderForGuest(order: any) {
  if (!order) return null;
  const orderId = String(order.id || '');
  const email = String(order.shippingEmail || '');
  const token = email ? generateGuestOrderToken(orderId, email) : '';

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    trackingNumber: order.trackingNumber || null,
    shippingName: order.shippingName || '',
    shippingAddress: order.shippingAddress || '',
    shippingCity: order.shippingCity || '',
    shippingProvince: order.shippingProvince || '',
    shippingEmail: order.shippingEmail || '',
    subtotal: Number(order.subtotal || 0),
    discount: Number(order.discount || 0),
    gst: Number(order.gst || 0),
    totalAmount: Number(order.totalAmount || 0),
    total: Number(order.totalAmount || 0),
    couponCode: order.couponCode || null,
    guestToken: token,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          image: item.image || '',
          size: item.size || null,
          color: item.color || null,
        }))
      : [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
