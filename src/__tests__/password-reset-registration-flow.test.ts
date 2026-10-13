import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email';

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (jest.fn() as any).mockResolvedValue({
    allowed: true,
    remaining: 100,
    resetTime: Date.now() + 60000,
  }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

describe('Auth Security & Flows: Password Reset OTP & Multi-Account Registration/Login', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setTimeout(20000);
    process.env = {
      ...originalEnv,
      SKIP_EMAIL_VERIFICATION: 'false',
      SMTP_USER: 'admin@fahadali.pk',
      SMTP_PASS: 'app-password-test',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ── 1. Password Reset & OTP Delivery ───────────────────────────────────────
  describe('Issue 1: Password Reset Email & OTP Code Delivery', () => {
    it('generates secure 6-digit OTP code and calls sendPasswordResetEmail', async () => {
      const mockUser = {
        id: 'usr_pwd_01',
        name: 'Ahmad Khan',
        email: 'ahmad@royal.pk',
        role: 'USER',
        deletedAt: null,
      };

      (db.user.findUnique as any).mockResolvedValue(mockUser);
      (db.passwordResetToken.deleteMany as any).mockResolvedValue({});
      (db.passwordResetToken.create as any).mockResolvedValue({});
      (sendPasswordResetEmail as any).mockResolvedValue({ success: true });

      const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'ahmad@royal.pk' }),
      });

      const res = await forgotPasswordPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const callArgs = (sendPasswordResetEmail as any).mock.calls[0][0];
      expect(callArgs.to).toBe('ahmad@royal.pk');
      expect(callArgs.code).toMatch(/^\d{6}$/); // 6-digit OTP
      expect(callArgs.resetUrl).toContain('/reset-password?token=');

      // Verify token creation in database contains OTP code
      expect(db.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id,
            tokenHash: expect.stringContaining(`:${callArgs.code}`),
          }),
        })
      );
    });

    it('verifies 6-digit OTP code and successfully updates password', async () => {
      const mockUser = {
        id: 'usr_pwd_02',
        name: 'Ahmad Khan',
        email: 'ahmad@royal.pk',
        role: 'USER',
        password: '$2a$10$oldhashedpassworddummy12345678901234567890',
        deletedAt: null,
        lockedUntil: null,
      };

      (db.user.findUnique as any).mockResolvedValue(mockUser);
      (db.passwordResetToken.findFirst as any).mockResolvedValue({
        id: 'prt_101',
        userId: mockUser.id,
        tokenHash: 'sampletokenhash:654321',
        expiresAt: new Date(Date.now() + 300000),
      });
      (db.user.update as any).mockResolvedValue({ ...mockUser, loginAttempts: 0 });

      const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'ahmad@royal.pk',
          code: '654321',
          password: 'NewStrongPassword123!#',
        }),
      });

      const res = await resetPasswordPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verify password was hashed and updated
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            loginAttempts: 0,
            lockedUntil: null,
          }),
        })
      );
      const updateData = (db.user.update as any).mock.calls[0][0].data;
      const isNewHash = await bcrypt.compare('NewStrongPassword123!#', updateData.password);
      expect(isNewHash).toBe(true);
    }, 15000);

    it('rejects invalid or expired OTP code with 400', async () => {
      const mockUser = {
        id: 'usr_pwd_03',
        email: 'ahmad@royal.pk',
        deletedAt: null,
        lockedUntil: null,
        loginAttempts: 0,
      };

      (db.user.findUnique as any).mockResolvedValue(mockUser);
      (db.passwordResetToken.findFirst as any).mockResolvedValue(null); // No matching record

      const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'ahmad@royal.pk',
          code: '000000',
          password: 'NewStrongPassword123!#',
        }),
      });

      const res = await resetPasswordPOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/invalid or expired/i);
    });
  });

  // ── 2. Second Account Registration & Login ────────────────────────────────
  describe('Issue 2: Second Account Registration & Login Flow', () => {
    it('registers a second account and persists user with hashed password and role USER', async () => {
      (db.user.findFirst as any).mockResolvedValue(null); // No collision
      (sendVerificationEmail as any).mockResolvedValue({ success: true });
      (db.emailVerificationToken.create as any).mockResolvedValue({});

      const mockCreatedUser = {
        id: 'usr_second_client',
        name: 'Fatima Malik',
        email: 'fatima@royal.pk',
        role: 'USER',
        createdAt: new Date(),
      };
      (db.user.create as any).mockResolvedValue(mockCreatedUser);

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Fatima Malik',
          email: 'fatima@royal.pk',
          phone: '+92 300 7654321',
          password: 'FatimaPassword123!',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe('fatima@royal.pk');

      // Verify db.user.create called with bcrypt hash
      expect(db.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'fatima@royal.pk',
            name: 'Fatima Malik',
            phone: '+92 300 7654321',
            role: 'USER',
          }),
        })
      );
      const createData = (db.user.create as any).mock.calls[0][0].data;
      const isMatch = await bcrypt.compare('FatimaPassword123!', createData.password);
      expect(isMatch).toBe(true);
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      (db.user.findFirst as any).mockResolvedValue({
        id: 'usr_existing_01',
        email: 'fatima@royal.pk',
      });

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Fatima Duplicate',
          email: 'fatima@royal.pk',
          password: 'FatimaPassword123!',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toMatch(/already exists/i);
    });

    it('authenticates newly registered second account via Credentials authorize callback', async () => {
      const plainPassword = 'ClientPassword999!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const mockDbUser = {
        id: 'usr_client_second',
        name: 'Second Client',
        email: 'secondclient@royal.pk',
        password: hashedPassword,
        role: 'USER',
        emailVerified: new Date(),
        deletedAt: null,
        lockedUntil: null,
        loginAttempts: 0,
        totpEnabled: false,
      };

      (db.user.findUnique as any).mockImplementation(async (args: any) => {
        if (args?.where?.email === 'secondclient@royal.pk') {
          return mockDbUser;
        }
        return null;
      });

      // Find credentials provider in authOptions
      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'Credentials'
      ) as any;
      expect(credentialsProvider).toBeDefined();

      // In NextAuth CredentialsProvider, the custom authorize callback is stored under options.authorize
      const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
      expect(authorizeFn).toBeDefined();

      const userSession = await authorizeFn({
        email: 'secondclient@royal.pk',
        password: plainPassword,
      });

      expect(userSession).not.toBeNull();
      expect(userSession?.id).toBe(mockDbUser.id);
      expect(userSession?.email).toBe(mockDbUser.email);
      expect(userSession?.role).toBe('USER');
    }, 15000);

    it('auto-verifies user during registration when verification email delivery fails to prevent permanent lockout', async () => {
      (db.user.findFirst as any).mockResolvedValue(null);
      // Simulate SMTP delivery failure
      (sendVerificationEmail as any).mockResolvedValue({ success: false, error: 'SMTP timeout' });
      (db.emailVerificationToken.create as any).mockResolvedValue({});
      (db.user.update as any).mockResolvedValue({});

      const mockCreatedUser = {
        id: 'usr_unverified_fallback',
        name: 'Fallback User',
        email: 'fallback@royal.pk',
        role: 'USER',
        createdAt: new Date(),
      };
      (db.user.create as any).mockResolvedValue(mockCreatedUser);

      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Fallback User',
          email: 'fallback@royal.pk',
          password: 'FallbackPassword123!',
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(201);

      // Verify db.user.update was called to auto-verify the user so they can log in
      expect(db.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCreatedUser.id },
          data: expect.objectContaining({
            emailVerified: expect.any(Date),
          }),
        })
      );
    });
  });
});
