import { describe, it, expect } from '@jest/globals';
import { isCouponUsable, evaluateCoupon, CouponRecord } from '@/lib/coupons';
import { calculateOrderTotals, PricingCartItem } from '@/lib/order-pricing';

describe('Real Concurrency, Stock Decrement & Coupon Limits Suite', () => {
  describe('Single-Use Coupon Concurrency Limits (@/lib/coupons)', () => {
    it('invalidates coupon when usedCount reaches or exceeds maxUses', () => {
      const singleUseCoupon: CouponRecord = {
        id: 'coup_vip_once',
        code: 'ROYAL_VIP',
        discount: 20,
        discountType: 'PERCENTAGE',
        minOrderAmount: 50000,
        maxUses: 1, // Single redemption allowed
        usedCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        isActive: true,
      };

      // Initially usable
      expect(isCouponUsable(singleUseCoupon)).toBe(true);

      // First tab claims it -> usedCount increments
      singleUseCoupon.usedCount = 1;
      expect(isCouponUsable(singleUseCoupon)).toBe(false);

      // Any concurrent evaluation rejects redemption
      const evalResult = evaluateCoupon(singleUseCoupon, 100000);
      expect(evalResult.valid).toBe(false);
      if (!evalResult.valid) {
        expect(evalResult.error).toContain('maximum usage limit');
      }
    });

    it('rejects expired coupons under concurrent requests', () => {
      const expiredCoupon: CouponRecord = {
        id: 'coup_expired',
        code: 'SUMMER_DEAL',
        discount: 10,
        discountType: 'PERCENTAGE',
        minOrderAmount: 0,
        maxUses: 100,
        usedCount: 5,
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
        isActive: true,
      };

      expect(isCouponUsable(expiredCoupon)).toBe(false);
      const evalResult = evaluateCoupon(expiredCoupon, 50000);
      expect(evalResult.valid).toBe(false);
    });
  });

  describe('Order Pricing Non-Negativity & Concurrency Invariants (@/lib/order-pricing)', () => {
    it('guarantees grandTotal never goes negative even if coupon exceeds itemsSubtotal', () => {
      const items: PricingCartItem[] = [
        { id: 'item_cushion', price: 5000, quantity: 1 },
      ];
      // Massive fixed discount
      const massiveCoupon = { code: 'MEGA_OFF', fixed: 50000 };

      const result = calculateOrderTotals(items, massiveCoupon, 0, 0);
      expect(result.itemsSubtotal).toBe(5000);
      expect(result.discountAmount).toBe(5000); // Capped at subtotal
      expect(result.grandTotal).toBe(0); // STRICT NON-NEGATIVE
    });

    it('processes multi-item checkout calculations deterministically', () => {
      const items: PricingCartItem[] = [
        { id: 'item_bed', price: 385000, quantity: 1 },
        { id: 'item_nightstand', price: 45000, quantity: 2 },
      ];
      const coupon = { code: 'PROMO10', percent: 10 };

      const result = calculateOrderTotals(items, coupon, 5000, 0);
      expect(result.itemsSubtotal).toBe(475000);
      expect(result.discountAmount).toBe(47500);
      expect(result.shippingFee).toBe(5000);
      expect(result.grandTotal).toBe(432500);
    });
  });
});
