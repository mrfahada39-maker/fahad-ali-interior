import crypto from 'crypto';
import { WhatsAppService } from '@/lib/whatsapp';
import { SmsService } from '@/lib/sms';
import { logger } from '@/lib/logger';
import { isValidPakistaniPhone } from '@/lib/pakistan-localization';

/**
 * Masks a Pakistani phone number for private display (e.g. +92 300 ••••567).
 */
export function maskPakistaniPhone(phone: string): string {
  if (!phone) return '';
  const norm = normalizePakistaniPhone(phone);
  if (norm.length >= 10) {
    const cc = norm.slice(0, 2);
    const code = norm.slice(2, 5);
    const suffix = norm.slice(-3);
    return `+${cc} ${code} ••••${suffix}`;
  }
  return phone;
}

/**
 * In-memory rate limiting and attempt tracker for phone OTPs.
 * Tracks per-phone rate limits to prevent SMS/WhatsApp spam and brute-force attacks.
 */
interface RateLimitRecord {
  lastSentAt: number;
  sendCount: number;
  firstSentAt: number;
  attempts: number;
}

const otpRateLimitMap = new Map<string, RateLimitRecord>();

const COOLDOWN_SECONDS = 30;
const MAX_SENDS_PER_WINDOW = 10;
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Normalizes any Pakistani mobile number into international E.164 without plus:
 * e.g. "0300 1234567" -> "923001234567"
 *      "+92 321-3283301" -> "923213283301"
 */
