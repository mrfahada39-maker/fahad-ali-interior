import crypto from 'crypto';

/**
 * AI Chat Session Cryptographic Binding
 *
 * Ensures:
 * 1. AI chat session IDs are generated server-side with crypto.randomUUID().
 * 2. Session IDs are cryptographically signed and stored in httpOnly cookies.
 * 3. History and chat access requires proof of session ownership (cookie signature or user ID).
 */

export const AI_SESSION_COOKIE_NAME = 'fai_ai_session';

function getSessionSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.ADMIN_TOKEN_SECRET || 'fai_ai_chat_session_secret_fallback_32_chars';
}

/** Signs a sessionId with HMAC-SHA256. */
export function signAiSessionId(sessionId: string): string {
  const secret = getSessionSecret();
  const signature = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
  return `${sessionId}.${signature}`;
}

/** Verifies an AI session cookie value and extracts the validated sessionId. */
export function verifyAiSessionCookie(cookieValue: string | null | undefined): string | null {
  if (!cookieValue || !cookieValue.includes('.')) return null;

  const dotIdx = cookieValue.indexOf('.');
  const sessionId = cookieValue.slice(0, dotIdx);
  const signature = cookieValue.slice(dotIdx + 1);

  if (!sessionId || !signature) return null;

  const secret = getSessionSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');

  const providedBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  if (providedBuf.length !== expectedBuf.length) return null;

  try {
    return crypto.timingSafeEqual(providedBuf, expectedBuf) ? sessionId : null;
  } catch {
    return null;
  }
}
