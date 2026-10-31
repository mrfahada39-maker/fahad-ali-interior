import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { POST as adminLoginPOST } from '@/app/api/admin/auth/login/route';
import { verifyCredentialsAnd2Fa } from '@/lib/auth';
import { createPhoneOtpSecret } from '@/lib/totp-crypto';
import { rateLimit } from '@/lib/rate-limit';

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getClientIp: jest.fn(() => '10.0.0.1'),
}));

const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

describe('Admin Login & Shared 2FA Invalidation Security (M7)', () => {
  const mockedRateLimit = rateLimit as jest.Mock;
  const originalEnv = process.env;

  const validPassword = 'SecureAdminPassword123!';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(validPassword, 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      ADMIN_TOKEN_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
      TOTP_ENC_KEY: 'fedcba9876543210fedcba9876543210',
    };
    mockedRateLimit.mockResolvedValue({ allowed: true });
    mockUserUpdate.mockResolvedValue({});
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('verifyCredentialsAnd2Fa (Shared Logic)', () => {
    it('returns INVALID_CREDENTIALS for empty email or password', async () => {
      const result = await verifyCredentialsAnd2Fa({ email: '', password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('INVALID_CREDENTIALS');
      }
    });

    it('returns INVALID_CREDENTIALS for non-existent user and executes dummy hash comparison', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await verifyCredentialsAnd2Fa({
        email: 'ghost@fahadali.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('INVALID_CREDENTIALS');
        expect(result.error).toBe('Invalid executive credentials');
      }
    });

    it('returns LOCKED if lockedUntil is in the future', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'usr_locked',
        email: 'locked@fahadali.com',
        password: passwordHash,
        lockedUntil: new Date(Date.now() + 600_000),
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'locked@fahadali.com',
        password: validPassword,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('LOCKED');
        expect(result.error).toBe('Invalid executive credentials');
        expect(result.error).not.toContain('locked');
      }
    });

    it('returns REQUIRES_2FA if user has totpEnabled and no code provided', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'usr_2fa',
        email: 'admin2fa@fahadali.com',
        password: passwordHash,
        totpEnabled: true,
        totpSecret: 'phone_otp:v1:9999999999:abc',
        role: 'ADMIN',
        emailVerified: new Date(),
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'admin2fa@fahadali.com',
        password: validPassword,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('REQUIRES_2FA');
      }
    });

    it('successfully verifies and INVALIDATES phone OTP secret in DB after single use', async () => {
      const userId = 'usr_phone_otp_admin';
      const otp = '849201';
      const phoneSecret = createPhoneOtpSecret(userId, otp);

      mockUserFindUnique.mockResolvedValue({
        id: userId,
        email: 'phoneadmin@fahadali.com',
        name: 'Phone Admin',
        password: passwordHash,
        totpEnabled: true,
        totpSecret: phoneSecret,
        role: 'ADMIN',
        loginAttempts: 2,
        emailVerified: new Date(),
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'phoneadmin@fahadali.com',
        password: validPassword,
        totpCode: otp,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.email).toBe('phoneadmin@fahadali.com');
      }

      // Assert that totpSecret was atomically updated to a used sentinel
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({
            totpSecret: expect.stringMatching(/^phone_otp:v1:used:\d+$/),
          }),
        })
      );

      // Assert that loginAttempts was reset on successful verification
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({
            loginAttempts: 0,
            lockedUntil: null,
          }),
        })
      );
    });

    it('rejects replay of a used phone OTP challenge', async () => {
      const userId = 'usr_replay_attacker';
      const usedSecret = `phone_otp:v1:used:${Date.now() - 5000}`;

      mockUserFindUnique.mockResolvedValue({
        id: userId,
        email: 'attacker@fahadali.com',
        password: passwordHash,
        totpEnabled: true,
        totpSecret: usedSecret,
        role: 'ADMIN',
        emailVerified: new Date(),
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'attacker@fahadali.com',
        password: validPassword,
        totpCode: '849201',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('INVALID_2FA');
      }
    });

    it('enforces requireAdminRole: true strictly', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'usr_normal_shopper',
        email: 'shopper@example.com',
        password: passwordHash,
        role: 'USER',
      });

      const result = await verifyCredentialsAnd2Fa({
        email: 'shopper@example.com',
        password: validPassword,
        requireAdminRole: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('FORBIDDEN');
        expect(result.error).toContain('Admin role required');
      }
    });
  });

  describe('POST /api/admin/auth/login (Endpoint Verification)', () => {
    it('returns requires2fa: true with status 200 when admin has 2FA enabled', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'admin_2fa_prompt',
        email: 'admin@fahadali.com',
        password: passwordHash,
        totpEnabled: true,
        totpSecret: 'phone_otp:v1:test',
        role: 'ADMIN',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@fahadali.com',
          password: validPassword,
        }),
      });

      const res = await adminLoginPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.requires2fa).toBe(true);
    });

    it('successfully logs in admin, sets fai_admin_token cookie, and invalidates phone-OTP secret', async () => {
      const adminId = 'admin_exec_99';
      const otp = '123987';
      const phoneSecret = createPhoneOtpSecret(adminId, otp);

      mockUserFindUnique.mockResolvedValue({
        id: adminId,
        email: 'executive@fahadali.com',
        name: 'Executive Partner',
        password: passwordHash,
        totpEnabled: true,
        totpSecret: phoneSecret,
        role: 'ADMIN',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'executive@fahadali.com',
          password: validPassword,
          totpCode: otp,
        }),
      });

      const res = await adminLoginPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.id).toBe(adminId);

      // Verify secure httpOnly cookie set
      const cookie = res.cookies.get('fai_admin_token');
      expect(cookie).toBeDefined();
      expect(cookie?.value).toMatch(/^fai_token_admin_exec_99_\d+_[a-f0-9]{64}$/);
      expect(cookie?.httpOnly).toBe(true);

      // Verify phone OTP was invalidated
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: adminId },
          data: expect.objectContaining({
            totpSecret: expect.stringMatching(/^phone_otp:v1:used:\d+$/),
          }),
        })
      );
    });

    it('rejects login with 403 when non-admin credentials are used on admin route', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'usr_normal',
        email: 'regular@example.com',
        password: passwordHash,
        role: 'USER',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'regular@example.com',
          password: validPassword,
        }),
      });

      const res = await adminLoginPOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Admin role required');
    });
  });
});
