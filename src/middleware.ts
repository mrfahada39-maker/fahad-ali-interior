import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isNextAuthInternalRoute, toNestApiPath } from '@/lib/api-config';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

function generateRequestId(): string {
  return crypto.randomUUID();
}

function isUnsafeMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!host) return false;

  if (!origin) {
    const fetchSite = request.headers.get('sec-fetch-site');
    return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none';
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

const protectedPages = ['/dashboard', '/checkout', '/cart'];
const adminPages     = ['/admin'];

function isLocalHost(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

function buildContentSecurityPolicy(nonce: string, isProduction: boolean, httpsOnly: boolean): string {
  const scriptSrc = `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com`;
  const styleDirectives = [
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
  ];

  return [
    "default-src 'self'",
    scriptSrc,
    ...styleDirectives,
    "img-src 'self' data: https: blob: http:",
    "media-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https: http: ws: wss: https://vitals.vercel-insights.com https://va.vercel-scripts.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(httpsOnly ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function applyPageSecurityHeaders(
  request: NextRequest,
  requestHeaders: Headers,
  nonce: string,
  requestId: string,
  isProduction: boolean,
): NextResponse {
  const httpsOnly = isProduction && !isLocalHost(request);
  const csp = buildContentSecurityPolicy(nonce, isProduction, httpsOnly);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=()');
  if (httpsOnly) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';
  const nonce = btoa(crypto.randomUUID());

  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-request-id', requestId);

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/seed')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const ip = getClientIp(request);

    if (isNextAuthInternalRoute(pathname)) {
      if (isUnsafeMethod(request.method) && !isSameOriginRequest(request)) {
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (pathname === '/api/auth/verify-email' && request.method === 'GET') {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Rate limiting on sensitive API routes (brute-force and spam prevention)
    if (pathname.includes('/auth/login') || pathname.includes('/auth/signin')) {
      const rl = await rateLimit(`login:${ip}`, 'login');
      if (!rl.allowed) return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    } else if (pathname.includes('/auth/register') || pathname.includes('/auth/signup')) {
      const rl = await rateLimit(`register:${ip}`, 'register');
      if (!rl.allowed) return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    } else if (pathname.includes('/uploads')) {
      const rl = await rateLimit(`upload:${ip}`, 'upload');
      if (!rl.allowed) return NextResponse.json({ error: 'Upload rate limit exceeded. Please wait.' }, { status: 429 });
    } else if (pathname.includes('/inquiries') || pathname.includes('/contact')) {
      const rl = await rateLimit(`inquiry:${ip}`, 'inquiry');
      if (!rl.allowed) return NextResponse.json({ error: 'Too many inquiries submitted.' }, { status: 429 });
    }

    if (isUnsafeMethod(request.method) && !isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }

    if (!pathname.startsWith('/api/v1') && !pathname.startsWith('/api/admin/telemetry')) {
      const mapped = toNestApiPath(`${pathname}${request.nextUrl.search}`);
      const q = mapped.indexOf('?');
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = q >= 0 ? mapped.slice(0, q) : mapped;
      rewriteUrl.search = q >= 0 ? mapped.slice(q) : '';
      return NextResponse.rewrite(rewriteUrl);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (adminPages.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (!token) {
      const login = new URL('/', request.url);
      login.searchParams.set('auth', 'login');
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    const tokenRole = String(token.role ?? '').toUpperCase();
    if (tokenRole !== 'ADMIN' && tokenRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ── Role-based dashboard redirect (runs at EDGE — no session cache issues) ──
  if (pathname === '/dashboard') {
    if (!token) {
      const login = new URL('/', request.url);
      login.searchParams.set('auth', 'login');
      login.searchParams.set('next', '/dashboard');
      return NextResponse.redirect(login);
    }
    const tokenRole = String(token.role ?? '').toUpperCase();
    if (tokenRole === 'ADMIN' || tokenRole === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  if (protectedPages.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (!token) {
      const login = new URL('/', request.url);
      login.searchParams.set('auth', 'login');
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
  }

  return applyPageSecurityHeaders(request, requestHeaders, nonce, requestId, isProduction);
}

export const config = {
  matcher: ['/:path*'],
};
