import crypto from 'crypto';

export const AI_SESSION_COOKIE_NAME = 'fai_ai_session';

let ephemeralDevAiSecret: string | null = null;

/**
 * Retrieve dedicated secret for AI session binding.
 * Uses AI_SESSION_SECRET when configured, or derives a cryptographically domain-separated
 * HMAC-SHA256 secret from NEXTAUTH_SECRET / DATABASE_URL.
 */
export function getAiSessionSecret(): string {
  const aiSecret = process.env.AI_SESSION_SECRET?.trim();
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();

  if (aiSecret && aiSecret.length >= 16) {
    if (process.env.NODE_ENV === 'production' && nextAuthSecret && aiSecret === nextAuthSecret) {
      throw new Error(
        'CRITICAL: AI_SESSION_SECRET must be separate from NEXTAUTH_SECRET in production.'
      );
    }
    return aiSecret;
  }

  const baseSeed = nextAuthSecret || process.env.DATABASE_URL?.trim();
  if (baseSeed && baseSeed.length >= 16) {
    return crypto
      .createHmac('sha256', baseSeed)
      .update('fai:ai-session-binding-secret:v1')
      .digest('hex');
  }

  if (!ephemeralDevAiSecret) {
    ephemeralDevAiSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralDevAiSecret;
}

/**
 * Signs an AI chat sessionId using HMAC-SHA256 so anonymous users cannot
 * enumerate or hijack other users' chat sessions.
 * Format: `<sessionId>.<hmacHex>`
 */
export function signAiSessionId(sessionId: string): string {
  const sig = crypto
    .createHmac('sha256', getAiSessionSecret())
    .update(sessionId)
    .digest('hex');
  return `${sessionId}.${sig}`;
}

/**
 * Verifies a signed AI session cookie and returns the sessionId if valid, or null.
 */
export function verifyAiSessionCookie(cookieValue: string | undefined | null): string | null {
  if (!cookieValue) return null;
  const lastDot = cookieValue.lastIndexOf('.');
  if (lastDot === -1) return null;

  const sessionId = cookieValue.slice(0, lastDot);
  const sig = cookieValue.slice(lastDot + 1);
  if (!sessionId || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getAiSessionSecret())
    .update(sessionId)
    .digest('hex');

  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    return sessionId;
  } catch {
    return null;
  }
}
