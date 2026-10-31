import { describe, it, expect } from '@jest/globals';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { metadata as homeMetadata } from '@/app/page';
import { BUSINESS_CONTACT } from '@/lib/contact-config';
import { getHomePageData, invalidateHomePageDataCache } from '@/lib/home-page-data';
import { getStorefrontCategories, clearCatalogMemoryCache } from '@/lib/catalog-api';

describe('Real All-Pages Infrastructure, Metadata, Sitemap & Robots Suite', () => {
  describe('robots.ts (@/app/robots)', () => {
    it('generates compliant crawler directives protecting sensitive portals', () => {
      const config = robots();
      expect(config.sitemap).toContain('/sitemap.xml');
      expect(Array.isArray(config.rules)).toBe(true);

      const rules = (Array.isArray(config.rules) ? config.rules : [config.rules]) as Array<{ userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] }>;
      const generalRule = rules.find((r) => r.userAgent === '*');
      expect(generalRule).toBeDefined();
      expect(generalRule?.allow).toBe('/');
      expect(generalRule?.disallow).toContain('/api/');
      expect(generalRule?.disallow).toContain('/admin/');
      expect(generalRule?.disallow).toContain('/dashboard/');
    });

    it('grants curated read access to responsible AI crawlers', () => {
      const config = robots();
      const rules = (Array.isArray(config.rules) ? config.rules : [config.rules]) as Array<{ userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] }>;
      const aiRule = rules.find((r) => Array.isArray(r.userAgent) && r.userAgent.includes('GPTBot'));
      expect(aiRule).toBeDefined();
      expect(aiRule?.allow).toContain('/llms.txt');
    });
  });

  describe('sitemap.ts (@/app/sitemap)', () => {
    it('generates sitemap entries with canonical priority structure', async () => {
      const entries = await sitemap();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(5);

      const urls = entries.map(e => e.url);
      expect(urls.some(u => u.endsWith('/shop'))).toBe(true);
      expect(urls.some(u => u.endsWith('/about'))).toBe(true);
      expect(urls.some(u => u.endsWith('/contact'))).toBe(true);
      expect(urls.some(u => u.endsWith('/terms'))).toBe(true);
      expect(urls.some(u => u.endsWith('/privacy'))).toBe(true);
    });
  });

  describe('Homepage Metadata & Canonical Route (@/app/page)', () => {
    it('declares canonical homepage alternate link', () => {
      expect(homeMetadata.alternates?.canonical).toBe('/');
    });
  });

  describe('Business Contact Infrastructure (@/lib/contact-config)', () => {
    it('provides standardized, consistent Pakistani flagship details', () => {
      expect(BUSINESS_CONTACT.adminEmail).toContain('@');
      expect(BUSINESS_CONTACT.phone).toContain('+92');
      expect(BUSINESS_CONTACT.phoneDial).toMatch(/^\+92\d+$/);
      expect(BUSINESS_CONTACT.whatsapp).toMatch(/^92\d+$/);
      expect(BUSINESS_CONTACT.address).toContain('Lahore');
    });
  });

  describe('Homepage Data & Catalog Cache Invalidation (@/lib/home-page-data, @/lib/catalog-api)', () => {
    it('fetches homepage bundle with fallback categories and stats safely', async () => {
      invalidateHomePageDataCache();
      const data = await getHomePageData();
      expect(data).toBeDefined();
      expect(Array.isArray(data.categories)).toBe(true);
      expect(Array.isArray(data.banners)).toBe(true);
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.stats).toBeDefined();
    });

    it('retrieves luxury storefront categories and handles memory cache clearing', async () => {
      clearCatalogMemoryCache();
      const categories = await getStorefrontCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('Living Room');
      expect(categories).toContain('Bedroom');
    });
  });
});
