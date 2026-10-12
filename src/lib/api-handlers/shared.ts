import { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { clearCatalogMemoryCache } from '@/lib/catalog-api';
import { invalidateHomePageDataCache } from '@/lib/home-page-data';
import { getAdminTokenSecret } from '@/lib/admin-auth';

export interface SessionUser {
  id?: string;
  email?: string;
  role?: string;
}

export interface ApiDispatchContext {
  method: string;
  segment: string;
  normalizedSegment: string;
  pathParts: string[];
  req: NextRequest;
  ip: string;
}

export interface DbOrderItemRecord {
  id?: string;
  productId?: string;
  name?: string;
  price?: unknown;
  quantity?: number;
  image?: string | null;
  [key: string]: unknown;
}

export interface DbOrderRecord {
  id: string;
  userId?: string | null;
  shippingName?: string | null;
  shippingEmail?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  paymentMethod?: string | null;
  status?: string;
  paymentStatus?: string;
  discount?: unknown;
  gst?: unknown;
  subtotal?: unknown;
  totalAmount?: unknown;
  createdAt: Date | string;
  items?: DbOrderItemRecord[];
  user?: { id: string; name?: string | null; email: string; phone?: string | null } | null;
  [key: string]: unknown;
}

export interface DbReviewRecord {
  id: string;
  rating?: number | string;
  comment?: string | null;
  customerName?: string | null;
  image?: string | null;
  status?: string;
  createdAt?: Date | string;
  productId?: string;
  product?: { id?: string; name?: string; image?: string | null; category?: string; price?: unknown } | null;
  user?: { id?: string; name?: string | null; avatar?: string | null; email?: string } | null;
  [key: string]: unknown;
}

export interface DbProductRecord {
  id: string;
  name: string;
  price: unknown;
  category: string;
  image?: string | null;
  images?: string[];
  dimensions?: string | null;
  material?: string | null;
  stockCount?: number;
  isPremium?: boolean;
  description?: string | null;
  specs?: unknown;
  createdAt?: Date | string;
  reviews?: DbReviewRecord[];
  [key: string]: unknown;
}

export interface DbMessageRecord {
  id: string;
  text: string;
  sender?: string | null;
  createdAt?: Date | string;
  [key: string]: unknown;
}

export interface DbUserRecord {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  bio?: string | null;
  role?: string;
  segment?: string | null;
  loyaltyTier?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  lockedUntil?: Date | string | null;
  orders?: DbOrderRecord[];
  reviews?: DbReviewRecord[];
  messages?: DbMessageRecord[];
  [key: string]: unknown;
}

export interface DbCategoryRecord {
  id?: string;
  name: string;
  image?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

export interface DbChatMessageRecord {
  id: string;
  role: string;
  content: string;
  intent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface DbChatSessionRecord {
  id: string;
  sessionId: string;
  customerName?: string | null;
  city?: string | null;
  status?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages?: DbChatMessageRecord[];
}

export interface DbNotificationRecord {
  id: string;
  isNew?: boolean;
  [key: string]: unknown;
}

export const fallbackCategories = [
  { id: 'cat_living', name: 'Living Room', description: 'Solid Sheesham luxury sofas, chairs and cabinets' },
  { id: 'cat_bedroom', name: 'Bedroom', description: 'Artisanal beds, wardrobes and side tables' },
  { id: 'cat_dining', name: 'Dining Room', description: 'Handcrafted dining sets and buffets' },
  { id: 'cat_coffee', name: 'Coffee Chairs', description: 'Premium accent and coffee chairs' },
  { id: 'cat_showcase', name: 'Luxury Showcase', description: 'Exquisite consoles and display units' },
  { id: 'cat_wardrobe', name: 'Luxury Wardrobes', description: 'Custom solid wood wardrobes' },
  { id: 'cat_center', name: 'Center Tables', description: 'Luxury center and nesting tables' },
];

export async function getUserFromSessionOrToken(req: NextRequest): Promise<SessionUser | null> {
  const adminCookie = req.cookies.get('fai_admin_token')?.value;
  const authHeader = req.headers.get('authorization') || req.headers.get('x-enterprise-token') || adminCookie;
  if (authHeader && authHeader.includes('fai_token_')) {
    const cleanToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    const match = cleanToken.match(/fai_token_(.+)_(\d+)_([a-f0-9]+)/);
    if (match) {
      const [, userId, timestampStr, signature] = match;
      const timestamp = parseInt(timestampStr, 10);
      const maxAgeMs = 24 * 60 * 60 * 1000;
      if (!isNaN(timestamp) && Date.now() - timestamp < maxAgeMs) {
        const adminSecret = getAdminTokenSecret();
        const nextAuthSecret = process.env.NEXTAUTH_SECRET || '';
        const candidateSigs: string[] = [];
        if (adminSecret) {
          candidateSigs.push(
            crypto.createHmac('sha256', adminSecret).update(`${userId}:${timestamp}:ADMIN`).digest('hex'),
            crypto.createHmac('sha256', adminSecret).update(`${userId}:${timestamp}`).digest('hex')
          );
        }
        if (nextAuthSecret && nextAuthSecret.length >= 32) {
          candidateSigs.push(
            crypto.createHmac('sha256', nextAuthSecret).update(`${userId}:${timestamp}`).digest('hex'),
            crypto.createHmac('sha256', nextAuthSecret).update(`${userId}:${timestamp}:ADMIN`).digest('hex')
          );
        }
        try {
          const sigBuf = Buffer.from(signature, 'hex');
          const isValidSig = candidateSigs.some((expected) => {
            const expBuf = Buffer.from(expected, 'hex');
            return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
          });
          if (isValidSig) {
            const dbUser = await db.user.findUnique({
              where: { id: userId },
              select: { id: true, email: true, role: true, deletedAt: true },
            });
            if (dbUser && !dbUser.deletedAt) {
              return {
                id: dbUser.id,
                email: dbUser.email,
                role: String(dbUser.role).toUpperCase(),
              };
            }
          }
        } catch {}
      }
    }
  }

  try {
    const isHttps = req.url.startsWith('https://') || process.env.NODE_ENV === 'production';
    const token =
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps })) ||
      (await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false }));
    if (token) {
      return {
        id: token.id as string,
        email: token.email as string,
        role: String(token.role ?? '').toUpperCase(),
      };
    }
  } catch {}

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const sUser = session.user as SessionUser;
      return {
        id: sUser.id,
        email: session.user.email || undefined,
        role: String(sUser.role ?? '').toUpperCase(),
      };
    }
  } catch {}

  return null;
}

export function requireAdmin(user: SessionUser | null): boolean {
  if (!user?.role) return false;
  const r = user.role.toUpperCase();
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}

export function revalidateProductCaches(productId?: string): void {
  try {
    clearCatalogMemoryCache();
    invalidateHomePageDataCache();
  } catch {}
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/shop', 'layout');
    revalidatePath('/admin', 'layout');
    revalidatePath('/dashboard', 'layout');
    if (productId) {
      revalidatePath(`/product/${productId}`, 'page');
    }
  } catch {}
  try {
    revalidateTag('homepage', { expire: 0 });
    revalidateTag('products', { expire: 0 });
    revalidateTag('reviews', { expire: 0 });
    revalidateTag('home-bundle-cache', { expire: 0 });
  } catch {}
}
