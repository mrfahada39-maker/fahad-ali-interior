import crypto from 'crypto';

export const AI_SESSION_COOKIE_NAME = 'fai_ai_session';

let ephemeralDevAiSecret: string | null = null;

/**
 * Retrieve dedicated secret for AI session binding.
 * In production, AI_SESSION_SECRET is required and must be separate from NEXTAUTH_SECRET.
 */
export function getAiSessionSecret(): string {
  const aiSecret = process.env.AI_SESSION_SECRET?.trim();
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!aiSecret || aiSecret.length < 16) {
      throw new Error(
        'CRITICAL: AI_SESSION_SECRET environment variable (min 16 chars) is required in production.'
      );
    }
    if (nextAuthSecret && aiSecret === nextAuthSecret) {
      throw new Error(
        'CRITICAL: AI_SESSION_SECRET must be separate from NEXTAUTH_SECRET in production.'
      );
    }
    return aiSecret;
  }

  if (aiSecret && aiSecret.length >= 16) {
    return aiSecret;
  }
  if (!ephemeralDevAiSecret) {
    ephemeralDevAiSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralDevAiSecret;
}

// Validate at startup in production runtime (excluding static build phase when SKIP_ENV_VALIDATION is set)
if (
  process.env.NODE_ENV === 'production' &&
  process.env.SKIP_ENV_VALIDATION !== 'true' &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  getAiSessionSecret();
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
