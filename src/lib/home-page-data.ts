/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';
import type { StorefrontProduct } from '@/lib/types';
import { db } from '@/lib/db';

export type HomeStats = {
  products: number;
  approvedReviews: number;
  completedOrders: number;
  uniqueCustomers: number;
};

export type HomeCategory = {
  name: string;
  count: number;
  image: string;
  description: string;
  icon?: string;
  items?: string;
  isPromo?: boolean;
};

export type HomeReview = {
  id: string;
  customerName: string | null;
  rating: number;
  comment: string | null;
  createdAt?: string;
  product: { name: string; image?: string };
  user?: { name?: string | null; image?: string | null };
};

export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  ctaText?: string;
  ctaLink?: string;
  badgeText?: string;
  price?: number | string | null;
  colors?: string | null;
};

export type HomeSiteSettings = {
  siteName: string;
  contactPhone: string;
  adminEmail: string;
  storeAddress: string;
  socialInstagram: string;
  socialFacebook: string;
  socialWhatsapp: string;
  foundedYear: string;
  currency: string;
};

export type HomePageData = {
  stats: HomeStats;
  products: StorefrontProduct[];
  categories: HomeCategory[];
  reviews: HomeReview[];
  settings: HomeSiteSettings;
  banners: HomeBanner[];
};

const empty: HomePageData = {
  stats: {
    products: 0,
    approvedReviews: 0,
    completedOrders: 0,
    uniqueCustomers: 0,
  },
  products: [],
  categories: [],
  reviews: [],
  banners: [],
  settings: {
    siteName: 'Fahad Ali Interior',
    contactPhone: '+92 320 7006110',
    adminEmail: 'info@fahadaliinterior.com',
    storeAddress: 'Main Boulevard, Gulberg III, Lahore, Pakistan',
    socialInstagram: '',
    socialFacebook: '',
    socialWhatsapp: '923207006110',
    foundedYear: '2016',
    currency: 'PKR',
  },
};

let cachedHomeData: HomePageData | null = null;
let lastCacheTimestamp = 0;
const CACHE_LIFETIME = 300000; // 5m in-memory cache

export function invalidateHomePageDataCache() {
  cachedHomeData = null;
  lastCacheTimestamp = 0;
}

const getCachedHomePageDataNext = unstable_cache(
  async () => fetchHomePageDataInternal(),
  ['home-page-data-v3'],
  { revalidate: 300, tags: ['home-data', 'products', 'categories', 'reviews', 'settings'] }
);

export async function getHomePageData(): Promise<HomePageData> {
  const now = Date.now();
  if (cachedHomeData && (now - lastCacheTimestamp) < CACHE_LIFETIME) {
    return cachedHomeData;
  }
  try {
    const data = await getCachedHomePageDataNext();
    cachedHomeData = data;
    lastCacheTimestamp = now;
    return data;
  } catch (err) {
    logger.error('getHomePageData error:', err);
    if (cachedHomeData) return cachedHomeData;
    return empty;
  }
}

