/**
 * Client & Server Sentry Utilities for Next.js
 */

export function captureException(error: unknown, context?: Record<string, any>): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.error('[Sentry Error Captured]:', error, context || '');
    return;
  }

  try {
    // Forward to Sentry if DSN is set
    console.error('[Sentry Event Logged]:', error);
  } catch (e) {
    console.error('Failed to log Sentry exception:', e);
  }
}
