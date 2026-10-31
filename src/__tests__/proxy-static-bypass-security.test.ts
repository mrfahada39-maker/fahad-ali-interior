import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { proxy, config } from '@/proxy';
import * as nextAuthJwt from 'next-auth/jwt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => {
  const actual = jest.requireActual<Record<string, unknown>>('@/lib/rate-limit');
  return {
    ...actual,
    rateLimit: (jest.fn() as any).mockResolvedValue({ allowed: true, remaining: 100 }),
    isRateLimitConfigured: jest.fn().mockReturnValue(true),
  };
});

const mockedGetToken = nextAuthJwt.getToken as unknown as jest.MockedFunction<
  (...args: unknown[]) => Promise<unknown>
>;

describe('L5: Static Asset Bypass Hardening in proxy.ts', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    (process.env as { NODE_ENV: string }).NODE_ENV = 'production';
    jest.clearAllMocks();
    mockedGetToken.mockResolvedValue(null);
  });

  afterEach(() => {
    (process.env as { NODE_ENV: string }).NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  describe('1. Sensitive API Routes Never Bypass Proxy via Extension Spoofing', () => {
    it('blocks foreign-origin mutating request to /api/v1/orders.png with 403 CSRF', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/v1/orders.png', {
        method: 'POST',
        headers: {
          host: 'fahad-ali-interior.vercel.app',
          origin: 'https://malicious-attacker.com',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ item: 'chair' }),
      });

      const res = await proxy(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('CSRF validation failed');
    });

    it('intercepts /api/seed.json and blocks with 404 regardless of file extension', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/seed.json', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('Not found');
    });

    it('enforces payload size limits on /api/v1/orders.jpg blocking oversized body with 413', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/v1/orders.jpg', {
        method: 'POST',
        headers: {
          host: 'fahad-ali-interior.vercel.app',
          origin: 'https://fahad-ali-interior.vercel.app',
          'content-length': '2097152', // 2 MB (exceeds 1 MB limit for non-uploads)
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('enforces anti-HPP protection on /api/v1/orders.json when duplicate sensitive params are passed', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/api/v1/orders.json?role=user&role=admin', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('PARAMETER_POLLUTION_BLOCKED');
    });
  });

  describe('2. Sensitive Admin & Dashboard Routes Never Bypass Authentication', () => {
    it('redirects unauthenticated request to /admin.png to /admin/login', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/admin.png', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location') || '';
      expect(location).toContain('/admin/login');
      expect(location).toContain('next=%2Fadmin.png');
    });

    it('redirects unauthenticated request to /admin/orders.json to /admin/login', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/admin/orders.json', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location') || '';
      expect(location).toContain('/admin/login');
      expect(location).toContain('next=%2Fadmin%2Forders.json');
    });

    it('redirects non-admin authenticated user on /admin/users.css to /dashboard', async () => {
      mockedGetToken.mockResolvedValue({ role: 'CUSTOMER', sub: 'usr_1' });

      const req = new NextRequest('https://fahad-ali-interior.vercel.app/admin/users.css', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location') || '';
      expect(location).toContain('/dashboard');
    });

    it('redirects unauthenticated request to /dashboard.json to login flow', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/dashboard.json', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location') || '';
      expect(location).toContain('auth=login');
      expect(location).toContain('next=%2Fdashboard');
    });
  });

  describe('3. Legitimate Public Static Assets Fast-Path Bypass Safely', () => {
    it('fast-paths /_next/static bundle requests without security header overhead', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/_next/static/chunks/main.js', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      // Fast path returns NextResponse.next() without adding CSP nonce or custom x-request-id
      expect(res.headers.get('x-nonce')).toBeNull();
    });

    it('fast-paths /favicon.ico requests', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/favicon.ico', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.headers.get('x-nonce')).toBeNull();
    });

    it('fast-paths whitelisted public image assets under /images/products/royal-sofa.webp', async () => {
      const req = new NextRequest('https://fahad-ali-interior.vercel.app/images/products/royal-sofa.webp', {
        method: 'GET',
        headers: { host: 'fahad-ali-interior.vercel.app' },
      });

      const res = await proxy(req);
      expect(res.headers.get('x-nonce')).toBeNull();
    });
  });

  describe('4. Proxy Config Matcher Routing Coverage', () => {
    it('ensures config.matcher explicitly includes sensitive /api, /admin, and /dashboard prefixes', () => {
      expect(config.matcher).toBeDefined();
      expect(config.matcher).toContain('/api/:path*');
      expect(config.matcher).toContain('/admin');
      expect(config.matcher).toContain('/admin/:path*');
      expect(config.matcher).toContain('/dashboard');
      expect(config.matcher).toContain('/dashboard/:path*');
    });
  });
});
