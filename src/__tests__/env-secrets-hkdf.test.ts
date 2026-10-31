import {
  validateEnv,
  assertProductionEnv,
  derivePurposeSecret,
  PRODUCTION_CRITICAL_ENV_VARS,
} from '@/lib/env';
import { getGuestSecret, generateGuestOrderToken, verifyGuestOrderToken } from '@/lib/guest-order';
import { getAdminTokenSecret } from '@/lib/admin-auth';
import {
  getOrderActionSecret,
  generateOrderActionToken,
  verifyOrderActionToken,
} from '@/lib/whatsapp';
import { createOtpChallengeToken, verifyOtpChallengeToken } from '@/lib/phone-otp';

describe('H3: Production Secret Hardening, HKDF Derivation & Startup Failure', () => {
  const originalEnv = process.env;

  const validProductionEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/fahad_db?sslmode=require',
    DIRECT_DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/fahad_db?sslmode=require',
    NEXTAUTH_URL: 'https://fahadaliinterior.com',
    NEXTAUTH_SECRET: 'auth-sec-32-chars-long-random-string-12345!',
    ADMIN_TOKEN_SECRET: 'admin-sec-32-chars-long-unique-hex-abcde!',
    TOTP_ENC_KEY: 'totp-key-32-chars-long-unique-hex-67890!',
    AI_SESSION_SECRET: 'ai-session-sec-32-chars-unique-string-fghij!',
    CRON_SECRET: 'cron-secret-32-chars-long-unique-hex-klmno!',
    WHATSAPP_APP_SECRET: 'whatsapp-meta-app-secret-32-chars-pqrst!',
    UPSTASH_REDIS_REST_URL: 'https://my-upstash-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'upstash-token-value-with-sufficient-length',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test-vapid-key',
  };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Production Startup Env Validation', () => {
    it('passes validation when all 8 critical production secrets are unique and valid', () => {
      process.env = { ...validProductionEnv };
      const { valid, errors } = validateEnv();
      expect(errors).toEqual([]);
      expect(valid).toBe(true);
      expect(() => assertProductionEnv()).not.toThrow();
    });

    it.each(PRODUCTION_CRITICAL_ENV_VARS)(
      'fails validation and throws on assertProductionEnv when %s is missing in production',
      (missingVar) => {
        process.env = { ...validProductionEnv };
        delete process.env[missingVar];

        const { valid, errors } = validateEnv();
        expect(valid).toBe(false);
        expect(errors.some((e) => e.includes(missingVar))).toBe(true);
        expect(() => assertProductionEnv()).toThrow(/CRITICAL: Production startup aborted/);
      }
    );

    it('fails validation when any two critical secrets are equal to each other', () => {
      process.env = { ...validProductionEnv };
      // Reuse NEXTAUTH_SECRET as ADMIN_TOKEN_SECRET
      process.env.ADMIN_TOKEN_SECRET = process.env.NEXTAUTH_SECRET;

      const { valid, errors } = validateEnv();
      expect(valid).toBe(false);
      expect(
        errors.some(
          (e) =>
            e.includes('Secret reuse detected') &&
            e.includes('NEXTAUTH_SECRET') &&
            e.includes('ADMIN_TOKEN_SECRET')
        )
      ).toBe(true);

      expect(() => assertProductionEnv()).toThrow(/Secret reuse detected/);
    });

    it('fails validation when CRON_SECRET is reused as AI_SESSION_SECRET', () => {
      process.env = { ...validProductionEnv };
      process.env.CRON_SECRET = process.env.AI_SESSION_SECRET;

      const { valid, errors } = validateEnv();
      expect(valid).toBe(false);
      expect(
        errors.some(
          (e) =>
            e.includes('Secret reuse detected') &&
            e.includes('AI_SESSION_SECRET') &&
            e.includes('CRON_SECRET')
        )
      ).toBe(true);
    });

    it('rejects insecure placeholder values for critical secrets', () => {
      process.env = { ...validProductionEnv };
      process.env.ADMIN_TOKEN_SECRET = 'GENERATE_SEPARATE_32_BYTE_HEX_FOR_ADMIN_TOKENS';

      const { valid, errors } = validateEnv();
      expect(valid).toBe(false);
      expect(errors.some((e) => e.includes('insecure placeholder'))).toBe(true);
    });

    it('requires UPSTASH_REDIS_REST_URL to start with https://', () => {
      process.env = { ...validProductionEnv };
      process.env.UPSTASH_REDIS_REST_URL = 'http://insecure-redis.example.com';

      const { valid, errors } = validateEnv();
      expect(valid).toBe(false);
      expect(errors.some((e) => e.includes('must start with https://'))).toBe(true);
    });
  });

  describe('Cryptographic HKDF Key Derivation Isolation', () => {
    it('derives distinct, non-overlapping keys for all 4 distinct security boundaries', () => {
      process.env = {
        NEXTAUTH_SECRET: 'master-key-32-chars-long-with-sufficient-entropy!',
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv;

      const adminKey = derivePurposeSecret('admin-token');
      const guestKey = derivePurposeSecret('guest-order-token');
      const otpKey = derivePurposeSecret('otp-token');
      const orderActionKey = derivePurposeSecret('order-action-token');

      const allKeys = [adminKey, guestKey, otpKey, orderActionKey];
      const uniqueKeys = new Set(allKeys);

      expect(uniqueKeys.size).toBe(4);
      for (const k of allKeys) {
        expect(k).not.toBe(process.env.NEXTAUTH_SECRET);
        expect(k.length).toBe(64); // 32 bytes hex-encoded
      }
    });

    it('throws in production if a dedicated secret equals NEXTAUTH_SECRET', () => {
      process.env = {
        NODE_ENV: 'production',
        NEXTAUTH_SECRET: 'master-key-32-chars-long-with-sufficient-entropy!',
      } as NodeJS.ProcessEnv;

      expect(() => {
        derivePurposeSecret('guest-order-token', process.env.NEXTAUTH_SECRET);
      }).toThrow(/must not equal NEXTAUTH_SECRET/);
    });
  });

  describe('Guest Order Token Security & Removal of Hardcoded Secret', () => {
    it('getGuestSecret does not return hardcoded string and generates authentic verification tokens', () => {
      process.env = {
        NEXTAUTH_SECRET: 'test-seed-key-32-chars-long-entropy-12345!',
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv;

      const secret = getGuestSecret();
      expect(secret).not.toBe('fai-guest-order-secret-2026');
      expect(secret).not.toBe(process.env.NEXTAUTH_SECRET);
      expect(secret.length).toBe(64);

      const token = generateGuestOrderToken('ORD-123', 'guest@customer.pk');
      expect(typeof token).toBe('string');
      expect(verifyGuestOrderToken('ORD-123', 'guest@customer.pk', token)).toBe(true);
      expect(verifyGuestOrderToken('ORD-123', 'other@customer.pk', token)).toBe(false);
    });
  });

  describe('Order Action 1-Tap Links Security Isolation', () => {
    it('generates and verifies 1-tap tokens using dedicated secret, rejecting tokens signed with admin secret', () => {
      process.env = {
        NEXTAUTH_SECRET: 'test-seed-key-32-chars-long-entropy-12345!',
        ADMIN_TOKEN_SECRET: 'test-admin-secret-32-chars-long-key-12345!',
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv;

      const actionSecret = getOrderActionSecret();
      const adminSecret = getAdminTokenSecret();
      expect(actionSecret).not.toBe(adminSecret);

      const actionToken = generateOrderActionToken('ORD-999', 'verify');
      expect(verifyOrderActionToken('ORD-999', 'verify', actionToken)).toBe(true);

      // Verify action token cannot be forged with admin token secret
      const crypto = require('crypto');
      const timestamp = Math.floor(Date.now() / 1000);
      const forgedWithAdminSecret = crypto
        .createHmac('sha256', adminSecret)
        .update(`ORD-999:verify:${timestamp}`)
        .digest('hex');
      const badToken = `${timestamp}.${forgedWithAdminSecret}`;

      expect(verifyOrderActionToken('ORD-999', 'verify', badToken)).toBe(false);
    });
  });

  describe('Phone OTP Token Signing Isolation', () => {
    it('signs and verifies OTP challenges using isolated HKDF token secret', async () => {
      process.env = {
        NEXTAUTH_SECRET: 'test-seed-key-32-chars-long-entropy-12345!',
        NODE_ENV: 'test',
      } as NodeJS.ProcessEnv;

      const { token } = createOtpChallengeToken('03001234567', '445566');
      const check = await verifyOtpChallengeToken('03001234567', '445566', token);
      expect(check.valid).toBe(true);
    });
  });
});
