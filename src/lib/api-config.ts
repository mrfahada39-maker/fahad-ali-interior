/**
 * Pure Next.js 16 Serverless API routing configuration.
 */

const API_PREFIX = '/api/v1';

/** NextAuth routes (same origin cookies). */
const NEXTAUTH_ONLY_PREFIXES = [
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/error',
  '/api/auth/_log',
  '/api/auth/check-2fa',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/contact',
  '/api/user',
] as const;

/** Next.js internal API routes. */
const NEXTJS_ONLY_API_PREFIXES = ['/api/enterprise', '/api/auth/[...nextauth]'] as const;

export function isNextJsOnlyApiRoute(pathname: string): boolean {
  return NEXTJS_ONLY_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isNextAuthInternalRoute(pathname: string): boolean {
  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/[')) return true;
  if (isNextJsOnlyApiRoute(pathname)) return true;
  return NEXTAUTH_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isV1ApiRoute(path: string): boolean {
  const normalized = (path.split('?')[0] ?? path).replace(/\/$/, '');
  if (!normalized.startsWith('/api/')) return false;
  if (isNextAuthInternalRoute(normalized)) return false;
  return true;
}
export const isNestApiRoute = isV1ApiRoute;

/** Map /api/foo → /api/v1/foo for Next.js direct API routes. */
export function toV1ApiPath(path: string): string {
  const [pathname, query] = path.split('?');
  let mapped = (pathname ?? path).replace(/\/$/, '');

  if (mapped === '/api/register') {
    mapped = `${API_PREFIX}/auth/register`;
  } else if (mapped === '/api/health') {
    mapped = `${API_PREFIX}/health`;
  } else if (mapped.startsWith('/api/v1/') || mapped === '/api/v1') {
    // Already has /api/v1 prefix
  } else if (mapped.startsWith('/api/')) {
    mapped = `${API_PREFIX}${mapped.slice(4)}`;
  }

  return query ? `${mapped}?${query}` : mapped;
}
export const toNestApiPath = toV1ApiPath;

/** Always same-origin `/api/v1/*`. */
export function resolveApiPath(path: string): string {
  if (!isV1ApiRoute(path)) return path;
  return toV1ApiPath(path);
}
