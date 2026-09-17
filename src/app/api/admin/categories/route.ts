import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

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
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
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
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
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
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Executive admin credentials required.' }, { status: 403 });
    }

    const searchId = req.nextUrl.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    const id = searchId || body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await db.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    }).catch(async () => {
      await db.category.delete({ where: { id } });
    });

    invalidateStorefrontCache();
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
