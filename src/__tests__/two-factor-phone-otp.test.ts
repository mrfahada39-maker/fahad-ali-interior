import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as handleSendOtp } from '@/app/api/auth/2fa/send-otp/route';
import { POST as handleVerifyOtp } from '@/app/api/auth/2fa/verify-otp/route';
import { GET as handleStatus } from '@/app/api/auth/2fa/status/route';
import { POST as handleDisable } from '@/app/api/auth/2fa/disable/route';
import { db } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: (jest.fn() as any).mockResolvedValue({
    allowed: true,
    remaining: 10,
    resetTime: Date.now() + 60000,
  }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/api-handlers/shared', () => ({
  getUserFromSessionOrToken: jest.fn(),
}));

describe('Two-Step Phone & WhatsApp Verification Endpoints', () => {
  const mockUserId = 'user_phone_2fa_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. returns status with registered and masked phone for authenticated user', async () => {
    const phone = '03001111111';
    const { getUserFromSessionOrToken } = require('@/lib/api-handlers/shared');
    getUserFromSessionOrToken.mockResolvedValueOnce({ id: mockUserId, email: 'client@interior.pk' });
    (db.user.findUnique as any).mockResolvedValueOnce({
      totpEnabled: false,
      phone,
      email: 'client@interior.pk',
    });

    const req = new NextRequest('http://localhost:3000/api/auth/2fa/status');
    const res = await handleStatus(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.enabled).toBe(false);
    expect(data.phone).toBe(phone);
    expect(data.maskedPhone).toContain('••••');
  });

  it('2. sends 6-digit OTP via SIM Text SMS and returns challenge token', async () => {
    const phone = '03002222222';
    const { getUserFromSessionOrToken } = require('@/lib/api-handlers/shared');
    getUserFromSessionOrToken.mockResolvedValueOnce({ id: mockUserId });
    (db.user.findUnique as any).mockResolvedValueOnce({ phone });

    const req = new NextRequest('http://localhost:3000/api/auth/2fa/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'SMS', phone }),
    });

    const res = await handleSendOtp(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.devCode).toBeDefined();
  });

  it('3. sends 6-digit OTP via WhatsApp and returns challenge token', async () => {
    const phone = '03003333333';
    const { getUserFromSessionOrToken } = require('@/lib/api-handlers/shared');
    getUserFromSessionOrToken.mockResolvedValueOnce({ id: mockUserId });
    (db.user.findUnique as any).mockResolvedValueOnce({ phone });

    const req = new NextRequest('http://localhost:3000/api/auth/2fa/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'WHATSAPP', phone }),
    });

    const res = await handleSendOtp(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
  });

  it('4. verifies 6-digit OTP successfully and activates 2FA on the user account', async () => {
    const phone = '03004444444';
    const { getUserFromSessionOrToken } = require('@/lib/api-handlers/shared');
    getUserFromSessionOrToken.mockResolvedValueOnce({ id: mockUserId });
    (db.user.findUnique as any).mockResolvedValueOnce({ phone });

    // 1. Send OTP to get valid token and devCode
    const sendReq = new NextRequest('http://localhost:3000/api/auth/2fa/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'WHATSAPP', phone }),
    });
    const sendRes = await handleSendOtp(sendReq);
    const sendData = await sendRes.json();

    // 2. Verify with valid token & code
    getUserFromSessionOrToken.mockResolvedValueOnce({ id: mockUserId });
    (db.user.update as any).mockResolvedValueOnce({ id: mockUserId, totpEnabled: true });

    const verifyReq = new NextRequest('http://localhost:3000/api/auth/2fa/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        token: sendData.token,
        code: sendData.devCode,
        channel: 'WHATSAPP',
      }),
    });

    const verifyRes = await handleVerifyOtp(verifyReq);
    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.enabled).toBe(true);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockUserId },
        data: expect.objectContaining({ totpEnabled: true }),
      })
    );
  });

  it('5. rejects invalid 6-digit OTP code with 400 Bad Request', async () => {
    const phone = '03005555555';
    const req = new NextRequest('http://localhost:3000/api/auth/2fa/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        token: 'invalid_token_challenge',
        code: '999999',
      }),
    });

    const res = await handleVerifyOtp(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('6. disables 2-step verification successfully', async () => {
    const { getUserFromSessionOrToken } = require('@/lib/api-handlers/shared');
    getUserFromSessionOrToken.mockResolvedValueOnce({ id: mockUserId });
    (db.user.findUnique as any).mockResolvedValueOnce({ id: mockUserId, totpEnabled: true });
    (db.user.update as any).mockResolvedValueOnce({ id: mockUserId, totpEnabled: false });

    const req = new NextRequest('http://localhost:3000/api/auth/2fa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await handleDisable(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.disabled).toBe(true);
  });
});
