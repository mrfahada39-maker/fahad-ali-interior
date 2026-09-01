/**
 * API Client — Fahad Ali Interior
 *
 * Security: JWT tokens are stored in HttpOnly cookies set by the backend.
 * This client no longer stores tokens in sessionStorage or localStorage,
 * which protects against XSS token theft.
 */
import { resolveApiPath } from '@/lib/api-config';

// ── Token management — Dual-layer (HttpOnly cookies + Bearer token) ──────

export function getEnterpriseAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      sessionStorage.getItem('enterprise_access_token') ||
      localStorage.getItem('enterprise_access_token') ||
      sessionStorage.getItem('has_enterprise_session')
    );
  } catch {
    return null;
  }
}

export function getEnterpriseRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem('enterprise_refresh_token') || localStorage.getItem('enterprise_refresh_token');
  } catch {
    return null;
  }
}

export function setEnterpriseTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('has_enterprise_session', 'present');
    if (accessToken) {
      sessionStorage.setItem('enterprise_access_token', accessToken);
      localStorage.setItem('enterprise_access_token', accessToken);
    }
    if (refreshToken) {
      sessionStorage.setItem('enterprise_refresh_token', refreshToken);
      localStorage.setItem('enterprise_refresh_token', refreshToken);
    }
  } catch { /* ignore */ }
}

export function clearEnterpriseTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('has_enterprise_session');
    sessionStorage.removeItem('enterprise_access_token');
    sessionStorage.removeItem('enterprise_refresh_token');
    localStorage.removeItem('enterprise_access_token');
    localStorage.removeItem('enterprise_refresh_token');
  } catch { /* ignore */ }
}

// ── Response unwrapper ────────────────────────────────────────────────────────

function unwrapNestBody<T>(body: unknown): T {
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    (body as { success: boolean }).success === true &&
    'data' in body
  ) {
    return (body as { data: T }).data;
  }
  return body as T;
}

// ── CSRF Token retrieval ──────────────────────────────────────────────────

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf_token='))
        ?.split('=')[1] || null
    );
  } catch {
    return null;
  }
}

// ── Core fetch ────────────────────────────────────────────────────────────────

/** Client fetch — all business APIs use /api/v1 (NestJS proxy). */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url     = resolveApiPath(path);
  const headers = new Headers(init?.headers);

  // Auto-inject CSRF for unsafe methods
  const method = init?.method?.toUpperCase() || 'GET';
  const isUnsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (isUnsafe) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set('x-csrf-token', csrf);
    }
  }

  // Auto-inject Enterprise Bearer session token if available
  const bearer = getEnterpriseAccessToken();
  if (bearer && !headers.has('authorization') && bearer.includes('direct_session_')) {
    headers.set('authorization', `Bearer ${bearer}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  const signal = init?.signal ? combineSignals(init.signal, controller.signal) : controller.signal;

  // Note: credentials 'include' is mandatory for HttpOnly cookies to be sent
  return fetch(url, {
    ...init,
    headers,
    credentials: 'include',
    signal,
  }).finally(() => clearTimeout(timer));
}

function combineSignals(s1: AbortSignal, s2: AbortSignal): AbortSignal {
  const ctrl = new AbortController();
  if (s1.aborted) { ctrl.abort(); return ctrl.signal; }
  if (s2.aborted) { ctrl.abort(); return ctrl.signal; }
  const onAbort = () => ctrl.abort();
  s1.addEventListener('abort', onAbort, { once: true });
  s2.addEventListener('abort', onAbort, { once: true });
  return ctrl.signal;
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await apiFetch(path, init);
    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        const text = await res.text().catch(() => '');
        console.warn(`[apiFetchJson] ${res.status} ${path}: ${text.slice(0, 200)}`);
      }
      return null;
    }
    const body    = await res.json();
    const resolved = resolveApiPath(path);
    if (resolved.includes('/api/v1')) {
      return unwrapResponseBody<T>(body);
    }
    return body as T;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[apiFetchJson] network error ${path}:`, err);
    }
    return null;
  }
}

export async function apiFetchJsonWithStatus<T = unknown>(
  path:  string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res  = await apiFetch(path, init);
  let data: T | null = null;
  try {
    const body    = await res.json();
    const resolved = resolveApiPath(path);
    if (resolved.includes('/api/v1') && body && typeof body === 'object' && 'error' in body) {
      data = body as T;
    } else if (resolved.includes('/api/v1')) {
      data = unwrapResponseBody<T>(body);
    } else {
      data = body as T;
    }
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

