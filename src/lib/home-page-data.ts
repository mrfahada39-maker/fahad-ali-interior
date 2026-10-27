/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';
import type { StorefrontProduct } from '@/lib/types';
import { db } from '@/lib/db';
import { BUSINESS_CONTACT } from '@/lib/contact-config';

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
    contactPhone: BUSINESS_CONTACT.phone,
    adminEmail: BUSINESS_CONTACT.supportEmail,
    storeAddress: BUSINESS_CONTACT.address,
    socialInstagram: '',
    socialFacebook: '',
    socialWhatsapp: BUSINESS_CONTACT.whatsapp,
    foundedYear: '2016',
    currency: 'PKR',
  },
};

let cachedHomePageData: { data: HomePageData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 45 * 1000; // 45 seconds high-speed RAM cache

export function invalidateHomePageDataCache() {
  cachedHomePageData = null;
}

export async function getHomePageData(): Promise<HomePageData> {
  const now = Date.now();
  if (cachedHomePageData && cachedHomePageData.expiresAt > now) {
    return cachedHomePageData.data;
  }

  try {
    const data = await fetchHomePageDataInternal();
    if (data && (data.products?.length > 0 || data.categories?.length > 0)) {
      cachedHomePageData = {
        data,
        expiresAt: now + CACHE_TTL_MS,
      };
    }
    return data;
  } catch (err) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      logger.error('getHomePageData error:', err);
    }
    return cachedHomePageData?.data || empty;
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
        take: 28,
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
        image: c.image || '/cat-thumb-sofas-2x.webp',
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
      categories: formattedCategories,
      reviews: formattedReviews,
      settings: settings ? {
        siteName: settings.siteName || 'Fahad Ali Interior',
        contactPhone: settings.contactPhone || BUSINESS_CONTACT.phone,
        adminEmail: settings.adminEmail || BUSINESS_CONTACT.supportEmail,
        storeAddress: settings.storeAddress || BUSINESS_CONTACT.address,
        socialInstagram: settings.socialInstagram || '',
        socialFacebook: settings.socialFacebook || '',
        socialWhatsapp: settings.socialWhatsapp || BUSINESS_CONTACT.whatsapp,
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
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      logger.error('fetchHomePageDataInternal direct DB query error:', err);
    }
    return empty;
  }
}
