import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockDb: any = {
  order: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  db: mockDb,
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('otplib', () => ({
  verifySync: jest.fn(() => ({ valid: false })),
}));

import {
  generateGuestOrderToken,
  verifyGuestOrderToken,
  sanitizeOrderForGuest,
} from '@/lib/guest-order';
import { handleOrderRoutes } from '@/lib/api-handlers/orders';

describe('Guest Order Tracking & Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrder = {
    id: 'ord_luxury_123',
    userId: 'guest_system_account',
    shippingName: 'Royal Customer',
    shippingEmail: 'guest@test.com',
    shippingAddress: 'Gulberg III, Lahore',
    shippingCity: 'Lahore',
    shippingProvince: 'Punjab',
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    trackingNumber: 'TCS-998877',
    subtotal: 120000,
    discount: 10000,
    gst: 18000,
    totalAmount: 128000,
    couponCode: 'WELCOME10',
    orderFingerprint: 'internal_secret_fingerprint',
    paymentScreenshot: 'https://cdn.example.com/sensitive_receipt.png',
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-02'),
    user: {
      id: 'usr_secret',
      password: 'hashed_password_secret',
      role: 'ADMIN',
      email: 'admin@system.local',
    },
    items: [
      {
        id: 'item_1',
        productId: 'prod_sheesham_bed',
        name: 'Royal Sheesham King Bed',
        price: 120000,
        quantity: 1,
        image: '/bed.jpg',
      },
    ],
  };

  it('generates and verifies guest tokens accurately', () => {
    const token = generateGuestOrderToken('ord_luxury_123', 'guest@test.com');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    // Verify valid
    expect(verifyGuestOrderToken('ord_luxury_123', 'guest@test.com', token)).toBe(true);
    // Case-insensitivity check
    expect(verifyGuestOrderToken('ORD_LUXURY_123', 'GUEST@TEST.COM', token)).toBe(true);
    // Mismatched order ID
    expect(verifyGuestOrderToken('ord_wrong_999', 'guest@test.com', token)).toBe(false);
    // Mismatched email
    expect(verifyGuestOrderToken('ord_luxury_123', 'hacker@evil.com', token)).toBe(false);
    // Tampered token
    expect(verifyGuestOrderToken('ord_luxury_123', 'guest@test.com', token + 'bad')).toBe(false);
  });

  it('sanitizes order for guest and strips all sensitive user/internal data', () => {
    const sanitized: any = sanitizeOrderForGuest(mockOrder);
    expect(sanitized).toBeDefined();
    expect(sanitized.id).toBe('ord_luxury_123');
    expect(sanitized.trackingNumber).toBe('TCS-998877');
    expect(sanitized.items.length).toBe(1);

    // Assert internal/sensitive fields are NEVER exposed
    expect(sanitized.user).toBeUndefined();
    expect(sanitized.password).toBeUndefined();
    expect(sanitized.orderFingerprint).toBeUndefined();
    expect(sanitized.paymentScreenshot).toBeUndefined();
  });

  it('rejects unauthenticated request to GET /orders/:id without guest query', async () => {
    mockDb.order.findFirst.mockResolvedValue(mockOrder);

    const req = new NextRequest('http://localhost:3000/api/v1/orders/ord_luxury_123', {
      method: 'GET',
    });

    const res = await handleOrderRoutes({
      req,
      method: 'GET',
      segment: 'orders/ord_luxury_123',
      normalizedSegment: 'orders/ord_luxury_123',
      pathParts: ['orders', 'ord_luxury_123'],
      ip: '127.0.0.1',
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe(401);
    const data = await res?.json();
    expect(data.error).toMatch(/Unauthorized/i);
  });

  it('allows unauthenticated guest to track order with matching email in query', async () => {
    mockDb.order.findFirst.mockResolvedValue(mockOrder);

    const req = new NextRequest(
      'http://localhost:3000/api/v1/orders/ord_luxury_123?email=guest%40test.com',
      { method: 'GET' }
    );

    const res = await handleOrderRoutes({
      req,
      method: 'GET',
      segment: 'orders/ord_luxury_123',
      normalizedSegment: 'orders/ord_luxury_123',
      pathParts: ['orders', 'ord_luxury_123'],
      ip: '127.0.0.1',
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const data = await res?.json();
    expect(data.success).toBe(true);
    expect(data.order.id).toBe('ord_luxury_123');
    expect(data.order.user).toBeUndefined();
    expect(data.isGuestTrack).toBe(true);
  });

  it('allows unauthenticated guest to track order with valid HMAC token in query', async () => {
    mockDb.order.findFirst.mockResolvedValue(mockOrder);
    const token = generateGuestOrderToken('ord_luxury_123', 'guest@test.com');

    const req = new NextRequest(
      `http://localhost:3000/api/v1/orders/ord_luxury_123?token=${encodeURIComponent(token)}`,
      { method: 'GET' }
    );

    const res = await handleOrderRoutes({
      req,
      method: 'GET',
      segment: 'orders/ord_luxury_123',
      normalizedSegment: 'orders/ord_luxury_123',
      pathParts: ['orders', 'ord_luxury_123'],
      ip: '127.0.0.1',
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const data = await res?.json();
    expect(data.success).toBe(true);
    expect(data.order.id).toBe('ord_luxury_123');
  });

  it('rejects guest tracking when email does not match shippingEmail', async () => {
    mockDb.order.findFirst.mockResolvedValue(mockOrder);

    const req = new NextRequest(
      'http://localhost:3000/api/v1/orders/ord_luxury_123?email=stranger%40test.com',
      { method: 'GET' }
    );

    const res = await handleOrderRoutes({
      req,
      method: 'GET',
      segment: 'orders/ord_luxury_123',
      normalizedSegment: 'orders/ord_luxury_123',
      pathParts: ['orders', 'ord_luxury_123'],
      ip: '127.0.0.1',
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
    const data = await res?.json();
    expect(data.error).toMatch(/Forbidden/i);
  });

  it('supports POST /orders/track with orderId and matching email', async () => {
    mockDb.order.findFirst.mockResolvedValue(mockOrder);

    const req = new NextRequest('http://localhost:3000/api/v1/orders/track', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'ord_luxury_123',
        email: 'guest@test.com',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await handleOrderRoutes({
      req,
      method: 'POST',
      segment: 'orders/track',
      normalizedSegment: 'orders/track',
      pathParts: ['orders', 'track'],
      ip: '127.0.0.1',
    });

    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    const data = await res?.json();
    expect(data.success).toBe(true);
    expect(data.order.id).toBe('ord_luxury_123');
  });
});
