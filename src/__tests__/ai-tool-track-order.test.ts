import { AiToolExecutor } from '@/lib/ai/tool-registry';
import { generateGuestOrderToken } from '@/lib/guest-order';

const mockFindFirst = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    order: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

describe('AiToolExecutor trackOrder Authorization & Security (M2)', () => {
  const sampleOrder = {
    id: 'ord_luxury_101',
    userId: 'user_cust_555',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    trackingNumber: 'TRK-PK-987654',
    totalAmount: 125000,
    shippingEmail: 'customer@example.pk',
    user: {
      id: 'user_cust_555',
      email: 'customer@example.pk',
      role: 'USER',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Order Not Found when order does not exist in database', async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const result = await AiToolExecutor.executeTool('trackOrder', {
      orderIdOrNumber: 'ord_nonexistent',
    });

    expect(result.success).toBe(false);
    expect(result.status).toContain('Order Not Found');
  });

  it('fails closed and blocks unauthenticated caller from reading order details', async () => {
    mockFindFirst.mockResolvedValueOnce(sampleOrder);

    // Caller passes only the order ID without guest token or user session
    const result = await AiToolExecutor.executeTool('trackOrder', {
      orderIdOrNumber: 'ord_luxury_101',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Forbidden');
    expect(result.status).toContain('Access Denied');
    // Ensure sensitive order fields are not leaked
    expect(result.totalAmount).toBeUndefined();
    expect(result.paymentStatus).toBeUndefined();
    expect(result.trackingNumber).toBeUndefined();
  });

  it('rejects an invalid or tampered guest HMAC token', async () => {
    mockFindFirst.mockResolvedValueOnce(sampleOrder);

    const result = await AiToolExecutor.executeTool('trackOrder', {
      orderIdOrNumber: 'ord_luxury_101',
      guestToken: 'forged_fake_token_hex_1234567890abcdef',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Forbidden');
    expect(result.status).toContain('Access Denied');
  });

  it('grants access when a valid guest HMAC token is provided', async () => {
    mockFindFirst.mockResolvedValueOnce(sampleOrder);

    const validGuestToken = generateGuestOrderToken(
      sampleOrder.id,
      sampleOrder.shippingEmail
    );

    const result = await AiToolExecutor.executeTool('trackOrder', {
      orderIdOrNumber: 'ord_luxury_101',
      guestToken: validGuestToken,
    });

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBe('ord_luxury_101');
    expect(result.status).toBe('CONFIRMED');
    expect(result.paymentStatus).toBe('PAID');
    expect(result.trackingNumber).toBe('TRK-PK-987654');
    expect(result.totalAmount).toBe(125000);
  });

  it('grants access when caller is the authenticated order owner by userId', async () => {
    mockFindFirst.mockResolvedValueOnce(sampleOrder);

    const result = await AiToolExecutor.executeTool(
      'trackOrder',
      { orderIdOrNumber: 'ord_luxury_101' },
      { userId: 'user_cust_555' }
    );

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBe('ord_luxury_101');
    expect(result.status).toBe('CONFIRMED');
    expect(result.totalAmount).toBe(125000);
  });

  it('grants access when caller is the authenticated order owner by matching email', async () => {
    mockFindFirst.mockResolvedValueOnce(sampleOrder);

    const result = await AiToolExecutor.executeTool(
      'trackOrder',
      { orderIdOrNumber: 'ord_luxury_101' },
      { userEmail: 'customer@example.pk' }
    );

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBe('ord_luxury_101');
    expect(result.status).toBe('CONFIRMED');
  });

  it('grants access to an authenticated administrator', async () => {
    mockFindFirst.mockResolvedValueOnce(sampleOrder);

    const result = await AiToolExecutor.executeTool(
      'trackOrder',
      { orderIdOrNumber: 'ord_luxury_101' },
      { isAdmin: true }
    );

    expect(result.success).toBe(true);
    expect(result.orderNumber).toBe('ord_luxury_101');
    expect(result.status).toBe('CONFIRMED');
  });

  it('rejects caller with valid credentials for a different user', async () => {
    mockFindFirst.mockResolvedValueOnce(sampleOrder);

    const result = await AiToolExecutor.executeTool(
      'trackOrder',
      { orderIdOrNumber: 'ord_luxury_101' },
      { userId: 'different_attacker_user', userEmail: 'attacker@evil.com' }
    );

    expect(result.success).toBe(false);
    expect(result.status).toContain('Access Denied');
  });

  it('handles invalid or empty order reference input', async () => {
    const result = await AiToolExecutor.executeTool('trackOrder', {
      orderIdOrNumber: '',
    });

    expect(result.success).toBe(false);
    expect(result.status).toContain('Invalid Order ID');
  });
});

