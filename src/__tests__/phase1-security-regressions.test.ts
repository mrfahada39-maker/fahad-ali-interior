/**
 * Phase 1 Security Regression Test Suite
 * Covers C1, C2, C3, and C4 security and data integrity requirements.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// ── Mock Dependencies ──────────────────────────────────────────────────────────

jest.mock('@/lib/admin-auth', () => ({
  getVerifiedAdmin: jest.fn(),
  verifySignedTokenUserId: jest.fn(),
  isAdminRole: jest.fn((r: unknown) => String(r).toUpperCase() === 'ADMIN' || String(r).toUpperCase() === 'SUPER_ADMIN'),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('otplib', () => ({
  verifySync: jest.fn(),
  generateSecret: jest.fn(),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn<() => Promise<{ allowed: boolean; limit: number; remaining: number; reset: number }>>().mockImplementation(() =>
    Promise.resolve({ allowed: true, limit: 100, remaining: 99, reset: Date.now() + 60000 })
  ),
  getClientIp: jest.fn(() => '127.0.0.1'),
}));

jest.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: jest.fn<() => Promise<boolean>>().mockImplementation(() => Promise.resolve(true)),
  sendPasswordResetEmail: jest.fn<() => Promise<boolean>>().mockImplementation(() => Promise.resolve(true)),
  sendVerificationEmail: jest.fn<() => Promise<boolean>>().mockImplementation(() => Promise.resolve(true)),
}));

jest.mock('@/lib/catalog-api', () => ({
  clearCatalogMemoryCache: jest.fn(),
}));

jest.mock('@/lib/home-page-data', () => ({
  invalidateHomePageDataCache: jest.fn(),
}));

jest.mock('@/lib/recycle-bin', () => ({
  moveToRecycleBin: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ success: true })),
  listRecycleBinItems: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ items: [], total: 0 })),
  restoreFromRecycleBin: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ success: true })),
  permanentlyDeleteFromRecycleBin: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ success: true })),
  emptyRecycleBin: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ success: true })),
}));

// Mock db
const mockDb: any = {
  chatSession: {
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    count: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(0)),
    delete: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    deleteMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 0 })),
  },
  chatMessage: {
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    count: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(0)),
    deleteMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 0 })),
  },
  user: {
    findUnique: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    findFirst: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    create: jest.fn<(args: any) => Promise<any>>().mockImplementation((args: any) => Promise.resolve({ id: 'usr_guest_1', ...args?.data })),
    update: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    updateMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 1 })),
  },
  order: {
    create: jest.fn<(args: any) => Promise<any>>().mockImplementation((args: any) => Promise.resolve({ id: 'ord_test_1', items: [], ...args?.data })),
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    findUnique: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    update: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
  },
  product: {
    findFirst: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    findUnique: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    create: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ id: 'prod_1' })),
    update: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    updateMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 1 })),
    deleteMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 0 })),
  },
  coupon: {
    findFirst: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    updateMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 1 })),
    update: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
  },
  auditLog: {
    create: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
  },
  review: {
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    findUnique: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    update: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    delete: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    deleteMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 0 })),
  },
  inquiry: {
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    update: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
  },
  message: {
    create: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    findMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve([])),
  },
  customerNote: {
    create: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
  },
  settings: {
    findFirst: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    create: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    update: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({})),
  },
  orderItem: {
    deleteMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 0 })),
  },
  wishlistItem: {
    deleteMany: jest.fn<() => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 0 })),
  },
  $transaction: jest.fn((cb: any) => {
    if (typeof cb === 'function') {
      return cb(mockDb);
    }
    return Promise.all(cb);
  }),
};

jest.mock('@/lib/db', () => ({
  db: mockDb,
}));

import { GET as analyticsGET, DELETE as analyticsDELETE } from '@/app/api/v1/ai/admin/analytics/route';
import {
  GET as catchAllGET,
  POST as catchAllPOST,
  PUT as catchAllPUT,
  PATCH as catchAllPATCH,
  DELETE as catchAllDELETE,
} from '@/app/api/v1/[...path]/route';
import { getVerifiedAdmin } from '@/lib/admin-auth';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';

describe('Phase 1 Security Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getVerifiedAdmin as any).mockResolvedValue(null);
    (getToken as any).mockResolvedValue(null);
    (getServerSession as any).mockResolvedValue(null);
  });

  // ── C1: AI Admin Analytics Authentication & Pagination ──────────────────────────
  describe('C1: /api/v1/ai/admin/analytics Route Security', () => {
    it('returns 403 on GET for anonymous unauthenticated requests', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/ai/admin/analytics');
      const res = await analyticsGET(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('Forbidden');
    });

    it('returns 403 on DELETE for anonymous requests even when sessionId=ALL', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/ai/admin/analytics?sessionId=ALL', {
        method: 'DELETE',
      });
      const res = await analyticsDELETE(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(mockDb.chatSession.deleteMany).not.toHaveBeenCalled();
      expect(mockDb.chatMessage.deleteMany).not.toHaveBeenCalled();
    });

    it('returns paginated data for verified executive admin', async () => {
      (getVerifiedAdmin as any).mockResolvedValue({ id: 'admin_1', email: 'admin@fahadali.pk', role: 'ADMIN' });
      mockDb.chatSession.count.mockResolvedValue(100);
      mockDb.chatMessage.count.mockResolvedValue(500);
      mockDb.chatSession.findMany.mockResolvedValue([
        {
          id: 's1',
          sessionId: 'sess_1',
          customerName: 'Ahmad Khan',
          city: 'Lahore',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [{ id: 'm1', role: 'user', content: 'Custom size quote', createdAt: new Date() }],
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/v1/ai/admin/analytics?page=2&limit=10');
      const res = await analyticsGET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.pagination).toBeDefined();
      expect(json.data.pagination.page).toBe(2);
      expect(json.data.pagination.limit).toBe(10);
      expect(json.data.pagination.totalSessions).toBe(100);
      expect(json.data.pagination.totalPages).toBe(10);
    });

    it('allows verified admin to clear all sessions', async () => {
      (getVerifiedAdmin as any).mockResolvedValue({ id: 'admin_1', role: 'ADMIN' });
      mockDb.chatMessage.deleteMany.mockResolvedValue({ count: 50 });
      mockDb.chatSession.deleteMany.mockResolvedValue({ count: 10 });

      const req = new NextRequest('http://localhost:3000/api/v1/ai/admin/analytics?sessionId=ALL', {
        method: 'DELETE',
      });
      const res = await analyticsDELETE(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockDb.chatMessage.deleteMany).toHaveBeenCalled();
      expect(mockDb.chatSession.deleteMany).toHaveBeenCalled();
    });
  });

  // ── C2: Catch-All Route Guard Bypasses with Prefixed Paths ───────────────────────
  describe('C2: Admin Route Guard Bypasses & Strict Route Matching', () => {
    it.each([
      ['PUT', catchAllPUT, ['x', 'admin', 'orders'], { id: 'ord_1', status: 'SHIPPED' }],
      ['PATCH', catchAllPATCH, ['x', 'admin', 'orders'], { id: 'ord_1', status: 'DELIVERED' }],
      ['PUT', catchAllPUT, ['x', 'admin', 'reviews'], { id: 'rev_1', status: 'APPROVED' }],
      ['PATCH', catchAllPATCH, ['x', 'admin', 'customers', 'c_1', 'lock'], { block: true }],
      ['PATCH', catchAllPATCH, ['x', 'admin', 'customers', 'c_1', 'segment'], { segment: 'VIP' }],
      ['POST', catchAllPOST, ['x', 'admin', 'customers', 'c_1', 'notes'], { text: 'Bypassed note' }],
      ['POST', catchAllPOST, ['x', 'admin', 'messages'], { text: 'Spoofed support message' }],
      ['DELETE', catchAllDELETE, ['x', 'admin', 'products'], { id: 'p_1' }],
    ])(
      'blocks bypass attempt %s on prefixed path %j returning 403',
      async (method, handler, pathParts, body) => {
        const req = new NextRequest(`http://localhost:3000/api/v1/${pathParts.join('/')}`, {
          method,
          body: JSON.stringify(body),
        });
        const res = await handler(req, { params: Promise.resolve({ path: pathParts }) });
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.error).toContain('Forbidden');
      }
    );

    it.each([
      ['PUT', catchAllPUT, ['admin', 'orders'], { id: 'ord_1', status: 'SHIPPED' }],
      ['PUT', catchAllPUT, ['admin', 'reviews'], { id: 'rev_1', status: 'APPROVED' }],
      ['DELETE', catchAllDELETE, ['admin', 'reviews'], { id: 'rev_1' }],
      ['PATCH', catchAllPATCH, ['admin', 'customers', 'c_1', 'lock'], { block: true }],
      ['PATCH', catchAllPATCH, ['admin', 'customers', 'c_1', 'segment'], { segment: 'VIP' }],
      ['POST', catchAllPOST, ['admin', 'customers', 'c_1', 'notes'], { text: 'Note' }],
      ['POST', catchAllPOST, ['admin', 'messages'], { text: 'Hello' }],
      ['DELETE', catchAllDELETE, ['admin', 'products'], { id: 'p_1' }],
      ['POST', catchAllPOST, ['admin', 'products'], { name: 'Chair', price: 1000 }],
      ['PUT', catchAllPUT, ['admin', 'settings'], { siteName: 'Hacked' }],
      ['GET', catchAllGET, ['ai', 'admin', 'analytics'], undefined],
    ])(
      'blocks direct unauthenticated call %s on %j returning 403',
      async (method, handler, pathParts, body) => {
        const req = new NextRequest(`http://localhost:3000/api/v1/${pathParts.join('/')}`, {
          method,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        const res = await handler(req, { params: Promise.resolve({ path: pathParts }) });
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.error).toContain('Forbidden');
      }
    );
  });

  // ── C3: Hardcoded Coupons Removal & Race-Condition Safe Atomic Usage ─────────────
  describe('C3: Hardcoded Coupons Removal & Concurrency Safety', () => {
    it.each(['FAHAD10', 'VIP10', 'LUXURY10', 'FAHAD20', 'ROYAL50'])(
      'rejects hardcoded coupon code %s when no DB record exists',
      async (couponCode) => {
        mockDb.coupon.findFirst.mockResolvedValue(null);
        mockDb.product.findFirst.mockResolvedValue({
          id: 'prod_valid_1',
          name: 'Solid Sheesham Dining Table',
          price: 150000,
          image: '/table.webp',
          stockCount: 10,
          deletedAt: null,
        });

        const req = new NextRequest('http://localhost:3000/api/v1/orders', {
          method: 'POST',
          body: JSON.stringify({
            shippingEmail: 'patron@example.com',
            shippingName: 'Patron',
            couponCode,
            items: [{ productId: 'prod_valid_1', quantity: 1 }],
          }),
        });

        const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toMatch(/Invalid or inactive coupon/i);
      }
    );

    it('rejects coupon when expired or max uses exceeded in DB', async () => {
      mockDb.coupon.findFirst.mockResolvedValue({
        id: 'cpn_expired',
        code: 'EXPIRED10',
        isActive: true,
        expiresAt: new Date(Date.now() - 100000), // in the past
        maxUses: 10,
        usedCount: 5,
        minOrderAmount: 0,
      });
      mockDb.product.findFirst.mockResolvedValue({
        id: 'prod_1',
        name: 'Bed',
        price: 50000,
        deletedAt: null,
      });

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingEmail: 'patron@example.com',
          couponCode: 'EXPIRED10',
          items: [{ productId: 'prod_1', quantity: 1 }],
        }),
      });

      const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/expired/i);
    });

    it('aborts order transaction if coupon usage update fails (race condition protection)', async () => {
      mockDb.product.findFirst.mockResolvedValue({
        id: 'prod_1',
        name: 'Bed',
        price: 50000,
        deletedAt: null,
      });
      mockDb.coupon.findFirst.mockResolvedValue({
        id: 'cpn_race',
        code: 'RACE10',
        isActive: true,
        expiresAt: new Date(Date.now() + 100000),
        maxUses: 1,
        usedCount: 0,
        discount: 10,
        discountType: 'PERCENTAGE',
        minOrderAmount: 0,
      });

      // Stock update succeeds
      mockDb.product.updateMany.mockResolvedValue({ count: 1 });
      // Coupon conditional update returns count: 0 (another concurrent request took the last slot)
      mockDb.coupon.updateMany.mockResolvedValue({ count: 0 });

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingEmail: 'patron@example.com',
          couponCode: 'RACE10',
          items: [{ productId: 'prod_1', quantity: 1 }],
        }),
      });

      const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/maximum usage limit/i);
      expect(mockDb.order.create).not.toHaveBeenCalled();
    });
  });

  // ── C4: Order Pricing & Inventory Decrement Integrity ───────────────────────────
  describe('C4: Order Pricing, Validation & Atomic Inventory Stock', () => {
    it('returns 400 when productId is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingEmail: 'patron@example.com',
          items: [{ quantity: 1 }],
        }),
      });

      const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Product ID is required/i);
    });

    it('returns 400 when product is unknown in DB (no fallback 10000 price or fallback create)', async () => {
      mockDb.product.findFirst.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingEmail: 'patron@example.com',
          items: [{ productId: 'prod_non_existent', quantity: 1 }],
        }),
      });

      const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Product not found or unavailable/i);
      expect(mockDb.product.create).not.toHaveBeenCalled();
    });

    it('returns 400 when product is soft-deleted', async () => {
      // deletedAt is checked in query, so findFirst returns null
      mockDb.product.findFirst.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingEmail: 'patron@example.com',
          items: [{ productId: 'prod_soft_deleted', quantity: 1 }],
        }),
      });

      const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Product not found or unavailable/i);
    });

    it.each([0, -1, 21, 1.5, 'invalid'])(
      'rejects invalid quantity %p with 400',
      async (quantity) => {
        const req = new NextRequest('http://localhost:3000/api/v1/orders', {
          method: 'POST',
          body: JSON.stringify({
            shippingEmail: 'patron@example.com',
            items: [{ productId: 'prod_1', quantity }],
          }),
        });

        const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toMatch(/Quantity must be an integer between 1 and 20/i);
      }
    );

    it('takes name, image and price strictly from DB and ignores client-supplied values', async () => {
      mockDb.product.findFirst.mockResolvedValue({
        id: 'prod_genuine',
        name: 'Royal Chesterfield Sofa',
        price: 250000,
        image: '/genuine-sofa.webp',
        deletedAt: null,
      });

      mockDb.product.updateMany.mockResolvedValue({ count: 1 });
      mockDb.order.create.mockImplementation((args: any) => ({
        id: 'ord_real_1',
        totalAmount: args.data.totalAmount,
        subtotal: args.data.subtotal,
        discount: args.data.discount,
        gst: args.data.gst,
        shippingEmail: args.data.shippingEmail,
        items: args.data.items.create,
      }));

      // Client passes fake price of 1 PKR and spoofed name
      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingEmail: 'patron@example.com',
          items: [
            {
              productId: 'prod_genuine',
              quantity: 1,
              price: 1, // Tampered!
              name: 'Spoofed Name',
              image: '/spoofed.jpg',
            },
          ],
        }),
      });

      const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.order.totalAmount).toBe(250000);
      expect(json.order.items[0].name).toBe('Royal Chesterfield Sofa');
      expect(json.order.items[0].price).toBe(250000);
      expect(json.order.items[0].image).toBe('/genuine-sofa.webp');
    });

    it('aborts the entire order transaction when stock is insufficient (no overselling)', async () => {
      mockDb.product.findFirst.mockResolvedValue({
        id: 'prod_out_of_stock',
        name: 'Artisanal Coffee Table',
        price: 45000,
        deletedAt: null,
      });

      // Atomic update returns 0 affected rows because stockCount < quantity
      mockDb.product.updateMany.mockResolvedValue({ count: 0 });

      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingEmail: 'patron@example.com',
          items: [{ productId: 'prod_out_of_stock', quantity: 2 }],
        }),
      });

      const res = await catchAllPOST(req, { params: Promise.resolve({ path: ['orders'] }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Insufficient stock for "Artisanal Coffee Table"/i);
      expect(mockDb.order.create).not.toHaveBeenCalled();
    });
  });
});
