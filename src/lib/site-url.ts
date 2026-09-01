/** Canonical site origin for SEO (sitemap, robots, JSON-LD, Open Graph). */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://fahad-ali-interior.vercel.app');
  return raw.replace(/\/$/, '');
}
