import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import {
  calculateLockoutDurationMs,
  verifyCredentialsAnd2Fa,
} from '@/lib/auth';
import { getVerifiedUser, getAdminTokenSecret } from '@/lib/admin-auth';
import { rateLimit } from '@/lib/rate-limit';

// Mock DB, rate-limit, and logger
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  ...jest.requireActual('@/lib/rate-limit'),
  rateLimit: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('M10: Account Lockout Hardening & Progressive Delay', () => {
  const mockUserFindUnique = db.user.findUnique as jest.Mock;
  const mockUserUpdate = db.user.update as jest.Mock;
  const mockRateLimit = rateLimit as jest.Mock;

  const validPassword = 'ExecutivePassword#2026';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(validPassword, 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60_000,
    });
    mockUserUpdate.mockResolvedValue({});
  });

  describe('1. Progressive Lockout Duration Calculation', () => {
    it('returns 0 ms for fewer than 5 attempts', () => {
      expect(calculateLockoutDurationMs(0)).toBe(0);
      expect(calculateLockoutDurationMs(1)).toBe(0);
      expect(calculateLockoutDurationMs(4)).toBe(0);
      expect(calculateLockoutDurationMs(4, true)).toBe(0);
    });

    it('returns progressive delay tiers for regular accounts (5m -> 15m -> 30m -> 60m -> 24h)', () => {
      expect(calculateLockoutDurationMs(5)).toBe(5 * 60 * 1000);   // 5 mins
      expect(calculateLockoutDurationMs(6)).toBe(15 * 60 * 1000);  // 15 mins
      expect(calculateLockoutDurationMs(7)).toBe(30 * 60 * 1000);  // 30 mins
      expect(calculateLockoutDurationMs(8)).toBe(60 * 60 * 1000);  // 60 mins
      expect(calculateLockoutDurationMs(9)).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(calculateLockoutDurationMs(15)).toBe(24 * 60 * 60 * 1000); // 24 hours capped
    });

    it('returns 24-hour persistent lockout for admin accounts requiring 2FA or email unlock', () => {
      expect(calculateLockoutDurationMs(5, true)).toBe(24 * 60 * 60 * 1000);
      expect(calculateLockoutDurationMs(8, true)).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('2. Per-IP Rate Limiting on Login', () => {
    it('rejects login with RATE_LIMITED status when per-IP limit is exceeded', async () => {
      mockRateLimit.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60_000,
        error: 'Too many login attempts from this IP. Please wait a minute and try again.',
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'attacker@target.com',
        password: 'any_password',
        ip: '198.51.100.44',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('RATE_LIMITED');
        expect(result.error).toContain('Too many login attempts from this IP');
      }
      expect(mockRateLimit).toHaveBeenCalledWith('login_ip:198.51.100.44', 'login');
      // DB user lookup must be skipped when rate limited
      expect(mockUserFindUnique).not.toHaveBeenCalled();
    });
  });

  describe('3. Progressive Lockout on Failed Password Attempts', () => {
    it('applies 5-minute lockout on 5th failed attempt for regular user', async () => {
      mockUserFindUnique.mockResolvedValueOnce({
        id: 'usr_reg_1',
        email: 'user1@fahadali.com',
        password: passwordHash,
        role: 'USER',
        loginAttempts: 4,
        lockedUntil: null,
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'user1@fahadali.com',
        password: 'wrong_password',
      });

      expect(result.success).toBe(false);
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr_reg_1' },
          data: expect.objectContaining({
            loginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        })
      );
    });

    it('applies 15-minute lockout on 6th failed attempt', async () => {
      mockUserFindUnique.mockResolvedValueOnce({
        id: 'usr_reg_2',
        email: 'user2@fahadali.com',
        password: passwordHash,
        role: 'USER',
        loginAttempts: 5,
        lockedUntil: null,
      });

      await verifyCredentialsAnd2Fa({
        email: 'user2@fahadali.com',
        password: 'wrong_password',
      });

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr_reg_2' },
          data: expect.objectContaining({
            loginAttempts: 6,
            lockedUntil: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('4. Admin 2FA Unlock When Account Is Locked', () => {
    it('locked admin entering wrong password stays locked and increments attempts', async () => {
      mockUserFindUnique.mockResolvedValueOnce({
        id: 'adm_locked_1',
        email: 'admin_locked@fahadali.com',
        password: passwordHash,
        role: 'ADMIN',
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 600_000),
        emailVerified: new Date(),
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'admin_locked@fahadali.com',
        password: 'bad_password',
        requireAdminRole: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('LOCKED');
      }
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'adm_locked_1' },
          data: expect.objectContaining({
            loginAttempts: 6,
          }),
        })
      );
    });

    it('locked admin entering valid password without 2FA receives REQUIRES_2FA prompt to unlock', async () => {
      mockUserFindUnique.mockResolvedValueOnce({
        id: 'adm_locked_2',
        email: 'admin_locked@fahadali.com',
        password: passwordHash,
        role: 'ADMIN',
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 600_000),
        totpEnabled: true,
        emailVerified: new Date(),
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'admin_locked@fahadali.com',
        password: validPassword,
        requireAdminRole: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('REQUIRES_2FA');
        expect(result.error).toContain('Two-factor authentication code required');
      }
    });

    it('locked admin entering valid password AND valid 2FA code successfully UNLOCKS the account', async () => {
      const validTotp = '123456';
      mockUserFindUnique.mockResolvedValueOnce({
        id: 'adm_locked_3',
        email: 'admin_locked@fahadali.com',
        password: passwordHash,
        role: 'ADMIN',
        loginAttempts: 6,
        lockedUntil: new Date(Date.now() + 600_000),
        totpEnabled: true,
        backupCodes: [validTotp], // Backup code unlock
        emailVerified: new Date(),
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'admin_locked@fahadali.com',
        password: validPassword,
        totpCode: validTotp,
        requireAdminRole: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.email).toBe('admin_locked@fahadali.com');
      }

      // Verify account was unlocked: loginAttempts and lockedUntil reset to 0/null
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'adm_locked_3' },
          data: expect.objectContaining({
            loginAttempts: 0,
            lockedUntil: null,
          }),
        })
      );
    });
  });

  describe('5. getVerifiedUser DoS Immunity for Already Logged-in Admins', () => {
    it('active admin session remains valid and usable even when lockedUntil is set by external attacker', async () => {
      const adminId = 'adm_logged_in_42';
      const secret = getAdminTokenSecret();
      const timestamp = Date.now();
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${adminId}:${timestamp}`)
        .digest('hex');
      const token = `fai_token_${adminId}_${timestamp}_${signature}`;

      // Simulate database state where an external attacker triggered lockedUntil on this admin
      mockUserFindUnique.mockResolvedValueOnce({
        id: adminId,
        name: 'Logged-in Admin',
        email: 'admin_active@fahadali.com',
        role: 'ADMIN',
        deletedAt: null,
        lockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Attacker locked the account!
      });

      const req = new NextRequest('http://localhost:3000/api/admin/orders', {
        headers: {
          cookie: `fai_admin_token=${token}`,
        },
      });

      const verified = await getVerifiedUser(req, { requireAdminRole: true });

      // An active admin session must NOT be invalidated by external password sprays!
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(adminId);
      expect(verified?.email).toBe('admin_active@fahadali.com');
      expect(verified?.role).toBe('ADMIN');
    });

    it('rejects already logged-in session if account has been deleted (deletedAt is set)', async () => {
      const adminId = 'adm_deleted_99';
      const secret = getAdminTokenSecret();
      const timestamp = Date.now();
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${adminId}:${timestamp}`)
        .digest('hex');
      const token = `fai_token_${adminId}_${timestamp}_${signature}`;

      mockUserFindUnique.mockResolvedValueOnce({
        id: adminId,
        name: 'Deleted Admin',
        email: 'deleted@fahadali.com',
        role: 'ADMIN',
        deletedAt: new Date(),
        lockedUntil: null,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/orders', {
        headers: {
          cookie: `fai_admin_token=${token}`,
        },
      });

      const verified = await getVerifiedUser(req, { requireAdminRole: true });
      expect(verified).toBeNull();
    });

    it('rejects already logged-in session if role was demoted to USER', async () => {
      const adminId = 'adm_demoted_55';
      const secret = getAdminTokenSecret();
      const timestamp = Date.now();
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${adminId}:${timestamp}`)
        .digest('hex');
      const token = `fai_token_${adminId}_${timestamp}_${signature}`;

      mockUserFindUnique.mockResolvedValueOnce({
        id: adminId,
        name: 'Demoted User',
        email: 'demoted@fahadali.com',
        role: 'USER', // Demoted!
        deletedAt: null,
        lockedUntil: null,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/orders', {
        headers: {
          cookie: `fai_admin_token=${token}`,
        },
      });

      const verified = await getVerifiedUser(req, { requireAdminRole: true });
      expect(verified).toBeNull();
    });
  });
});
