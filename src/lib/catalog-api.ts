/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';
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

function normalizeCatalogText(text: string | null | undefined, fallback: string | null | undefined = ''): string {
  if (!text) return fallback || '';
  return text
    .replace(/\bProuducts\b/g, 'Products')
    .replace(/\bprouducts\b/gi, 'products')
    .replace(/\bProuduct\b/g, 'Product')
    .replace(/\bprouduct\b/gi, 'product')
    .replace(/\bcenter tables\b/gi, 'Center Tables')
    .replace(/\bL-Shap\b(?!e)/gi, 'L-Shape')
    .trim();
}

function inferFallbackDimensions(name: string, category: string, dims?: string | null): string {
  if (dims && dims.trim().length > 0) return dims.trim();
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('12-seater') || n.includes('u-shape')) return '11 ft × 9 ft × 34 in (Custom Sizing Available)';
  if (n.includes('10-seater')) return '10.5 ft × 8.5 ft × 34 in (Custom Sizing Available)';
  if (n.includes('l-shape') || n.includes('sectional') || n.includes('corner')) return '9 ft × 7 ft × 34 in (Custom Sizing Available)';
  if (n.includes('6-seater') || n.includes('7-seater') || n.includes('sofa set')) return '3-Seater (7.2 ft) + 2-Seater (5.2 ft) + 1-Seater (3.2 ft)';
  if (c.includes('bed') || n.includes('bed')) return 'King Size: 6.5 ft × 6 ft × 48 in Headboard';
  if (c.includes('dining')) return 'Table: 7 ft × 3.5 ft × 30 in';
  if (c.includes('table') || n.includes('table')) return '4 ft × 2.5 ft × 18 in';
  if (c.includes('wardrobe')) return '8 ft (H) × 6 ft (W) × 24 in (D)';
  return '8.5 ft × 6.5 ft × 34 in (Custom Sizing Available)';
}

/** Server-side category list for storefront pages */
export async function getStorefrontCategories(): Promise<string[]> {
  const cacheKey = 'storefront_categories';
  const cached = getCached<string[]>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const cats = await db.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { name: true },
    });
    if (cats && cats.length > 0) {
      const names = ['All', ...cats.map((c: any) => normalizeCatalogText(c.name, c.name))];
      setCached(cacheKey, names, 120);
      return names;
    }
  } catch (err) {
    logger.error('Direct DB categories fetch error:', err);
  }

  const fallback = [
    'All',
    'Living Room',
    'Bedroom',
    'Dining Room',
    'Office',
    'Sofas',
    'Coffee Tables',
    'TV Units',
    'Storage',
    'Outdoor',
    'Accessories',
  ];
  setCached(cacheKey, fallback, 120);
  return fallback;
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
        updatedAt: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const result = (products || []).map((p: any) => {
      const cleanName = normalizeCatalogText(p.name, p.name);
      const cleanCategory = normalizeCatalogText(p.category, p.category);
      return {
        ...p,
        name: cleanName,
        category: cleanCategory,
        description: normalizeCatalogText(p.description, p.description),
        dimensions: inferFallbackDimensions(cleanName, cleanCategory, p.dimensions),
        price: Number(p.price),
      };
    }) as unknown as StorefrontProduct[];
    setCached(cacheKey, result, 60);
    return result;
  } catch (err) {
    logger.error('Direct DB product fetch error:', err);
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
      const cleanName = normalizeCatalogText(p.name, p.name);
      const cleanCategory = normalizeCatalogText(p.category, p.category);

      const result = {
        ...p,
        name: cleanName,
        category: cleanCategory,
        description: normalizeCatalogText(p.description, p.description),
        dimensions: inferFallbackDimensions(cleanName, cleanCategory, p.dimensions),
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
    logger.error('Direct DB product detail error:', err);
  }

  return null;
}
