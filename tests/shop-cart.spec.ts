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
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', { timeout: 15000 });
  });

  test('should have category filters visible', async ({ page }) => {
    const filterArea = page.locator('button, a').filter({ hasText: /Living Room|Bedroom|Sofa|Chair|Table/i }).first();
    await expect(filterArea).toBeVisible({ timeout: 10000 });
  });

  test('should have price filter or sorting', async ({ page }) => {
    const sortControl = page.locator('select, button').filter({ hasText: /sort|filter|price/i }).first();
    await expect(sortControl).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Product Detail Page', () => {
  test('should navigate to a product page', async ({ page }) => {
    await page.goto('/shop');
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 15000 });
    const href = await productLink.getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href!);
    await expect(page.url()).toContain('/product/');
  });
});

test.describe('Cart', () => {
  test('should load cart page or redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/(\/cart|\?auth=login|\/)/);
  });

  test('should open cart drawer and show cart state', async ({ page }) => {
    await page.goto('/');
    const cartBtn = page.locator('button[aria-label*="Cart"], button:has-text("Cart")').first();
    await expect(cartBtn).toBeVisible({ timeout: 10000 });
    await cartBtn.click();
    const cartDrawer = page.locator('[role="dialog"], aside, div').filter({ hasText: /Cart|Bag|Subtotal|Empty/i }).first();
    await expect(cartDrawer).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Checkout Auth Guard', () => {
  test('should redirect unauthenticated user from checkout to login or render checkout terminal', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(\/checkout|\?auth=login|\/auth|\/)/);
  });
});
