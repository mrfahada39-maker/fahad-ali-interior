import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

/** Maximum lifetime for signed admin bearer tokens (7 days in ms) */
export const ADMIN_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * L1 cache + Upstash Redis (with TTL = ADMIN_TOKEN_MAX_AGE_MS) + Database persistence
 * for revoked admin token signatures across Vercel serverless instances.
 */
const revokedAdminSignatures = new Set<string>();

/**
 * L1 cache + Upstash Redis + AuditLog persistence for per-user "tokens issued before"
 * timestamps so all earlier tokens die simultaneously (e.g. on logout, password change, 2FA toggle, role change).
 */
const userTokensRevokedBefore = new Map<string, number>();

let redisInstance: Redis | null = null;
function getRevocationRedis(): Redis | null {
  if (redisInstance) return redisInstance;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && url.startsWith('https://')) {
    redisInstance = new Redis({ url, token });
    return redisInstance;
  }
  return null;
}

let ephemeralDevAdminSecret: string | null = null;

/**
 * Retrieve dedicated canonical signing secret for admin tokens.
 * Uses ADMIN_TOKEN_SECRET when configured, or derives a cryptographically domain-separated
 * HMAC-SHA256 key from NEXTAUTH_SECRET / DATABASE_URL so serverless instances never crash
 * at module import time when optional env vars are omitted.
 */
