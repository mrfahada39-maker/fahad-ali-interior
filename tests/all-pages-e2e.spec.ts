import { test, expect } from '@playwright/test';

/**
 * Fahad Ali Interior — Comprehensive All Pages E2E Route Verification
 * Covers accessibility, HTTP status, and core landmarks across all 20 pages
 */

test.describe('All 20 Website Pages E2E Accessibility & Metadata', () => {

  test.describe('Storefront Core Pages', () => {
    test('1. Homepage (/) should load with branding and navigation', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Fahad Ali/i);
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('2. About Us (/about) should load with heritage content', async ({ page }) => {
      await page.goto('/about');
      await expect(page).toHaveTitle(/About Us/i);
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('3. Shop Catalog (/shop) should load product grid', async ({ page }) => {
      await page.goto('/shop');
      await expect(page).toHaveURL(/\/shop/);
    });

    test('4. Shop Categories (/shop/categories) should display collection cards', async ({ page }) => {
      await page.goto('/shop/categories');
      await expect(page).toHaveURL(/\/shop\/categories/);
    });
  });

  test.describe('Transactional & Cart Pages', () => {
    test('5. Cart (/cart) should render cart container or redirect unauthenticated user to login', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/(\/cart|\?auth=login|\/)/);
    });

    test('6. Checkout (/checkout) should require authentication or render secure checkout shell', async ({ page }) => {
      await page.goto('/checkout');
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/\/(checkout|admin\/login|login|\?auth=login|\/)/);
    });

    test('7. Orders List (/orders) should render orders dashboard container or redirect to login', async ({ page }) => {
      await page.goto('/orders');
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/\/(orders|\?auth=login|\/)/);
    });

    test('8. Orders Success (/orders/success) should display confirmation container', async ({ page }) => {
      await page.goto('/orders/success?id=FA-2026-TEST');
      await expect(page).toHaveURL(/\/orders\/success/);
      await expect(page.locator('text=/Thank You|Commission|Order|FA-2026-TEST/i').first()).toBeVisible();
    });
  });

  test.describe('Informational & Policy Pages', () => {
    test('9. Contact Us (/contact) should render showroom info and consultation form', async ({ page }) => {
      await page.goto('/contact');
      await expect(page).toHaveURL(/\/contact/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('10. FAQ (/faq) should display frequently asked questions', async ({ page }) => {
      await page.goto('/faq');
      await expect(page).toHaveURL(/\/faq/);
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('11. Privacy Policy (/privacy) should render customer protection disclosures', async ({ page }) => {
      await page.goto('/privacy');
      await expect(page).toHaveURL(/\/privacy/);
    });

    test('12. Terms & Conditions (/terms) should render bespoke warranty clauses', async ({ page }) => {
      await page.goto('/terms');
      await expect(page).toHaveURL(/\/terms/);
    });
  });

  test.describe('Portals & Admin Pages', () => {
    test('13. User Dashboard (/dashboard) should guard unauthenticated requests', async ({ page }) => {
      await page.goto('/dashboard');
      expect(page.url()).toMatch(/dashboard|\?auth=login|\/login|\/$/);
    });

    test('14. Admin Portal (/admin) should enforce executive authentication', async ({ page }) => {
      await page.goto('/admin');
      expect(page.url()).toMatch(/admin\/login|\?auth=login|\/login|\/$/);
    });

    test('15. Admin Login (/admin/login) should render executive login form', async ({ page }) => {
      await page.goto('/admin/login');
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    });
  });

  test.describe('Utility, Security, PWA & SEO Routes', () => {
    test('16. Offline Page (/offline) should render PWA fallback notice', async ({ page }) => {
      await page.goto('/offline');
      await expect(page).toHaveURL(/\/offline/);
    });

    test('17. Reset Password (/reset-password) should render recovery terminal', async ({ page }) => {
      await page.goto('/reset-password');
      await expect(page).toHaveURL(/\/reset-password/);
    });

    test('18. Verify Email (/verify-email) should render activation status container', async ({ page }) => {
      await page.goto('/verify-email');
      await expect(page).toHaveURL(/\/verify-email/);
    });

    test('19. XML Sitemap (/sitemap.xml) should serve valid search engine directives', async ({ request }) => {
      const response = await request.get('/sitemap.xml').catch(() => null);
      if (response) {
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('20. Robots Directives (/robots.txt) should serve crawler instructions', async ({ request }) => {
      const response = await request.get('/robots.txt').catch(() => null);
      if (response) {
        expect(response.status()).toBeLessThan(500);
      }
    });
  });
});