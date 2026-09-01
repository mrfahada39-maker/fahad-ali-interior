import { unstable_cache } from 'next/cache';
import type { StorefrontProduct } from '@/lib/types/product';
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
  product: { name: string };
};

export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
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
    contactPhone: '',
    adminEmail: '',
    storeAddress: '',
    socialInstagram: '',
    socialFacebook: '',
    socialWhatsapp: '',
    foundedYear: '',
    currency: 'PKR',
  },
};

// Next.js Tag-based High-Performance Server Cache
export const getHomePageData = unstable_cache(
  async (): Promise<HomePageData> => {
    try {
      const [products, categories, settings, banners] = await Promise.all([
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
            description: true,
          },
          take: 12,
          orderBy: { createdAt: 'desc' },
        }),
        db.category.findMany({
          where: { deletedAt: null },
          select: {
            name: true,
            description: true,
            image: true,
            items: true,
            icon: true,
            isPromo: true,
          },
          orderBy: { order: 'asc' },
        }).catch(() => []),
        db.settings.findFirst({
          select: {
            siteName: true,
            contactPhone: true,
            adminEmail: true,
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
      ]);

      const formattedProducts = products.map((p) => ({
        ...p,
        price: Number(p.price),
      })) as unknown as StorefrontProduct[];

      const formattedCategories = categories.map((c) => ({
        name: c.name,
        count: Number(c.items || 0) || 12,
        image: c.image || '/images/placeholder.webp',
        description: c.description || 'Solid Sheesham Wood',
      }));

      return {
        stats: {
          products: products.length,
          approvedReviews: 0,
          completedOrders: 0,
          uniqueCustomers: 0,
        },
        products: formattedProducts,
        categories: formattedCategories.length > 0 ? formattedCategories : [
          { name: 'Living Room', count: 25, image: 'https://images.unsplash.com/photo-1583847268964-b28ce8f31586?auto=format&fit=crop&w=800&q=80', description: 'Solid Sheesham' },
          { name: 'Bedroom', count: 18, image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80', description: 'Solid Sheesham' },
          { name: 'Dining Room', count: 16, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', description: 'Solid Sheesham' },
        ],
        reviews: [],
        settings: settings ? {
          siteName: settings.siteName || 'Fahad Ali Interior',
          contactPhone: settings.contactPhone || '',
          adminEmail: settings.adminEmail || '',
          storeAddress: settings.storeAddress || '',
          socialInstagram: settings.socialInstagram || '',
          socialFacebook: settings.socialFacebook || '',
          socialWhatsapp: settings.socialWhatsapp || '',
          foundedYear: settings.foundedYear || '',
          currency: settings.currency || 'PKR',
        } : empty.settings,
        banners: banners.map((b: any) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle || '',
          ctaText: 'EXPLORE COLLECTION',
          ctaLink: b.link || '/shop',
          image: b.image,
          badgeText: '',
        })),
      };
    } catch (err) {
      console.error('getHomePageData direct DB query error:', err);
      return empty;
    }
  },
  ['home-bundle-cache'],
  { revalidate: 3600, tags: ['homepage', 'products', 'banners'] }
);


