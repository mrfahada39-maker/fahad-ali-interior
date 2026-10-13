import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { safeApiErrorResponse } from '@/lib/api-error';
import {
  ApiDispatchContext,
  getUserFromSessionOrToken,
  requireAdmin,
} from '@/lib/api-handlers/shared';
import { handleAuthRoutes } from '@/lib/api-handlers/auth';
import { handleProductRoutes } from '@/lib/api-handlers/products';
import { handleOrderRoutes } from '@/lib/api-handlers/orders';
import { handleReviewRoutes } from '@/lib/api-handlers/reviews';
import { handleCustomerRoutes } from '@/lib/api-handlers/customers';
import { handleMessageRoutes } from '@/lib/api-handlers/messages';
import { handleSettingsAndBundleRoutes } from '@/lib/api-handlers/settings';

type RouteContext = { params: Promise<{ path: string[] }> };

const RESOURCE_HANDLERS = [
  handleSettingsAndBundleRoutes,
  handleAuthRoutes,
  handleReviewRoutes,
  handleProductRoutes,
  handleOrderRoutes,
  handleCustomerRoutes,
  handleMessageRoutes,
];

/**
 * Primary API v1 dispatcher routing requests to modular resource handlers.
 */
async function handleApiV1Request(
  method: string,
  segment: string,
  req: NextRequest
): Promise<NextResponse> {
  try {
    const normalizedSegment = segment.replace(/^v1\//, '').replace(/^\/+|\/+$/g, '');
    const pathParts = normalizedSegment.split('/');
    const ip = getClientIp(req);

    // Rate limiting for sensitive endpoints
    if (
      method === 'POST' &&
      (normalizedSegment === 'orders' || segment === 'orders' || segment === 'v1/orders')
    ) {
      const rl = await rateLimit(`orders:${ip}`, 'api');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many requests. Please wait and try again.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    }

    if (
      method === 'POST' &&
      (normalizedSegment === 'contact' ||
        normalizedSegment === 'inquiries' ||
        segment === 'contact' ||
        segment === 'v1/contact' ||
        segment === 'inquiries' ||
        segment === 'v1/inquiries')
    ) {
      const rl = await rateLimit(`contact:${ip}`, 'inquiry');
      if (!rl.allowed) {
        return NextResponse.json(
          { error: rl.error || 'Too many requests. Please wait a minute and try again.' },
          { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
        );
      }
    }

    // Executive RBAC guard on all /admin/* paths (except public GET category reads)
    const hasAdminInPath =
      pathParts.includes('admin') ||
      normalizedSegment.startsWith('admin') ||
      segment.includes('admin');
    const isPublicCategory =
      method === 'GET' &&
      (normalizedSegment === 'categories' || normalizedSegment === 'admin/categories');

    if (hasAdminInPath && !isPublicCategory) {
      const user = await getUserFromSessionOrToken(req);
      if (!requireAdmin(user)) {
        return NextResponse.json(
          { error: 'Forbidden. Executive admin credentials required.' },
          { status: 403 }
        );
      }
    }

    const ctx: ApiDispatchContext = {
      method,
      segment,
      normalizedSegment,
      pathParts,
      req,
      ip,
    };

    for (const handler of RESOURCE_HANDLERS) {
      const response = await handler(ctx);
      if (response) {
        return response;
      }
    }

    return NextResponse.json({ error: 'API v1 route handler not found' }, { status: 501 });
  } catch (error: unknown) {
    return safeApiErrorResponse(error, 'An unexpected server error occurred', 500, req);
  }
}

async function handleRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  const segment = path.join('/');
  return await handleApiV1Request(request.method, segment, request);
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
