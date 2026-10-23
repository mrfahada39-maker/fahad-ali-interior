/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
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
  } catch {
    // ignore in environments without revalidation context
  }
}

// Showroom Taxonomy & Master Collections API (Standardized categories: Living Room, Bedroom, Dining Room, Center Tables & Coffee Tables, etc.)

import { getVerifiedAdmin } from '@/lib/admin-auth';
import { safeApiErrorResponse } from '@/lib/api-error';

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

// GET /api/admin/categories - Returns real database categories with dynamically calculated live product counts
export async function GET(req: NextRequest) {
  try {
    const [categories, products] = await Promise.all([
      db.category.findMany({
        where: { deletedAt: null },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }).catch(() => []),
      db.product.findMany({
        where: { deletedAt: null },
        select: { id: true, category: true, categoryId: true },
      }).catch(() => []),
    ]);

    // Attach dynamic real-time product count matching categoryId or category name
    const listWithCounts = (categories as any[]).map((cat: any) => {
      const count = (products as any[]).filter(
        (p: any) =>
          p.categoryId === cat.id ||
          (p.category && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase())
      ).length;

      return {
        ...cat,
        _count: {
          products: count,
        },
      };
    });

    return NextResponse.json(listWithCounts);
  } catch (error: any) {
    return safeApiErrorResponse(error, 'Failed to fetch categories', 500, req);
  }
}

// POST /api/admin/categories - Creates or updates category in real database
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

    const trimmedName = body.name.trim();

    const category = await db.category.upsert({
      where: { name: trimmedName },
      create: {
        name: trimmedName,
        description: body.description?.trim() || null,
        image: body.image?.trim() || null,
        icon: body.icon?.trim() || null,
        items: body.items?.trim() || null,
        isPromo: Boolean(body.isPromo),
        order: Number(body.order) || 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      update: {
        description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
        image: body.image !== undefined ? (body.image?.trim() || null) : undefined,
        icon: body.icon !== undefined ? (body.icon?.trim() || null) : undefined,
        items: body.items !== undefined ? (body.items?.trim() || null) : undefined,
        isPromo: body.isPromo !== undefined ? Boolean(body.isPromo) : undefined,
        order: body.order !== undefined ? Number(body.order) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        deletedAt: null,
      },
    });

    // Automatically associate unlinked products matching this category name
    await db.product.updateMany({
      where: { category: trimmedName, categoryId: null },
      data: { categoryId: category.id },
    }).catch(() => {});

    invalidateStorefrontCache();
    return NextResponse.json({ success: true, data: category, category });
  } catch (error: any) {
    return safeApiErrorResponse(error, 'Failed to create category', 500, req);
  }
}

// PUT /api/admin/categories - Updates category and reorders accurately
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
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.image !== undefined) updateData.image = body.image?.trim() || null;
    if (body.icon !== undefined) updateData.icon = body.icon?.trim() || null;
    if (body.items !== undefined) updateData.items = body.items?.trim() || null;
    if (body.isPromo !== undefined) updateData.isPromo = Boolean(body.isPromo);
    if (body.order !== undefined) updateData.order = Number(body.order);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    let updated = null;
    if (id) {
      updated = await db.category.update({
        where: { id },
        data: updateData,
      });

      // If category name was renamed, sync products referencing this category
      if (updateData.name) {
        await db.product.updateMany({
          where: { categoryId: id },
          data: { category: updateData.name },
        }).catch(() => {});
      }
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
    return safeApiErrorResponse(error, 'Failed to update category', 500, req);
  }
}

export const PATCH = PUT;

// DELETE /api/admin/categories - Deletes category from database with unlinked foreign key handling
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
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // 1. Move snapshot to recycle bin for administrative audit trail
    await moveToRecycleBin({
      entityType: 'CATEGORY',
      entityId: existing.id,
      name: existing.name,
      payload: existing,
      deletedBy: user?.email || user?.id || null,
    }).catch(() => {});

    // 2. Dissociate foreign key references on products so foreign key constraints never block deletion
    await db.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    }).catch(() => {});

    // 3. Delete category from database
    await db.category.delete({ where: { id } }).catch(async () => {
      // Soft-delete fallback if hard deletion fails
      await db.category.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });
    });

    invalidateStorefrontCache();
    return NextResponse.json({ success: true, deletedId: id, message: 'Category deleted successfully' });
  } catch (error: any) {
    return safeApiErrorResponse(error, 'Failed to delete category', 500, req);
  }
}
