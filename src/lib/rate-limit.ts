import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  newsletter: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  inquiry: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  coupon: { windowMs: 60 * 1000, maxRequests: 10 },
  admin: { windowMs: 60 * 1000, maxRequests: 100 },
  api: { windowMs: 60 * 1000, maxRequests: 120 },
  upload: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
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

setInterval(cleanupMemoryBuckets, 60 * 1000);

export async function rateLimit(
  identifier: string,
  name: LimitName,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const config = RATE_LIMITS[name];

  if (!isRateLimitConfigured()) {
    const now = Date.now();
    const bucket = memoryBuckets.get(identifier);

    if (!bucket || now > bucket.resetAt) {
      memoryBuckets.set(identifier, { count: 1, resetAt: now + config.windowMs });
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
    }

    if (bucket.count < config.maxRequests) {
      bucket.count++;
      return { allowed: true, remaining: config.maxRequests - bucket.count, resetTime: bucket.resetAt };
    }

    return { allowed: false, remaining: 0, resetTime: bucket.resetAt };
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
    // If Upstash is temporarily unavailable, fail open in dev, fail closed in prod
    console.error('[RateLimit] Upstash error:', err);
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      allowed: !isProduction,
      remaining: 0,
      resetTime: Date.now() + config.windowMs,
    };
  }
}
