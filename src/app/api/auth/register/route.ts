import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'Password cannot exceed 128 characters' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name: name?.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Account created successfully', user },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to register account' },
      { status: 500 }
    );
  }
}
