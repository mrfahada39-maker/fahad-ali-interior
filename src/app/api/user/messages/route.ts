import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id) return token.id as string;
    if (token?.sub) return token.sub as string;
    if (token?.email) {
      const u = await db.user.findUnique({ where: { email: token.email as string } }).catch(() => null);
      if (u?.id) return u.id;
    }
  } catch {}
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.id) return (session?.user as any).id;
    if (session?.user?.email) {
      const u = await db.user.findUnique({ where: { email: session.user.email } }).catch(() => null);
      if (u?.id) return u.id;
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json([]);
    const messages = await db.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(messages);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const audioUrl = body.audioUrl;
    const text = audioUrl ? `[VOICE_NOTE]:${audioUrl}` : (body.message || body.text || '').trim();

    if (!text) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }
    const created = await db.message.create({
      data: {
        userId,
        text,
        sender: 'user',
      },
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