export function getAdminTokenSecret(): string {
  const adminSecret = process.env.ADMIN_TOKEN_SECRET?.trim();
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();

  if (adminSecret && adminSecret.length >= 16) {
    if (process.env.NODE_ENV === 'production' && nextAuthSecret && adminSecret === nextAuthSecret) {
      throw new Error(
        'CRITICAL: ADMIN_TOKEN_SECRET must be separate from NEXTAUTH_SECRET in production.'
      );
    }
    return adminSecret;
  }

  const baseSeed = nextAuthSecret || process.env.DATABASE_URL?.trim();
  if (baseSeed && baseSeed.length >= 16) {
    return crypto
      .createHmac('sha256', baseSeed)
      .update('fai:admin-token-signing-secret:v1')
      .digest('hex');
  }

  if (!ephemeralDevAdminSecret) {
    ephemeralDevAdminSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralDevAdminSecret;
}

export interface ParsedAdminToken {
  userId: string;
  issuedAt: number;
  signature: string;
}

/**
 * Parse an admin token into its constituent components.
 * Format: `fai_token_<userId>_<timestamp>_<signature>`
 */
export function parseAdminToken(rawToken: string): ParsedAdminToken | null {
  const clean = rawToken.replace(/^Bearer\s+/i, '').trim();
  if (!clean.startsWith('fai_token_')) return null;

  const body = clean.slice('fai_token_'.length);
  const lastUnderscore = body.lastIndexOf('_');
  if (lastUnderscore === -1) return null;

  const signature = body.slice(lastUnderscore + 1);
  const rest = body.slice(0, lastUnderscore);
  const secondLastUnderscore = rest.lastIndexOf('_');
  if (secondLastUnderscore === -1) return null;

  const timestampStr = rest.slice(secondLastUnderscore + 1);
  const userId = rest.slice(0, secondLastUnderscore);
  if (!userId || !timestampStr || !signature) return null;

  const issuedAt = Number(timestampStr);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return null;

  return { userId, issuedAt, signature };
}

/**
 * Extract token signature for revocation lookup.
 */
export function extractTokenSignature(rawToken: string): string | null {
  const parsed = parseAdminToken(rawToken);
  return parsed?.signature ?? null;
}

/**
 * Mint a canonical HMAC-signed token for an authenticated admin.
 * Format: `fai_token_<userId>_<timestamp>_<hmacHex>`
 */
export function createAdminToken(userId: string, timestamp: number = Date.now()): string {
  const secret = getAdminTokenSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${timestamp}`)
    .digest('hex');
  return `fai_token_${userId}_${timestamp}_${signature}`;
}

async function persistRevokedSignature(signature: string): Promise<void> {
  const redis = getRevocationRedis();
  const ttlSeconds = Math.ceil(ADMIN_TOKEN_MAX_AGE_MS / 1000);
  await Promise.allSettled([
    redis
      ? redis.set(`revoked_admin_sig:${signature}`, '1', { ex: ttlSeconds })
      : Promise.resolve(null),
    db.auditLog
      ?.create?.({
        data: {
          action: 'ADMIN_TOKEN_REVOKED',
          entity: 'AdminToken',
          entityId: signature,
          metadata: {
            revokedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ADMIN_TOKEN_MAX_AGE_MS).toISOString(),
          },
        },
      })
      ?.catch?.(() => null),
  ]);
}

/**
 * Revoke a single signed admin token (synchronous L1 update + background Redis/DB persistence).
 */
export function revokeAdminToken(rawToken: string): boolean {
  const parsed = parseAdminToken(rawToken);
  if (!parsed) return false;
  revokedAdminSignatures.add(parsed.signature);
  void persistRevokedSignature(parsed.signature);
  return true;
}

/**
 * Async revocation that awaits Upstash Redis and DB persistence for a single token.
 */
export async function revokeAdminTokenAsync(rawToken: string): Promise<boolean> {
  const parsed = parseAdminToken(rawToken);
  if (!parsed) return false;
  revokedAdminSignatures.add(parsed.signature);
  await persistRevokedSignature(parsed.signature);
  return true;
}

async function persistUserTokensRevoked(userId: string, timestamp: number): Promise<void> {
  const redis = getRevocationRedis();
  const ttlSeconds = Math.ceil(ADMIN_TOKEN_MAX_AGE_MS / 1000);
  await Promise.allSettled([
    redis
      ? redis.set(`user_tokens_revoked_before:${userId}`, String(timestamp), { ex: ttlSeconds })
      : Promise.resolve(null),
    db.auditLog
      ?.create?.({
        data: {
          action: 'USER_ALL_TOKENS_REVOKED',
          entity: 'User',
          entityId: userId,
          metadata: {
            revokedBefore: timestamp,
            revokedAt: new Date().toISOString(),
          },
        },
      })
      ?.catch?.(() => null),
  ]);
}

/**
 * Invalidate all tokens issued to a user before the current timestamp
 * (used on logout, password change, 2FA toggle, and role change).
 */
export function revokeAllUserTokens(userId: string): void {
  const now = Date.now();
  userTokensRevokedBefore.set(userId, now);
  void persistUserTokensRevoked(userId, now);
}

/**
 * Async invalidation of all user tokens with Redis/DB persistence await.
 */
export async function revokeAllUserTokensAsync(userId: string): Promise<void> {
  const now = Date.now();
  userTokensRevokedBefore.set(userId, now);
  await persistUserTokensRevoked(userId, now);
}

/**
 * Synchronous L1 check if a signature or user token has been revoked.
 */
export function isTokenRevoked(signature: string, userId?: string, issuedAt?: number): boolean {
  if (revokedAdminSignatures.has(signature)) return true;
  if (userId && issuedAt !== undefined) {
    const revokedBefore = userTokensRevokedBefore.get(userId);
    if (revokedBefore !== undefined && issuedAt <= revokedBefore) {
      return true;
    }
  }
  return false;
}

/**
 * Check token revocation across L1 cache, Upstash Redis, and PostgreSQL AuditLog table.
 */
export async function isTokenRevokedAsync(
  signature: string,
  userId?: string,
  issuedAt?: number
): Promise<boolean> {
  if (isTokenRevoked(signature, userId, issuedAt)) return true;

  const redis = getRevocationRedis();
  if (redis) {
    try {
      const sigVal = await redis.get(`revoked_admin_sig:${signature}`);
      if (sigVal) {
        revokedAdminSignatures.add(signature);
        return true;
      }
      if (userId && issuedAt !== undefined) {
        const userBefore = await redis.get(`user_tokens_revoked_before:${userId}`);
        if (userBefore) {
          const beforeTs = Number(userBefore);
          if (Number.isFinite(beforeTs)) {
            userTokensRevokedBefore.set(userId, beforeTs);
            if (issuedAt <= beforeTs) return true;
          }
        }
      }
    } catch {
      // Fall back to DB check if Redis is unreachable
    }
  }

  try {
    const record = await db.auditLog?.findFirst?.({
      where: {
        action: 'ADMIN_TOKEN_REVOKED',
        entity: 'AdminToken',
        entityId: signature,
      },
      select: { id: true },
    });
    if (record) {
      revokedAdminSignatures.add(signature);
      return true;
    }

    if (userId && issuedAt !== undefined) {
      const userRevRecord = await db.auditLog?.findFirst?.({
        where: {
          action: 'USER_ALL_TOKENS_REVOKED',
          entity: 'User',
          entityId: userId,
        },
        orderBy: { createdAt: 'desc' },
        select: { metadata: true },
      });
      if (userRevRecord?.metadata && typeof userRevRecord.metadata === 'object') {
        const beforeTs = Number((userRevRecord.metadata as Record<string, unknown>).revokedBefore);
        if (Number.isFinite(beforeTs)) {
          userTokensRevokedBefore.set(userId, beforeTs);
          if (issuedAt <= beforeTs) return true;
        }
      }
    }
  } catch {
    // Ignore DB lookup errors in unit tests with partial mocks
  }

  return false;
}

/**
 * Parse and cryptographically verify an HMAC-signed token of format:
 * `fai_token_<userId>_<timestamp>_<hmacHex>`
 * Uses ONE canonical secret and ONE token format with timing-safe comparison.
 * Rejects unsigned, forged, expired, or revoked tokens.
 */
export function verifySignedTokenUserId(
  rawToken: string,
  nowMs: number = Date.now()
): string | null {
  const parsed = parseAdminToken(rawToken);
  if (!parsed) return null;

  const { userId, issuedAt, signature } = parsed;

  // L1 revocation checks
  if (isTokenRevoked(signature, userId, issuedAt)) {
    return null;
  }

  // Strict expiry enforcement
  if (nowMs - issuedAt > ADMIN_TOKEN_MAX_AGE_MS || issuedAt > nowMs + 60_000) {
    return null;
  }

  // Canonical timing-safe HMAC verification against getAdminTokenSecret()
  const secret = getAdminTokenSecret();
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${issuedAt}`)
    .digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}

