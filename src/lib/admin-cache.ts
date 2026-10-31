/**
 * Utilities for secure, privacy-preserving administrative client caching.
 * Enforces zero-PII caching in browser localStorage and ensures full cache invalidation on logout.
 */

export const ADMIN_CACHE_KEY = 'fahad_admin_live_bundle';

export interface NonPersonalAdminBundle {
  stats?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  siteSettings?: Record<string, unknown>;
}

/**
 * Strips all Personally Identifiable Information (PII) including customer orders,
 * user accounts, chat message threads, and inquiries before saving to localStorage.
 * Only non-personal aggregate telemetry, charts, and public site configuration are retained.
 */
export function sanitizeBundleForCache(
  bundle: Record<string, unknown> | null | undefined
): NonPersonalAdminBundle {
  if (!bundle) return {};

  return {
    ...(bundle.stats && typeof bundle.stats === 'object'
      ? { stats: bundle.stats as Record<string, unknown> }
      : {}),
    ...(bundle.analytics && typeof bundle.analytics === 'object'
      ? { analytics: bundle.analytics as Record<string, unknown> }
      : {}),
    ...(bundle.siteSettings && typeof bundle.siteSettings === 'object'
      ? { siteSettings: bundle.siteSettings as Record<string, unknown> }
      : {}),
  };
}

/**
 * Saves only sanitized, non-personal data to localStorage.
 * Guaranteed never to write customer names, emails, phone numbers, or addresses to disk.
 */
export function saveSanitizedAdminBundle(
  bundle: Record<string, unknown> | null | undefined
): void {
  if (typeof window === 'undefined' || !bundle) return;
  try {
    const sanitized = sanitizeBundleForCache(bundle);
    window.localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(sanitized));
  } catch {
    // Gracefully ignore QuotaExceededError or private browsing restrictions
  }
}

/**
 * Completely purges administrative cache from localStorage on sign-out / logout.
 */
export function clearAdminCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ADMIN_CACHE_KEY);
  } catch {
    // Gracefully ignore security errors
  }
}

