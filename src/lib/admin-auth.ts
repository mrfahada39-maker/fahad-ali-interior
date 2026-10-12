import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
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
 * Retrieve dedicated signing secret for admin tokens.
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

export function extractTokenSignature(rawToken: string): string | null {
  const clean = rawToken.replace(/^Bearer\s+/i, '').trim();
  if (!clean.startsWith('fai_token_')) return null;
  const body = clean.slice('fai_token_'.length);
  const lastUnderscore = body.lastIndexOf('_');
  if (lastUnderscore === -1) return null;
  const signature = body.slice(lastUnderscore + 1);
  return signature || null;
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
 * Revoke a signed admin token (synchronous L1 update + background Redis/DB persistence).
 */
export function revokeAdminToken(rawToken: string): boolean {
  const signature = extractTokenSignature(rawToken);
  if (!signature) return false;
  revokedAdminSignatures.add(signature);
  void persistRevokedSignature(signature);
  return true;
}

/**
 * Async revocation that awaits Upstash Redis (with TTL = token lifetime) and DB persistence.
 */
export async function revokeAdminTokenAsync(rawToken: string): Promise<boolean> {
  const signature = extractTokenSignature(rawToken);
  if (!signature) return false;
  revokedAdminSignatures.add(signature);
  await persistRevokedSignature(signature);
  return true;
}

export function isTokenRevoked(signature: string): boolean {
  return revokedAdminSignatures.has(signature);
}

/**
 * Check token revocation across L1 cache, Upstash Redis, and PostgreSQL AuditLog table.
 */
export async function isTokenRevokedAsync(signature: string): Promise<boolean> {
  if (revokedAdminSignatures.has(signature)) return true;

  const redis = getRevocationRedis();
  if (redis) {
    try {
      const val = await redis.get(`revoked_admin_sig:${signature}`);
      if (val) {
        revokedAdminSignatures.add(signature);
        return true;
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
  } catch {
    // Ignore DB lookup errors in unit tests with partial mocks
  }

  return false;
}

/**
 * Parse and cryptographically verify an HMAC-signed token of format:
 * `fai_token_<userId>_<timestamp>_<hmacHex>`
 * Rejects unsigned, forged, expired, or revoked tokens.
 */
export function verifySignedTokenUserId(
  rawToken: string,
  nowMs: number = Date.now()
): string | null {
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

  if (revokedAdminSignatures.has(signature)) {
    return null;
  }

  const issuedAt = Number(timestampStr);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return null;
  if (nowMs - issuedAt > ADMIN_TOKEN_MAX_AGE_MS || issuedAt > nowMs + 60_000) {
    return null;
  }

  const secret = getAdminTokenSecret();
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${timestampStr}`)
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

export async function getVerifiedAdmin(req: NextRequest) {
  let userId: string | undefined;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
  if (token?.id) {
    userId = token.id as string;
  }

  if (!userId) {
    const raw =
      req.headers.get('authorization') ||
      req.headers.get('x-enterprise-token') ||
      req.cookies.get('fai_admin_token')?.value;
    if (raw) {
      const signature = extractTokenSignature(raw);
      if (signature && (await isTokenRevokedAsync(signature))) {
        return null;
      }
      const verifiedId = verifySignedTokenUserId(raw);
      if (verifiedId) userId = verifiedId;
    }
  }

  if (!userId) return null;

  const user = await db.user
    .findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, deletedAt: true },
    })
    .catch(() => null);

  if (!user || user.deletedAt) return null;
  const role = String(user.role || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return null;

  return user;
}
