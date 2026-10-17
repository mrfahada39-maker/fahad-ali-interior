/* eslint-disable @typescript-eslint/no-explicit-any */
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
    if (!userId) return NextResponse.json({ id: 'guest', name: 'Valued Client', email: '' });
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        role: true,
        createdAt: true,
        emailNotif: true,
        pushNotif: true,
        orderNotif: true,
        promoNotif: true,
        tags: true,
      },
    });
    if (!user) return NextResponse.json({ id: userId, name: 'Valued Client', email: '' });
    const tags: string[] = Array.isArray(user.tags) ? user.tags : [];
    const timberTag = tags.find((t: string) => t.startsWith('timberFinish:'));
    const fabricTag = tags.find((t: string) => t.startsWith('fabricPreference:'));
    return NextResponse.json({
      ...user,
      timberFinish: timberTag ? timberTag.slice('timberFinish:'.length) : 'Royal Walnut',
      fabricPreference: fabricTag ? fabricTag.slice('fabricPreference:'.length) : 'Turkish Champagne Velvet',
    });
  } catch {
    return NextResponse.json({ id: 'guest', name: 'Valued Client', email: '' });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));

    let updatedTags: string[] | undefined = undefined;
    if (body.timberFinish !== undefined || body.fabricPreference !== undefined) {
      const current = await db.user.findUnique({ where: { id: userId }, select: { tags: true } });
      const currentTags: string[] = Array.isArray(current?.tags) ? current.tags : [];
      const baseTags = currentTags.filter(
        (t: string) => !t.startsWith('timberFinish:') && !t.startsWith('fabricPreference:')
      );
      const timber =
        body.timberFinish !== undefined
          ? String(body.timberFinish)
          : currentTags.find((t: string) => t.startsWith('timberFinish:'))?.slice('timberFinish:'.length) ||
            'Royal Walnut';
      const fabric =
        body.fabricPreference !== undefined
          ? String(body.fabricPreference)
          : currentTags
              .find((t: string) => t.startsWith('fabricPreference:'))
              ?.slice('fabricPreference:'.length) || 'Turkish Champagne Velvet';
      updatedTags = [...baseTags, `timberFinish:${timber}`, `fabricPreference:${fabric}`];
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        bio: body.bio !== undefined ? body.bio : undefined,
        emailNotif: typeof body.emailNotif === 'boolean' ? body.emailNotif : undefined,
        pushNotif: typeof body.pushNotif === 'boolean' ? body.pushNotif : undefined,
        orderNotif: typeof body.orderNotif === 'boolean' ? body.orderNotif : undefined,
        promoNotif: typeof body.promoNotif === 'boolean' ? body.promoNotif : undefined,
        tags: updatedTags,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        role: true,
        emailNotif: true,
        pushNotif: true,
        orderNotif: true,
        promoNotif: true,
        tags: true,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const existing = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (existing?.role === 'ADMIN' || existing?.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Executive admin account cannot be self-deleted.' }, { status: 403 });
    }
    await db.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

