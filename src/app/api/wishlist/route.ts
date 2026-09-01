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
    if (!userId) return NextResponse.json([]);
    const items = await db.wishlistItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    if (!body.productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    const item = await db.wishlistItem.create({
      data: { userId, productId: body.productId },
      include: { product: true },
    }).catch(() => null);
    return NextResponse.json(item || { success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const id = req.nextUrl.searchParams.get('id');
    const productId = req.nextUrl.searchParams.get('productId');
    if (id) {
      await db.wishlistItem.deleteMany({ where: { id, ...(userId ? { userId } : {}) } });
    } else if (productId && userId) {
      await db.wishlistItem.deleteMany({ where: { userId, productId } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
