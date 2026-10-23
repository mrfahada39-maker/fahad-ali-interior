import { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { clearCatalogMemoryCache } from '@/lib/catalog-api';
import { invalidateHomePageDataCache } from '@/lib/home-page-data';
import { getVerifiedUser, getVerifiedAdmin, type VerifiedUser } from '@/lib/admin-auth';

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
  { id: 'cat_living', name: 'Living Room', slug: 'living-room', order: 1, description: '' },
  { id: 'cat_bedroom', name: 'Bedroom', slug: 'bedroom', order: 2, description: '' },
  { id: 'cat_dining', name: 'Dining Room', slug: 'dining-room', order: 3, description: '' },
  { id: 'cat_office', name: 'Office', slug: 'office', order: 4, description: '' },
  { id: 'cat_sofas', name: 'Sofas', slug: 'sofas', order: 5, description: '' },
  { id: 'cat_coffee', name: 'Coffee Tables', slug: 'coffee-tables', order: 6, description: '' },
  { id: 'cat_tv', name: 'TV Units', slug: 'tv-units', order: 7, description: '' },
  { id: 'cat_storage', name: 'Storage', slug: 'storage', order: 8, description: '' },
  { id: 'cat_outdoor', name: 'Outdoor', slug: 'outdoor', order: 9, description: '' },
  { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', order: 10, description: '' },
];

export async function getUserFromSessionOrToken(req: NextRequest): Promise<SessionUser | null> {
  const verifier =
    typeof getVerifiedUser === 'function'
      ? getVerifiedUser
      : (getVerifiedAdmin as unknown as (r: NextRequest, opts?: { allowAnyRole?: boolean }) => Promise<VerifiedUser | null>);
  const verified = verifier ? await verifier(req, { allowAnyRole: true }) : null;
  if (!verified) return null;
  return {
    id: verified.id,
    email: verified.email,
    role: verified.role,
  };
}

export function requireAdmin(user: SessionUser | null): boolean {
  if (!user?.role) return false;
  const r = String(user.role).toUpperCase();
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
