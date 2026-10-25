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

  const row = await db.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!row || row.deletedAt) {
    return NextResponse.json(
      { authenticated: false, error: 'User not found or deactivated' },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  const role = String(row.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // Only mint signed admin token for accounts with active database ADMIN role
  const signedToken = isAdmin ? createAdminToken(row.id) : undefined;

  return NextResponse.json(
    {
      accessToken: signedToken,
      user: {
        id: row.id,
        email: session.user.email,
        name: session.user.name,
        role,
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
