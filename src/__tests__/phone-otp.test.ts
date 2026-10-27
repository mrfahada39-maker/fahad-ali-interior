import {
  normalizePakistaniPhone,
  generate6DigitOtp,
  createOtpChallengeToken,
  verifyOtpChallengeToken,
  signVerifiedPhoneToken,
  isPhoneVerifiedTokenValid,
  sendOtpToPhone,
} from '@/lib/phone-otp';

describe('Phone OTP Verification Engine', () => {
  const testPhone = '0300 1234567';
  const normalizedExpected = '923001234567';

  it('correctly normalizes Pakistani phone numbers to E.164 without plus', () => {
    expect(normalizePakistaniPhone('0300 1234567')).toBe('923001234567');
    expect(normalizePakistaniPhone('0321-3283301')).toBe('923213283301');
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

  it('creates an HMAC challenge token and verifies a matching 6-digit code', () => {
    const otp = '849201';
    const { token } = createOtpChallengeToken(testPhone, otp, 60000);

    const result = verifyOtpChallengeToken(testPhone, otp, token);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects an incorrect 6-digit code and tracks remaining attempts', () => {
    const otp = '554433';
    const wrongOtp = '112233';
    const { token } = createOtpChallengeToken(testPhone, otp, 60000);

    const result = verifyOtpChallengeToken(testPhone, wrongOtp, token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Incorrect verification code');
  });

  it('rejects an expired OTP challenge token', () => {
    const otp = '998877';
    // Expired immediately (-1000ms TTL)
    const { token } = createOtpChallengeToken(testPhone, otp, -1000);

    const result = verifyOtpChallengeToken(testPhone, otp, token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('detects tampering with phone number in verification challenge', () => {
    const otp = '123456';
    const { token } = createOtpChallengeToken('0300 1111111', otp);

    const result = verifyOtpChallengeToken('0321 9999999', otp, token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not match');
  });

  it('detects tampering with the HMAC signature payload', () => {
    const otp = '654321';
    const { token } = createOtpChallengeToken(testPhone, otp);
    // Alter base64url payload
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const tampered = Buffer.from(decoded.replace(normalizedExpected, '923999999999')).toString('base64url');

    const result = verifyOtpChallengeToken(testPhone, otp, tampered);
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
    const validNum = '0300 1234567';
    const res = await sendOtpToPhone(validNum);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.cooldownSeconds).toBe(45);
      expect(typeof res.token).toBe('string');
    }
  });
});
