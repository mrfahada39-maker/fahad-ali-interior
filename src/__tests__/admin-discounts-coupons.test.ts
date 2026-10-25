import {
  evaluateCoupon,
  computeCouponDiscount,
  isCouponUsable,
  normalizeCouponCode,
  CouponRecord,
} from '@/lib/coupons';

describe('Admin Discounts & Promotional Coupons Engine Suite', () => {
  const baseCoupon: CouponRecord = {
    id: 'coup_1',
    code: 'WELCOME10',
    discount: 10,
    discountType: 'PERCENTAGE',
    minOrderAmount: 50000,
    maxUses: 100,
    usedCount: 15,
    expiresAt: new Date('2026-12-31T23:59:59Z'),
    isActive: true,
    deletedAt: null,
  };

  it('normalizes coupon codes to trimmed uppercase strings', () => {
    expect(normalizeCouponCode('  eid2026 ')).toBe('EID2026');
    expect(normalizeCouponCode('royal-50k')).toBe('ROYAL-50K');
    expect(normalizeCouponCode(null)).toBe('');
    expect(normalizeCouponCode(undefined)).toBe('');
  });

  describe('Coupon Usability Evaluation', () => {
    it('returns true when coupon is active, under usage limit, and not expired', () => {
      expect(isCouponUsable(baseCoupon, new Date('2026-06-01'))).toBe(true);
    });

    it('returns false when coupon is paused / inactive', () => {
      const inactive = { ...baseCoupon, isActive: false };
      expect(isCouponUsable(inactive)).toBe(false);
    });

    it('returns false when coupon is soft-deleted', () => {
      const deleted = { ...baseCoupon, deletedAt: new Date() };
      expect(isCouponUsable(deleted)).toBe(false);
    });

    it('returns false when coupon has reached its maximum usage quota', () => {
      const maxed = { ...baseCoupon, maxUses: 50, usedCount: 50 };
      expect(isCouponUsable(maxed)).toBe(false);
    });

    it('returns false when current date exceeds coupon expiration date', () => {
      const expiredDate = new Date('2027-01-01');
      expect(isCouponUsable(baseCoupon, expiredDate)).toBe(false);
    });

    it('allows lifetime coupons with no expiration date (null)', () => {
      const lifetime = { ...baseCoupon, expiresAt: null };
      expect(isCouponUsable(lifetime, new Date('2030-01-01'))).toBe(true);
    });
  });

  describe('Discount Calculations & Thresholds', () => {
    it('accurately computes 10% percentage discount on cart subtotal', () => {
      const subtotal = 100000;
      const discount = computeCouponDiscount(baseCoupon, subtotal);
      expect(discount).toBe(10000);
    });

    it('accurately computes fixed PKR discount (e.g. Flat PKR 50,000)', () => {
      const fixedCoupon: CouponRecord = {
        ...baseCoupon,
        code: 'ROYAL50K',
        discount: 50000,
        discountType: 'FIXED',
        minOrderAmount: 200000,
      };
      const subtotal = 350000;
      const discount = computeCouponDiscount(fixedCoupon, subtotal);
      expect(discount).toBe(50000);
    });

    it('never allows discount to exceed subtotal so total never becomes negative', () => {
      const massiveCoupon: CouponRecord = {
        ...baseCoupon,
        discount: 100000,
        discountType: 'FIXED',
        minOrderAmount: 0,
      };
      const smallSubtotal = 40000;
      const discount = computeCouponDiscount(massiveCoupon, smallSubtotal);
      expect(discount).toBe(40000); // capped at subtotal
    });

    it('enforces minimum order requirement correctly in evaluateCoupon', () => {
      const resultUnderMin = evaluateCoupon(baseCoupon, 30000);
      expect(resultUnderMin.valid).toBe(false);
      if (!resultUnderMin.valid) {
        expect(resultUnderMin.error).toContain('Minimum order amount');
      }

      const resultOverMin = evaluateCoupon(baseCoupon, 80000);
      expect(resultOverMin.valid).toBe(true);
      if (resultOverMin.valid) {
        expect(resultOverMin.discountAmount).toBe(8000);
      }
    });
  });
});
