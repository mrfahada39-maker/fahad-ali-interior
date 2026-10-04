import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';

/**
 * Shared, cryptographically verified admin authentication.
 *
 * Replaces the weak `cookie.includes('fai_token_')` checks, which accepted ANY
 * forged cookie value. A request is only treated as admin when:
 *   - it carries an HMAC-signed `fai_token_<userId>_<timestamp>_<sig>` token
 *     (Authorization header, x-enterprise-token header, or fai_admin_token
 *     cookie) that is unexpired and matches NEXTAUTH_SECRET, AND the user
 *     still exists, is not soft-deleted, and has an ADMIN/SUPER_ADMIN role; OR
 *   - it carries a valid NextAuth JWT whose role is ADMIN/SUPER_ADMIN.
 */

export interface VerifiedAdmin {
  id: string;
  email?: string;
  role: string;
}

/** Admin tokens are issued with a 24h cookie lifetime; enforce the same on verify. */
export const ADMIN_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const TOKEN_PATTERN = /fai_token_([^_]+)_([^_]+)_([a-f0-9]+)/;

export function isAdminRole(role: unknown): boolean {
  const r = String(role ?? '').toUpperCase();
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}

/** Verifies the HMAC signature + expiry of a raw token string. Returns the user id or null. */
export function verifySignedTokenUserId(raw: string | null | undefined, now = Date.now()): string | null {
  if (!raw || !raw.includes('fai_token_')) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) return null;

  const match = raw.match(TOKEN_PATTERN);
  if (!match) return null;

  const [, userId, timestampStr, signature] = match;
  const timestamp = parseInt(timestampStr, 10);
  if (Number.isNaN(timestamp)) return null;

  const age = now - timestamp;
  if (age < 0 || age >= ADMIN_TOKEN_MAX_AGE_MS) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(`${userId}:${timestamp}`).digest('hex');

  const provided = Buffer.from(signature, 'hex');
  const expected = Buffer.from(expectedSig, 'hex');
  // timingSafeEqual throws on length mismatch, so guard first.
  if (provided.length !== expected.length) return null;

  try {
    return crypto.timingSafeEqual(provided, expected) ? userId : null;
  } catch {
    return null;
  }
}

/** Returns the verified admin behind this request, or null if the request is not an authenticated admin. */
export async function getVerifiedAdmin(req: NextRequest): Promise<VerifiedAdmin | null> {
  // 1. HMAC-signed admin token (header or cookie)
  const raw =
    req.headers.get('authorization') ||
    req.headers.get('x-enterprise-token') ||
    req.cookies.get('fai_admin_token')?.value;

  const userId = verifySignedTokenUserId(raw);
  if (userId) {
    try {
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, deletedAt: true },
      });
      if (dbUser && !dbUser.deletedAt && isAdminRole(dbUser.role)) {
        return { id: dbUser.id, email: dbUser.email ?? undefined, role: String(dbUser.role).toUpperCase() };
      }
    } catch {
      // fall through to NextAuth check
    }
  }

  // 2. NextAuth session JWT
  try {
    const isHttps = req.url.startsWith('https://') || process.env.NODE_ENV === 'production';
    const token =
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps })) ||
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }));
    if (token && isAdminRole(token.role)) {
      return {
        id: String(token.id ?? ''),
        email: typeof token.email === 'string' ? token.email : undefined,
        role: String(token.role).toUpperCase(),
      };
    }
  } catch {
    // not authenticated
  }

  return null;
}
