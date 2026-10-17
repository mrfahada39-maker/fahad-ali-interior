import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAdminToken } from '@/lib/admin-auth';

/**
 * Exchange NextAuth cookie session for cryptographically signed client auth token.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { authenticated: false, error: 'Not signed in' },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
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
    return NextResponse.json(
      { authenticated: false, error: 'User not found' },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const signedToken = createAdminToken(userId);
  return NextResponse.json(
    {
      accessToken: signedToken,
      user: {
        id: userId,
        email: session.user.email,
        name: session.user.name,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
