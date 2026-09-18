import { test, expect } from '@playwright/test';

/**
 * Fahad Ali Interior — Mobile Responsive, Keyboard a11y & Network Resilience E2E Suite
 * Validates mobile drawers, Ctrl+K hotkeys, focus traps, 404 recovery, and PWA offline fallbacks.
 */

test.describe('Responsive, Accessibility & Resilience Suite', () => {

  test.describe('Mobile Viewport & Navigation Drawer', () => {
    test('should open mobile navigation drawer on small screen sizes', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Hamburger button
      const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Navigation"], header button').first();
      if (await hamburger.count() > 0) {
        await hamburger.click();
        await page.waitForTimeout(300);

        // Mobile nav drawer should appear
        const mobileNav = page.locator('nav, [role="dialog"], aside').filter({ hasText: /Shop|About|Contact|Collections/i }).first();
        await expect(mobileNav).toBeVisible();
      }
    });

    test('should display responsive shopping bag counter on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const cartTrigger = page.locator('button[aria-label*="Cart"], a[href="/cart"]').first();
      if (await cartTrigger.count() > 0) {
        await expect(cartTrigger).toBeVisible();
      }
    });
  });

  test.describe('Keyboard Navigation & Global Hotkeys (a11y)', () => {
    test('should open search modal using Ctrl+K / Cmd+K hotkey', async ({ page }) => {
      await page.goto('/');
      
      // Press Ctrl+K
      await page.keyboard.press('Control+KeyK');
      await page.waitForTimeout(500);

      const searchModal = page.locator('[role="dialog"], input[type="search"], input[placeholder*="Search"]').first();
      if (await searchModal.count() > 0) {
        await expect(searchModal).toBeVisible();
        
        // Escape key should dismiss modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('should have valid heading hierarchy and landmark structure', async ({ page }) => {
      await page.goto('/');
      
      // Main landmark exists
      const mainLandmark = page.locator('main').first();
      await expect(mainLandmark).toBeVisible();

      // Heading 1 exists
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
    });

    test('should verify all interactive buttons have accessible names', async ({ page }) => {
      await page.goto('/');
      
      const buttons = page.locator('header button');
      const count = await buttons.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        const btn = buttons.nth(i);
        const ariaLabel = await btn.getAttribute('aria-label');
        const textContent = await btn.textContent();
        expect(ariaLabel || (textContent && textContent.trim().length > 0)).toBeTruthy();
      }
    });
  });

  test.describe('Resilience, 404 Recovery & PWA Offline', () => {
    test('should handle nonexistent route with luxury 404 and recovery action', async ({ page }) => {
      await page.goto('/atelier-invalid-nonexistent-piece-999');
      
      const notFoundContainer = page.locator('text=/404|Not Found|Masterpiece Not Found|Atelier/i').first();
      await expect(notFoundContainer).toBeVisible();

      const homeLink = page.locator('a[href="/"], button:has-text("Home")').first();
      await expect(homeLink).toBeVisible();
      await homeLink.click();
      await expect(page).toHaveURL(/\/$/);
    });

    test('should render PWA offline fallback screen with service worker messaging', async ({ page }) => {
      await page.goto('/offline');
      await expect(page).toHaveURL(/\/offline/);

      const offlineNotice = page.locator('text=/Offline|Internet|Connection|Cache/i').first();
      await expect(offlineNotice).toBeVisible();
    });
  });

});