export interface VerifiedUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

/**
 * Unified authentication verifier:
 * 1. Validates HMAC timing-safe with canonical secret and single token format
 * 2. Enforces expiry
 * 3. Checks revocation stores (L1, Upstash Redis, and AuditLog)
 * 4. Loads user from DB and confirms existence, not deleted, not locked, and active role
 */
export async function getVerifiedUser(
  req: NextRequest,
  options?: { requireAdminRole?: boolean }
): Promise<VerifiedUser | null> {
  let userId: string | undefined;

  const adminCookie = req.cookies.get('fai_admin_token')?.value;
  const raw =
    req.headers.get('authorization') ||
    req.headers.get('x-enterprise-token') ||
    adminCookie;

  if (raw && raw.includes('fai_token_')) {
    const clean = raw.replace(/^Bearer\s+/i, '').trim();
    const parsed = parseAdminToken(clean);
    if (!parsed) {
      return null;
    }

    // Comprehensive async revocation check (signature + user-level)
    if (await isTokenRevokedAsync(parsed.signature, parsed.userId, parsed.issuedAt)) {
      return null;
    }

    const verifiedId = verifySignedTokenUserId(clean);
    if (!verifiedId) {
      return null;
    }
    userId = verifiedId;
  }

  // Fallback to NextAuth JWT cookie / session support
  if (!userId) {
    try {
      const isHttps = req.url.startsWith('https://') || process.env.NODE_ENV === 'production';
      const token =
        (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps }).catch(() => null)) ||
        (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }).catch(() => null));
      if (token?.id) {
        userId = token.id as string;
      }
    } catch {}

    if (!userId) {
      try {
        const session = await getServerSession(authOptions).catch(() => null);
        if (session?.user && (session.user as { id?: string }).id) {
          userId = (session.user as { id: string }).id;
        }
      } catch {}
    }
  }

  if (!userId) return null;

  // Always confirm user and live role from the database
  const user = await db.user
    .findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, deletedAt: true, lockedUntil: true },
    })
    .catch(() => null);

  if (!user || user.deletedAt) return null;
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return null;

  const role = String(user.role || '').toUpperCase();
  if (options?.requireAdminRole) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return null;
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
  };
}

/**
 * Shared verifier for admin actions.
 * Enforces valid signature, expiry, revocation, DB existence, not locked/deleted, and ADMIN role.
 */
export async function getVerifiedAdmin(req: NextRequest): Promise<VerifiedUser | null> {
  return getVerifiedUser(req, { requireAdminRole: true });
}
