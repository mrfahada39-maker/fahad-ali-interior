/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

describe('Phase 5: Performance, SEO, Accessibility & Content Fixes', () => {
  const rootDir = process.cwd();

  it('switches product/[id]/page.tsx from force-dynamic to ISR (revalidate = 60 + generateStaticParams)', () => {
    const productPageSrc = fs.readFileSync(
      path.join(rootDir, 'src/app/product/[id]/page.tsx'),
      'utf8'
    );
    expect(productPageSrc).toContain('export const revalidate = 60');
    expect(productPageSrc).toContain('export async function generateStaticParams');
    expect(productPageSrc).not.toContain("dynamic = 'force-dynamic'");
    expect(productPageSrc).not.toContain('revalidate = 0');
  });

  it('uses framer-motion in AnimatedCounter (no duplicate gsap dependency) and lazy-loads Recharts tabs in AdminDashboard', () => {
    const counterSrc = fs.readFileSync(
      path.join(rootDir, 'src/components/AnimatedCounter.tsx'),
      'utf8'
    );
    expect(counterSrc).not.toContain('gsap');
    expect(counterSrc).toContain("from 'framer-motion'");

    const adminSrc = fs.readFileSync(
      path.join(rootDir, 'src/components/AdminDashboard.tsx'),
      'utf8'
    );
    expect(adminSrc).toContain("dynamic(() => import('./OverviewTab')");
    expect(adminSrc).toContain("dynamic(() => import('./AnalyticsTab')");
  });

  it('optimizes hero video (poster, preload="none" on mobile) and LCP images (priority, sizes)', () => {
    const homeInteractiveSrc = fs.readFileSync(
      path.join(rootDir, 'src/app/HomePageInteractive.tsx'),
      'utf8'
    );
    expect(homeInteractiveSrc).toContain('poster={isMobileViewport ? CLOUDINARY_ASSETS.heroMobilePoster : CLOUDINARY_ASSETS.heroDesktopPoster}');
    expect(homeInteractiveSrc).toContain("preload={isMobileViewport ? 'none' : 'metadata'}");
    expect(homeInteractiveSrc).toContain('priority');
    expect(homeInteractiveSrc).toContain('sizes="100vw"');
    expect(homeInteractiveSrc).toContain('sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"');
  });

  it('provides a valid 1200x630 PNG OpenGraph image at public/og-image.png and references it in layout.tsx', () => {
    const ogPath = path.join(rootDir, 'public/og-image.png');
    expect(fs.existsSync(ogPath)).toBe(true);

    const buf = fs.readFileSync(ogPath);
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    expect(buf[0]).toBe(0x89);
    expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
    // IHDR chunk width (offset 16) and height (offset 20)
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);

    const layoutSrc = fs.readFileSync(path.join(rootDir, 'src/app/layout.tsx'), 'utf8');
    expect(layoutSrc).toContain('url: "/og-image.png"');
    expect(layoutSrc).toContain('width: 1200');
    expect(layoutSrc).toContain('height: 630');
    expect(layoutSrc).not.toContain('images: [{ url: "/logo.svg" }]');
  });

  it('deduplicates testimonials and uses distinct avatars across different names', () => {
    const testimonialsSrc = fs.readFileSync(
      path.join(rootDir, 'src/components/TestimonialsSection.tsx'),
      'utf8'
    );
    expect(testimonialsSrc).toContain('DISTINCT_FALLBACK_AVATARS');
    expect(testimonialsSrc).toContain('seenKeys');
    expect(testimonialsSrc).toContain('uniqueReviews');
  });

  it('normalizes "Prouduct" typos and standardizes "Center Tables" capitalization across the codebase', () => {
    const filesToCheck = [
      'src/app/HomePageInteractive.tsx',
      'src/lib/home-page-data.ts',
      'src/lib/catalog-api.ts',
      'src/app/api/admin/categories/route.ts',
      'src/app/api/v1/ai/chat/route.ts',
      'src/lib/ai/rag.ts',
    ];
    for (const relPath of filesToCheck) {
      const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
      expect(content).not.toContain("'Center tables'");
      expect(content).not.toContain('5. Center tables');
      expect(content).toContain('Center Tables');
    }

    const homeDataSrc = fs.readFileSync(path.join(rootDir, 'src/lib/home-page-data.ts'), 'utf8');
    expect(homeDataSrc).toContain('normalizeCatalogText');
  });

  it('fixes Decor & Lighting link, social links, hardcoded Notification 2 badge, and dead href="#" links', () => {
    const footerSrc = fs.readFileSync(path.join(rootDir, 'src/components/Footer.tsx'), 'utf8');
    expect(footerSrc).toContain("href: '/shop?category=Decor%20%26%20Lighting'");
    expect(footerSrc).not.toContain("{ label: 'Decor & Lighting', href: '/shop?category=Luxury%20Showcase' }");
    expect(footerSrc).toContain('https://facebook.com/fahadaliinterior');
    expect(footerSrc).toContain('https://instagram.com/fahadaliinterior');
    expect(footerSrc).toContain('https://pinterest.com/fahadaliinterior');
    expect(footerSrc).toContain('https://youtube.com/@fahadaliinterior');

    const navbarSrc = fs.readFileSync(path.join(rootDir, 'src/components/Navbar.tsx'), 'utf8');
    expect(navbarSrc).not.toContain(": '#'");
    expect(navbarSrc).not.toContain('href="#"');
    expect(navbarSrc).toContain("unreadCount > 0");
    expect(navbarSrc).toContain('https://facebook.com/fahadaliinterior');
    expect(navbarSrc).toContain('https://instagram.com/fahadaliinterior');
  });
});
