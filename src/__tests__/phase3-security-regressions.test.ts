/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockDb: any = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  emailVerificationToken: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  settings: {
    findFirst: jest.fn(),
  },
  auditLog: {
    deleteMany: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockCheckDatabaseHealth: any = jest.fn();

jest.mock('@/lib/db', () => ({
  db: mockDb,
  checkDatabaseHealth: (...args: any[]) => mockCheckDatabaseHealth(...args),
}));

jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  sendOrderConfirmationEmail: jest.fn(() => Promise.resolve()),
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

import { validatePasswordStrength, runDummyBcryptCompare } from '@/lib/password-policy';
import { validateImageBuffer, MAX_IMAGE_SIZE_BYTES } from '@/lib/image-validator';
import { safeApiErrorResponse } from '@/lib/api-error';
import { BUSINESS_CONTACT } from '@/lib/contact-config';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route';
import { POST as adminLoginPOST } from '@/app/api/admin/auth/login/route';
import { GET as healthGET } from '@/app/api/health/route';
import { POST as callSignalPOST } from '@/app/api/calls/signal/route';
import { POST as v1POST, PUT as v1PUT } from '@/app/api/v1/[...path]/route';
import { POST as adminCategoriesPOST } from '@/app/api/admin/categories/route';
import { proxy } from '@/proxy';
import { rateLimit } from '@/lib/rate-limit';
import { getAdminTokenSecret } from '@/lib/admin-auth';
import crypto from 'crypto';

function createValidAdminToken(userId = 'usr_admin_1'): string {
  const timestamp = Date.now().toString();
  const secret = getAdminTokenSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${timestamp}`)
    .digest('hex');
  return `fai_token_${userId}_${timestamp}_${signature}`;
}

describe('PHASE 3: Medium & Low Security Regressions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXTAUTH_SECRET: 'test-nextauth-secret-key-minimum-32-chars!!',
      ADMIN_TOKEN_SECRET: 'test-admin-token-secret-separate-32-chars!!',
      NEXTAUTH_URL: 'https://fahad-ali-interior.vercel.app',
    };
    mockDb.user.findUnique.mockImplementation(async (args: any) => {
      if (args?.where?.id === 'usr_admin_1') {
        return {
          id: 'usr_admin_1',
          email: 'admin@fahadali.pk',
          role: 'ADMIN',
          deletedAt: null,
        };
      }
      return null;
    });
  });

  // ── 1 & 2: crypto.randomInt OTP & Fixed getSiteUrl() Links ───────────────
  describe('M1 & M2: Secure OTP Generation & Host Header Poisoning Defense', () => {
    it('ignores poisoned Host and X-Forwarded-Host headers in password reset links', async () => {
      const { sendPasswordResetEmail } = require('@/lib/email');
      mockDb.user.findUnique.mockResolvedValue({
        id: 'usr_1',
        email: 'client@example.com',
        name: 'Client',
      });
      mockDb.passwordResetToken.deleteMany.mockResolvedValue({});
      mockDb.passwordResetToken.create.mockResolvedValue({});

      const req = new NextRequest('https://evil-attacker.com/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          host: 'evil-attacker.com',
          'x-forwarded-host': 'phishing-domain.net',
          'x-forwarded-for': '10.99.1.1',
        },
        body: JSON.stringify({ email: 'client@example.com' }),
      });

      const res = await forgotPasswordPOST(req);
      expect(res.status).toBe(200);
      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const callArg = sendPasswordResetEmail.mock.calls[0][0];
      expect(callArg.resetUrl).toContain('https://fahad-ali-interior.vercel.app/reset-password');
      expect(callArg.resetUrl).not.toContain('evil-attacker.com');
      expect(callArg.resetUrl).not.toContain('phishing-domain.net');
      expect(callArg.code).toMatch(/^\d{6}$/);
    });
  });

  // ── 3 & 4: Stronger Password Policy & User Enumeration Defense ──────────
  describe('M3 & M4: Enterprise Password Policy & Anti-Enumeration', () => {
    it('enforces minimum 10 characters, letters+numbers, and blocks common passwords', () => {
      expect(validatePasswordStrength('Short123').valid).toBe(false);
      expect(validatePasswordStrength('alllettersonly').valid).toBe(false);
      expect(validatePasswordStrength('123456789012').valid).toBe(false);
      expect(validatePasswordStrength('password1234').valid).toBe(false);
      expect(validatePasswordStrength('pakistan123').valid).toBe(false);
      expect(validatePasswordStrength('Sovereign99Oak!').valid).toBe(true);
    });

    it('enforces strong password policy on admin/password endpoint', async () => {
      const adminToken = createValidAdminToken('usr_admin_1');
      const req = new NextRequest('http://localhost:3000/api/v1/admin/password', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'OldValidPassword123!',
          newPassword: 'short1',
        }),
      });

      const res = await v1PUT(req, { params: Promise.resolve({ path: ['admin', 'password'] }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('at least 10 characters');
    });

    it('does not leak a distinct "locked" message on admin login when lockedUntil is active', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'usr_admin_1',
        email: 'admin@fahadali.pk',
        password: '$2a$12$validhashplaceholder12345678901234567890123456',
        lockedUntil: new Date(Date.now() + 600_000),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '10.99.2.2',
        },
        body: JSON.stringify({
          email: 'admin@fahadali.pk',
          password: 'SomePassword123!',
        }),
      });

      const res = await adminLoginPOST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid executive credentials');
      expect(data.error).not.toContain('locked');
    });

    it('runs dummy bcrypt comparison safely for constant-time non-existent user checks', async () => {
      const result = await runDummyBcryptCompare('AnyPassword123!');
      expect(result).toBe(false);
    });

    it('returns generic duplicate/unavailable message on registration when email exists', async () => {
      mockDb.user.findFirst.mockResolvedValue({ id: 'usr_existing', email: 'existing@example.com' });

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '10.99.3.3',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'StrongPassword99!',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain('already exists or is unavailable');
    });
  });

  // ── 5: Production Rate Limiter Enforcement ──────────────────────────────
  describe('M5: Production Upstash Requirement', () => {
    it('fails closed in production when Upstash configuration is missing instead of falling back to per-instance memory', async () => {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const rl = await rateLimit('prod-test-ip', 'login');
      expect(rl.allowed).toBe(false);
      spy.mockRestore();
    });
  });

  // ── 6: CSRF Check in proxy.ts ───────────────────────────────────────────
  describe('M6: Strict CSRF Check on Cookie-Authenticated Unsafe Requests', () => {
    it('rejects POST request with session cookie when both Origin and Sec-Fetch-Site headers are missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          cookie: 'next-auth.session-token=fake_session_token_value',
          'x-forwarded-for': '10.99.4.4',
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('CSRF validation failed');
    });
  });

  // ── 7: Sanitized API Catch Block Errors ─────────────────────────────────
  describe('M7: API Catch Block Error Sanitization', () => {
    it('does not leak raw database error.message to clients and includes requestId', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const adminToken = createValidAdminToken('usr_admin_1');
      mockDb.category.upsert.mockRejectedValue(
        new Error('FATAL Prisma P2002: Unique constraint failed on internal table postgres_schema.categories')
      );

      const req = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminToken}`,
          'x-request-id': 'req-test-999',
        },
        body: JSON.stringify({ name: 'Test Category' }),
      });

      const res = await adminCategoriesPOST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Failed to create category');
      expect(data.error).not.toContain('Prisma P2002');
      expect(data.error).not.toContain('postgres_schema');
      expect(data.requestId).toBe('req-test-999');
      spy.mockRestore();
    });

    it('safeApiErrorResponse generates a UUID requestId when header is absent', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = safeApiErrorResponse(new Error('Secret stack trace'), 'Generic failure', 500);
      const data = await res.json();
      expect(data.error).toBe('Generic failure');
      expect(data.requestId).toBeDefined();
      spy.mockRestore();
    });
  });

  // ── 8: Image Upload Magic Bytes & Size Validation ──────────────────────
  describe('M8: Image Upload Magic Bytes & Size Enforcement', () => {
    it('validates real JPEG, PNG, WebP, and AVIF magic bytes and rejects disguised files', () => {
      // Valid JPEG: FF D8 FF E0
      const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      expect(validateImageBuffer(jpegBuf, 'image/jpeg')).toEqual({
        valid: true,
        mimeType: 'image/jpeg',
      });

      // Valid PNG: 89 50 4E 47 0D 0A 1A 0A
      const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      expect(validateImageBuffer(pngBuf, 'image/png')).toEqual({
        valid: true,
        mimeType: 'image/png',
      });

      // Disguised HTML/SVG/Script claiming to be image/jpeg
      const disguisedBuf = Buffer.from('<script>alert("xss")</script>', 'utf8');
      const disguisedRes = validateImageBuffer(disguisedBuf, 'image/jpeg');
      expect(disguisedRes.valid).toBe(false);
      expect(disguisedRes.error).toContain('Magic bytes do not match');

      // Oversized file (> 5 MB)
      const hugeBuf = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1024, 0xff);
      const hugeRes = validateImageBuffer(hugeBuf, 'image/jpeg');
      expect(hugeRes.valid).toBe(false);
      expect(hugeRes.error).toContain('exceeds maximum allowed limit of 5 MB');
    });
  });

  // ── 9: Hardcoded Personal Data Removal ──────────────────────────────────
  describe('M9: Centralized Business Contact Configuration', () => {
    it('provides consistent business contact details without personal email or placeholder phone', () => {
      expect(BUSINESS_CONTACT.adminEmail).not.toMatch(/@(gmail|yahoo|hotmail)\.com$/i);
      expect(BUSINESS_CONTACT.phone).toBe('+92 321 3283301');
      expect(BUSINESS_CONTACT.phone).not.toBe('+92 300 1234567');
    });
  });

  // ── 10: /api/health Public Privacy ──────────────────────────────────────
  describe('M10: /api/health Public vs Admin Detail Isolation', () => {
    it('returns only { status } publicly and hides uptime, memory, and latency details from anonymous callers', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        ok: true,
        dialect: 'postgresql',
        latencyMs: 12,
        timestamp: new Date().toISOString(),
      });

      const anonReq = new NextRequest('http://localhost:3000/api/health');
      const anonRes = await healthGET(anonReq);
      expect(anonRes.status).toBe(200);
      const anonData = await anonRes.json();
      expect(anonData).toEqual({ status: 'healthy' });
      expect(anonData.uptimeSeconds).toBeUndefined();
      expect(anonData.system).toBeUndefined();
      expect(anonData.services).toBeUndefined();

      // Verified admin receives full diagnostics
      const adminToken = createValidAdminToken('usr_admin_1');
      const adminReq = new NextRequest('http://localhost:3000/api/health', {
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const adminRes = await healthGET(adminReq);
      const adminData = await adminRes.json();
      expect(adminData.status).toBe('healthy');
      expect(typeof adminData.uptimeSeconds).toBe('number');
      expect(adminData.system?.memoryUsageMb).toBeDefined();
      expect(adminData.services?.database?.latencyMs).toBe(12);
    });
  });

  // ── 11: Serverless WebRTC Signaling Persistence ─────────────────────────
  describe('M11: Serverless WebRTC Signaling State Persistence', () => {
    it('persists call session to database/Redis with short TTL instead of process-local memory Map', async () => {
      mockDb.auditLog.deleteMany.mockResolvedValue({});
      mockDb.auditLog.create.mockResolvedValue({});

      const req = new NextRequest('http://localhost:3000/api/calls/signal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          fromUserId: 'usr_client_1',
          toUserId: 'admin',
          callType: 'voice',
          offerSdp: { type: 'offer', sdp: 'v=0...' },
        }),
      });

      const res = await callSignalPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.status).toBe('outgoing');
      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'call_initiate',
            entity: 'call_signal',
          }),
        })
      );
    });
  });
});
