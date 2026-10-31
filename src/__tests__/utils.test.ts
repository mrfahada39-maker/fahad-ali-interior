import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  cn,
  formatPricePk,
  getSiteUrl,
  shouldSkipEmailVerification,
  DEFAULT_ADMIN_STATS,
  DEFAULT_ADMIN_ORDERS,
} from '@/lib/utils';

describe('src/lib/utils.ts real module verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('cn (Tailwind class merger)', () => {
    it('merges class names and handles conflicting tailwind utilities', () => {
      expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500');
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', false && 'hidden', null, undefined, 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatPricePk', () => {
    it('formats PKR numbers with default zero decimals', () => {
      expect(formatPricePk(1000)).toBe('1,000');
      expect(formatPricePk(150000)).toBe('150,000');
      expect(formatPricePk(99.99)).toBe('100');
      expect(formatPricePk(0)).toBe('0');
    });

    it('formats PKR numbers with two decimals when requested', () => {
      expect(formatPricePk(1000.5, 2)).toBe('1,000.50');
      expect(formatPricePk(99.99, 2)).toBe('99.99');
    });
  });

  describe('getSiteUrl', () => {
    it('prefers NEXT_PUBLIC_APP_URL when defined and strips trailing slashes', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://fahad-ali-interior.com/';
      expect(getSiteUrl()).toBe('https://fahad-ali-interior.com');
    });

    it('falls back to NEXTAUTH_URL if APP_URL is absent', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXTAUTH_URL = 'https://auth.fahad-ali-interior.com/';
      expect(getSiteUrl()).toBe('https://auth.fahad-ali-interior.com');
    });

    it('falls back to VERCEL_URL if APP_URL and NEXTAUTH_URL are absent', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXTAUTH_URL;
      process.env.VERCEL_URL = 'fahad-preview.vercel.app';
      expect(getSiteUrl()).toBe('https://fahad-preview.vercel.app');
    });

    it('uses fallback default when no environment variables are set', () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXTAUTH_URL;
      delete process.env.VERCEL_URL;
      expect(getSiteUrl()).toBe('https://fahad-ali-interior.vercel.app');
    });
  });

  describe('shouldSkipEmailVerification', () => {
    it('returns true when SKIP_EMAIL_VERIFICATION is explicitly true', () => {
      process.env.SKIP_EMAIL_VERIFICATION = 'true';
      expect(shouldSkipEmailVerification()).toBe(true);
    });

    it('skips verification in non-production when SMTP credentials are missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SKIP_EMAIL_VERIFICATION;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      expect(shouldSkipEmailVerification()).toBe(true);
    });

    it('skips verification when NEXTAUTH_URL contains localhost', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SKIP_EMAIL_VERIFICATION;
      process.env.SMTP_USER = 'smtp@user.com';
      process.env.SMTP_PASS = 'secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      expect(shouldSkipEmailVerification()).toBe(true);
    });

    it('requires email verification in production with full credentials and real domain', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SKIP_EMAIL_VERIFICATION;
      process.env.SMTP_USER = 'smtp@user.com';
      process.env.SMTP_PASS = 'secret';
      process.env.NEXTAUTH_URL = 'https://fahad-ali-interior.com';
      expect(shouldSkipEmailVerification()).toBe(false);
    });
  });

  describe('Default constant structures', () => {
    it('validates default admin stats structure and values', () => {
      expect(DEFAULT_ADMIN_STATS.totalRevenue).toBe(0);
      expect(DEFAULT_ADMIN_STATS.orderCount).toBe(0);
      expect(DEFAULT_ADMIN_STATS.pendingOrders).toBe(0);
      expect(Array.isArray(DEFAULT_ADMIN_ORDERS)).toBe(true);
      expect(DEFAULT_ADMIN_ORDERS.length).toBe(0);
    });
  });
});
