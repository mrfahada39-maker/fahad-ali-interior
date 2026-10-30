import { MetadataRoute } from 'next';
import { getStorefrontProducts } from '@/lib/catalog-api';
import { getSiteUrl } from '@/lib/utils';
import { db } from '@/lib/db';

type ExtendedSitemapEntry = MetadataRoute.Sitemap[number] & { images?: string[] };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // 1. Fetch Storefront Products
  const products = await getStorefrontProducts(100).catch(() => []);
  const productPages: MetadataRoute.Sitemap = (products || []).map((p) => {
    const pWithUpdated = p as { id: string; image?: string; updatedAt?: string | Date };
    const entry: ExtendedSitemapEntry = {
      url: `${baseUrl}/product/${p.id}`,
      lastModified: pWithUpdated.updatedAt ? new Date(pWithUpdated.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    };

    if (p.image) {
      const imageUrl = p.image.startsWith('http')
        ? p.image
        : `${baseUrl}${p.image.startsWith('/') ? '' : '/'}${p.image}`;

      entry.images = [imageUrl];
    }

    return entry;
  });

  // 2. Fetch Blog / Editorial Articles
  let blogArticles: Array<{ slug: string; updatedAt?: Date | string; image?: string | null }> = [];
  try {
    const dbBlogs = await db.blogPost.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true, image: true },
      take: 100,
    });
    if (dbBlogs && dbBlogs.length > 0) {
      blogArticles = dbBlogs;
    }
  } catch {
    blogArticles = [];
  }

  const blogPages: MetadataRoute.Sitemap = blogArticles.map((article) => {
    const entry: ExtendedSitemapEntry = {
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    };

    if (article.image) {
      const img = article.image.startsWith('http')
        ? article.image
        : `${baseUrl}${article.image.startsWith('/') ? '' : '/'}${article.image}`;
      entry.images = [img];
    }

    return entry;
  });

  return [...staticPages, ...productPages, ...blogPages];
}
