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

import { getVerifiedAdmin } from '@/lib/admin-auth';

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
    const user = await getVerifiedAdmin(req);
    if (!user) {
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
    const user = await getVerifiedAdmin(req);
    if (!user) {
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
    const user = await getVerifiedAdmin(req);
    if (!user) {
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
