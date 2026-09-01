import { MetadataRoute } from 'next';
import { getStorefrontProducts } from '@/lib/catalog-api';
import { getSiteUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const products = await getStorefrontProducts(100);

  if (!products || products.length === 0) {
    return staticPages;
  }

  const productPages: MetadataRoute.Sitemap = products.map((p) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${baseUrl}/product/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    };

    // Add product image for Google Image Search indexing
    if (p.image) {
      const imageUrl = p.image.startsWith('http')
        ? p.image
        : `${baseUrl}${p.image.startsWith('/') ? '' : '/'}${p.image}`;

      (entry as any).images = [imageUrl];
    }

    return entry;
  });

  return [...staticPages, ...productPages];
}
