import { describe, it, expect } from '@jest/globals';
import { tabs, statusStyles, STORE_SETTINGS_KEYS, PIE_COLORS } from '@/components/admin/admin-tab-types';
import {
  createAdminToken,
  parseAdminToken,
  extractTokenSignature,
  getAdminTokenSecret,
  ADMIN_TOKEN_MAX_AGE_MS,
} from '@/lib/admin-auth';

describe('Real Admin Dashboard Architecture & Security Contracts', () => {
  describe('Tab Registry & Visual Configuration (@/components/admin/admin-tab-types)', () => {
    it('contains all 16 executive tabs with unique IDs', () => {
      expect(tabs.length).toBe(16);
      const ids = tabs.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(16);

      expect(ids).toContain('overview');
      expect(ids).toContain('orders');
      expect(ids).toContain('products');
      expect(ids).toContain('discounts');
      expect(ids).toContain('ai-chatbot');
      expect(ids).toContain('payment-verifications');
    });

    it('verifies statusStyles map covers essential order & moderation states', () => {
      const requiredStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      requiredStatuses.forEach(s => {
        expect(statusStyles[s]).toBeDefined();
        expect(typeof statusStyles[s]).toBe('string');
      });
    });

    it('verifies STORE_SETTINGS_KEYS includes Pakistani payment and branding keys', () => {
      expect(STORE_SETTINGS_KEYS).toContain('bankName');
      expect(STORE_SETTINGS_KEYS).toContain('accountTitle');
      expect(STORE_SETTINGS_KEYS).toContain('iban');
      expect(STORE_SETTINGS_KEYS).toContain('jazzcashNumber');
      expect(STORE_SETTINGS_KEYS).toContain('easypaisaNumber');
      expect(STORE_SETTINGS_KEYS).toContain('socialWhatsapp');
      expect(Array.isArray(PIE_COLORS)).toBe(true);
      expect(PIE_COLORS.length).toBeGreaterThan(0);
    });
  });

  describe('Admin Bearer Token Cryptography & Lifecycle (@/lib/admin-auth)', () => {
    it('mints HMAC-SHA256 signed bearer tokens with valid timestamp and format', () => {
      const userId = 'admin_super_user_01';
      const now = Date.now();
      const token = createAdminToken(userId, now);

      expect(token.startsWith('fai_token_')).toBe(true);
      const parsed = parseAdminToken(token);
      expect(parsed).not.toBeNull();
      expect(parsed?.userId).toBe(userId);
      expect(parsed?.issuedAt).toBe(now);
      expect(parsed?.signature.length).toBe(64); // SHA256 hex is 64 characters
    });

    it('extracts signature accurately and handles Bearer prefixes', () => {
      const token = createAdminToken('admin_02');
      const sig1 = extractTokenSignature(token);
      const sig2 = extractTokenSignature(`Bearer ${token}`);

      expect(sig1).not.toBeNull();
      expect(sig1).toBe(sig2);
    });

    it('rejects malformed, truncated, or tampered tokens safely', () => {
      expect(parseAdminToken('invalid_token_string')).toBeNull();
      expect(parseAdminToken('fai_token_incomplete')).toBeNull();
      expect(parseAdminToken('')).toBeNull();
    });

    it('ensures token secret is derived and max age is configured to 24 hours', () => {
      const secret = getAdminTokenSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThanOrEqual(16);
      expect(ADMIN_TOKEN_MAX_AGE_MS).toBe(24 * 60 * 60 * 1000);
    });
  });
});
