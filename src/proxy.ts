import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isNextAuthInternalRoute, toV1ApiPath } from '@/lib/api-config';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { SecurityGuardrails } from '@/lib/guardrails';

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
    if (!fetchSite) {
      const cookieHeader = request.headers.get('cookie') ?? '';
      const hasCookieAuth =
        cookieHeader.includes('next-auth.session-token') ||
        cookieHeader.includes('__Secure-next-auth.session-token') ||
        cookieHeader.includes('fai_admin_token');
      if (hasCookieAuth) {
        return false;
      }
      return true;
    }
    return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none';
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

const protectedPages = ['/dashboard'];
const adminPages     = ['/admin'];

function isLocalHost(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

function resolveAllowedWebsocketHosts(request: NextRequest, isProduction: boolean): string {
  const hosts = new Set<string>();
  const requestHost = request.headers.get('host');
  if (requestHost) {
    hosts.add(`wss://${requestHost}`);
    if (!isProduction && (requestHost.startsWith('localhost') || requestHost.startsWith('127.0.0.1'))) {
      hosts.add(`ws://${requestHost}`);
    }
  }
  const backendEnv = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.ENTERPRISE_API_ORIGIN;
  if (backendEnv) {
    try {
      const parsed = new URL(backendEnv);
      hosts.add(`wss://${parsed.host}`);
    } catch {
      // Ignore malformed env URL
    }
  }
  if (hosts.size === 0) {
    hosts.add('wss://fahad-ali-interior.vercel.app');
  }
  return Array.from(hosts).join(' ');
}

function buildContentSecurityPolicy(
  request: NextRequest,
  nonce: string,
  isProduction: boolean,
  httpsOnly: boolean
): string {
  const isTest = process.env.NODE_ENV === 'test';
  const scriptSrc = isTest
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com https://vitals.vercel-insights.com`
    : isProduction
      ? `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com`
      : `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com`;

  const styleDirectives = [
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
  ];
  const wsHosts = resolveAllowedWebsocketHosts(request, isProduction);

  return [
    "default-src 'self'",
    scriptSrc,
    ...styleDirectives,
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://plus.unsplash.com https://va.vercel-scripts.com",
    "media-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "manifest-src 'self' data: blob:",
    `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://res.cloudinary.com https://images.unsplash.com https://plus.unsplash.com ${wsHosts}`,
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
  const csp = buildContentSecurityPolicy(request, nonce, isProduction, httpsOnly);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), display-capture=(), midi=(), sync-xhr=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Download-Options', 'noopen');
  if (httpsOnly) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';
  const nonce = btoa(crypto.randomUUID());

  // ── 1. Enterprise Anti-Probing & Malicious Scanner Firewall ──
  const userAgent = request.headers.get('user-agent') || '';
  const probeCheck = SecurityGuardrails.detectProbingOrScanner(pathname, userAgent);
  if (probeCheck.isBlocked) {
    return NextResponse.json({ error: 'Access Denied: Reconnaissance scan intercepted' }, { status: 404 });
  }

  // ── 2. Enterprise WAF: Deep Query Parameter & Search Payload Inspection ──
  if (request.nextUrl.search) {
    const payloadCheck = SecurityGuardrails.detectMaliciousPayload(request.nextUrl.search);
    if (payloadCheck.isMalicious) {
      return NextResponse.json(
        { error: 'Forbidden: Malicious pattern intercepted by security firewall', code: payloadCheck.reason },
        { status: 403 }
      );
    }
  }

  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-request-id', requestId);

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/seed')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // ── 3. High-Security DoS & Payload Memory Exhaustion Guard ──
    const contentLength = request.headers.get('content-length');
    if (contentLength && isUnsafeMethod(request.method)) {
      const bytes = parseInt(contentLength, 10);
      const maxAllowedBytes = pathname.includes('/uploads') ? 15 * 1024 * 1024 : 1024 * 1024; // 15MB for uploads, 1MB for all other JSON APIs
      if (!isNaN(bytes) && bytes > maxAllowedBytes) {
        return NextResponse.json(
          { error: 'Payload Too Large: Request body exceeds maximum allowed size', code: 'PAYLOAD_TOO_LARGE' },
          { status: 413 }
        );
      }
    }

    // ── 4. Anti-HTTP Parameter Pollution (HPP) Defense ──
    const sensitiveParams = ['role', 'admin', 'price', 'discount', 'userId', 'token'];
    for (const param of sensitiveParams) {
      if (request.nextUrl.searchParams.getAll(param).length > 1) {
        return NextResponse.json(
          { error: `Forbidden: Duplicate parameter '${param}' detected (HPP attack)`, code: 'PARAMETER_POLLUTION_BLOCKED' },
          { status: 400 }
        );
      }
    }

    const ip = getClientIp(request);

    if (isNextAuthInternalRoute(pathname)) {
      if (pathname.includes('/auth/callback/credentials')) {
        const rl = await rateLimit(`login:${ip}`, 'login');
        if (!rl.allowed) {
          return NextResponse.json(
            { error: rl.error || 'Too many login attempts. Please try again later.' },
            { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
          );
        }
      }
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
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many login attempts. Please try again later.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/auth/register') || pathname.includes('/auth/signup')) {
      const rl = await rateLimit(`register:${ip}`, 'register');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many registration attempts. Please try again later.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/uploads')) {
      const rl = await rateLimit(`upload:${ip}`, 'upload');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Upload rate limit exceeded. Please wait.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/inquiries') || pathname.includes('/contact')) {
      const rl = await rateLimit(`inquiry:${ip}`, 'inquiry');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many inquiries submitted.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/coupons')) {
      const rl = await rateLimit(`coupon:${ip}`, 'coupon');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many coupon attempts. Please wait a moment.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/orders/track')) {
      const rl = await rateLimit(`track:${ip}`, 'coupon');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many order tracking requests. Please wait a moment.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/reviews') && isUnsafeMethod(request.method)) {
      const rl = await rateLimit(`review:${ip}`, 'inquiry');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many review submissions. Please wait.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/orders') && isUnsafeMethod(request.method)) {
      const rl = await rateLimit(`order_create:${ip}`, 'api');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many order requests. Please wait a moment.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/ai/chat')) {
      const rl = await rateLimit(`ai_chat:${ip}`, 'api');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'AI concierge rate limit exceeded. Please wait a moment.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    } else if (pathname.includes('/calls/signal')) {
      const rl = await rateLimit(`signal:${ip}`, 'api');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Signaling rate limit exceeded.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    }

    const isWebhookOrPublicAction =
      pathname.startsWith('/api/whatsapp') ||
      pathname.startsWith('/api/orders/action') ||
      pathname.startsWith('/api/cron');

    if (isUnsafeMethod(request.method) && !isSameOriginRequest(request) && !isWebhookOrPublicAction) {
      return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }

    if (
      !pathname.startsWith('/api/v1') &&
      !pathname.startsWith('/api/admin') &&
      !isWebhookOrPublicAction
    ) {
      const mapped = toV1ApiPath(`${pathname}${request.nextUrl.search}`);
      const q = mapped.indexOf('?');
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = q >= 0 ? mapped.slice(0, q) : mapped;
      rewriteUrl.search = q >= 0 ? mapped.slice(q) : '';
      return NextResponse.rewrite(rewriteUrl);
    }

    const apiRes = NextResponse.next({ request: { headers: requestHeaders } });
    if (
      pathname.startsWith('/api/admin') ||
      pathname.startsWith('/api/user') ||
      pathname.startsWith('/api/v1/admin')
    ) {
      apiRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      apiRes.headers.set('Pragma', 'no-cache');
      apiRes.headers.set('Expires', '0');
    }
    return apiRes;
  }

  const isAdminPath = pathname !== '/admin/login' && adminPages.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isDashboardPath = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const isProtectedPath = protectedPages.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isAdminPath || isDashboardPath || isProtectedPath) {
    const token =
      (await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: false,
      })) ||
      (await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: true,
      }));

    if (isAdminPath) {
      if (!token) {
        const login = new URL('/admin/login', request.url);
        login.searchParams.set('next', pathname);
        return NextResponse.redirect(login);
      }
      const tokenRole = String(token.role ?? '').toUpperCase();
      if (tokenRole !== 'ADMIN' && tokenRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // ── Role-based dashboard redirect (runs at Proxy layer — no session cache issues) ──
    if (isDashboardPath) {
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

    if (isProtectedPath) {
      if (!token) {
        const login = new URL('/', request.url);
        login.searchParams.set('auth', 'login');
        login.searchParams.set('next', pathname);
        return NextResponse.redirect(login);
      }
    }
  }

  return applyPageSecurityHeaders(request, requestHeaders, nonce, requestId, isProduction);
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|offline.html|sw-push.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|mp4|webm)).*)',
  ],
};
