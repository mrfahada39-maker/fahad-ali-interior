/**
 * Storefront Product Data Layer (Direct PostgreSQL with in-memory caching)
 */

import type { StorefrontProduct } from '@/lib/types';
import { db } from '@/lib/db';

// High-speed In-Memory RAM Cache (Instant Sub-1ms responses)
const memoryCache = new Map<string, { data: any; expiry: number }>();

export function clearCatalogMemoryCache(): void {
  memoryCache.clear();
}

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached<T>(key: string, data: T, ttlSeconds = 60): void {
  memoryCache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

/** Server-side product list for pages (Direct PostgreSQL Query). */
export async function getStorefrontProducts(limit = 50): Promise<StorefrontProduct[]> {
  const cacheKey = `storefront_products_${limit}`;
  const cached = getCached<StorefrontProduct[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // 1. Direct High-Speed PostgreSQL Query (1-5ms response)
  try {
    const products = await db.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        image: true,
        images: true,
        dimensions: true,
        material: true,
        stockCount: true,
        isPremium: true,
        description: true,
        specs: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const result = (products || []).map((p: any) => ({
      ...p,
      price: Number(p.price),
    })) as unknown as StorefrontProduct[];
    setCached(cacheKey, result, 60);
    return result;
  } catch (err) {
    console.error('Direct DB product fetch error:', err);
    return [];
  }
}

export async function getProductById(id: string): Promise<StorefrontProduct | null> {
  const cacheKey = `product_detail_${id}`;
  const cached = getCached<StorefrontProduct>(cacheKey);
  if (cached) {
    return cached;
  }

  // 1. Direct DB Query
  try {
    const p = await db.product.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        image: true,
        images: true,
        dimensions: true,
        material: true,
        stockCount: true,
        isPremium: true,
        description: true,
        specs: true,
        createdAt: true,
        reviews: {
          where: { deletedAt: null, status: 'APPROVED' },
          select: {
            id: true,
            rating: true,
            comment: true,
            customerName: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (p) {
      const approvedReviews = (p as any).reviews || [];
      const reviewCount = approvedReviews.length;
      const avgRating = reviewCount > 0
        ? Number((approvedReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1))
        : 5.0;

      const result = {
        ...p,
        price: Number(p.price),
        reviewCount,
        avgRating,
        reviews: approvedReviews.map((r: any) => ({
          ...r,
          createdAt: typeof r.createdAt === 'object' && r.createdAt?.toISOString ? r.createdAt.toISOString() : String(r.createdAt || ''),
        })),
      } as unknown as StorefrontProduct;
      setCached(cacheKey, result, 60);
      return result;
    }
  } catch (err) {
    console.error('Direct DB product detail error:', err);
  }

  return null;
}
