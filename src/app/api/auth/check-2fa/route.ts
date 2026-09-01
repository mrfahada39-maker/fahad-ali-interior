import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function checkUser2fa(email: string | null) {
  if (!email) {
    return { requires2fa: false };
  }
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { totpEnabled: true },
    });
    return { requires2fa: !!user?.totpEnabled };
  } catch {
    return { requires2fa: false };
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const result = await checkUser2fa(email);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = body.email || req.nextUrl.searchParams.get('email');
  const result = await checkUser2fa(email);
  return NextResponse.json(result);
}