export function normalizePakistaniPhone(phone: string): string {
  let cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (!cleaned.startsWith('92') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

/**
 * Retrieves the cryptographic secret used to sign OTP challenge tokens.
 */
function getPhoneOtpSecret(): string {
  return (
    process.env.ADMIN_TOKEN_SECRET ||
    process.env.AI_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'fahad-ali-interior-phone-otp-secret-2026'
  );
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP (100000 - 999999).
 */
export function generate6DigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Creates an HMAC signed, tamper-proof OTP challenge token.
 * Token payload: phone:expiresAt:otpHash:signature
 */
export function createOtpChallengeToken(
  phone: string,
  otp: string,
  ttlMs: number = OTP_TTL_MS
): { token: string; expiresAt: number } {
  const normPhone = normalizePakistaniPhone(phone);
  const expiresAt = Date.now() + ttlMs;
  const secret = getPhoneOtpSecret();

  const otpHash = crypto
    .createHmac('sha256', secret)
    .update(`${normPhone}:${otp}`)
    .digest('hex');

  const payload = `${normPhone}:${expiresAt}:${otpHash}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');
  return { token, expiresAt };
}

/**
 * Validates a submitted 6-digit code against the HMAC signed challenge token.
 */
export function verifyOtpChallengeToken(
  phone: string,
  inputOtp: string,
  token: string
): { valid: boolean; error?: string } {
  if (!phone || !inputOtp || !token) {
    return { valid: false, error: 'Phone number, 6-digit code, and token are required' };
  }

  const cleanOtp = inputOtp.replace(/\D/g, '').trim();
  if (cleanOtp.length !== 6) {
    return { valid: false, error: 'Please enter a complete 6-digit verification code' };
  }

  const normPhone = normalizePakistaniPhone(phone);
  const secret = getPhoneOtpSecret();

  // Rate-limit attempt tracking to prevent brute-force (max 5 tries)
  const rlKey = `verify:${normPhone}`;
  const record = otpRateLimitMap.get(rlKey) || {
    lastSentAt: Date.now(),
    sendCount: 0,
    firstSentAt: Date.now(),
    attempts: 0,
  };

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    return {
      valid: false,
      error: 'Maximum verification attempts exceeded. Please request a new verification code.',
    };
  }

  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 4) {
      return { valid: false, error: 'Malformed verification token' };
    }

    const [tokenPhone, expStr, tokenOtpHash, sig] = parts;

    if (tokenPhone !== normPhone) {
      return { valid: false, error: 'Phone number does not match verification challenge' };
    }

    const expiresAt = parseInt(expStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    const payload = `${tokenPhone}:${expStr}:${tokenOtpHash}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const sigBuf = Buffer.from(sig);
    const expSigBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return { valid: false, error: 'Verification challenge is invalid or has been modified' };
    }

    const calculatedOtpHash = crypto
      .createHmac('sha256', secret)
      .update(`${normPhone}:${cleanOtp}`)
      .digest('hex');

    const hashBuf = Buffer.from(tokenOtpHash);
    const calcBuf = Buffer.from(calculatedOtpHash);
    if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
      record.attempts += 1;
      otpRateLimitMap.set(rlKey, record);
      const remaining = MAX_VERIFY_ATTEMPTS - record.attempts;
      return {
        valid: false,
        error: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`,
      };
    }

    // Success: reset attempts
    otpRateLimitMap.delete(rlKey);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Failed to verify OTP code' };
  }
}

/**
 * Creates a signed verification receipt token (valid for 1 hour).
 * The client attaches this to the order payload to prove phone ownership.
 */
export function signVerifiedPhoneToken(phone: string, ttlMs: number = 60 * 60 * 1000): string {
  const normPhone = normalizePakistaniPhone(phone);
  const expiresAt = Date.now() + ttlMs;
  const secret = getPhoneOtpSecret();
  const payload = `${normPhone}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', secret).update(`VERIFIED_PHONE:${payload}`).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

/**
 * Verifies that a phone number was genuinely verified via OTP within its validity window.
 */
export function isPhoneVerifiedTokenValid(phone: string, token: string): boolean {
  if (!phone || !token) return false;
  try {
    const normPhone = normalizePakistaniPhone(phone);
    const secret = getPhoneOtpSecret();
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const [tokenPhone, expStr, sig] = raw.split(':');

    if (tokenPhone !== normPhone) return false;
    const expiresAt = parseInt(expStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const payload = `${tokenPhone}:${expStr}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`VERIFIED_PHONE:${payload}`)
      .digest('hex');

    const sigBuf = Buffer.from(sig);
    const expSigBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expSigBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expSigBuf);
  } catch {
    return false;
  }
}

/**
 * Sends a 6-digit OTP code to the customer via WhatsApp or cellular SMS text (with fallback logging for dev/testing).
 */
export async function sendOtpToPhone(
  phone: string,
  channelPref: 'WHATSAPP' | 'SMS' = 'WHATSAPP',
  contextTitle: string = 'Security Verification',
  customOtp?: string
): Promise<
  | {
      success: true;
      token: string;
      cooldownSeconds: number;
      channel: 'WHATSAPP' | 'SMS' | 'DEV_LOG';
      devCode?: string;
    }
  | { success: false; error: string; cooldownSeconds?: number }
> {
  if (!isValidPakistaniPhone(phone)) {
    return {
      success: false,
      error: 'Please enter a valid 11-digit Pakistani mobile number (e.g. 0300 1234567 or +92 300 1234567).',
    };
  }

  const normPhone = normalizePakistaniPhone(phone);
  const now = Date.now();

  // Check rate limit
  const record = otpRateLimitMap.get(normPhone);
  if (record) {
    // Window expiration reset
    if (now - record.firstSentAt > WINDOW_DURATION_MS) {
      otpRateLimitMap.delete(normPhone);
    } else {
      // Cooldown check
      const elapsedSeconds = Math.floor((now - record.lastSentAt) / 1000);
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        return {
          success: false,
          error: `Please wait ${remaining} second${remaining > 1 ? 's' : ''} before requesting another verification code.`,
          cooldownSeconds: remaining,
        };
      }
      // Maximum send limit in window
      if (record.sendCount >= MAX_SENDS_PER_WINDOW) {
        return {
          success: false,
          error: 'Maximum verification attempts reached for this number. Please try again after 10 minutes.',
        };
      }
    }
  }

  // Generate 6-digit OTP and challenge token
  const otp = customOtp || generate6DigitOtp();
  const { token } = createOtpChallengeToken(normPhone, otp);

  // Update rate limit tracker
  const existing = otpRateLimitMap.get(normPhone);
  if (existing && now - existing.firstSentAt <= WINDOW_DURATION_MS) {
    existing.lastSentAt = now;
    existing.sendCount += 1;
    otpRateLimitMap.set(normPhone, existing);
  } else {
    otpRateLimitMap.set(normPhone, {
      lastSentAt: now,
      sendCount: 1,
      firstSentAt: now,
      attempts: 0,
    });
  }

  // Reset verify attempts for this phone
  otpRateLimitMap.delete(`verify:${normPhone}`);

  const isDevOrTest = process.env.NODE_ENV !== 'production';

  // ── Dispatch via Cellular SMS ──
  if (channelPref === 'SMS') {
    const smsRes = await SmsService.sendOtpMessage(normPhone, otp);
    if (smsRes.success) {
      return {
        success: true,
        token,
        cooldownSeconds: COOLDOWN_SECONDS,
        channel: smsRes.channel,
        ...(smsRes.devCode ? { devCode: smsRes.devCode } : (isDevOrTest || smsRes.channel === 'DEV_LOG' ? { devCode: otp } : {})),
      };
    }
  }

  // ── Dispatch via WhatsApp Cloud API ──
  const messageBody = `🏛️ *FAHAD ALI INTERIOR*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assalam-o-Alaikum,

Aapka ${contextTitle} 6-digit verification code yeh hai:

🔑 *${otp}*

Yeh code agle 10 minute ke liye valid hai. Baraye meherbani yeh code kisi ke sath share na karein.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Fahad Ali Interior — Haute Couture Handcrafted Luxury*`;

  let sentViaWhatsApp = false;
  try {
    sentViaWhatsApp = await WhatsAppService.sendTextMessage(normPhone, messageBody);
  } catch (err) {
    logger.warn('[WhatsApp OTP Dispatch Failed]:', { detail: String(err) });
  }

  if (sentViaWhatsApp) {
    logger.info(`[WhatsApp OTP Dispatched]: Sent 6-digit code to ${normPhone}`);
    return {
      success: true,
      token,
      cooldownSeconds: COOLDOWN_SECONDS,
      channel: 'WHATSAPP',
      ...(isDevOrTest ? { devCode: otp } : {}),
    };
  }

  // If WhatsApp API credentials are not set (e.g. localhost, testing, dev, or live fallback)
  logger.info(`[DEV / TEST OTP DISPATCH] 6-digit code for ${normPhone}: ${otp} (channel: ${channelPref})`);

  return {
    success: true,
    token,
    cooldownSeconds: COOLDOWN_SECONDS,
    channel: 'DEV_LOG',
    devCode: otp,
  };
}

