/**
 * Order Pricing and Calculation Engine
 * Fahad Ali Haute Interior Architecture & Artisanal Furniture
 *
 * Handles subtotal calculation, coupon discounts, sales tax, shipping fee,
 * and safeguards against negative order totals.
 */

export interface PricingCartItem {
  id: string;
  price: number;
  quantity: number;
}

export interface PricingCoupon {
  code: string;
  percent?: number;
  fixed?: number;
}

export interface OrderPricingSummary {
  itemsSubtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
}

/**
 * Calculates order financial breakdown with non-negativity guarantee.
 */
export function calculateOrderTotals(
  items: PricingCartItem[],
  coupon: PricingCoupon | null,
  shippingFee = 0,
  taxRate = 0
): OrderPricingSummary {
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  let discountAmount = 0;
  if (coupon) {
    if (coupon.percent && coupon.percent > 0) {
      discountAmount = Math.round((itemsSubtotal * coupon.percent) / 100);
    } else if (coupon.fixed && coupon.fixed > 0) {
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
