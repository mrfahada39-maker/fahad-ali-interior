import { NextRequest } from 'next/server';
import {
  handleOrderRoutes,
  releaseExpiredStockReservations,
  UNPAID_STOCK_RESERVATION_TTL_MS,
} from '@/lib/api-handlers/orders';
import { signVerifiedPhoneToken } from '@/lib/phone-otp';
import { calculateOrderTotals } from '@/lib/order-pricing';
import { ApiDispatchContext } from '@/lib/api-handlers/shared';

function makeDispatchContext(req: NextRequest, segment = 'v1/orders'): ApiDispatchContext {
  return {
    method: 'POST',
    segment,
    normalizedSegment: segment,
    pathParts: segment.split('/'),
    req,
    ip: '127.0.0.1',
  };
}

jest.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/whatsapp', () => ({
  WhatsAppService: {
    sendAdminOrderNotification: jest.fn().mockResolvedValue({ success: true }),
    sendCustomerOrderConfirmation: jest.fn().mockResolvedValue({ success: true }),
    sendCustomerOrderHold: jest.fn().mockResolvedValue({ success: true }),
    sendCustomerOrderRejected: jest.fn().mockResolvedValue({ success: true }),
    sendAdminOrderVerificationAlert: jest.fn().mockResolvedValue({ success: true }),
    sendCustomerOrderPlacedSlip: jest.fn().mockResolvedValue({ success: true }),
  },
}));

const mockProductFind = jest.fn();
const mockProductUpdateMany = jest.fn();
const mockCouponFindFirst = jest.fn();
const mockCouponUpdateMany = jest.fn();
const mockOrderFindMany = jest.fn();
const mockOrderFindFirst = jest.fn();
const mockOrderCreate = jest.fn();
const mockOrderUpdate = jest.fn();
const mockUserFindUnique = jest.fn();
const mockSettingsFindFirst = jest.fn();
const mockAuditCreate = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    product: {
      findFirst: (...args: unknown[]) => mockProductFind(...args),
      updateMany: (...args: unknown[]) => mockProductUpdateMany(...args),
    },
    coupon: {
      findFirst: (...args: unknown[]) => mockCouponFindFirst(...args),
      updateMany: (...args: unknown[]) => mockCouponUpdateMany(...args),
    },
    order: {
      findMany: (...args: unknown[]) => mockOrderFindMany(...args),
      findFirst: (...args: unknown[]) => mockOrderFindFirst(...args),
      create: (...args: unknown[]) => mockOrderCreate(...args),
      update: (...args: unknown[]) => mockOrderUpdate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: jest.fn().mockResolvedValue({ id: 'guest_system_account' }),
    },
    settings: {
      findFirst: (...args: unknown[]) => mockSettingsFindFirst(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditCreate(...args),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        product: { updateMany: mockProductUpdateMany },
        coupon: { updateMany: mockCouponUpdateMany },
        order: { create: mockOrderCreate, update: mockOrderUpdate },
        auditLog: { create: mockAuditCreate },
      };
      return fn(tx);
    },
  },
}));

