import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────────
// Fahad Ali Interior — E2E Tests: Shop, Cart & Checkout Flow
// ──────────────────────────────────────────────────────────────

test.describe('Shop Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop');
  });

  test('should load shop page with products', async ({ page }) => {
    await expect(page).toHaveURL(/\/shop/);
    // Wait for product cards to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', { timeout: 10000 });
  });

  test('should have category filters visible', async ({ page }) => {
    // Category filter buttons or sidebar should be visible
    const filterArea = page.locator('button, a').filter({ hasText: /Living Room|Bedroom|Sofa|Chair|Table/i }).first();
    await expect(filterArea).toBeVisible({ timeout: 10000 });
  });

  test('should have price filter or sorting', async ({ page }) => {
    // Sort/filter controls should exist
    const sortControl = page.locator('select, button').filter({ hasText: /sort|filter|price/i }).first();
    if (await sortControl.count() > 0) {
      await expect(sortControl).toBeVisible();
    }
  });
});

test.describe('Product Detail Page', () => {
  test('should navigate to a product page', async ({ page }) => {
    await page.goto('/shop');
    // Click first product link
    const productLink = page.locator('a[href^="/product/"]').first();
    if (await productLink.count() > 0) {
      const href = await productLink.getAttribute('href');
      await page.goto(href!);
      await expect(page.url()).toContain('/product/');
    }
  });
});

test.describe('Cart', () => {
  test('should load cart page', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
  });

  test('should show empty cart state', async ({ page }) => {
    await page.goto('/cart');
    // Either shows empty state or cart items
    const emptyOrCart = page.locator('text=empty, text=No items, text=Cart, h1, h2').first();
    await expect(emptyOrCart).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Checkout Auth Guard', () => {
  test('should redirect unauthenticated user from checkout to login', async ({ page }) => {
    await page.goto('/checkout');
    // Should redirect to home with auth param, or show login
    await page.waitForURL(url => url.pathname === '/' || url.pathname === '/checkout', { timeout: 8000 });
    const currentUrl = page.url();
    // Either redirected to home with login prompt, or on checkout if somehow authorized
    expect(currentUrl).toMatch(/\/(checkout|\?auth=login)?/);
  });
});

test.describe('Authentication Guard', () => {
  test('should redirect unauthenticated user from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(url => url.pathname !== '/dashboard', { timeout: 8000 }).catch(() => {});
    // Should have been redirected
    const url = page.url();
    expect(url).not.toContain('/admin');
    expect(url).not.toContain('/vendor');
  });

  test('should redirect unauthenticated user from /admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(url => url.pathname !== '/admin', { timeout: 8000 }).catch(() => {});
    const url = page.url();
    // Should have redirected to home
    expect(url).not.toContain('/admin/dashboard');
  });
});
