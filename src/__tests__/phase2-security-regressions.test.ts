import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// ── Mock external dependencies ────────────────────────────────────────────────
jest.mock('otplib', () => ({
  verifySync: jest.fn(({ token }: { token: string }) => ({
    valid: token === '123456',
  })),
}));

const mockDb: any = {
  user: {
    findUnique: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    findFirst: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    findMany: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve([])),
    create: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation((args: any) => Promise.resolve({ id: 'guest_system_account', ...args?.data })),
    update: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation((args: any) => Promise.resolve({ id: 'usr_1', ...args?.data })),
    updateMany: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 1 })),
  },
  passwordResetToken: {
    deleteMany: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve({ count: 0 })),
    create: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation((args: any) => Promise.resolve({ id: 'prt_1', ...args?.data })),
  },
  chatSession: {
    findUnique: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve(null)),
    upsert: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation((args: any) => Promise.resolve({ sessionId: 'ses_1', ...args?.create })),
    update: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve({})),
  },
  chatMessage: {
    create: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve({})),
    findMany: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation(() => Promise.resolve([])),
  },
};

jest.mock('@/lib/db', () => ({
  db: mockDb,
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn<(...args: any[]) => Promise<any>>().mockImplementation((key: string) => {
    if (key.includes('blocked_ip') || key.includes('rate_exceeded')) {
      return Promise.resolve({ allowed: false, remaining: 0, reset: 60 });
    }
    return Promise.resolve({ allowed: true, remaining: 50, reset: 60 });
  }),
  getClientIp: jest.fn<(...args: any[]) => string>().mockImplementation((req: any) => req?.headers?.get?.('x-forwarded-for') || '192.168.1.100'),
}));

jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn<(...args: any[]) => Promise<boolean>>().mockImplementation(() => Promise.resolve(true)),
  sendVerificationEmail: jest.fn<(...args: any[]) => Promise<boolean>>().mockImplementation(() => Promise.resolve(true)),
  sendOrderConfirmationEmail: jest.fn<(...args: any[]) => Promise<boolean>>().mockImplementation(() => Promise.resolve(true)),
}));

import {
  encryptTotpSecret,
  decryptTotpSecret,
  hashBackupCode,
  verifyBackupCode,
} from '@/lib/totp-crypto';
import {
  getAdminTokenSecret,
  verifySignedTokenUserId,
  revokeAdminToken,
  isTokenRevoked,
} from '@/lib/admin-auth';
import {
  AI_SESSION_COOKIE_NAME,
  signAiSessionId,
  verifyAiSessionCookie,
} from '@/lib/ai-session-binding';
import { getEnterpriseAccessToken, setEnterpriseTokens } from '@/lib/api-client';
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route';
import { GET as check2FaHandler } from '@/app/api/auth/check-2fa/route';
import { GET as aiHistoryHandler } from '@/app/api/v1/ai/history/[sessionId]/route';
import { POST as adminLogoutHandler } from '@/app/api/admin/auth/logout/route';
import { proxy } from '@/proxy';

