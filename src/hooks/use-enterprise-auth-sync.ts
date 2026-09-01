'use client';

import {
  clearEnterpriseTokens,
  getEnterpriseAccessToken,
  setEnterpriseTokens,
} from '@/lib/api-client';

/** Sync JWT when user has NextAuth session but localStorage token is missing or stale. */
export async function ensureEnterpriseTokens(forceRefresh = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!forceRefresh && getEnterpriseAccessToken()) return true;

  if (forceRefresh) clearEnterpriseTokens();

  try {
    const res = await fetch('/api/enterprise/session', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      accessToken?: string;
      refreshToken?: string;
      error?: string;
    };
    if (!data.accessToken) return false;
    setEnterpriseTokens(data.accessToken, data.refreshToken || '');
    return true;
  } catch {
    return false;
  }
}

export function apiErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as { error?: string; message?: string | string[] };
  if (d.error) return d.error;
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (d.message) return String(d.message);
  return fallback;
}
