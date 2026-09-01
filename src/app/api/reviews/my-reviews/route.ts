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
    const reviews = await db.review.findMany({
      where: { userId, deletedAt: null },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json([]);
  }
}
