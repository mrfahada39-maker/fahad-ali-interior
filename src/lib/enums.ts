import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ReviewStatus,
  UserRole,
  DiscountType,
} from '@prisma/client';

export function toPaymentMethod(value: string): PaymentMethod {
  const map: Record<string, PaymentMethod> = {
    cod: PaymentMethod.COD,
    jazzcash: PaymentMethod.JAZZCASH,
    easypaisa: PaymentMethod.EASYPAISA,
    bank: PaymentMethod.BANK,
  };
  const m = map[value.toLowerCase()];
  if (!m) throw new Error('Invalid payment method');
  return m;
}

export function toOrderStatus(value: string): OrderStatus {
  const map: Record<string, OrderStatus> = {
    pending: OrderStatus.PENDING,
    processing: OrderStatus.PROCESSING,
    shipped: OrderStatus.SHIPPED,
    out_for_delivery: OrderStatus.SHIPPED,
    delivered: OrderStatus.DELIVERED,
    cancelled: OrderStatus.CANCELLED,
  };
  const s = map[value.toLowerCase()];
  if (!s) throw new Error('Invalid order status');
  return s;
}

export function toPaymentStatus(value: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    pending: PaymentStatus.PENDING,
    paid: PaymentStatus.PAID,
    failed: PaymentStatus.FAILED,
    awaiting_verification: PaymentStatus.AWAITING_VERIFICATION,
    refunded: PaymentStatus.REFUNDED,
  };
  const s = map[value.toLowerCase()];
  if (!s) throw new Error('Invalid payment status');
  return s;
}

export function toReviewStatus(value: string): ReviewStatus {
  const map: Record<string, ReviewStatus> = {
    pending: ReviewStatus.PENDING,
    approved: ReviewStatus.APPROVED,
    rejected: ReviewStatus.REJECTED,
  };
  const s = map[value.toLowerCase()];
  if (!s) throw new Error('Invalid review status');
  return s;
}

export function toDiscountType(value: string): DiscountType {
  return value === 'fixed' ? DiscountType.FIXED : DiscountType.PERCENTAGE;
}

export function sessionRole(role: UserRole): string {
  if (role === UserRole.SUPER_ADMIN) return 'SUPER_ADMIN';
  if (role === UserRole.ADMIN) return 'ADMIN';
  if (role === UserRole.VENDOR) return 'VENDOR';
  if (role === UserRole.STAFF) return 'STAFF';
  return 'USER';
}
