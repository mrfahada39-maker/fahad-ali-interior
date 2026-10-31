import { NextRequest } from 'next/server';
import { POST as verifySlipPOST } from '@/app/api/checkout/verify-slip/route';
import { getVerifiedUser } from '@/lib/admin-auth';
import { PaymentVerifier } from '@/lib/ai/payment-verifier';
import { generateGuestOrderToken } from '@/lib/guest-order';
import { rateLimit } from '@/lib/rate-limit';

jest.mock('@/lib/admin-auth', () => ({
  getVerifiedUser: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getClientIp: jest.fn(() => '192.168.1.100'),
}));

jest.mock('@/lib/ai/payment-verifier', () => ({
  PaymentVerifier: {
    verifyScreenshot: jest.fn(),
  },
}));

const mockOrderFindUnique = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    order: {
      findUnique: (...args: unknown[]) => mockOrderFindUnique(...args),
    },
  },
}));

describe('Checkout Slip Verification Security (M5)', () => {
  const mockedGetVerifiedUser = getVerifiedUser as jest.Mock;
  const mockedRateLimit = rateLimit as jest.Mock;
  const mockedVerifyScreenshot = PaymentVerifier.verifyScreenshot as jest.Mock;

  const mockValidAudit = {
    verdict: 'AUTHENTIC_MATCH',
    confidence: 95,
    extractedAmount: 15000,
    transactionId: 'TXN12345678',
    amountMatches: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRateLimit.mockResolvedValue({ allowed: true });
    mockedGetVerifiedUser.mockResolvedValue(null);
    mockOrderFindUnique.mockResolvedValue(null);
    mockedVerifyScreenshot.mockResolvedValue(mockValidAudit);
  });

  it('rejects rate-limited requests with 429', async () => {
    mockedRateLimit.mockResolvedValue({
      allowed: false,
      reason: 'LIMIT_EXCEEDED',
      error: 'Rate limit exceeded',
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slipBase64: 'data:image/jpeg;base64,abc' }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('Rate limit exceeded');
  });

  it('rejects requests missing slipBase64 with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: 'ord_123' }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Slip image is required');
  });

  it('rejects unauthenticated visitor without orderId with 401', async () => {
    mockedGetVerifiedUser.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slipBase64: 'data:image/jpeg;base64,valid' }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Authentication or valid order token required');
  });

  it('rejects unauthenticated visitor with STANDALONE_AUDIT with 401', async () => {
    mockedGetVerifiedUser.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'STANDALONE_AUDIT',
        slipBase64: 'data:image/jpeg;base64,valid',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Authentication or valid order token required');
  });

  it('rejects unauthenticated visitor providing orderId but missing token with 401', async () => {
    mockedGetVerifiedUser.mockResolvedValue(null);
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_123',
      shippingEmail: 'customer@example.com',
      totalAmount: 25000,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ord_123',
        slipBase64: 'data:image/jpeg;base64,valid',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Authentication or valid order token required');
  });

  it('rejects unauthenticated visitor with invalid token with 401 without leaking order details', async () => {
    mockedGetVerifiedUser.mockResolvedValue(null);
    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_123',
      shippingEmail: 'customer@example.com',
      totalAmount: 25000,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-order-token': 'bad_token_1234567890abcdef',
      },
      body: JSON.stringify({
        orderId: 'ord_123',
        slipBase64: 'data:image/jpeg;base64,valid',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid or unauthorized order');
  });

  it('rejects unauthenticated visitor when order does not exist with 401 generic message', async () => {
    mockedGetVerifiedUser.mockResolvedValue(null);
    mockOrderFindUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-order-token': 'some_token',
      },
      body: JSON.stringify({
        orderId: 'ord_nonexistent',
        slipBase64: 'data:image/jpeg;base64,valid',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid or unauthorized order');
  });

  it('allows unauthenticated guest with valid order-bound HMAC token', async () => {
    const orderId = 'ord_guest_99';
    const email = 'guest.shopper@example.com';
    const validGuestToken = generateGuestOrderToken(orderId, email);

    mockedGetVerifiedUser.mockResolvedValue(null);
    mockOrderFindUnique.mockResolvedValue({
      id: orderId,
      shippingEmail: email,
      totalAmount: 32000,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-guest-token': validGuestToken,
      },
      body: JSON.stringify({
        orderId,
        slipBase64: 'data:image/jpeg;base64,valid_guest_slip',
        paymentMethod: 'RAAST_P2M',
        selectedBank: 'Faysal Bank',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.audit).toEqual(mockValidAudit);
    expect(mockedVerifyScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId,
        screenshotUrlOrBase64: 'data:image/jpeg;base64,valid_guest_slip',
        expectedAmount: 32000,
        paymentMethod: 'RAAST_P2M',
        selectedBank: 'Faysal Bank',
      })
    );
  });

  it('allows authenticated Admin to verify slip for any order', async () => {
    mockedGetVerifiedUser.mockResolvedValue({
      id: 'admin_1',
      name: 'Executive Admin',
      email: 'admin@fahadali.com',
      role: 'ADMIN',
    });

    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_customer_1',
      shippingEmail: 'someone.else@example.com',
      totalAmount: 18000,
      userId: 'user_other',
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ord_customer_1',
        slipBase64: 'data:image/jpeg;base64,admin_check',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockedVerifyScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord_customer_1',
        expectedAmount: 18000,
      })
    );
  });

  it('allows authenticated Admin to run standalone slip audit without orderId', async () => {
    mockedGetVerifiedUser.mockResolvedValue({
      id: 'admin_1',
      name: 'Executive Admin',
      email: 'admin@fahadali.com',
      role: 'ADMIN',
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slipBase64: 'data:image/jpeg;base64,standalone_admin',
        expectedAmount: 50000,
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockedVerifyScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'STANDALONE_AUDIT',
        expectedAmount: 50000,
      })
    );
  });

  it('allows authenticated customer to verify slip on their own order', async () => {
    mockedGetVerifiedUser.mockResolvedValue({
      id: 'user_456',
      name: 'Sara Khan',
      email: 'sara@example.com',
      role: 'USER',
    });

    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_sara_77',
      shippingEmail: 'sara@example.com',
      totalAmount: 45000,
      userId: 'user_456',
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ord_sara_77',
        slipBase64: 'data:image/jpeg;base64,sara_slip',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('rejects authenticated customer attempting to verify slip on another users order with 403', async () => {
    mockedGetVerifiedUser.mockResolvedValue({
      id: 'user_intruder',
      name: 'Intruder',
      email: 'intruder@example.com',
      role: 'USER',
    });

    mockOrderFindUnique.mockResolvedValue({
      id: 'ord_victim_88',
      shippingEmail: 'victim@example.com',
      totalAmount: 75000,
      userId: 'user_victim',
    });

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ord_victim_88',
        slipBase64: 'data:image/jpeg;base64,evil_slip',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Access denied');
    expect(mockedVerifyScreenshot).not.toHaveBeenCalled();
  });

  it('returns generic 500 error and suppresses internal stack trace when verification throws', async () => {
    mockedGetVerifiedUser.mockResolvedValue({
      id: 'admin_1',
      name: 'Executive Admin',
      email: 'admin@fahadali.com',
      role: 'ADMIN',
    });

    mockedVerifyScreenshot.mockRejectedValue(
      new Error('INTERNAL_SYSTEM_CRASH_SECRET_KEY=sensitive_12345')
    );

    const req = new NextRequest('http://localhost:3000/api/checkout/verify-slip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slipBase64: 'data:image/jpeg;base64,trigger_error',
      }),
    });

    const res = await verifySlipPOST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe(
      'Slip verification could not be completed. Please try again or contact support.'
    );
    expect(data.error).not.toContain('INTERNAL_SYSTEM_CRASH');
    expect(data.error).not.toContain('sensitive_12345');
  });
});

