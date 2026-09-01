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
    const addresses = await db.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: { isDefault: 'desc' },
    });
    return NextResponse.json(addresses);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const newAddr = await db.address.create({
      data: {
        userId,
        name: body.name || 'Shipping Address',
        phone: body.phone || '',
        address: body.address || '',
        city: body.city || 'Lahore',
        province: body.province || 'Punjab',
        isDefault: Boolean(body.isDefault),
      },
    });
    return NextResponse.json(newAddr);
  } catch {
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const id = req.nextUrl.searchParams.get('id');
    if (id) {
      await db.address.deleteMany({ where: { id, ...(userId ? { userId } : {}) } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
