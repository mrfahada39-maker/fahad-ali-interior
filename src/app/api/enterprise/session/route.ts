import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Exchange NextAuth cookie session for client auth tokens directly on Next.js.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let userId = (session.user as { id?: string }).id;
  if (!userId) {
    const row = await db.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true },
    });
    userId = row?.id;
  }
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Issue session token directly in Next.js
  return NextResponse.json({
    accessToken: `direct_session_${userId}_${Date.now()}`,
    refreshToken: `direct_refresh_${userId}_${Date.now()}`,
    user: {
      id: userId,
      email: session.user.email,
      name: session.user.name,
    },
  });
}
