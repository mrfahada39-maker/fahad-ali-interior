import { describe, it, expect } from '@jest/globals';

interface CartItem {
  id: string;
  price: number;
  quantity: number;
}

interface Coupon {
  code: string;
  percent?: number;
  fixed?: number;
}

function calculateOrderTotals(
  items: CartItem[],
  coupon: Coupon | null,
  shippingFee = 0,
  taxRate = 0
) {
  const itemsSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (coupon) {
    if (coupon.percent) {
      discountAmount = Math.round((itemsSubtotal * coupon.percent) / 100);
    } else if (coupon.fixed) {
      discountAmount = Math.min(coupon.fixed, itemsSubtotal);
    }
  }

  const discountedSubtotal = Math.max(0, itemsSubtotal - discountAmount);
  const taxAmount = Math.round(discountedSubtotal * taxRate);
  const grandTotal = Math.max(0, discountedSubtotal + shippingFee + taxAmount);

  return {
    itemsSubtotal,
    discountAmount,
    taxAmount,
    shippingFee,
    grandTotal,
  };
}

describe('E-Commerce Order Calculation & Coupon Engine', () => {
  const sampleItems: CartItem[] = [
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
    const coupon: Coupon = { code: 'VIP10', percent: 10 };
    const totals = calculateOrderTotals(sampleItems, coupon);

    expect(totals.itemsSubtotal).toBe(300000);
    expect(totals.discountAmount).toBe(30000);
    expect(totals.grandTotal).toBe(270000);
  });

  it('applies fixed-amount coupons correctly', () => {
    const coupon: Coupon = { code: 'LUXURY15K', fixed: 15000 };
    const totals = calculateOrderTotals(sampleItems, coupon);

    expect(totals.itemsSubtotal).toBe(300000);
    expect(totals.discountAmount).toBe(15000);
    expect(totals.grandTotal).toBe(285000);
  });

  it('caps fixed discount so grand total never becomes negative', () => {
    const coupon: Coupon = { code: 'MEGABONUS', fixed: 500000 };
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
