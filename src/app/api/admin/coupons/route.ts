/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/admin-auth';
import { normalizeCouponCode } from '@/lib/coupons';
import { logger } from '@/lib/logger';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ── GET: Fetch all coupons & promotional metrics ──
export async function GET(req: NextRequest) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

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

    // Compute Executive Stats
    const totalCoupons = formattedCoupons.length;
    const activeCoupons = formattedCoupons.filter((c: any) => c.isActive && !c.isExpired && !c.isMaxedOut).length;
    const totalRedemptions = formattedCoupons.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0);

    // Sum actual discounts recorded in order receipts
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
    logger.error('Failed to load admin coupons', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// ── POST: Create new promotional discount coupon ──
export async function POST(req: NextRequest) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawCode = normalizeCouponCode(body?.code);

    if (!rawCode || rawCode.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Coupon code must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    // Check code uniqueness
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
        createdBy: admin.email || admin.id,
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
    logger.error('Failed to create coupon', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}

// ── PUT: Update existing discount coupon ──
export async function PUT(req: NextRequest) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

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
    const discountType = body?.discountType === 'FIXED' ? 'FIXED' : body?.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : existing.discountType;

    if (discountType === 'PERCENTAGE' && (discountNum < 1 || discountNum > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount must be between 1% and 100%.' },
        { status: 400 }
      );
    }

    const minOrderAmount = body?.minOrderAmount !== undefined ? Math.max(0, Number(body.minOrderAmount)) : Number(existing.minOrderAmount);
    const maxUses = body?.maxUses !== undefined ? Math.max(0, parseInt(body.maxUses, 10)) : existing.maxUses;
    const expiresAt = body?.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : existing.expiresAt;
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
        updatedBy: admin.email || admin.id,
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
    logger.error('Failed to update coupon', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update coupon' }, { status: 500 });
  }
}

// ── DELETE: Soft-delete discount coupon ──
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getVerifiedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

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
        updatedBy: admin.email || admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Coupon "${existing.code}" has been removed.`,
    });
  } catch (error: any) {
    logger.error('Failed to delete coupon', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
