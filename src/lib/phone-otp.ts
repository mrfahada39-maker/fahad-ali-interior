import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { WhatsAppService } from '@/lib/whatsapp';
import { SmsService } from '@/lib/sms';
import { logger } from '@/lib/logger';
import { isValidPakistaniPhone } from '@/lib/pakistan-localization';
import { isRateLimitConfigured } from '@/lib/rate-limit';
import { derivePurposeSecret } from '@/lib/env';
import { getSiteUrl } from '@/lib/utils';

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
 * Upstash Redis client singleton for distributed rate limiting and attempt tracking.
 */
let redisInstance: Redis | null = null;

export function setOtpRedisClient(client: Redis | null): void {
  redisInstance = client;
}

function getOtpRedis(): Redis | null {
  if (redisInstance) return redisInstance;
  if (isRateLimitConfigured()) {
    try {
      redisInstance = Redis.fromEnv();
      return redisInstance;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * In-memory rate limiting and attempt tracker fallback for phone OTPs (used in local development and unit tests).
 */
interface RateLimitRecord {
  lastSentAt: number;
  sendCount: number;
  firstSentAt: number;
  attempts: number;
}

const otpRateLimitMap = new Map<string, RateLimitRecord>();

export function clearOtpRateLimits(): void {
  otpRateLimitMap.clear();
}

const COOLDOWN_SECONDS = 45;
const MAX_SENDS_PER_WINDOW = 10;
const WINDOW_DURATION_SECONDS = 600; // 10 minutes
const OTP_TTL_MS = 10 * 60 * 1000;   // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Normalizes any Pakistani mobile number into international E.164 without plus:
 * e.g. "0300 1234567" -> "923001234567"
 *      "+92 300-1234567" -> "923001234567"
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
 * Uses domain-separated HKDF derivation to avoid secret reuse without DATABASE_URL fallbacks.
 */
function getPhoneOtpSecret(): string {
  return derivePurposeSecret(
    'otp-token',
    process.env.PHONE_OTP_SECRET || process.env.OTP_TOKEN_SECRET
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
 * Distributed rate-limiting helpers for cooldown and send window checks.
 */
async function checkPhoneRateLimit(normPhone: string): Promise<{
  allowed: boolean;
  cooldownSeconds?: number;
  error?: string;
}> {
  const redis = getOtpRedis();
  if (redis) {
    try {
      const cooldownTtl = await redis.ttl(`fai:otp:cooldown:${normPhone}`);
      if (cooldownTtl > 0) {
        return {
          allowed: false,
          cooldownSeconds: cooldownTtl,
          error: `Please wait ${cooldownTtl} second${cooldownTtl > 1 ? 's' : ''} before requesting another verification code.`,
        };
      }

      const count = await redis.get<number>(`fai:otp:send_count:${normPhone}`);
      if (count !== null && Number(count) >= MAX_SENDS_PER_WINDOW) {
        return {
          allowed: false,
          error: 'Maximum verification attempts reached for this number. Please try again after 10 minutes.',
        };
      }

      return { allowed: true };
    } catch (err) {
      logger.warn('[PhoneOTP Redis Check Error, fallback to memory tracker]:', { detail: String(err) });
    }
  }

  // Memory fallback
  const now = Date.now();
  const record = otpRateLimitMap.get(normPhone);
  if (record) {
    if (now - record.firstSentAt > WINDOW_DURATION_SECONDS * 1000) {
      otpRateLimitMap.delete(normPhone);
    } else {
      const elapsedSeconds = Math.floor((now - record.lastSentAt) / 1000);
      if (elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        return {
          allowed: false,
          error: `Please wait ${remaining} second${remaining > 1 ? 's' : ''} before requesting another verification code.`,
          cooldownSeconds: remaining,
        };
      }
      if (record.sendCount >= MAX_SENDS_PER_WINDOW) {
        return {
          allowed: false,
          error: 'Maximum verification attempts reached for this number. Please try again after 10 minutes.',
        };
      }
    }
  }
  return { allowed: true };
}

async function recordOtpSent(normPhone: string): Promise<void> {
  const redis = getOtpRedis();
  if (redis) {
    try {
      await redis.set(`fai:otp:cooldown:${normPhone}`, '1', { ex: COOLDOWN_SECONDS });
      const newCount = await redis.incr(`fai:otp:send_count:${normPhone}`);
      if (newCount === 1) {
        await redis.expire(`fai:otp:send_count:${normPhone}`, WINDOW_DURATION_SECONDS);
      }
      await redis.del(`fai:otp:verify_attempts:${normPhone}`);
    } catch (err) {
      logger.warn('[PhoneOTP Redis Record Error]:', { detail: String(err) });
    }
  }

  const now = Date.now();
  const existing = otpRateLimitMap.get(normPhone);
  if (existing && now - existing.firstSentAt <= WINDOW_DURATION_SECONDS * 1000) {
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
  otpRateLimitMap.delete(`verify:${normPhone}`);
}

async function getVerifyAttempts(normPhone: string): Promise<number> {
  const redis = getOtpRedis();
  if (redis) {
    try {
      const count = await redis.get<number>(`fai:otp:verify_attempts:${normPhone}`);
      if (count !== null) return Number(count);
    } catch (err) {
      logger.warn('[PhoneOTP Redis GetAttempts Error]:', { detail: String(err) });
    }
  }
  const rlKey = `verify:${normPhone}`;
  return otpRateLimitMap.get(rlKey)?.attempts ?? 0;
}

async function recordFailedVerifyAttempt(normPhone: string): Promise<number> {
  let redisAttempts: number | null = null;
  const redis = getOtpRedis();
  if (redis) {
    try {
      redisAttempts = await redis.incr(`fai:otp:verify_attempts:${normPhone}`);
      if (redisAttempts === 1) {
        await redis.expire(`fai:otp:verify_attempts:${normPhone}`, WINDOW_DURATION_SECONDS);
      }
    } catch (err) {
      logger.warn('[PhoneOTP Redis RecordFailedAttempt Error]:', { detail: String(err) });
    }
  }

  const rlKey = `verify:${normPhone}`;
  const record = otpRateLimitMap.get(rlKey) || {
    lastSentAt: Date.now(),
    sendCount: 0,
    firstSentAt: Date.now(),
    attempts: 0,
  };
  record.attempts += 1;
  otpRateLimitMap.set(rlKey, record);

  return redisAttempts !== null ? redisAttempts : record.attempts;
}

async function resetVerifyAttempts(normPhone: string): Promise<void> {
  const redis = getOtpRedis();
  if (redis) {
    try {
      await redis.del(`fai:otp:verify_attempts:${normPhone}`);
    } catch (err) {
      logger.warn('[PhoneOTP Redis ResetAttempts Error]:', { detail: String(err) });
    }
  }
  otpRateLimitMap.delete(`verify:${normPhone}`);
}

/**
 * Validates a submitted 6-digit code against the HMAC signed challenge token.
 * Tracks verify attempts per phone in Upstash Redis to prevent brute-force attacks.
 */
export async function verifyOtpChallengeToken(
  phone: string,
  inputOtp: string,
  token: string
): Promise<{ valid: boolean; error?: string }> {
  if (!phone || !inputOtp || !token) {
    return { valid: false, error: 'Phone number, 6-digit code, and token are required' };
  }

  const cleanOtp = inputOtp.replace(/\D/g, '').trim();
  if (cleanOtp.length !== 6) {
    return { valid: false, error: 'Please enter a complete 6-digit verification code' };
  }

  const normPhone = normalizePakistaniPhone(phone);
  const secret = getPhoneOtpSecret();

  // Rate-limit attempt tracking to prevent brute-force (max 5 tries) across distributed instances
  const currentAttempts = await getVerifyAttempts(normPhone);
  if (currentAttempts >= MAX_VERIFY_ATTEMPTS) {
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
      const attempts = await recordFailedVerifyAttempt(normPhone);
      const remaining = Math.max(0, MAX_VERIFY_ATTEMPTS - attempts);
      return {
        valid: false,
        error: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`,
      };
    }

    // Success: reset attempts in Upstash Redis and local memory
    await resetVerifyAttempts(normPhone);
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
 * Sends a 6-digit OTP code to the customer via WhatsApp or cellular SMS text.
 * Enforces distributed rate limits and fails closed in production if delivery fails.
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

  // Check distributed rate limit / cooldown via Upstash Redis
  const limitCheck = await checkPhoneRateLimit(normPhone);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || 'Rate limit exceeded.',
      cooldownSeconds: limitCheck.cooldownSeconds,
    };
  }

  // Generate 6-digit OTP and challenge token
  const otp = customOtp || generate6DigitOtp();
  const { token } = createOtpChallengeToken(normPhone, otp);

  // Record send in Redis and local tracker (sets 45s cooldown, increments window count, resets verify attempts)
  await recordOtpSent(normPhone);

  const isDevOrTest = process.env.NODE_ENV !== 'production';

  // ── Dispatch via Cellular SMS ──
  if (channelPref === 'SMS') {
    const smsRes = await SmsService.sendOtpMessage(normPhone, otp);
    if (smsRes.success && (smsRes.channel === 'SMS' || isDevOrTest)) {
      return {
        success: true,
        token,
        cooldownSeconds: COOLDOWN_SECONDS,
        channel: smsRes.channel,
        ...(isDevOrTest ? { devCode: smsRes.devCode || otp } : {}),
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

  // Dual delivery guarantee: Always also dispatch via Meta approved template so it bypasses 24h customer window
  try {
    const tmplOk = await WhatsAppService.sendTemplateMessage(normPhone, 'customer_order_slip_v2', [
      'Valued Client',
      `OTP-${otp}`,
      `Code: ${otp}`,
      'Login Security OTP',
      `Aapka 6-digit WhatsApp login verification code: ${otp}. Valid for 10 minutes.`,
      `${getSiteUrl()}/login`,
    ]);
    if (tmplOk) sentViaWhatsApp = true;
  } catch (tmplErr) {
    logger.warn('[WhatsApp Template OTP Fallback Error]:', { detail: String(tmplErr) });
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

  // In production: FAIL CLOSED if WhatsApp/SMS delivery fails. Return a real error.
  if (process.env.NODE_ENV === 'production') {
    return {
      success: false,
      error: 'Failed to deliver verification code. Please check your phone number or try again later.',
    };
  }

  // Development / test fallback only — NEVER log the plain OTP code
  logger.info(`[DEV / TEST OTP DISPATCH] Verification code dispatched for ${normPhone} (channel: ${channelPref})`);

  return {
    success: true,
    token,
    cooldownSeconds: COOLDOWN_SECONDS,
    channel: 'DEV_LOG',
    devCode: otp,
  };
}
