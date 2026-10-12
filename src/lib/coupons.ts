import { db } from '@/lib/db';

/** Minimal coupon shape needed for validation (matches Prisma `Coupon`). */
export interface CouponRecord {
  id: string;
  code: string;
  discount: unknown;
  discountType: string;
  minOrderAmount: unknown;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | string | null;
  isActive?: boolean;
  deletedAt?: Date | string | null;
}

export interface ActivePromo {
  code: string;
  discount: number;
  discountType: string;
  minOrderAmount: number;
}

export type CouponEvaluation =
  | {
      valid: true;
      code: string;
      discountType: string;
      discount: number;
      minOrderAmount: number;
      discountAmount: number;
    }
  | { valid: false; status: number; error: string };

export function normalizeCouponCode(raw: unknown): string {
  return String(raw ?? '').trim().toUpperCase();
}

/** True when the coupon is not expired and still has remaining uses. */
export function isCouponUsable(c: CouponRecord, now: Date = new Date()): boolean {
  if (c.isActive === false || c.deletedAt) return false;
  const notExpired = !c.expiresAt || new Date(c.expiresAt) >= now;
  const underLimit = c.maxUses <= 0 || c.usedCount < c.maxUses;
  return notExpired && underLimit;
}

export function computeCouponDiscount(c: CouponRecord, subtotal: number): number {
  const value = Number(c.discount);
  const raw = c.discountType === 'PERCENTAGE' ? Math.round((subtotal * value) / 100) : value;
  const positive = Math.max(0, raw);
  return subtotal > 0 ? Math.min(subtotal, positive) : positive;
}

/**
 * Pure evaluation of a DB coupon against a subtotal. `subtotal` undefined skips
 * the minimum-order check (used for "peek" validation before the cart is known).
 */
export function evaluateCoupon(
  coupon: CouponRecord | null,
  subtotal: number | undefined,
  now: Date = new Date()
): CouponEvaluation {
  if (!coupon || coupon.isActive === false || coupon.deletedAt) {
    return { valid: false, status: 404, error: 'Invalid or inactive coupon code.' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { valid: false, status: 400, error: 'This coupon has expired.' };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, status: 400, error: 'This coupon has reached its maximum usage limit.' };
  }
  const minOrderAmount = Number(coupon.minOrderAmount || 0);
  if (subtotal !== undefined && subtotal < minOrderAmount) {
    return {
      valid: false,
      status: 400,
      error: `Minimum order amount of Rs. ${minOrderAmount.toLocaleString()} required for this coupon.`,
    };
  }
  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discount: Number(coupon.discount),
    minOrderAmount,
    discountAmount: computeCouponDiscount(coupon, subtotal ?? 0),
  };
}

export async function findCouponByCode(code: string): Promise<CouponRecord | null> {
  if (!code) return null;
  try {
    const found = await db.coupon.findFirst({
      where: { code, isActive: true, deletedAt: null },
    });
    return (found as CouponRecord | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the newest usable promo coupon from the database (or null).
 * This is the single source of truth for any promo code shown in the UI or AI replies.
 */
export async function findActivePromo(now: Date = new Date()): Promise<ActivePromo | null> {
  let rows: CouponRecord[] = [];
  try {
    rows = (await db.coupon.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })) as CouponRecord[];
  } catch {
    rows = [];
  }
  const usable = rows.find((c: CouponRecord) => isCouponUsable(c, now));
  if (!usable) return null;
  return {
    code: usable.code,
    discount: Number(usable.discount),
    discountType: usable.discountType,
    minOrderAmount: Number(usable.minOrderAmount || 0),
  };
}
