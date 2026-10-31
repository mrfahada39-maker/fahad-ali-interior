import { NextRequest } from 'next/server';
import { handleOrderRoutes } from '@/lib/api-handlers/orders';
import { getUserFromSessionOrToken, type ApiDispatchContext } from '@/lib/api-handlers/shared';
import { logger } from '@/lib/logger';
import { revokeAdminTokenAsync } from '@/lib/admin-auth';

jest.mock('@/lib/api-handlers/shared', () => {
  const actual = jest.requireActual('@/lib/api-handlers/shared');
  return {
    ...actual,
    getUserFromSessionOrToken: jest.fn(),
  };
});

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    audit: jest.fn(),
  },
}));

const mockWishlistCreate = jest.fn();
const mockWishlistFindMany = jest.fn();
const mockWishlistDeleteMany = jest.fn();
const mockAuditCreate = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    wishlistItem: {
      create: (...args: unknown[]) => mockWishlistCreate(...args),
      findMany: (...args: unknown[]) => mockWishlistFindMany(...args),
      deleteMany: (...args: unknown[]) => mockWishlistDeleteMany(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditCreate(...args),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  },
}));

describe('Catch Block Error Sanitization & Wishlist Reliability (M8)', () => {
  const mockedGetUser = getUserFromSessionOrToken as jest.Mock;
  const mockedLoggerError = logger.error as jest.Mock;
  const mockedLoggerWarn = logger.warn as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetUser.mockResolvedValue({
      id: 'usr_patron_100',
      email: 'patron@fahadali.com',
      role: 'USER',
    });
  });

  function makeContext(
    req: NextRequest,
    segment = 'v1/wishlist',
    method = 'POST'
  ): ApiDispatchContext {
    const normalizedSegment = segment.replace(/^v1\//, '').replace(/^\/+|\/+$/g, '');
    return {
      method,
      segment,
      normalizedSegment,
      pathParts: normalizedSegment.split('/'),
      req,
      ip: '127.0.0.1',
    };
  }

  describe('Wishlist API Error Handling', () => {
    it('returns status 500 (NOT success: true) and logs error when wishlist create DB throws', async () => {
      mockWishlistCreate.mockRejectedValue(new Error('DATABASE_CONNECTION_LOST'));

      const req = new NextRequest('http://localhost:3000/api/v1/wishlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId: 'prod_luxury_sofa' }),
      });
      const ctx = makeContext(req, 'v1/wishlist', 'POST');

      const res = await handleOrderRoutes(ctx);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(500);

      const data = await res?.json();
      expect(data.error).toBe('Failed to add item to wishlist');
      expect(data.success).toBeUndefined();

      expect(mockedLoggerError).toHaveBeenCalledWith(
        'Failed to add item to wishlist:',
        expect.any(Error),
        expect.objectContaining({
          userId: 'usr_patron_100',
          productId: 'prod_luxury_sofa',
        })
      );
    });

    it('returns status 500 and logs error when wishlist GET findMany DB throws', async () => {
      mockWishlistFindMany.mockRejectedValue(new Error('PG_QUERY_TIMEOUT'));

      const req = new NextRequest('http://localhost:3000/api/v1/wishlist', {
        method: 'GET',
      });
      const ctx = makeContext(req, 'v1/wishlist', 'GET');

      const res = await handleOrderRoutes(ctx);
      expect(res?.status).toBe(500);

      const data = await res?.json();
      expect(data.error).toBe('Failed to retrieve wishlist items');
      expect(mockedLoggerError).toHaveBeenCalledWith(
        'Failed to retrieve wishlist items:',
        expect.any(Error),
        expect.objectContaining({ userId: 'usr_patron_100' })
      );
    });

    it('returns status 500 and logs error when wishlist DELETE deleteMany DB throws', async () => {
      mockWishlistDeleteMany.mockRejectedValue(new Error('CONSTRAINT_VIOLATION'));

      const req = new NextRequest(
        'http://localhost:3000/api/v1/wishlist?productId=prod_luxury_sofa',
        { method: 'DELETE' }
      );
      const ctx = makeContext(req, 'v1/wishlist', 'DELETE');

      const res = await handleOrderRoutes(ctx);
      expect(res?.status).toBe(500);

      const data = await res?.json();
      expect(data.error).toBe('Failed to remove item from wishlist');
      expect(mockedLoggerError).toHaveBeenCalledWith(
        'Failed to remove item from wishlist:',
        expect.any(Error),
        expect.objectContaining({
          userId: 'usr_patron_100',
          productId: 'prod_luxury_sofa',
        })
      );
    });

    it('returns status 201 on successful wishlist create', async () => {
      const mockItem = {
        id: 'wsh_123',
        userId: 'usr_patron_100',
        productId: 'prod_luxury_sofa',
      };
      mockWishlistCreate.mockResolvedValue(mockItem);

      const req = new NextRequest('http://localhost:3000/api/v1/wishlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId: 'prod_luxury_sofa' }),
      });
      const ctx = makeContext(req, 'v1/wishlist', 'POST');

      const res = await handleOrderRoutes(ctx);
      expect(res?.status).toBe(201);
      const data = await res?.json();
      expect(data.id).toBe('wsh_123');
    });
  });

  describe('Audit Log & Notification Logger Invocations', () => {
    it('logs warning through logger when token revocation audit log creation fails', async () => {
      mockAuditCreate.mockRejectedValue(new Error('AUDIT_STORE_UNAVAILABLE'));

      const token = 'fai_token_admin_test_1700000000000_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      await revokeAdminTokenAsync(token);

      expect(mockedLoggerWarn).toHaveBeenCalledWith(
        'Failed to persist audit log for admin token revocation:',
        expect.objectContaining({
          error: expect.stringContaining('AUDIT_STORE_UNAVAILABLE'),
        })
      );
    });
  });
});

