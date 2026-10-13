import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateSecret, generateSync, verifySync } from 'otplib';
import { handleAuthRoutes } from '@/lib/api-handlers/auth';
import { ApiDispatchContext } from '@/lib/api-handlers/shared';
import {
  encryptTotpSecret,
  hashBackupCode,
  verifyBackupCode,
} from '@/lib/totp-crypto';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/db-utils';

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/db-utils', () => ({
  recordAuditLog: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (jest.fn() as any).mockResolvedValue({
    allowed: true,
    remaining: 10,
    resetTime: Date.now() + 60000,
  }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

describe('Two-Factor Authentication (TOTP) Security & Flow', () => {
  const mockUserId = 'user_2fa_test_123';
  const mockUserEmail = 'fahad@interior.pk';
  const mockPasswordPlain = 'SecurePassword123!';
  let mockPasswordHash: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPasswordHash = await bcrypt.hash(mockPasswordPlain, 10);
  });

  function createMockContext(
    method: string,
    segment: string,
    body?: Record<string, unknown>,
    authenticatedUserId: string | null = mockUserId
  ): ApiDispatchContext {
    const url = `http://localhost:3000/api/v1/${segment}`;
    const req = new NextRequest(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-user-id': authenticatedUserId || '',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      method,
      segment,
      normalizedSegment: segment.replace(/^v1\//, ''),
      pathParts: segment.split('/'),
      req,
      ip: '127.0.0.1',
    };
  }

  // ── 1. Base32 Secret Generation & Otplib Verifiability ───────────────────
  describe('1. Base32 Secret Generation & Otplib Verifiability', () => {
    it('generates valid RFC-compliant Base32 secrets that otplib can verify without throwing', () => {
      for (let i = 0; i < 50; i++) {
        const secret = generateSecret();
        expect(secret).toBeDefined();
        expect(typeof secret).toBe('string');
        expect(secret.length).toBeGreaterThanOrEqual(16);
        // Valid RFC 3548 / RFC 4648 Base32 alphabet
        expect(secret).toMatch(/^[A-Z2-7]+=*$/);

        // Generate token and verify with otplib
        const token = generateSync({ secret });
        expect(token).toMatch(/^\d{6}$/);

        const check = verifySync({ token, secret });
        expect(check.valid).toBe(true);
      }
    });

    it('tolerates +/- 1 time step (30 seconds) clock drift with epochTolerance: 30', () => {
      const secret = generateSecret();
      const pastToken = generateSync({
        secret,
        epoch: Math.floor(Date.now() / 1000) - 30,
      });
      const futureToken = generateSync({
        secret,
        epoch: Math.floor(Date.now() / 1000) + 30,
      });
      const tooFarPastToken = generateSync({
        secret,
        epoch: Math.floor(Date.now() / 1000) - 90,
      });

      expect(verifySync({ token: pastToken, secret, epochTolerance: 30 }).valid).toBe(true);
      expect(verifySync({ token: futureToken, secret, epochTolerance: 30 }).valid).toBe(true);
      expect(verifySync({ token: tooFarPastToken, secret, epochTolerance: 30 }).valid).toBe(false);
    });
  });

  // ── 2. Setup Endpoint Security ──────────────────────────────────────────
  describe('2. Setup Endpoint (auth/2fa/setup)', () => {
    it('rejects GET requests with 405 Method Not Allowed', async () => {
      const ctx = createMockContext('GET', 'auth/2fa/setup');
      const res = await handleAuthRoutes(ctx);

      expect(res).not.toBeNull();
      expect(res!.status).toBe(405);
      const data = await res!.json();
      expect(data.error).toBe('Method not allowed');
    });

    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const ctx = createMockContext('POST', 'auth/2fa/setup', undefined, null);
      const res = await handleAuthRoutes(ctx);

      expect(res).not.toBeNull();
      expect(res!.status).toBe(401);
      const data = await res!.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 409 Conflict if 2FA is already enabled on the account', async () => {
      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        totpEnabled: true,
      });

      // Mock shared session lookup
      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/setup');
      const res = await handleAuthRoutes(ctx);

      expect(res).not.toBeNull();
      expect(res!.status).toBe(409);
      const data = await res!.json();
      expect(data.error).toMatch(/already enabled/i);
    });

    it('generates a local data-URL QR code and saves encrypted secret with totpEnabled: false', async () => {
      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        totpEnabled: false,
      });
      (db.user.update as any).mockResolvedValueOnce({
        id: mockUserId,
      });

      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/setup');
      const res = await handleAuthRoutes(ctx);

      expect(res).not.toBeNull();
      expect(res!.status).toBe(200);
      const data = await res!.json();

      // Local QR data URL (no third-party api.qrserver.com leak)
      expect(data.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(data.qrCode).not.toContain('api.qrserver.com');
      expect(data.manualKey).toMatch(/^[A-Z2-7]+=*$/);

      // Verify DB update kept totpEnabled: false and stored encrypted secret
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          totpEnabled: false,
          totpSecret: expect.stringMatching(/^enc:v1:/),
        }),
      });
    });
  });

  // ── 3. Enable Endpoint Security ─────────────────────────────────────────
  describe('3. Enable Endpoint (auth/2fa/enable)', () => {
    it('rejects GET requests with 405 Method Not Allowed', async () => {
      const ctx = createMockContext('GET', 'auth/2fa/enable');
      const res = await handleAuthRoutes(ctx);

      expect(res).not.toBeNull();
      expect(res!.status).toBe(405);
    });

    it('rejects missing or non-6-digit token with 400 Bad Request', async () => {
      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValue({
        id: mockUserId,
        email: mockUserEmail,
      });

      // Missing token
      let ctx = createMockContext('POST', 'auth/2fa/enable', {});
      let res = await handleAuthRoutes(ctx);
      expect(res!.status).toBe(400);

      // 4-digit token
      ctx = createMockContext('POST', 'auth/2fa/enable', { token: '1234' });
      res = await handleAuthRoutes(ctx);
      expect(res!.status).toBe(400);

      // Non-digit token
      ctx = createMockContext('POST', 'auth/2fa/enable', { token: 'ABCDEF' });
      res = await handleAuthRoutes(ctx);
      expect(res!.status).toBe(400);
    });

    it('rejects an incorrect token with 400 Bad Request', async () => {
      const plainSecret = generateSecret();
      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        totpSecret: encryptTotpSecret(plainSecret),
        totpEnabled: false,
      });

      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/enable', { token: '000000' });
      const res = await handleAuthRoutes(ctx);

      expect(res!.status).toBe(400);
      const data = await res!.json();
      expect(data.error).toMatch(/invalid verification code/i);
    });

    it('accepts correct token, enables 2FA, and returns 8 hashed backup codes once', async () => {
      const plainSecret = generateSecret();
      const validToken = generateSync({ secret: plainSecret });

      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        totpSecret: encryptTotpSecret(plainSecret),
        totpEnabled: false,
      });
      (db.user.update as any).mockResolvedValueOnce({
        id: mockUserId,
      });

      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/enable', { token: validToken });
      const res = await handleAuthRoutes(ctx);

      expect(res!.status).toBe(200);
      const data = await res!.json();
      expect(data.enabled).toBe(true);
      expect(Array.isArray(data.backupCodes)).toBe(true);
      expect(data.backupCodes.length).toBe(8);

      // Verify DB update stored HASHED backup codes
      const updateCall = (db.user.update as any).mock.calls[0][0] as any;
      expect(updateCall.data.totpEnabled).toBe(true);
      expect(updateCall.data.backupCodes.length).toBe(8);
      // Stored codes must be hashed with bkc:v2: prefix
      expect(updateCall.data.backupCodes[0]).toMatch(/^bkc:v2:/);
    });
  });

  // ── 4. Disable Endpoint Security ────────────────────────────────────────
  describe('4. Disable Endpoint (auth/2fa/disable)', () => {
    it('rejects GET requests with 405 Method Not Allowed', async () => {
      const ctx = createMockContext('GET', 'auth/2fa/disable');
      const res = await handleAuthRoutes(ctx);

      expect(res!.status).toBe(405);
    });

    it('requires BOTH current password and valid token (rejects missing fields)', async () => {
      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValue({
        id: mockUserId,
        email: mockUserEmail,
      });

      // Missing token
      let ctx = createMockContext('POST', 'auth/2fa/disable', { password: mockPasswordPlain });
      let res = await handleAuthRoutes(ctx);
      expect(res!.status).toBe(400);

      // Missing password
      ctx = createMockContext('POST', 'auth/2fa/disable', { token: '123456' });
      res = await handleAuthRoutes(ctx);
      expect(res!.status).toBe(400);
    });

    it('rejects incorrect password with 400 Bad Request', async () => {
      const plainSecret = generateSecret();
      const validToken = generateSync({ secret: plainSecret });

      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        password: mockPasswordHash,
        totpSecret: encryptTotpSecret(plainSecret),
        totpEnabled: true,
        backupCodes: [],
      });

      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/disable', {
        password: 'WrongPassword!',
        token: validToken,
      });
      const res = await handleAuthRoutes(ctx);

      expect(res!.status).toBe(400);
      const data = await res!.json();
      expect(data.error).toMatch(/password is incorrect/i);
    });

    it('rejects wrong TOTP token and wrong backup code with 400 Bad Request', async () => {
      const plainSecret = generateSecret();

      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        password: mockPasswordHash,
        totpSecret: encryptTotpSecret(plainSecret),
        totpEnabled: true,
        backupCodes: [hashBackupCode('REAL-CODE-1')],
      });

      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/disable', {
        password: mockPasswordPlain,
        token: 'WRONG-TOKEN',
      });
      const res = await handleAuthRoutes(ctx);

      expect(res!.status).toBe(400);
      const data = await res!.json();
      expect(data.error).toMatch(/invalid 2fa code or backup code/i);
    });

    it('disables 2FA with password + valid TOTP token, clears credentials, and writes audit log', async () => {
      const plainSecret = generateSecret();
      const validToken = generateSync({ secret: plainSecret });

      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        password: mockPasswordHash,
        totpSecret: encryptTotpSecret(plainSecret),
        totpEnabled: true,
        backupCodes: [hashBackupCode('CODE1234')],
      });
      (db.user.update as any).mockResolvedValueOnce({
        id: mockUserId,
      });

      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/disable', {
        password: mockPasswordPlain,
        token: validToken,
      });
      const res = await handleAuthRoutes(ctx);

      expect(res!.status).toBe(200);
      const data = await res!.json();
      expect(data.disabled).toBe(true);

      // Clears secret, enabled, and backup codes
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          totpEnabled: false,
          totpSecret: null,
          backupCodes: [],
        },
      });

      // Writes audit log
      expect(recordAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: '2FA_DISABLED',
          entity: 'User',
        })
      );
    });

    it('disables 2FA with password + valid unused backup code', async () => {
      const plainSecret = generateSecret();
      const backupPlain = 'BACKUP-CODE-99';
      const storedHashed = hashBackupCode(backupPlain);

      (db.user.findUnique as any).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        password: mockPasswordHash,
        totpSecret: encryptTotpSecret(plainSecret),
        totpEnabled: true,
        backupCodes: [storedHashed],
      });
      (db.user.update as any).mockResolvedValueOnce({
        id: mockUserId,
      });

      jest.spyOn(require('@/lib/api-handlers/shared'), 'getUserFromSessionOrToken').mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
      });

      const ctx = createMockContext('POST', 'auth/2fa/disable', {
        password: mockPasswordPlain,
        token: backupPlain,
      });
      const res = await handleAuthRoutes(ctx);

      expect(res!.status).toBe(200);
      const data = await res!.json();
      expect(data.disabled).toBe(true);
    });
  });

  // ── 5. Backup Code Single-Use Consumption ───────────────────────────────
  describe('5. Backup Code Single-Use Consumption', () => {
    it('verifies a hashed backup code and ensures it cannot be reused after consumption', () => {
      const codeA = 'ABCD-1111';
      const codeB = 'EFGH-2222';
      const hashedA = hashBackupCode(codeA);
      const hashedB = hashBackupCode(codeB);

      let userCodes = [hashedA, hashedB];

      // First use: codeA matches
      const matchedFirst = verifyBackupCode(codeA, userCodes);
      expect(matchedFirst).toBe(hashedA);

      // Consume the code (filter out matched)
      userCodes = userCodes.filter((c) => c !== matchedFirst);
      expect(userCodes).toHaveLength(1);
      expect(userCodes[0]).toBe(hashedB);

      // Second use: codeA must now fail
      const matchedSecond = verifyBackupCode(codeA, userCodes);
      expect(matchedSecond).toBeNull();

      // codeB is still valid
      const matchedOther = verifyBackupCode(codeB, userCodes);
      expect(matchedOther).toBe(hashedB);
    });
  });
});
