import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id) return token.id as string;
  } catch {}
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.id) return (session?.user as any).id;
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ totalOrders: 0, orderCount: 0, totalSpent: 0, loyaltyPoints: 0, wishlistCount: 0 });
    }
    const [orderCount, orders, wishlistCount] = await Promise.all([
      db.order.count({ where: { userId, deletedAt: null } }).catch(() => 0),
      db.order.findMany({ where: { userId, deletedAt: null }, select: { totalAmount: true } }).catch(() => []),
      db.wishlistItem.count({ where: { userId } }).catch(() => 0),
    ]);
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const loyaltyPoints = Math.floor(totalSpent / 1000);
    return NextResponse.json({
      totalOrders: orderCount,
      orderCount,
      totalSpent,
      loyaltyPoints,
      wishlistCount,
    });
  } catch {
    return NextResponse.json({ totalOrders: 0, orderCount: 0, totalSpent: 0, loyaltyPoints: 0, wishlistCount: 0 });
  }
}