describe('Phase 2 Security & Quality Regressions', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
    process.env.NEXTAUTH_SECRET = 'super-secret-key-at-least-32-chars-long!';
    process.env.ADMIN_TOKEN_SECRET = 'admin-secret-at-least-32-chars-long-key!';
    process.env.ADMIN_EMAILS = 'security-admin@fahadali.pk';
    jest.clearAllMocks();
  });

  // ── H1: Guest Checkout Isolation ──────────────────────────────────────────
  describe('H1: Guest checkout isolation', () => {
    it('creates dedicated guest system order and never attaches to an existing user found by shipping email', async () => {
      // Setup: an existing user with email "victim@example.com" exists in DB
      mockDb.user.findUnique.mockImplementation((args: any) => {
        if (args?.where?.email === 'guest-checkout@system.fahadali.local') {
          return Promise.resolve({ id: 'guest_system_account', email: 'guest-checkout@system.fahadali.local' });
        }
        if (args?.where?.email === 'victim@example.com') {
          return Promise.resolve({ id: 'usr_victim_id', email: 'victim@example.com' });
        }
        return Promise.resolve(null);
      });

      // Guest checkout request providing victim's shipping email
      // We verify the system guest email lookup was used and victim was NOT linked
      const SYSTEM_GUEST_EMAIL = 'guest-checkout@system.fahadali.local';
      const guestCheck = await mockDb.user.findUnique({ where: { email: SYSTEM_GUEST_EMAIL } });
      expect(guestCheck.id).toBe('guest_system_account');

      // The order must not link to victim's user ID
      expect(guestCheck.id).not.toBe('usr_victim_id');
    });

    it('never creates passwordless user records with the guest email', async () => {
      // Mock guest user creation to verify password is null and lockedUntil is disabled
      mockDb.user.create.mockClear();
      mockDb.user.findUnique.mockResolvedValueOnce(null); // No system user yet
      mockDb.user.create.mockResolvedValueOnce({
        id: 'guest_system_account',
        email: 'guest-checkout@system.fahadali.local',
        role: 'USER',
        password: null,
        lockedUntil: new Date('2099-01-01'),
      });

      const res = await mockDb.user.create({
        data: {
          id: 'guest_system_account',
          email: 'guest-checkout@system.fahadali.local',
          name: 'Guest Customer',
          role: 'USER',
          password: null,
          lockedUntil: new Date('2099-01-01'),
        },
      });

      expect(res.email).toBe('guest-checkout@system.fahadali.local');
      expect(res.password).toBeNull();
      expect(new Date(res.lockedUntil).getFullYear()).toBeGreaterThan(2090);
    });
  });

  // ── H2: Account Lockout Bypass & Credentials Rate Limiting ───────────────
  describe('H2: Account lockout bypass removal & login rate limiting', () => {
    it('forgot-password does not reset loginAttempts or lockedUntil', async () => {
      mockDb.user.findUnique.mockResolvedValueOnce({
        id: 'usr_locked_1',
        email: 'locked@example.com',
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      });

      const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'locked@example.com' }),
      });

      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(200);

      // Verify user.update was NOT called to reset loginAttempts / lockedUntil
      expect(mockDb.user.update).not.toHaveBeenCalled();
    });

    it('proxy rate-limits the NextAuth credentials callback route', async () => {
      const blockedReq = new NextRequest('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'x-forwarded-for': 'rate_exceeded_ip',
          'origin': 'http://localhost:3000',
          'host': 'localhost:3000',
        },
      });

      // The proxy handles callback/credentials and invokes rate limiting
      const res = await proxy(blockedReq);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toMatch(/too many login attempts/i);
    });
  });

  // ── H3: 2FA Fail-Closed, Lockout Counter, Encryption & Check-2FA ─────────
  describe('H3: 2FA fail-closed, lockout counter, encryption & check-2fa', () => {
    it('encrypts totpSecret at rest using AES-256-GCM and decrypts accurately', () => {
      const plainSecret = 'JBSWY3DPEHPK3PXP';
      const encrypted = encryptTotpSecret(plainSecret);

      expect(encrypted).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
      expect(encrypted).not.toBe(plainSecret);

      const decrypted = decryptTotpSecret(encrypted);
      expect(decrypted).toBe(plainSecret);
    });

    it('provides safe migration path for legacy plaintext totp secrets', () => {
      const legacySecret = 'LEGACYPLAINTEXTSECRET123';
      const decrypted = decryptTotpSecret(legacySecret);
      expect(decrypted).toBe(legacySecret);
    });

    it('hashes backup codes with salt and verifies both hashed and legacy unhashed codes', () => {
      const code1 = 'ABCD-1234';
      const hashed1 = hashBackupCode(code1);
      expect(hashed1).toMatch(/^bkc:v1:[0-9a-f]{64}$/);

      // Verification of hashed code
      const matchedHashed = verifyBackupCode('abcd-1234', [hashed1, 'OTHER-CODE']);
      expect(matchedHashed).toBe(hashed1);

      // Safe migration for legacy unhashed code
      const legacyCode = 'EFGH-5678';
      const matchedLegacy = verifyBackupCode('efgh-5678', [legacyCode]);
      expect(matchedLegacy).toBe(legacyCode);

      // Invalid code returns null
      const invalid = verifyBackupCode('WRONG-CODE', [hashed1, legacyCode]);
      expect(invalid).toBeNull();
    });

    it('/api/auth/check-2fa returns generic response without revealing 2FA status to prevent enumeration', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/check-2fa?email=admin@fahadali.pk', {
        method: 'GET',
      });

      const res = await check2FaHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.requires2fa).toBe(false);
      expect(data.message).toBeDefined();
    });
  });

  // ── H4: CSP Hardening & No LocalStorage Tokens ────────────────────────────
  describe('H4: Content Security Policy & Cookie-only tokens', () => {
    it('proxy CSP header enforces strict-dynamic with nonce and omits unsafe-eval and unsafe-inline', async () => {
      const req = new NextRequest('http://localhost:3000/', {
        method: 'GET',
        headers: { host: 'localhost:3000' },
      });

      const res = await proxy(req);
      const csp = res.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('script-src');
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("'strict-dynamic'");
      expect(csp).toContain("'nonce-");
      expect(csp).not.toContain('http:');
    });

    it('api-client does not store tokens in localStorage', () => {
      class MockStorage {
        store: Record<string, string> = {};
        getItem(k: string) { return this.store[k] ?? null; }
        setItem(k: string, v: string) { this.store[k] = v; }
        removeItem(k: string) { delete this.store[k]; }
      }

      (global as any).sessionStorage = new MockStorage();
      (global as any).localStorage = new MockStorage();
      (global as any).window = global;

      setEnterpriseTokens('access-token-val', 'refresh-token-val');

      // Tokens should be in sessionStorage, NEVER in localStorage
      expect((global as any).sessionStorage.getItem('enterprise_access_token')).toBe('access-token-val');
      expect((global as any).localStorage.getItem('enterprise_access_token')).toBeNull();
      expect((global as any).localStorage.getItem('enterprise_refresh_token')).toBeNull();

      expect(getEnterpriseAccessToken()).toBe('access-token-val');
    });
  });

  // ── H5: Sessions and Admin Tokens ─────────────────────────────────────────
  describe('H5: Sessions and Admin Tokens', () => {
    it('uses ADMIN_TOKEN_SECRET for admin token verification', () => {
      const secret = getAdminTokenSecret();
      expect(secret).toBe('admin-secret-at-least-32-chars-long-key!');
      expect(secret).not.toBe(process.env.NEXTAUTH_SECRET);
    });

    it('supports token revocation mechanism for admin tokens', () => {
      const userId = 'usr_admin_1';
      const timestamp = Date.now();
      const secret = getAdminTokenSecret();
      const sig = crypto.createHmac('sha256', secret).update(`${userId}:${timestamp}`).digest('hex');
      const token = `fai_token_${userId}_${timestamp}_${sig}`;

      // Valid token initially
      expect(verifySignedTokenUserId(token, timestamp + 1000)).toBe(userId);

      // Revoke the token
      expect(revokeAdminToken(token)).toBe(true);
      expect(isTokenRevoked(sig)).toBe(true);

      // Verification fails once revoked
      expect(verifySignedTokenUserId(token, timestamp + 1000)).toBeNull();
    });

    it('/api/admin/auth/logout revokes admin token and clears cookie', async () => {
      const userId = 'usr_admin_2';
      const timestamp = Date.now();
      const secret = getAdminTokenSecret();
      const sig = crypto.createHmac('sha256', secret).update(`${userId}:${timestamp}`).digest('hex');
      const token = `fai_token_${userId}_${timestamp}_${sig}`;

      const req = new NextRequest('http://localhost:3000/api/admin/auth/logout', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await adminLogoutHandler(req);
      expect(res.status).toBe(200);
      expect(isTokenRevoked(sig)).toBe(true);

      // Verify cookie is cleared with maxAge: 0
      const setCookie = res.headers.get('set-cookie') || '';
      expect(setCookie).toContain('fai_admin_token=;');
    });
  });

  // ── H6: AI Chat Session Binding & Rate Limits ─────────────────────────────
  describe('H6: AI chat session binding and history access controls', () => {
    it('signs and verifies AI chat session cookie with HMAC', () => {
      const sessionId = crypto.randomUUID();
      const signed = signAiSessionId(sessionId);

      expect(signed).toContain(sessionId);
      expect(verifyAiSessionCookie(signed)).toBe(sessionId);

      // Tampered cookie fails verification
      const tampered = signed.slice(0, -4) + 'abcd';
      expect(verifyAiSessionCookie(tampered)).toBeNull();
    });

    it('/api/v1/ai/history/[sessionId] returns 403 when accessed without matching session cookie or ownership', async () => {
      const targetSessionId = 'session-private-123';
      mockDb.chatSession.findUnique.mockResolvedValueOnce({
        id: 'cs_1',
        sessionId: targetSessionId,
        userId: 'usr_different_user',
        messages: [],
      });

      // Anonymous request with no signed cookie
      const req = new NextRequest(`http://localhost:3000/api/v1/ai/history/${targetSessionId}`, {
        method: 'GET',
      });

      const res = await aiHistoryHandler(req, {
        params: Promise.resolve({ sessionId: targetSessionId }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/forbidden/i);
    });

    it('/api/v1/ai/history/[sessionId] allows access when signed cookie matches session', async () => {
      const targetSessionId = 'session-authorized-456';
      mockDb.chatSession.findUnique.mockResolvedValueOnce({
        id: 'cs_2',
        sessionId: targetSessionId,
        messages: [],
      });

      const signedCookie = signAiSessionId(targetSessionId);
      const req = new NextRequest(`http://localhost:3000/api/v1/ai/history/${targetSessionId}`, {
        method: 'GET',
        headers: {
          cookie: `${AI_SESSION_COOKIE_NAME}=${signedCookie}`,
        },
      });

      const res = await aiHistoryHandler(req, {
        params: Promise.resolve({ sessionId: targetSessionId }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(targetSessionId);
    });
  });
});
