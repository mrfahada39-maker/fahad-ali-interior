import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
