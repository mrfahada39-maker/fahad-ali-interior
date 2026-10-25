/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeCouponCode } from '@/lib/coupons';
import { logger } from '@/lib/logger';
import {
  ApiDispatchContext,
  getUserFromSessionOrToken,
  requireAdmin,
} from './shared';

export async function handleCouponRoutes(ctx: ApiDispatchContext): Promise<NextResponse | null> {
  const { method, segment, normalizedSegment, req } = ctx;

  const isCouponRoute =
    normalizedSegment === 'admin/coupons' ||
    normalizedSegment === 'coupons' ||
    segment === 'admin/coupons' ||
    segment === 'coupons' ||
    segment === 'v1/admin/coupons' ||
    segment === 'v1/coupons' ||
    normalizedSegment.startsWith('admin/coupons/') ||
    normalizedSegment.startsWith('coupons/');

  if (!isCouponRoute) {
    return null;
  }

  // Admin access guard
  const user = await getUserFromSessionOrToken(req);
  if (!user || !requireAdmin(user)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden. Executive admin credentials required.' },
      { status: 403 }
    );
  }

  // ── GET: Fetch all coupons & promotional metrics ──
  if (method === 'GET') {
    try {
      const [coupons, ordersWithCoupons] = await Promise.all([
        db.coupon.findMany({
          where: { deletedAt: null },
          orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        }).catch(() => []),
        db.order.findMany({
          where: {
            deletedAt: null,
            couponCode: { not: null },
          },
          select: {
            couponCode: true,
            discount: true,
            totalAmount: true,
          },
        }).catch(() => []),
      ]);

      const now = new Date();
      const formattedCoupons = (coupons as any[]).map((c: any) => {
        const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;
        const isMaxedOut = c.maxUses > 0 ? c.usedCount >= c.maxUses : false;
        return {
          id: c.id,
          code: c.code,
          discount: Number(c.discount || 0),
          discountType: c.discountType,
          minOrderAmount: Number(c.minOrderAmount || 0),
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
          isActive: Boolean(c.isActive),
          isExpired,
          isMaxedOut,
          createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
        };
      });

      const totalCoupons = formattedCoupons.length;
      const activeCoupons = formattedCoupons.filter((c: any) => c.isActive && !c.isExpired && !c.isMaxedOut).length;
      const totalRedemptions = formattedCoupons.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0);
      const totalSavingsGranted = (ordersWithCoupons as any[]).reduce(
        (sum: number, o: any) => sum + Number(o.discount || 0),
        0
      );

      return NextResponse.json({
        success: true,
        coupons: formattedCoupons,
        stats: {
          totalCoupons,
          activeCoupons,
          totalRedemptions,
          totalSavingsGranted: Math.round(totalSavingsGranted),
        },
      });
    } catch (error: any) {
      logger.error('Failed to load admin coupons in v1 handler', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch coupons' }, { status: 500 });
    }
  }

  // ── POST: Create new promotional discount coupon ──
  if (method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const rawCode = normalizeCouponCode(body?.code);

      if (!rawCode || rawCode.length < 3) {
        return NextResponse.json(
          { success: false, error: 'Coupon code must be at least 3 characters long.' },
          { status: 400 }
        );
      }

      const existing = await db.coupon.findFirst({
        where: { code: rawCode, deletedAt: null },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Coupon code "${rawCode}" already exists. Please choose a different code.` },
          { status: 409 }
        );
      }

      const discountNum = Number(body?.discount);
      if (isNaN(discountNum) || discountNum <= 0) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid positive discount amount.' },
          { status: 400 }
        );
      }

      const discountType = body?.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
      if (discountType === 'PERCENTAGE' && (discountNum < 1 || discountNum > 100)) {
        return NextResponse.json(
          { success: false, error: 'Percentage discount must be between 1% and 100%.' },
          { status: 400 }
        );
      }

      const minOrderAmount = Math.max(0, Number(body?.minOrderAmount || 0));
      const maxUses = Math.max(0, parseInt(body?.maxUses || '0', 10));
      const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;
      const isActive = body?.isActive !== false;

      const newCoupon = await db.coupon.create({
        data: {
          code: rawCode,
          discount: discountNum,
          discountType,
          minOrderAmount,
          maxUses,
          usedCount: 0,
          expiresAt,
          isActive,
          createdBy: user.email || user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Coupon "${newCoupon.code}" created successfully!`,
        coupon: {
          ...newCoupon,
          discount: Number(newCoupon.discount),
          minOrderAmount: Number(newCoupon.minOrderAmount),
        },
      });
    } catch (error: any) {
      logger.error('Failed to create coupon in v1 handler', error);
      return NextResponse.json({ success: false, error: error.message || 'Failed to create coupon' }, { status: 500 });
    }
  }

  // ── PUT: Update existing discount coupon ──
  if (method === 'PUT') {
    try {
      const body = await req.json().catch(() => ({}));
      const id = body?.id;

      if (!id) {
        return NextResponse.json({ success: false, error: 'Coupon ID is required for update' }, { status: 400 });
      }

      const existing = await db.coupon.findUnique({
        where: { id },
      });
      if (!existing || existing.deletedAt) {
        return NextResponse.json({ success: false, error: 'Coupon not found or already deleted' }, { status: 404 });
      }

      const rawCode = body?.code ? normalizeCouponCode(body.code) : existing.code;
      if (rawCode !== existing.code) {
        const duplicate = await db.coupon.findFirst({
          where: { code: rawCode, deletedAt: null, id: { not: id } },
        });
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: `Coupon code "${rawCode}" is already in use by another coupon.` },
            { status: 409 }
          );
        }
      }

      const discountNum = body?.discount !== undefined ? Number(body.discount) : Number(existing.discount);
      const discountType =
        body?.discountType === 'FIXED'
          ? 'FIXED'
          : body?.discountType === 'PERCENTAGE'
          ? 'PERCENTAGE'
          : existing.discountType;

      if (discountType === 'PERCENTAGE' && (discountNum < 1 || discountNum > 100)) {
        return NextResponse.json(
          { success: false, error: 'Percentage discount must be between 1% and 100%.' },
          { status: 400 }
        );
      }

      const minOrderAmount =
        body?.minOrderAmount !== undefined ? Math.max(0, Number(body.minOrderAmount)) : Number(existing.minOrderAmount);
      const maxUses =
        body?.maxUses !== undefined ? Math.max(0, parseInt(body.maxUses, 10)) : existing.maxUses;
      const expiresAt =
        body?.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : existing.expiresAt;
      const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : existing.isActive;

      const updated = await db.coupon.update({
        where: { id },
        data: {
          code: rawCode,
          discount: discountNum,
          discountType,
          minOrderAmount,
          maxUses,
          expiresAt,
          isActive,
          updatedBy: user.email || user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Coupon "${updated.code}" updated successfully!`,
        coupon: {
          ...updated,
          discount: Number(updated.discount),
          minOrderAmount: Number(updated.minOrderAmount),
        },
      });
    } catch (error: any) {
      logger.error('Failed to update coupon in v1 handler', error);
      return NextResponse.json({ success: false, error: error.message || 'Failed to update coupon' }, { status: 500 });
    }
  }

  // ── DELETE: Soft-delete discount coupon ──
  if (method === 'DELETE') {
    try {
      const searchParams = req.nextUrl?.searchParams;
      let id = searchParams?.get('id');

      if (!id) {
        const body = await req.json().catch(() => ({}));
        id = body?.id;
      }

      if (!id) {
        return NextResponse.json({ success: false, error: 'Coupon ID is required for deletion' }, { status: 400 });
      }

      const existing = await db.coupon.findUnique({
        where: { id },
      });

      if (!existing || existing.deletedAt) {
        return NextResponse.json({ success: false, error: 'Coupon not found or already deleted' }, { status: 404 });
      }

      await db.coupon.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          updatedBy: user.email || user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Coupon "${existing.code}" has been removed.`,
      });
    } catch (error: any) {
      logger.error('Failed to delete coupon in v1 handler', error);
      return NextResponse.json({ success: false, error: error.message || 'Failed to delete coupon' }, { status: 500 });
    }
  }

  return null;
}
