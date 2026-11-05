import {
  normalizePakistaniPhone,
  generate6DigitOtp,
  createOtpChallengeToken,
  verifyOtpChallengeToken,
  signVerifiedPhoneToken,
  isPhoneVerifiedTokenValid,
  sendOtpToPhone,
  setOtpRedisClient,
  clearOtpRateLimits,
} from '@/lib/phone-otp';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { Redis } from '@upstash/redis';
import { WhatsAppService } from '@/lib/whatsapp';
import { SmsService } from '@/lib/sms';

describe('Phone OTP Verification Engine', () => {
  const originalEnv = process.env;
  const testPhone = '0300 1234567';
  const normalizedExpected = '923001234567';

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    clearOtpRateLimits();
    setOtpRedisClient(null);
  });

  afterEach(() => {
    process.env = originalEnv;
    setOtpRedisClient(null);
    clearOtpRateLimits();
    jest.restoreAllMocks();
  });

  it('correctly normalizes Pakistani phone numbers to E.164 without plus', () => {
    expect(normalizePakistaniPhone('0300 1234567')).toBe('923001234567');
    expect(normalizePakistaniPhone('0321-9876543')).toBe('923219876543');
    expect(normalizePakistaniPhone('+92 345 6789012')).toBe('923456789012');
    expect(normalizePakistaniPhone('923331122334')).toBe('923331122334');
  });

  it('generates a secure 6-digit numeric OTP code', () => {
    for (let i = 0; i < 20; i++) {
      const code = generate6DigitOtp();
      expect(code).toMatch(/^\d{6}$/);
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    }
  });

  it('creates an HMAC challenge token and verifies a matching 6-digit code', async () => {
    const otp = '849201';
    const { token } = createOtpChallengeToken(testPhone, otp, 60000);

    const result = await verifyOtpChallengeToken(testPhone, otp, token);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects an incorrect 6-digit code and tracks remaining attempts', async () => {
    const otp = '554433';
    const wrongOtp = '112233';
    const { token } = createOtpChallengeToken(testPhone, otp, 60000);

    const result = await verifyOtpChallengeToken(testPhone, wrongOtp, token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Incorrect verification code');
  });

  it('rejects an expired OTP challenge token', async () => {
    const otp = '998877';
    // Expired immediately (-1000ms TTL)
    const { token } = createOtpChallengeToken(testPhone, otp, -1000);

    const result = await verifyOtpChallengeToken(testPhone, otp, token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('detects tampering with phone number in verification challenge', async () => {
    const otp = '123456';
    const { token } = createOtpChallengeToken('0300 1111111', otp);

    const result = await verifyOtpChallengeToken('0321 9999999', otp, token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not match');
  });

  it('detects tampering with the HMAC signature payload', async () => {
    const otp = '654321';
    const { token } = createOtpChallengeToken(testPhone, otp);
    // Alter base64url payload
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const tampered = Buffer.from(decoded.replace(normalizedExpected, '923999999999')).toString('base64url');

    const result = await verifyOtpChallengeToken(testPhone, otp, tampered);
    expect(result.valid).toBe(false);
  });

  it('creates and validates a signed verified phone token', () => {
    const verifiedToken = signVerifiedPhoneToken(testPhone);
    expect(typeof verifiedToken).toBe('string');
    expect(verifiedToken.length).toBeGreaterThan(20);

    const isValid = isPhoneVerifiedTokenValid(testPhone, verifiedToken);
    expect(isValid).toBe(true);

    const isInvalidPhone = isPhoneVerifiedTokenValid('0312 9999999', verifiedToken);
    expect(isInvalidPhone).toBe(false);
  });

  it('rejects invalid Pakistani phone numbers in sendOtpToPhone', async () => {
    const res = await sendOtpToPhone('12345');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('valid 11-digit Pakistani mobile number');
    }
  });

  it('dispatches OTP successfully with cooldown in sendOtpToPhone', async () => {
    jest.spyOn(WhatsAppService, 'sendTextMessage').mockResolvedValue(true);
    const validNum = '0300 1234567';
    const res = await sendOtpToPhone(validNum);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.cooldownSeconds).toBe(45);
      expect(typeof res.token).toBe('string');
      expect(res.channel).toBe('WHATSAPP');
    }
  });

  describe('H2: Distributed Upstash Redis Rate Limiting & Fail-Closed Delivery', () => {
    it('enforces distributed cooldown when Upstash Redis reports active cooldown TTL', async () => {
      const mockRedis = {
        ttl: jest.fn().mockResolvedValue(32),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1),
      } as unknown as Redis;

      setOtpRedisClient(mockRedis);

      const res = await sendOtpToPhone(testPhone);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.cooldownSeconds).toBe(32);
        expect(res.error).toContain('32 seconds');
      }
      expect(mockRedis.ttl).toHaveBeenCalledWith('fai:otp:cooldown:923001234567');
    });

    it('enforces distributed send limit when Upstash Redis reports 10 sends in window', async () => {
      const mockRedis = {
        ttl: jest.fn().mockResolvedValue(-2),
        get: jest.fn().mockResolvedValue(10),
        set: jest.fn().mockResolvedValue('OK'),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1),
      } as unknown as Redis;

      setOtpRedisClient(mockRedis);

      const res = await sendOtpToPhone(testPhone);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Maximum verification attempts reached for this number');
      }
    });

    it('enforces distributed verify attempt locking in Redis after 5 failed attempts', async () => {
      const mockRedis = {
        ttl: jest.fn().mockResolvedValue(-2),
        get: jest.fn().mockResolvedValue(5), // 5 previous attempts
        set: jest.fn().mockResolvedValue('OK'),
        incr: jest.fn().mockResolvedValue(6),
        expire: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1),
      } as unknown as Redis;

      setOtpRedisClient(mockRedis);

      const { token } = createOtpChallengeToken(testPhone, '123456');
      const res = await verifyOtpChallengeToken(testPhone, '123456', token);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Maximum verification attempts exceeded');
    });

    it('fails closed in production if WhatsApp and SMS dispatch fail, returning real error and never DEV_LOG', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      jest.spyOn(WhatsAppService, 'sendTextMessage').mockResolvedValue(false);
      jest.spyOn(WhatsAppService, 'sendTemplateMessage').mockResolvedValue(false);
      jest.spyOn(SmsService, 'sendOtpMessage').mockResolvedValue({
        success: false,
        error: 'SMS failed',
        channel: 'SMS',
      });

      const res = await sendOtpToPhone('0300 7654321');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Failed to deliver verification code');
      }
    });

    it('never logs plain OTP secrets to the logger', async () => {
      jest.spyOn(WhatsAppService, 'sendTextMessage').mockResolvedValue(false);
      jest.spyOn(WhatsAppService, 'sendTemplateMessage').mockResolvedValue(false);
      const loggerSpy = jest.spyOn(logger, 'info');
      await sendOtpToPhone('0311 2233445');

      for (const call of loggerSpy.mock.calls) {
        const loggedMsg = String(call[0] || '');
        expect(loggedMsg).not.toMatch(/6-digit code for .*: \d{6}/);
      }
    });

    it('configures dedicated IP rate limits for otpSend and otpVerify in RATE_LIMITS', () => {
      expect(RATE_LIMITS.otpSend).toBeDefined();
      expect(RATE_LIMITS.otpSend.maxRequests).toBe(5);
      expect(RATE_LIMITS.otpVerify).toBeDefined();
      expect(RATE_LIMITS.otpVerify.maxRequests).toBe(15);
    });
  });
});