describe('Orders Security, Stock Reservation & Pricing (M4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditCreate.mockResolvedValue({});
    mockProductFind.mockResolvedValue({
      id: 'prod_sheesham_1',
      name: 'Royal Bed',
      price: 150000,
      stockCount: 10,
    });
    mockProductUpdateMany.mockResolvedValue({ count: 1 });
    mockCouponUpdateMany.mockResolvedValue({ count: 1 });
    mockOrderCreate.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'ord_new_123',
        ...data,
        items: [{ price: 150000, quantity: 1 }],
      })
    );
    mockUserFindUnique.mockResolvedValue({ id: 'guest_system_account' });
    mockSettingsFindFirst.mockResolvedValue({
      shippingFee: 3500,
      gstRate: 0.18,
    });
    mockOrderFindMany.mockResolvedValue([]);
    mockOrderFindFirst.mockResolvedValue(null);
  });

  describe('1. Verified Phone Requirement for Guest COD Orders', () => {
    it('rejects guest COD order when phone verification token is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shippingEmail: 'guest@buyer.pk',
          shippingPhone: '03001234567',
          paymentMethod: 'COD',
          items: [{ productId: 'prod_sheesham_1', quantity: 1 }],
        }),
      });

      const res = await handleOrderRoutes(makeDispatchContext(req));

      expect(res?.status).toBe(400);
      const data = await res?.json();
      expect(data.error).toContain('Cash on Delivery (COD) for guest checkout requires phone number verification');
    });

    it('accepts guest COD order when valid phone OTP token is provided', async () => {
      const phone = '03001234567';
      const validToken = signVerifiedPhoneToken(phone);

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shippingEmail: 'guest@buyer.pk',
          shippingPhone: phone,
          paymentMethod: 'COD',
          verifiedPhoneToken: validToken,
          items: [{ productId: 'prod_sheesham_1', quantity: 1 }],
        }),
      });

      const res = await handleOrderRoutes(makeDispatchContext(req));

      expect(res?.status).toBe(200);
      const data = await res?.json();
      expect(data.order).toBeDefined();
      expect(data.order.paymentMethod).toBe('COD');
    });
  });

  describe('2. Unpaid Stock Reservation Expiry', () => {
    it('cancels expired unpaid orders and returns reserved stock to inventory', async () => {
      const expiredOrders = [
        {
          id: 'ord_abandoned_1',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: 'BANK',
          couponCode: 'PROMO10',
          shippingNotes: 'Unpaid direct transfer',
          items: [{ productId: 'prod_sheesham_1', quantity: 2 }],
        },
      ];

      mockOrderFindMany.mockResolvedValueOnce(expiredOrders);

      const released = await releaseExpiredStockReservations(UNPAID_STOCK_RESERVATION_TTL_MS);

      expect(released).toBe(1);
      // Verify order cancelled
      expect(mockOrderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_abandoned_1' },
          data: expect.objectContaining({
            status: 'CANCELLED',
            shippingNotes: expect.stringContaining('[STOCK_RESERVATION_EXPIRED]'),
          }),
        })
      );
      // Verify stock returned to product
      expect(mockProductUpdateMany).toHaveBeenCalledWith({
        where: { id: 'prod_sheesham_1' },
        data: { stockCount: { increment: 2 } },
      });
      // Verify coupon usage reverted
      expect(mockCouponUpdateMany).toHaveBeenCalledWith({
        where: { code: 'PROMO10', usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    });
  });

  describe('3. One-Coupon-Per-Customer Enforcement for Guests', () => {
    it('blocks a guest from reusing a coupon with the same shipping email', async () => {
      mockCouponFindFirst.mockResolvedValue({
        id: 'coup_1',
        code: 'WELCOME20',
        discount: 20,
        discountType: 'PERCENTAGE',
        isActive: true,
        maxUses: 100,
        usedCount: 5,
        minOrderAmount: 0,
      });

      // Existing order found matching guest email
      mockOrderFindFirst.mockResolvedValueOnce({ id: 'ord_previous_guest' });

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shippingEmail: 'repeat_guest@test.pk',
          shippingPhone: '03009999999',
          paymentMethod: 'BANK',
          couponCode: 'WELCOME20',
          items: [{ productId: 'prod_sheesham_1', quantity: 1 }],
        }),
      });

      const res = await handleOrderRoutes(makeDispatchContext(req));

      expect(res?.status).toBe(400);
      const data = await res?.json();
      expect(data.error).toContain('You have already redeemed this promotional coupon');
    });

    it('blocks a guest from reusing a coupon with the same phone number', async () => {
      mockCouponFindFirst.mockResolvedValue({
        id: 'coup_1',
        code: 'WELCOME20',
        discount: 20,
        discountType: 'PERCENTAGE',
        isActive: true,
        maxUses: 100,
        usedCount: 5,
        minOrderAmount: 0,
      });

      // Existing order found matching guest phone
      mockOrderFindFirst.mockResolvedValueOnce({ id: 'ord_previous_phone' });

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shippingEmail: 'different_email@test.pk',
          shippingPhone: '03009999999',
          paymentMethod: 'BANK',
          couponCode: 'WELCOME20',
          items: [{ productId: 'prod_sheesham_1', quantity: 1 }],
        }),
      });

      const res = await handleOrderRoutes(makeDispatchContext(req));

      expect(res?.status).toBe(400);
      const data = await res?.json();
      expect(data.error).toContain('You have already redeemed this promotional coupon');
    });
  });

  describe('4. Centralized Pricing Engine via calculateOrderTotals', () => {
    it('calculates totals matching calculateOrderTotals with real shipping fee and GST rate', async () => {
      mockCouponFindFirst.mockResolvedValue({
        id: 'coup_1',
        code: 'ROYAL10',
        discount: 10,
        discountType: 'PERCENTAGE',
        isActive: true,
        maxUses: 100,
        usedCount: 1,
        minOrderAmount: 0,
      });

      mockSettingsFindFirst.mockResolvedValue({
        shippingFee: 4000,
        gstRate: 0.18,
      });

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          shippingEmail: 'vip@concierge.pk',
          shippingPhone: '03001112233',
          paymentMethod: 'BANK',
          couponCode: 'ROYAL10',
          items: [{ productId: 'prod_sheesham_1', quantity: 1 }],
        }),
      });

      const res = await handleOrderRoutes(makeDispatchContext(req));

      expect(res?.status).toBe(200);

      // Verify calculation matches calculateOrderTotals exactly:
      // Item: 150,000
      // 10% coupon: 15,000 discount -> subtotal after discount = 135,000
      // 18% GST: 135,000 * 0.18 = 24,300
      // Shipping: 4,000
      // Total: 135,000 + 24,300 + 4,000 = 163,300
      const expected = calculateOrderTotals(
        [{ id: 'prod_sheesham_1', price: 150000, quantity: 1 }],
        { code: 'ROYAL10', percent: 10 },
        4000,
        0.18
      );

      expect(mockOrderCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: expected.itemsSubtotal,
            discount: expected.discountAmount,
            gst: expected.taxAmount,
            totalAmount: expected.grandTotal,
          }),
        })
      );
    });
  });
});
