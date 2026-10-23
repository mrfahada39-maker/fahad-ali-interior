import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeApiErrorResponse } from '@/lib/api-error';
import { createReviewSchema, updateReviewStatusSchema } from '@/lib/validations/api-schemas';
import {
  ApiDispatchContext,
  DbReviewRecord,
  getUserFromSessionOrToken,
  requireAdmin,
  revalidateProductCaches,
} from './shared';

export async function handleReviewRoutes(ctx: ApiDispatchContext): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

  // 1.9 GET /products/:id/reviews
  if (method === 'GET' && segment.includes('products/') && segment.endsWith('/reviews')) {
    const parts = segment.split('/');
    const prodIdx = parts.indexOf('products');
    const prodId = parts[prodIdx + 1];
    const reviews = await db.review
      .findMany({
        where: { productId: prodId, deletedAt: null, status: 'APPROVED' },
        select: {
          id: true,
          rating: true,
          comment: true,
          customerName: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);
    return NextResponse.json({ success: true, reviews });
  }

  // 2.5 GET /reviews/my-reviews
  if (
    method === 'GET' &&
    (segment === 'reviews/my-reviews' || segment === 'v1/reviews/my-reviews')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json([]);
    const reviews = await db.review
      .findMany({
        where: { userId: user.id, deletedAt: null },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);
    return NextResponse.json(reviews);
  }

  // 3.1.1 Public GET /reviews (approved reviews for storefront)
  if (
    method === 'GET' &&
    (segment === 'public/reviews' ||
      segment === 'v1/public/reviews' ||
      segment === 'reviews' ||
      segment === 'v1/reviews')
  ) {
    const approvedReviewsList = (await db.review
      .findMany({
        where: { deletedAt: null, status: 'APPROVED' },
        include: {
          product: { select: { id: true, name: true, image: true, category: true } },
          user: { select: { id: true, name: true, avatar: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      .catch(() => [])) as DbReviewRecord[];

    const formattedReviews = (approvedReviewsList || []).map((r: DbReviewRecord) => ({
      id: r.id,
      customerName:
        r.customerName ||
        r.user?.name ||
        (r.user?.email ? r.user.email.split('@')[0] : 'Verified Patron'),
      rating: Number(r.rating) || 5,
      comment: r.comment || '',
      image: r.image || null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      product: {
        id: r.product?.id,
        name: r.product?.name || 'Handcrafted Solid Sheesham',
        image: r.image || r.product?.image || null,
      },
      user: {
        name: r.user?.name || r.customerName || 'Verified Patron',
        image: r.user?.avatar || null,
      },
    }));

    return NextResponse.json({ success: true, reviews: formattedReviews });
  }

  // 5. GET /admin/reviews
  if (
    method === 'GET' &&
    (normalizedSegment === 'admin/reviews' ||
      segment === 'admin/reviews' ||
      segment === 'v1/admin/reviews')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const reviews = await db.review
      .findMany({
        where: { deletedAt: null },
        include: {
          product: { select: { id: true, name: true, image: true, price: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => []);
    return NextResponse.json(reviews);
  }

  // 12. PUT & DELETE /admin/reviews
  if (
    method === 'PUT' &&
    (normalizedSegment === 'admin/reviews' ||
      segment === 'admin/reviews' ||
      segment === 'v1/admin/reviews')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!requireAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Executive admin credentials required.' },
        { status: 403 }
      );
    }
    const rawBody = await req.json().catch(() => ({}));
    const parsed = updateReviewStatusSchema.safeParse(rawBody);
    if (!parsed.success || !rawBody?.id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (rawBody.status) {
      const raw = String(rawBody.status).trim().toUpperCase();
      const validStatuses: Record<string, string> = {
        PENDING: 'PENDING',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
      };
      if (validStatuses[raw]) {
        updateData.status = validStatuses[raw];
      }
    }

    try {
      const updated = await db.review.update({
        where: { id: rawBody.id },
        data: updateData,
      });
      if (updated.productId) {
        revalidateProductCaches(updated.productId);
      }
      return NextResponse.json({ success: true, ...updated });
    } catch (err: unknown) {
      return safeApiErrorResponse(err, 'Failed to update review', 400, req);
    }
  }

  if (
    method === 'DELETE' &&
    (normalizedSegment === 'admin/reviews' ||
      segment === 'admin/reviews' ||
      segment === 'v1/admin/reviews')
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
    const id = body.id || searchId;

    if (!id) return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });

    const revToDelete = await db.review
      .findUnique({ where: { id }, select: { productId: true } })
      .catch(() => null);
    try {
      await db.review.delete({ where: { id } });
    } catch {
      await db.review
        .update({
          where: { id },
          data: { deletedAt: new Date() },
        })
        .catch(() => {});
    }

    if (revToDelete?.productId) {
      revalidateProductCaches(revToDelete.productId);
    }

    return NextResponse.json({ success: true, deletedId: id });
  }

  // 18. User Reviews Delete (DELETE /user/reviews, /reviews)
  if (
    method === 'DELETE' &&
    (segment.includes('user/reviews') ||
      segment.includes('v1/user/reviews') ||
      segment === 'reviews' ||
      segment === 'v1/reviews')
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const searchId = req.nextUrl.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    const parts = segment.split('/');
    const pathId = parts[parts.length - 1] !== 'reviews' ? parts[parts.length - 1] : undefined;
    const reviewId = body.id || searchId || pathId;

    if (!reviewId) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });

    const revToDelete = await db.review
      .findUnique({ where: { id: reviewId }, select: { productId: true } })
      .catch(() => null);
    try {
      await db.review.deleteMany({ where: { id: reviewId, userId: user.id } });
    } catch {
      await db.review
        .updateMany({
          where: { id: reviewId, userId: user.id },
          data: { deletedAt: new Date() },
        })
        .catch(() => {});
    }

    if (revToDelete?.productId) {
      revalidateProductCaches(revToDelete.productId);
    }

    return NextResponse.json({ success: true, deletedId: reviewId });
  }

  // 20. User Reviews Submission (POST /user/reviews, /reviews, /v1/reviews, /products/:id/reviews)
  if (
    method === 'POST' &&
    (segment.includes('user/reviews') ||
      segment.includes('v1/user/reviews') ||
      segment === 'reviews' ||
      segment === 'v1/reviews' ||
      (segment.includes('products/') && segment.endsWith('/reviews')))
  ) {
    const user = await getUserFromSessionOrToken(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rawBody = await req.json().catch(() => ({}));

    const parts = segment.split('/');
    const prodIdx = parts.indexOf('products');
    const routeProdId = prodIdx !== -1 ? parts[prodIdx + 1] : undefined;
    const targetProductId = rawBody.productId || routeProdId;

    const parsed = createReviewSchema.safeParse({ ...rawBody, productId: targetProductId });
    if (!targetProductId || !rawBody.rating || !parsed.success) {
      return NextResponse.json({ error: 'Product ID and rating are required' }, { status: 400 });
    }

    let customerName = rawBody.customerName;
    if (!customerName) {
      const dbUser = await db.user
        .findUnique({ where: { id: user.id }, select: { name: true, email: true } })
        .catch(() => null);
      customerName = dbUser?.name || user.email || 'Valued Client';
    }

    const newReview = await db.review.create({
      data: {
        userId: user.id as string,
        productId: targetProductId,
        rating: Number(rawBody.rating),
        comment: rawBody.comment || '',
        image: rawBody.image || null,
        status: 'PENDING',
        customerName,
      },
    });

    revalidateProductCaches(targetProductId);
    return NextResponse.json(newReview);
  }

  return null;
}
