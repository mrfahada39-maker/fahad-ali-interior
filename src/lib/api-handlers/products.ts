import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { safeApiErrorResponse } from '@/lib/api-error';
import { validateImageBuffer } from '@/lib/image-validator';
import { moveToRecycleBin } from '@/lib/recycle-bin';
import { createCategorySchema, createProductSchema, updateProductSchema } from '@/lib/validations/api-schemas';
import {
  ApiDispatchContext,
  DbProductRecord,
  DbReviewRecord,
  getUserFromSessionOrToken,
  requireAdmin,
  revalidateProductCaches,
} from './shared';

function parseSafePrice(val: unknown): number {
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Math.min(Math.max(Math.round(val * 100) / 100, 0), 9999999999999.99);
  }
  const cleanStr = String(val || '0').replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed) || !isFinite(parsed)) return 0;
  return Math.min(Math.max(Math.round(parsed * 100) / 100, 0), 9999999999999.99);
}

export async function handleProductRoutes(ctx: ApiDispatchContext): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

  // Uploads Image (Protected)
  if (
    method === 'POST' &&
    (normalizedSegment === 'uploads/image' ||
      normalizedSegment.startsWith('uploads/image/') ||
      segment.startsWith('uploads/image') ||
      segment.startsWith('v1/uploads/image'))
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to upload images.' }, { status: 401 });
    }

    const rawFolder = req.nextUrl.searchParams.get('folder') || 'fahad-ali-interior/products';
    const sanitizedFolder = rawFolder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/+/g, '/').slice(0, 80) || 'fahad-ali-interior/products';
    const isClientAllowedFolder =
      sanitizedFolder.endsWith('/receipts') ||
      sanitizedFolder.endsWith('/avatars') ||
      sanitizedFolder.endsWith('/reviews') ||
      sanitizedFolder === 'receipts' ||
      sanitizedFolder === 'avatars' ||
      sanitizedFolder === 'reviews';

    if (!requireAdmin(user) && !isClientAllowedFolder) {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required to upload catalog assets.' },
        { status: 403 }
      );
    }
    const folder = sanitizedFolder;
    const formData = await req.formData().catch(() => null);
    const file = (formData?.get('file') || formData?.get('image')) as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validation = validateImageBuffer(buffer, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const base64 = `data:${validation.mimeType};base64,${buffer.toString('base64')}`;

    const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.CLOUDINARY_API_KEY;
    const API_SECRET = process.env.CLOUDINARY_API_SECRET;

    if (CLOUD_NAME && API_KEY && API_SECRET) {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      const cFormData = new FormData();
      cFormData.append('file', base64);
      cFormData.append('api_key', API_KEY);
      cFormData.append('timestamp', String(timestamp));
      cFormData.append('folder', folder);
      cFormData.append('signature', signature);

      try {
        const cRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: cFormData,
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          const result = {
            url: cData.secure_url || cData.url,
            secureUrl: cData.secure_url || cData.url,
            publicId: cData.public_id,
            format: cData.format || 'jpg',
            resourceType: cData.resource_type || 'image',
            width: cData.width,
            height: cData.height,
            bytes: cData.bytes || buffer.length,
          };
          return NextResponse.json({
            success: true,
            data: result,
            url: result.secureUrl,
            secureUrl: result.secureUrl,
          });
        }
      } catch {}
    }

    const localResult = {
      url: base64,
      secureUrl: base64,
      publicId: `local_${Date.now()}`,
      format: validation.mimeType?.split('/')[1] || 'jpg',
      resourceType: 'image',
      bytes: buffer.length,
    };
    return NextResponse.json({
      success: true,
      data: localResult,
      url: localResult.secureUrl,
      secureUrl: localResult.secureUrl,
    });
  }

  if (
    method === 'POST' &&
    (segment.startsWith('uploads/multiple') || segment.startsWith('v1/uploads/multiple'))
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Sign in to upload images.' }, { status: 401 });
    }
    const formData = await req.formData().catch(() => null);
    const files = (formData?.getAll('files') || []) as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    const results = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const validation = validateImageBuffer(buffer, file.type);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const base64 = `data:${validation.mimeType};base64,${buffer.toString('base64')}`;
      results.push({
        url: base64,
        secureUrl: base64,
        publicId: `local_${Date.now()}`,
        format: validation.mimeType?.split('/')[1] || 'jpg',
        resourceType: 'image',
        bytes: buffer.length,
      });
    }
    return NextResponse.json({ success: true, data: results });
  }

  // 1. GET /products or /api/v1/products
  if (method === 'GET' && (segment === 'products' || segment === 'v1/products')) {
    const products = await db.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        image: true,
        images: true,
        dimensions: true,
        material: true,
        stockCount: true,
        isPremium: true,
        description: true,
        specs: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = (products as DbProductRecord[]).map((p: DbProductRecord) => {
      const cleanName = String(p.name || '').replace(/\bL-Shap\b(?!e)/gi, 'L-Shape').trim();
      const n = cleanName.toLowerCase();
      const defaultDims = n.includes('12-seater') || n.includes('u-shape')
        ? '11 ft × 9 ft × 34 in (Custom Sizing Available)'
        : n.includes('10-seater')
        ? '10.5 ft × 8.5 ft × 34 in (Custom Sizing Available)'
        : n.includes('l-shape') || n.includes('sectional')
        ? '9 ft × 7 ft × 34 in (Custom Sizing Available)'
        : n.includes('6-seater')
        ? '3-Seater (7.2 ft) + 2-Seater (5.2 ft) + 1-Seater (3.2 ft)'
        : '8.5 ft × 6.5 ft × 34 in (Custom Sizing Available)';
      return {
        ...p,
        name: cleanName,
        dimensions: p.dimensions && String(p.dimensions).trim() ? p.dimensions : defaultDims,
        price: Number(p.price),
      };
    });
    return NextResponse.json(
      { products: formatted },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  }

  // 2. GET /products/:id (excluding /reviews which is handled in reviews handler)
  if (method === 'GET' && segment.startsWith('products/') && !segment.endsWith('/reviews')) {
    const id = segment.split('/').pop();
    const product = (await db.product.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        image: true,
        images: true,
        dimensions: true,
        material: true,
        stockCount: true,
        isPremium: true,
        description: true,
        specs: true,
        createdAt: true,
        reviews: {
          where: { deletedAt: null, status: 'APPROVED' },
          select: {
            id: true,
            rating: true,
            comment: true,
            customerName: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })) as DbProductRecord | null;
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const approvedReviews: DbReviewRecord[] = product.reviews || [];
    const reviewCount = approvedReviews.length;
    const avgRating =
      reviewCount > 0
        ? Number(
            (
              approvedReviews.reduce(
                (sum: number, r: DbReviewRecord) => sum + (Number(r.rating) || 5),
                0
              ) / reviewCount
            ).toFixed(1)
          )
        : 5.0;
    const cleanName = String(product.name || '').replace(/\bL-Shap\b(?!e)/gi, 'L-Shape').trim();

    return NextResponse.json(
      {
        product: {
          ...product,
          name: cleanName,
          price: Number(product.price),
          reviewCount,
          avgRating,
          reviews: approvedReviews,
        },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
    );
  }

  // 4. Categories CRUD (GET, POST, PUT, PATCH, DELETE, OPTIONS)
  if (segment.includes('categories')) {
    if (method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        },
      });
    }

    if (method === 'GET') {
      const [categories, products] = await Promise.all([
        db.category
          .findMany({
            where: { deletedAt: null },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          })
          .catch(() => []),
        db.product
          .findMany({
            where: { deletedAt: null },
            select: { id: true, category: true, categoryId: true },
          })
          .catch(() => []),
      ]);

      interface CategoryItem {
        id: string;
        name: string;
        [key: string]: unknown;
      }
      interface ProductRelItem {
        id: string;
        category?: string | null;
        categoryId?: string | null;
      }
      const listWithCounts = (categories as CategoryItem[]).map((cat) => {
        const count = (products as ProductRelItem[]).filter(
          (p) =>
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
    }

    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }

    if (method === 'POST') {
      const rawBody = await req.json().catch(() => ({}));
      const parsed = createCategorySchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
      }
      const body = rawBody;
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

      await db.product.updateMany({
        where: { category: trimmedName, categoryId: null },
        data: { categoryId: category.id },
      }).catch(() => {});

      try {
        revalidatePath('/', 'layout');
      } catch {}

      return NextResponse.json({ success: true, data: category, category });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json().catch(() => ({}));
      const searchId = req.nextUrl.searchParams.get('id');
      const id = body.id || searchId;

      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = String(body.name).trim();
      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      if (body.image !== undefined) updateData.image = body.image?.trim() || null;
      if (body.icon !== undefined) updateData.icon = body.icon?.trim() || null;
      if (body.items !== undefined) updateData.items = body.items?.trim() || null;
      if (body.isPromo !== undefined) updateData.isPromo = Boolean(body.isPromo);
      if (body.order !== undefined) updateData.order = Number(body.order);
      if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

      let updated: unknown = null;
      if (id) {
        updated = await db.category.update({
          where: { id },
          data: updateData,
        });

        if (updateData.name) {
          await db.product.updateMany({
            where: { categoryId: id },
            data: { category: String(updateData.name) },
          }).catch(() => {});
        }
      } else if (body.name) {
        updated = await db.category.update({
          where: { name: String(body.name).trim() },
          data: updateData,
        });
      } else {
        return NextResponse.json({ error: 'Category ID or name is required' }, { status: 400 });
      }

      try {
        revalidatePath('/', 'layout');
      } catch {}

      return NextResponse.json({ success: true, data: updated, category: updated });
    }

    if (method === 'DELETE') {
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

      await moveToRecycleBin({
        entityType: 'CATEGORY',
        entityId: existing.id,
        name: existing.name,
        payload: existing,
        deletedBy: user?.email || user?.id || null,
      }).catch(() => {});

      await db.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      }).catch(() => {});

      await db.category.delete({ where: { id } }).catch(async () => {
        await db.category.update({
          where: { id },
          data: { deletedAt: new Date(), isActive: false },
        });
      });

      try {
        revalidatePath('/', 'layout');
      } catch {}

      return NextResponse.json({ success: true, deletedId: id, message: 'Category deleted successfully' });
    }
  }

  // 8. Blog Posts CRUD
  if (segment.includes('blog')) {
    if (method === 'GET') {
      const blogs = await db.blogPost
        .findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } })
        .catch(() => []);
      return NextResponse.json(blogs);
    }

    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden. Admin credentials required.' }, { status: 403 });
    }

    if (method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const blog = await db.blogPost.create({
        data: {
          title: body.title,
          slug: body.slug || String(body.title || '').toLowerCase().replace(/\s+/g, '-'),
          content: body.content || '',
          excerpt: body.excerpt || '',
          image: body.image || null,
          author: body.author || 'Admin',
          tags:
            typeof body.tags === 'string'
              ? body.tags.split(',').map((t: string) => t.trim())
              : body.tags || [],
          isActive: body.isActive !== false,
        },
      });
      return NextResponse.json(blog);
    }

    if (method === 'PATCH' || method === 'PUT') {
      const parts = segment.split('/');
      const lastPart = parts[parts.length - 1];
      const body = await req.json().catch(() => ({}));
      const id = body.id || (lastPart !== 'blog' ? lastPart : undefined);

      if (!id) return NextResponse.json({ error: 'Blog post ID is required' }, { status: 400 });

      const updated = await db.blogPost.update({
        where: { id },
        data: {
          title: body.title,
          slug: body.slug,
          content: body.content,
          excerpt: body.excerpt,
          image: body.image,
          author: body.author,
          tags:
            typeof body.tags === 'string'
              ? body.tags.split(',').map((t: string) => t.trim())
              : body.tags,
          isActive: body.isActive,
        },
      });
      return NextResponse.json(updated);
    }

    if (method === 'DELETE') {
      const parts = segment.split('/');
      const lastPart = parts[parts.length - 1];
      const searchId = req.nextUrl.searchParams.get('id');
      const body = await req.json().catch(() => ({}));
      const id = body.id || searchId || (lastPart !== 'blog' ? lastPart : undefined);

      if (!id) return NextResponse.json({ error: 'Blog post ID is required' }, { status: 400 });

      try {
        await db.blogPost.delete({ where: { id } });
      } catch {
        await db.blogPost.updateMany({
          where: { id },
          data: { deletedAt: new Date(), isActive: false },
        });
      }

      return NextResponse.json({ success: true, deletedId: id });
    }
  }

  // 9. POST / PUT / PATCH / DELETE /admin/products
  if (
    method === 'POST' &&
    (normalizedSegment === 'admin/products' ||
      segment === 'admin/products' ||
      segment === 'v1/admin/products')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const rawBody = await req.json().catch(() => ({}));
    const parsed = createProductSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const safePrice = parseSafePrice(rawBody.price);
    const specsStr =
      typeof rawBody.specs === 'object' && rawBody.specs !== null
        ? JSON.stringify(rawBody.specs)
        : rawBody.specs || null;

    const matchingCategory = rawBody.category
      ? await db.category.findFirst({
          where: { name: { equals: String(rawBody.category).trim(), mode: 'insensitive' } },
        })
      : null;

    const product = await db.product.create({
      data: {
        name: rawBody.name.trim(),
        description: rawBody.description || '',
        price: safePrice,
        category: rawBody.category ? String(rawBody.category).trim() : 'Living Room',
        categoryId: matchingCategory?.id || null,
        image: rawBody.image ? String(rawBody.image).trim() : '',
        images: Array.isArray(rawBody.images) ? rawBody.images : [],
        material: rawBody.material || null,
        dimensions: rawBody.dimensions || null,
        stockCount: Math.max(0, Number(rawBody.stockCount) || 0),
        isPremium: Boolean(rawBody.isPremium),
        specs: specsStr,
      },
    });
    revalidateProductCaches(product.id);
    return NextResponse.json({
      ...product,
      price: Number(product.price),
    });
  }

  if (
    (method === 'PUT' || method === 'PATCH') &&
    (normalizedSegment === 'admin/products' ||
      segment === 'admin/products' ||
      segment === 'v1/admin/products')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateProductSchema.safeParse(rawBody);
    const { id, ...rest } = rawBody;
    if (!id || !parsed.success) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (rest.name !== undefined) updateData.name = String(rest.name).trim();
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.price !== undefined) {
      updateData.price = parseSafePrice(rest.price);
    }
    if (rest.category !== undefined) {
      updateData.category = String(rest.category).trim();
      const matchingCat = await db.category.findFirst({
        where: { name: { equals: String(rest.category).trim(), mode: 'insensitive' } },
      });
      updateData.categoryId = matchingCat?.id || null;
    }
    if (rest.image !== undefined) updateData.image = String(rest.image).trim();
    if (rest.images !== undefined) updateData.images = Array.isArray(rest.images) ? rest.images : [];
    if (rest.material !== undefined) updateData.material = rest.material;
    if (rest.dimensions !== undefined) updateData.dimensions = rest.dimensions;
    if (rest.stockCount !== undefined) updateData.stockCount = Math.max(0, Number(rest.stockCount) || 0);
    if (rest.isPremium !== undefined) updateData.isPremium = Boolean(rest.isPremium);
    if (rest.specs !== undefined) {
      updateData.specs =
        typeof rest.specs === 'object' && rest.specs !== null
          ? JSON.stringify(rest.specs)
          : rest.specs || null;
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    });
    revalidateProductCaches(product.id);
    return NextResponse.json({
      ...product,
      price: Number(product.price),
    });
  }

  // 10. DELETE /admin/products
  if (
    method === 'DELETE' &&
    (normalizedSegment === 'admin/products' ||
      /^admin\/products\/[^/]+$/.test(normalizedSegment) ||
      segment === 'admin/products' ||
      segment === 'v1/admin/products')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }

    const searchId = req.nextUrl.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    const parts = segment.split('/');
    const lastPart = parts[parts.length - 1];
    const id = searchId || body?.id || (lastPart !== 'products' ? lastPart : undefined);

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const existingProduct = await db.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    try {
      await moveToRecycleBin({
        entityType: 'PRODUCT',
        entityId: existingProduct.id,
        name: existingProduct.name,
        payload: existingProduct,
        deletedBy: user?.email || user?.id || null,
      });
    } catch {
      // Non-blocking recycle bin snapshot
    }

    try {
      await db.$transaction([
        db.wishlistItem.deleteMany({ where: { productId: id } }),
        db.review.deleteMany({ where: { productId: id } }),
        db.orderItem.deleteMany({ where: { productId: id } }),
        db.product.delete({ where: { id } }),
      ]);
    } catch {
      try {
        await db.wishlistItem.deleteMany({ where: { productId: id } }).catch(() => {});
        await db.review.deleteMany({ where: { productId: id } }).catch(() => {});
        await db.orderItem.deleteMany({ where: { productId: id } }).catch(() => {});
        await db.product.delete({ where: { id } });
      } catch (err: unknown) {
        return safeApiErrorResponse(err, 'Failed to permanently delete product from database', 500, req);
      }
    }

    revalidateProductCaches(id);
    return NextResponse.json({ success: true, deletedId: id, permanentlyDeleted: true });
  }

  return null;
}
