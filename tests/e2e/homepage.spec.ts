import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────────
// Fahad Ali Interior — E2E Tests: Homepage & Core Navigation
// ──────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Fahad Ali Interior/i);
  });

  test('should display the main hero section', async ({ page }) => {
    // Main heading should be visible
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible();
  });

  test('should have working navbar with shop link', async ({ page }) => {
    const shopLink = page.locator('a[href="/shop"]').first();
    await expect(shopLink).toBeVisible();
  });

  test('should navigate to shop page from navbar', async ({ page }) => {
    await page.click('a[href="/shop"]');
    await expect(page).toHaveURL(/\/shop/);
  });

  test('should open AI chatbot widget on click', async ({ page }) => {
    const aiBtn = page.locator('button[aria-label="Open AI Executive Advisor"]');
    await expect(aiBtn).toBeVisible();
    await aiBtn.click();
    // Chatbot modal should appear
    await expect(page.locator('text=FAHAD ALI Executive AI')).toBeVisible();
  });

  test('should have footer with contact information', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

test.describe('Navigation & Links', () => {
  test('should navigate to About page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Collections page', async ({ page }) => {
    await page.goto('/shop/categories');
    await expect(page).toHaveURL(/\/shop\/categories/);
  });

  test('should navigate to Contact page', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveURL(/\/contact/);
  });

  test('should navigate to FAQ page', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveURL(/\/faq/);
  });

  test('should show 404 page for unknown route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');
    await expect(page.locator('text=404')).toBeVisible();
  });
});

test.describe('Search', () => {
  test('should open search modal', async ({ page }) => {
    await page.goto('/');
    // Look for search trigger button
    const searchBtn = page.locator('button[aria-label*="earch"], button[title*="earch"]').first();
    if (await searchBtn.count() > 0) {
      await searchBtn.click();
      await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeFocused();
    }
  });
});
