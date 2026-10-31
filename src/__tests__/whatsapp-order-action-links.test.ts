import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/orders/action/route';
import { db } from '@/lib/db';
import { generateOrderActionToken, WhatsAppService } from '@/lib/whatsapp';

type AsyncMock = jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;

jest.mock('@/lib/whatsapp', () => {
  const actual = jest.requireActual('@/lib/whatsapp') as Record<string, unknown>;
  return {
    ...actual,
    WhatsAppService: {
      sendCustomerOrderApproved: jest.fn<(...args: unknown[]) => Promise<boolean>>().mockResolvedValue(true),
      sendCustomerOrderHold: jest.fn<(...args: unknown[]) => Promise<boolean>>().mockResolvedValue(true),
      sendCustomerOrderRejected: jest.fn<(...args: unknown[]) => Promise<boolean>>().mockResolvedValue(true),
    },
  };
});

describe('L6: WhatsApp 1-Tap Order Action Links Hardening', () => {
  const testOrderId = 'ord_luxury_bed_123';
  const mockItems = [
    { productId: 'prod_bed_1', quantity: 2 },
  ];

  const baseOrder = {
    id: testOrderId,
    totalAmount: 163300,
    shippingName: 'Valued Customer',
    paymentMethod: 'BANK TRANSFER',
    status: 'PENDING',
    paymentStatus: 'AWAITING_PAYMENT',
    userId: 'usr_customer_1',
    items: mockItems,
    deletedAt: null,
  };

  let mockOrderFind: AsyncMock;
  let mockOrderUpdate: AsyncMock;
  let mockProductUpdateMany: AsyncMock;
  let mockNotificationCreate: AsyncMock;
  let mockAuditCreate: AsyncMock;
  let mockTransaction: jest.MockedFunction<(callback: unknown) => Promise<unknown>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrderFind = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ ...baseOrder });
    mockOrderUpdate = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ ...baseOrder, status: 'PROCESSING', paymentStatus: 'PAID' });
    mockProductUpdateMany = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ count: 1 });
    mockNotificationCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ id: 'notif_1' });
    mockAuditCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ id: 'audit_1' });

    mockTransaction = jest.fn(async (callback: unknown) => {
      const cb = callback as (tx: unknown) => Promise<unknown>;
      return cb({
        product: { updateMany: mockProductUpdateMany },
        order: { update: mockOrderUpdate },
      });
    });

    (db as unknown as { order: { findFirst: unknown; update: unknown } }).order = {
      findFirst: mockOrderFind,
      update: mockOrderUpdate,
    };
    (db as unknown as { product: { updateMany: unknown } }).product = {
      updateMany: mockProductUpdateMany,
    };
    (db as unknown as { notification: { create: unknown } }).notification = {
      create: mockNotificationCreate,
    };
    (db as unknown as { auditLog: { create: unknown } }).auditLog = {
      create: mockAuditCreate,
    };
    (db as unknown as { $transaction: unknown }).$transaction = mockTransaction;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. GET Requests: Read-Only Interactive Confirmation Form (No State Mutation)', () => {
    it('blocks WhatsApp crawler pre-fetchers and returns safe notice without modifying database', async () => {
      const token = generateOrderActionToken(testOrderId, 'verify');
      const req = new NextRequest(
        `https://fahad-ali-interior.vercel.app/api/orders/action?id=${testOrderId}&action=verify&token=${token}`,
        {
          method: 'GET',
          headers: {
            host: 'fahad-ali-interior.vercel.app',
            'user-agent': 'WhatsApp/2.21.12.21 A',
          },
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Executive Order Authorization');
      expect(mockOrderUpdate).not.toHaveBeenCalled();
    });

    it('rejects GET requests missing required action or token parameters with 400', async () => {
      const req = new NextRequest(
        `https://fahad-ali-interior.vercel.app/api/orders/action?id=${testOrderId}`,
        {
          method: 'GET',
          headers: { host: 'fahad-ali-interior.vercel.app' },
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(400);
      const html = await res.text();
      expect(html).toContain('Invalid Request');
      expect(mockOrderUpdate).not.toHaveBeenCalled();
    });

    it('rejects GET requests with invalid or tampered token with 403', async () => {
      const req = new NextRequest(
        `https://fahad-ali-interior.vercel.app/api/orders/action?id=${testOrderId}&action=verify&token=123456789.badhmactoken`,
        {
          method: 'GET',
          headers: { host: 'fahad-ali-interior.vercel.app' },
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(403);
      const html = await res.text();
      expect(html).toContain('Security Token Expired or Invalid');
      expect(mockOrderUpdate).not.toHaveBeenCalled();
    });

    it('renders interactive confirmation page on valid GET request and NEVER mutates order', async () => {
      const token = generateOrderActionToken(testOrderId, 'verify');
      const req = new NextRequest(
        `https://fahad-ali-interior.vercel.app/api/orders/action?id=${testOrderId}&action=verify&token=${token}`,
        {
          method: 'GET',
          headers: { host: 'fahad-ali-interior.vercel.app' },
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(200);
      const html = await res.text();

      // Check confirmation page elements
      expect(html).toContain('Authorize Order Payment');
      expect(html).toContain('163,300');
      expect(html).toContain('Valued Customer');
      expect(html).toContain('<form method="POST" action="/api/orders/action">');
      expect(html).toContain(`value="${testOrderId}"`);
      expect(html).toContain('value="verify"');
      expect(html).toContain(`value="${token}"`);
      expect(html).toContain('Confirm & Authorize Payment');

      // CRITICAL: Database must NOT be updated on GET
      expect(mockOrderUpdate).not.toHaveBeenCalled();
      expect(WhatsAppService.sendCustomerOrderApproved).not.toHaveBeenCalled();
    });
  });

  describe('2. POST Requests: Executes State-Changing Mutations Upon Deliberate Confirmation', () => {
    it('executes verify action on valid POST request, updates database and dispatches notifications', async () => {
      const token = generateOrderActionToken(testOrderId, 'verify');
      const formData = new FormData();
      formData.append('id', testOrderId);
      formData.append('action', 'verify');
      formData.append('token', token);

      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/orders/action', {
        method: 'POST',
        headers: { host: 'fahad-ali-interior.vercel.app' },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Payment Verified Successfully!');

      expect(mockOrderUpdate).toHaveBeenCalledWith({
        where: { id: testOrderId },
        data: { status: 'PROCESSING', paymentStatus: 'PAID' },
      });
      expect(mockAuditCreate).toHaveBeenCalled();
      expect(WhatsAppService.sendCustomerOrderApproved).toHaveBeenCalled();
    });

    it('executes hold action on valid POST request and updates payment status', async () => {
      const token = generateOrderActionToken(testOrderId, 'hold');
      const formData = new FormData();
      formData.append('id', testOrderId);
      formData.append('action', 'hold');
      formData.append('token', token);

      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/orders/action', {
        method: 'POST',
        headers: { host: 'fahad-ali-interior.vercel.app' },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Order Placed On 24-48h Hold');

      expect(mockOrderUpdate).toHaveBeenCalledWith({
        where: { id: testOrderId },
        data: { paymentStatus: 'AWAITING_VERIFICATION' },
      });
      expect(WhatsAppService.sendCustomerOrderHold).toHaveBeenCalled();
    });

    it('executes reject action on valid POST request, atomically restoring stock and cancelling order', async () => {
      const token = generateOrderActionToken(testOrderId, 'reject');
      const formData = new FormData();
      formData.append('id', testOrderId);
      formData.append('action', 'reject');
      formData.append('token', token);

      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/orders/action', {
        method: 'POST',
        headers: { host: 'fahad-ali-interior.vercel.app' },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Order Rejected &amp; Cancelled');

      // Product stock incremented
      expect(mockProductUpdateMany).toHaveBeenCalledWith({
        where: { id: 'prod_bed_1', deletedAt: null },
        data: { stockCount: { increment: 2 } },
      });
      // Order marked cancelled
      expect(mockOrderUpdate).toHaveBeenCalledWith({
        where: { id: testOrderId },
        data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
      });
      expect(WhatsAppService.sendCustomerOrderRejected).toHaveBeenCalled();
    });

    it('rejects POST with invalid or expired token with 403', async () => {
      const formData = new FormData();
      formData.append('id', testOrderId);
      formData.append('action', 'verify');
      formData.append('token', 'bad.token');

      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/orders/action', {
        method: 'POST',
        headers: { host: 'fahad-ali-interior.vercel.app' },
        body: formData,
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockOrderUpdate).not.toHaveBeenCalled();
    });
  });

  describe('3. State Machine Constraints', () => {
    it('blocks verifying an already cancelled order with 400', async () => {
      mockOrderFind.mockResolvedValueOnce({ ...baseOrder, status: 'CANCELLED' });
      const token = generateOrderActionToken(testOrderId, 'verify');

      const req = new NextRequest(
        `https://fahad-ali-interior.vercel.app/api/orders/action?id=${testOrderId}&action=verify&token=${token}`,
        {
          method: 'GET',
          headers: { host: 'fahad-ali-interior.vercel.app' },
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(400);
      const html = await res.text();
      expect(html).toContain('Order Already Cancelled');
    });

    it('blocks rejecting an already shipped or delivered order with 400', async () => {
      mockOrderFind.mockResolvedValueOnce({ ...baseOrder, status: 'SHIPPED' });
      const token = generateOrderActionToken(testOrderId, 'reject');

      const req = new NextRequest(
        `https://fahad-ali-interior.vercel.app/api/orders/action?id=${testOrderId}&action=reject&token=${token}`,
        {
          method: 'GET',
          headers: { host: 'fahad-ali-interior.vercel.app' },
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(400);
      const html = await res.text();
      expect(html).toContain('Cannot Cancel Finalized Order');
    });
  });
});
