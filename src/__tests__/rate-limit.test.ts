import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  RATE_LIMITS,
  isRateLimitConfigured,
  getClientIp,
  getRateLimitHeaders,
  rateLimit,
} from '@/lib/rate-limit';

describe('Rate Limiting & Anti-Brute-Force Guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Configuration Detection', () => {
    it('returns false when Upstash env vars are missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      expect(isRateLimitConfigured()).toBe(false);
    });

    it('returns false when Upstash contains placeholder values', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://your-db.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'your-upstash-token-placeholder';
      expect(isRateLimitConfigured()).toBe(false);
    });

    it('returns true when valid Upstash credentials are provided', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://fai-redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'AXXkAAIncDFhYWRhbGktdGVzdC10b2tlbi0xMjM0NTY';
      expect(isRateLimitConfigured()).toBe(true);
    });
  });

  describe('Client IP Extraction', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const req = new Request('https://fahad-ali.com/api/test', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      });
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('extracts IP from x-real-ip header if forwarded-for is absent', () => {
      const req = new Request('https://fahad-ali.com/api/test', {
        headers: { 'x-real-ip': '198.51.100.42' },
      });
      expect(getClientIp(req)).toBe('198.51.100.42');
    });

    it('falls back to unknown when no IP headers exist', () => {
      const req = new Request('https://fahad-ali.com/api/test');
      expect(getClientIp(req)).toBe('unknown');
    });
  });

  describe('Rate Limit Headers', () => {
    it('formats remaining count and reset date correctly', () => {
      const resetTime = 1700000000000;
      const headers = getRateLimitHeaders(9, resetTime);
      expect(headers['X-RateLimit-Remaining']).toBe('9');
      expect(headers['X-RateLimit-Reset']).toBe(new Date(resetTime).toISOString());
    });
  });

  describe('In-Memory Sliding Window Fallback', () => {
    beforeEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it('allows initial request and correctly computes remaining attempts', async () => {
      const id = `test-client-${Date.now()}`;
      const res = await rateLimit(id, 'login');
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(RATE_LIMITS.login.maxRequests - 1);
    });

    it('throttles when maxRequests is reached for login', async () => {
      const id = `flood-client-${Date.now()}`;
      const max = RATE_LIMITS.register.maxRequests; // 5

      for (let i = 0; i < max; i++) {
        const res = await rateLimit(id, 'register');
        expect(res.allowed).toBe(true);
      }

      // 6th attempt should be blocked
      const blocked = await rateLimit(id, 'register');
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('isolates different clients and categories', async () => {
      const clientA = `client-a-${Date.now()}`;
      const clientB = `client-b-${Date.now()}`;

      const resA = await rateLimit(clientA, 'newsletter');
      const resB = await rateLimit(clientB, 'newsletter');

      expect(resA.allowed).toBe(true);
      expect(resB.allowed).toBe(true);
      expect(resA.remaining).toBe(resB.remaining);
    });
  });
});
