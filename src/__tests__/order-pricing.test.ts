import { describe, it, expect } from '@jest/globals';
import {
  calculateOrderTotals,
  PricingCartItem,
  PricingCoupon,
} from '@/lib/order-pricing';

describe('E-Commerce Order Calculation & Coupon Engine', () => {
  const sampleItems: PricingCartItem[] = [
    { id: '1', price: 200000, quantity: 1 },
    { id: '2', price: 50000, quantity: 2 },
  ]; // Subtotal = 300,000

  it('calculates items subtotal accurately', () => {
    const totals = calculateOrderTotals(sampleItems, null);
    expect(totals.itemsSubtotal).toBe(300000);
    expect(totals.discountAmount).toBe(0);
    expect(totals.grandTotal).toBe(300000);
  });

  it('applies percentage-based coupons correctly', () => {
    const coupon: PricingCoupon = { code: 'VIP10', percent: 10 };
    const totals = calculateOrderTotals(sampleItems, coupon);

    expect(totals.itemsSubtotal).toBe(300000);
    expect(totals.discountAmount).toBe(30000);
    expect(totals.grandTotal).toBe(270000);
  });

  it('applies fixed-amount coupons correctly', () => {
    const coupon: PricingCoupon = { code: 'LUXURY15K', fixed: 15000 };
    const totals = calculateOrderTotals(sampleItems, coupon);

    expect(totals.itemsSubtotal).toBe(300000);
    expect(totals.discountAmount).toBe(15000);
    expect(totals.grandTotal).toBe(285000);
  });

  it('caps fixed discount so grand total never becomes negative', () => {
    const coupon: PricingCoupon = { code: 'MEGABONUS', fixed: 500000 };
    const totals = calculateOrderTotals(sampleItems, coupon);

    expect(totals.discountAmount).toBe(300000);
    expect(totals.grandTotal).toBe(0);
  });

  it('handles empty cart safely', () => {
    const totals = calculateOrderTotals([], { code: 'FREE', percent: 50 });
    expect(totals.itemsSubtotal).toBe(0);
    expect(totals.discountAmount).toBe(0);
    expect(totals.grandTotal).toBe(0);
  });
});