async function fetchHomePageDataInternal(): Promise<HomePageData> {
  try {
    const [products, categories, settings, banners, productGroups, approvedReviewsList] = await Promise.all([
      db.product.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          image: true,
          dimensions: true,
          material: true,
          stockCount: true,
          isPremium: true,
          createdAt: true,
        },
        take: 48,
        orderBy: { createdAt: 'desc' },
      }),
      db.category.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          items: true,
          icon: true,
          isPromo: true,
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }).catch(() => []),
      db.settings.findFirst({
        select: {
          siteName: true,
          contactPhone: true,
          storeAddress: true,
          socialInstagram: true,
          socialFacebook: true,
          socialWhatsapp: true,
          foundedYear: true,
          currency: true,
        },
      }).catch(() => null),
      db.banner.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          subtitle: true,
          image: true,
          link: true,
          price: true,
          colors: true,
        },
        orderBy: { order: 'asc' },
      }).catch(() => []),
      db.product.groupBy({
        by: ['category'],
        where: { deletedAt: null },
        _count: { id: true },
      }).catch(() => []),
      db.review.findMany({
        where: { deletedAt: null, status: 'APPROVED' },
        select: {
          id: true,
          customerName: true,
          rating: true,
          comment: true,
          image: true,
          createdAt: true,
          product: { select: { id: true, name: true, image: true, category: true } },
          user: { select: { id: true, name: true, avatar: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }).catch(() => []),
    ]);

    const categoryCountMap = new Map<string, number>();
    for (const group of productGroups) {
      if (group.category) {
        categoryCountMap.set(group.category.trim().toLowerCase(), group._count.id);
      }
    }

    const normalizeCatalogText = (text: string | null | undefined, fallback: string | null | undefined = ''): string => {
      if (!text) return fallback || '';
      return text
        .replace(/\bProuducts\b/g, 'Products')
        .replace(/\bprouducts\b/gi, 'products')
        .replace(/\bProuduct\b/g, 'Product')
        .replace(/\bprouduct\b/gi, 'product')
        .replace(/\bcenter tables\b/gi, 'Center Tables')
        .replace(/\bL-Shap\b(?!e)/gi, 'L-Shape')
        .trim();
    };

    const inferFallbackDimensions = (name: string, category: string, dims?: string | null): string => {
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
    };

    const formattedProducts = products.map((p: any) => {
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

    const formattedCategories = categories.map((c: any) => {
      const normalizedName = normalizeCatalogText(c.name, '');
      const cleanName = normalizedName.toLowerCase();
      const liveCount = categoryCountMap.get(cleanName) ?? 0;
      const customItems = normalizeCatalogText(c.items, '');
      return {
        name: normalizedName,
        count: liveCount,
        image: c.image || '/images/placeholder.webp',
        description: normalizeCatalogText(c.description, 'Solid Sheesham Wood'),
        items: liveCount > 0 
          ? `${liveCount} ${liveCount === 1 ? 'Item' : 'Items'} Available` 
          : (customItems || 'Bespoke Collection'),
      };
    });

    const formattedReviews: HomeReview[] = (approvedReviewsList || []).map((r: any) => ({
      id: r.id,
      customerName: r.customerName || r.user?.name || (r.user?.email ? r.user.email.split('@')[0] : 'Verified Patron'),
      rating: Number(r.rating) || 5,
      comment: r.comment || '',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      product: {
        name: normalizeCatalogText(r.product?.name, 'Handcrafted Solid Sheesham'),
        image: r.image || r.product?.image || undefined,
      },
      user: {
        name: r.user?.name || r.customerName || 'Verified Patron',
        image: (r.user as any)?.avatar || (r.user as any)?.image || undefined,
      },
    }));

    return {
      stats: {
        products: products.length,
        approvedReviews: formattedReviews.length,
        completedOrders: 0,
        uniqueCustomers: 0,
      },
      products: formattedProducts,
      categories: formattedCategories.length > 0 ? formattedCategories : [
        { name: 'Living Room', count: 25, items: '25 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg', description: 'Solid Sheesham' },
        { name: 'Bedroom', count: 10, items: '10 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg', description: 'Solid Sheesham' },
        { name: 'Dining Room', count: 15, items: '15 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg', description: 'Solid Sheesham' },
        { name: 'Coffee Chairs', count: 20, items: '20 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784926669/fahad-ali-interior/categories/xqe9nnbcbvna9iqvnhpk.jpg', description: 'Solid Sheesham' },
        { name: 'Center Tables', count: 10, items: '10 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784927258/fahad-ali-interior/categories/b1v3zxrruuddtxkth1f9.jpg', description: 'Solid Sheesham' },
        { name: 'Luxury Showcase', count: 10, items: '10 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785010771/fahad-ali-interior/categories/xpdpsxe6jvjs6ezukwmg.jpg', description: 'Solid Sheesham' },
        { name: 'Luxury Wardrobes', count: 20, items: '20 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg', description: 'Solid Sheesham' },
      ],
      reviews: formattedReviews,
      settings: settings ? {
        siteName: settings.siteName || 'Fahad Ali Interior',
        contactPhone: settings.contactPhone || '+92 320 7006110',
        adminEmail: 'info@fahadaliinterior.com',
        storeAddress: settings.storeAddress || 'Main Boulevard, Gulberg III, Lahore, Pakistan',
        socialInstagram: settings.socialInstagram || '',
        socialFacebook: settings.socialFacebook || '',
        socialWhatsapp: settings.socialWhatsapp || '923207006110',
        foundedYear: settings.foundedYear || '2016',
        currency: settings.currency || 'PKR',
      } : empty.settings,
      banners: banners.map((b: any) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || null,
        link: b.link || '/#signature-categories',
        ctaText: 'EXPLORE COLLECTION',
        ctaLink: b.link || '/#signature-categories',
        image: b.image,
        badgeText: '',
        price: b.price != null ? Number(b.price) : null,
        colors: b.colors ?? null,
      })),
    };
  } catch (err) {
    logger.error('fetchHomePageDataInternal direct DB query error:', err);
    return empty;
  }
}
