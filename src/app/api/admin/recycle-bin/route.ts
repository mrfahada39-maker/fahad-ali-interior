import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import {
  listRecycleBinItems,
  restoreFromRecycleBin,
  permanentlyDeleteFromRecycleBin,
  emptyRecycleBin,
  RecycleBinEntityType,
} from '@/lib/recycle-bin';

interface SessionUser {
  id?: string;
  email?: string;
  role?: string;
}

async function getUserFromSessionOrToken(req: NextRequest): Promise<SessionUser | null> {
  const adminCookie = req.cookies.get('fai_admin_token')?.value;
  const authHeader = req.headers.get('authorization') || req.headers.get('x-enterprise-token') || adminCookie;
  if (authHeader && authHeader.includes('fai_token_')) {
    const match = authHeader.match(/fai_token_([^_]+)_([^_]+)_([a-f0-9]+)/);
    if (match) {
      const [, userId, timestampStr, signature] = match;
      const timestamp = parseInt(timestampStr, 10);
      const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
      if (!isNaN(timestamp) && (Date.now() - timestamp) < maxAgeMs) {
        const secret = process.env.NEXTAUTH_SECRET;
        if (secret && secret.length >= 32) {
          const expectedSig = crypto.createHmac('sha256', secret).update(userId + ':' + timestamp).digest('hex');
          try {
            if (crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
              const dbUser = await db.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true },
              });
              if (dbUser) {
                return {
                  id: dbUser.id,
                  email: dbUser.email,
                  role: String(dbUser.role).toUpperCase(),
                };
              }
            }
          } catch {}
        }
      }
    }
  }

  try {
    const isHttps = req.url.startsWith('https://') || process.env.NODE_ENV === 'production';
    const token =
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps })) ||
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }));
    if (token) {
      return {
        id: token.id as string,
        email: token.email as string,
        role: String(token.role ?? '').toUpperCase(),
      };
    }
  } catch {}

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        id: (session.user as any).id,
        email: session.user.email || undefined,
        role: String((session.user as any).role ?? '').toUpperCase(),
      };
    }
  } catch {}

  return null;
}

function requireAdmin(user: SessionUser | null): boolean {
  if (!user?.role) return false;
  const r = user.role.toUpperCase();
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-enterprise-token',
    },
  });
}

// GET /api/admin/recycle-bin - List items with section breakdowns
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType') as (RecycleBinEntityType | 'ALL') || 'ALL';
    const search = searchParams.get('search') || undefined;
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '50', 10);

    const result = await listRecycleBinItems({
      entityType,
      search,
      skip,
      take,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list recycle bin items' }, { status: 500 });
  }
}

// POST /api/admin/recycle-bin - Restore item from recycle bin
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, id } = body;

    if (action === 'restore' || (!action && id)) {
      if (!id) {
        return NextResponse.json({ error: 'Recycle bin item ID is required to restore' }, { status: 400 });
      }

      const result = await restoreFromRecycleBin(id, user?.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action. Supported: restore' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to restore item' }, { status: 500 });
  }
}

// DELETE /api/admin/recycle-bin - Permanently purge item or empty section
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const id = searchParams.get('id') || body?.id;
    const action = searchParams.get('action') || body?.action;
    const entityType = (searchParams.get('entityType') || body?.entityType) as RecycleBinEntityType | undefined;
    const all = searchParams.get('all') === 'true' || body?.all === true;

    // Purge single item
    if (id && action !== 'empty') {
      const result = await permanentlyDeleteFromRecycleBin(id, user?.id);
      return NextResponse.json(result);
    }

    // Empty entire recycle bin or a single section
    if (all || action === 'empty' || entityType) {
      const result = await emptyRecycleBin(entityType, user?.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Provide item id or specify empty/all action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete from recycle bin' }, { status: 500 });
  }
}
