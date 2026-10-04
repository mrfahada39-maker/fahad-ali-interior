import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { moveToRecycleBin } from '@/lib/recycle-bin';

interface SessionUser {
  id?: string;
  email?: string;
  role?: string;
}

function invalidateStorefrontCache() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/shop', 'layout');
  } catch {
    // ignore in environments without revalidation context
  }
}

const fallbackCategories = [
  { id: 'cat_living', name: 'Living Room', description: 'Solid Sheesham luxury sofas, chairs and cabinets', order: 1 },
  { id: 'cat_bedroom', name: 'Bedroom', description: 'Artisanal beds, wardrobes and side tables', order: 2 },
  { id: 'cat_dining', name: 'Dining Room', description: 'Handcrafted dining sets and buffets', order: 3 },
  { id: 'cat_coffee', name: 'Coffee Chairs', description: 'Premium accent and coffee chairs', order: 4 },
  { id: 'cat_fahad_ali', name: 'FAHAD ALI', description: 'ASSLAAM ALIKUM', order: 5 },
  { id: 'cat_center', name: 'Center tables', description: 'Luxury center and nesting tables', order: 6 },
  { id: 'cat_showcase', name: 'Luxury Showcase', description: 'Exquisite consoles and display units', order: 7 },
  { id: 'cat_wardrobe', name: 'Luxury Wardrobes', description: 'Custom solid wood wardrobes', order: 8 },
];

import { getVerifiedAdmin } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
    },
  });
}

// GET /api/admin/categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }).catch(() => []);

    if (categories.length === 0) {
      return NextResponse.json(fallbackCategories);
    }
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedAdmin(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await db.category.upsert({
      where: { name: body.name.trim() },
      create: {
        name: body.name.trim(),
        description: body.description || '',
        image: body.image || '',
        icon: body.icon || 'Sparkles',
        items: body.items || '',
        isPromo: Boolean(body.isPromo),
        order: Number(body.order) || 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      update: {
        description: body.description !== undefined ? body.description : undefined,
        image: body.image !== undefined ? body.image : undefined,
        icon: body.icon !== undefined ? body.icon : undefined,
        items: body.items !== undefined ? body.items : undefined,
        isPromo: body.isPromo !== undefined ? Boolean(body.isPromo) : undefined,
        order: body.order !== undefined ? Number(body.order) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        deletedAt: null,
      },
    });

    invalidateStorefrontCache();
    return NextResponse.json({ success: true, data: category, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

// PUT /api/admin/categories
export async function PUT(req: NextRequest) {
  try {
    const user = await getVerifiedAdmin(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const searchId = req.nextUrl.searchParams.get('id');
    const id = body.id || searchId;

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.items !== undefined) updateData.items = body.items;
    if (body.isPromo !== undefined) updateData.isPromo = Boolean(body.isPromo);
    if (body.order !== undefined) updateData.order = Number(body.order);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    let updated = null;
    if (id) {
      updated = await db.category.update({
        where: { id },
        data: updateData,
      });
    } else if (body.name) {
      updated = await db.category.update({
        where: { name: body.name.trim() },
        data: updateData,
      });
    } else {
      return NextResponse.json({ error: 'Category ID or name is required' }, { status: 400 });
    }

    invalidateStorefrontCache();
    return NextResponse.json({ success: true, data: updated, category: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export const PATCH = PUT;

// DELETE /api/admin/categories
export async function DELETE(req: NextRequest) {
  try {
    const user = await getVerifiedAdmin(req);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const searchId = req.nextUrl.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    const id = searchId || body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { id } });
    if (existing) {
      await moveToRecycleBin({
        entityType: 'CATEGORY',
        entityId: existing.id,
        name: existing.name,
        payload: existing,
        deletedBy: user?.email || user?.id || null,
      });

      await db.category.delete({ where: { id } }).catch(async () => {
        await db.category.update({
          where: { id },
          data: { deletedAt: new Date(), isActive: false },
        });
      });
    }

    invalidateStorefrontCache();
    return NextResponse.json({ success: true, deletedId: id, archivedToRecycleBin: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
