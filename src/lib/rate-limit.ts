import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  login: { windowMs: 60 * 1000, maxRequests: 10 },       // Strict brute-force protection
  register: { windowMs: 60 * 1000, maxRequests: 5 },      // Anti-bot account flood protection
  newsletter: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  inquiry: { windowMs: 60 * 1000, maxRequests: 10 },
  coupon: { windowMs: 60 * 1000, maxRequests: 20 },
  admin: { windowMs: 60 * 1000, maxRequests: 200 },
  api: { windowMs: 60 * 1000, maxRequests: 300 },
  upload: { windowMs: 60 * 1000, maxRequests: 15 },       // Anti-DDoS storage protection
} as const;

type LimitName = keyof typeof RATE_LIMITS;

const limiters = new Map<LimitName, Ratelimit>();

/** True when Upstash env vars are present and non-placeholder */
export function isRateLimitConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
  return (
    url.startsWith('https://') &&
    token.length > 10 &&
    !url.includes('your-db') &&
    !token.includes('your-upstash')
  );
}

function getLimiter(name: LimitName): Ratelimit {
  const cached = limiters.get(name);
  if (cached) return cached;

  const redis = Redis.fromEnv();
  const config = RATE_LIMITS[name];
  const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000));

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSec} s`),
    prefix: `fai:${name}`,
  });

  limiters.set(name, limiter);
  return limiter;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export function getRateLimitHeaders(remaining: number, resetTime: number) {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  };
}

// High-performance in-memory sliding window rate limit fallback
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function cleanupMemoryBuckets() {
  const now = Date.now();
  for (const [k, v] of memoryBuckets.entries()) {
    if (now > v.resetAt) memoryBuckets.delete(k);
  }
}

if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(cleanupMemoryBuckets, 60 * 1000);
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

let loggedMissingUpstashError = false;

if (process.env.NODE_ENV === 'production' && !isRateLimitConfigured()) {
  console.error(
    '[RateLimit FATAL] Upstash Redis configuration (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) is missing in production! Distributed rate limiting is required.'
  );
  loggedMissingUpstashError = true;
}

function checkShortLivedFallback(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const bucket = memoryBuckets.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (bucket.count < maxRequests) {
    bucket.count++;
    return { allowed: true, remaining: maxRequests - bucket.count, resetTime: bucket.resetAt };
  }

  return { allowed: false, remaining: 0, resetTime: bucket.resetAt };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  reason?: 'UNCONFIGURED' | 'RATE_LIMITED' | 'UPSTASH_ERROR';
  error?: string;
}

export async function rateLimit(
  identifier: string,
  name: LimitName,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[name];
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isRateLimitConfigured()) {
    if (isProduction) {
      const missingMsg =
        'Upstash Redis rate limiter is not configured in production. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in environment variables.';
      if (!loggedMissingUpstashError) {
        console.error(`[RateLimit FATAL] ${missingMsg}`);
        loggedMissingUpstashError = true;
      }
      // Do not fall back to per-instance memory limits in production when unconfigured
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + config.windowMs,
        reason: 'UNCONFIGURED',
        error: missingMsg,
      };
    }

    // Development / test environment in-memory sliding window
    return checkShortLivedFallback(identifier, config.maxRequests, config.windowMs);
  }

  try {
    const limiter = getLimiter(name);
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  } catch (err) {
    console.error('[RateLimit] Upstash error:', err);
    // Strict fail-closed only for login
    if (name === 'login') {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + config.windowMs,
      };
    }
    // Short-lived safe fallback (15s window) for non-auth routes so users aren't locked out if Upstash is down
    const shortWindowMs = Math.min(config.windowMs, 15 * 1000);
    return checkShortLivedFallback(`fallback:${identifier}`, config.maxRequests, shortWindowMs);
  }
}
