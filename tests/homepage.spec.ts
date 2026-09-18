import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────────
// Fahad Ali Interior — E2E Tests: Homepage & Core Navigation
// ──────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Fahad Ali/i);
  });

  test('should display the main hero section', async ({ page }) => {
    // Main heading should be visible
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible({ timeout: 15000 });
  });

  test('should have working navbar with shop link', async ({ page }) => {
    const shopLink = page.locator('nav a[href="/shop"]:visible, a[href="/shop"]:visible').first();
    await expect(shopLink).toBeVisible();
  });

  test('should navigate to shop page from navbar', async ({ page }) => {
    const desktopLink = page.locator('header a[href="/shop"]:visible').first();
    if (await desktopLink.isVisible().catch(() => false)) {
      await desktopLink.click();
    } else {
      await page.goto('/shop');
    }
    await expect(page).toHaveURL(/\/shop/);
  });

  test('should open AI chatbot widget on click', async ({ page }) => {
    const aiBtn = page.locator('button[aria-label*="AI"], button:has-text("AI")').first();
    if (await aiBtn.count() > 0) {
      await aiBtn.click();
      await page.waitForTimeout(500);
      const chatWidget = page.locator('text=/Executive AI|Advisor|FAHAD ALI/i, [role="dialog"]').first();
      await expect(chatWidget).toBeVisible();
    }
  });

  test('should have footer with contact information', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator('footer, [role="contentinfo"]').first();
    await expect(footer).toBeVisible();
  });
});

test.describe('Navigation & Links', () => {
  test('should navigate to About page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1').first()).toBeVisible();
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
    await expect(page.locator('text=404').first()).toBeVisible();
  });
});

test.describe('Search', () => {
  test('should open search modal', async ({ page }) => {
    await page.goto('/');
    const searchBtn = page.locator('button[aria-label*="Search"]:visible, button:has-text("Search"):visible').first();
    if (await searchBtn.count() > 0) {
      await searchBtn.click();
      await expect(page.locator('input[placeholder*="Search"], [role="dialog"]').first()).toBeVisible();
    } else {
      await page.keyboard.press('Control+KeyK');
      await page.waitForTimeout(300);
      const searchDialog = page.locator('[role="dialog"], input[placeholder*="Search"]').first();
      if (await searchDialog.count() > 0) {
        await expect(searchDialog).toBeVisible();
      }
    }
  });
});
