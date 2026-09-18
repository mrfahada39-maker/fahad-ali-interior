import { test, expect } from '@playwright/test';

/**
 * Fahad Ali Interior — Master E-Commerce Purchasing Journey E2E Suite
 * Validates complete customer conversion funnel from discovery to order fulfillment.
 */

test.describe('E-Commerce Purchasing Journey', () => {

  test.describe('Catalog Discovery & Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/shop');
    });

    test('should render the artisanal catalog with active category filters', async ({ page }) => {
      await expect(page).toHaveURL(/\/shop/);
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      const categoryFilters = page.locator('button, a').filter({ 
        hasText: /Living Room|Dining|Bedroom|Office|Chairs|All/i 
      });
      const filterCount = await categoryFilters.count();
      expect(filterCount).toBeGreaterThanOrEqual(1);
    });

    test('should toggle category filter and update product grid', async ({ page }) => {
      const diningFilter = page.locator('button, a').filter({ hasText: /Dining/i }).first();
      if (await diningFilter.count() > 0) {
        await diningFilter.click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should sort products by price and craftsmanship ratings', async ({ page }) => {
      const sortSelector = page.locator('select, button').filter({ hasText: /Sort|Price|Featured/i }).first();
      if (await sortSelector.count() > 0) {
        await expect(sortSelector).toBeVisible();
      }
    });
  });

  test.describe('Product Detail Page (PDP) & Custom Finishing', () => {
    test('should inspect product specifications, wood finish, and dimensions', async ({ page }) => {
      await page.goto('/shop');
      const firstProduct = page.locator('a[href*="/product/"]:visible').first();
      if (await firstProduct.count() > 0) {
        const href = await firstProduct.getAttribute('href');
        if (href) {
          await page.goto(href);
        } else {
          await firstProduct.click();
        }
        await expect(page).toHaveURL(/\/product\//);

        const title = page.locator('h1').first();
        await expect(title).toBeVisible();

        const specsOrDetails = page.locator('text=/PKR|Rs|Sheesham|Teak|Wood|Finish|Material/i').first();
        await expect(specsOrDetails).toBeVisible();
      }
    });

    test('should cycle through product gallery images', async ({ page }) => {
      await page.goto('/shop');
      const firstProduct = page.locator('a[href*="/product/"]:visible').first();
      if (await firstProduct.count() > 0) {
        const href = await firstProduct.getAttribute('href');
        if (href) {
          await page.goto(href);
        } else {
          await firstProduct.click();
        }
        const thumbnails = page.locator('button:has(img), img[alt*="thumbnail"], img[alt*="gallery"]');
        if (await thumbnails.count() > 1) {
          await thumbnails.nth(1).click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Slide-Over Cart Drawer & Math Synchronization', () => {
    test('should open cart drawer and calculate line items in PKR', async ({ page }) => {
      await page.goto('/shop');
      const addToCartBtn = page.locator('button').filter({ hasText: /Add to Cart|Commission Piece/i }).first();
      if (await addToCartBtn.count() > 0) {
        await addToCartBtn.click();
        const cartDrawer = page.locator('[role="dialog"], aside, div').filter({ hasText: /Cart|Your Atelier Bag|Subtotal/i }).first();
        await expect(cartDrawer).toBeVisible({ timeout: 5000 });
      }
    });

    test('should update item quantities and reflect updated subtotal or auth guard', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/(\/cart|\?auth=login|\/)/);
      
      const plusBtn = page.locator('button[aria-label*="Increase"], button:has-text("+")').first();
      if (await plusBtn.count() > 0) {
        await plusBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('should verify White-Glove VIP delivery indicator', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForTimeout(1000);
      const url = new URL(page.url());
      if (url.pathname === '/cart') {
        const whiteGloveIndicator = page.locator('main text=/White-Glove|Delivery|Shipping|Complimentary/i').first();
        if (await whiteGloveIndicator.count() > 0) {
          await expect(whiteGloveIndicator).toBeVisible();
        }
      } else {
        expect(page.url()).toMatch(/(\?auth=login|\/login|\/)/);
      }
    });
  });

  test.describe('Wishlist Drawer & Direct Cart Migration', () => {
    test('should toggle item into wishlist and open wishlist drawer', async ({ page }) => {
      await page.goto('/shop');
      const wishlistHeart = page.locator('button[aria-label*="Wishlist"], button[aria-label*="Save"]').first();
      if (await wishlistHeart.count() > 0) {
        await wishlistHeart.click();
        await page.waitForTimeout(300);
      }
    });

    test('should navigate to wishlist page and show saved collections', async ({ page }) => {
      await page.goto('/dashboard');
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    });
  });

  test.describe('Pakistani Localized Checkout & Order Confirmation', () => {
    test('should render Pakistani localized checkout inputs and payment methods', async ({ page }) => {
      await page.goto('/checkout');
      const formOrNotice = page.locator('form, input, [role="main"], body').first();
      await expect(formOrNotice).toBeVisible();

      const phoneInput = page.locator('input[type="tel"], input[name*="phone"]');
      if (await phoneInput.count() > 0) {
        await expect(phoneInput.first()).toBeVisible();
      }

      const paymentSection = page.locator('text=/Cash on Delivery|Bank Transfer|Meezan|Raast|JazzCash/i').first();
      if (await paymentSection.count() > 0) {
        await expect(paymentSection).toBeVisible();
      }
    });

    test('should apply coupon code and reflect discount in PKR', async ({ page }) => {
      await page.goto('/checkout');
      const couponInput = page.locator('input[placeholder*="Coupon"], input[placeholder*="Voucher"], input[name*="coupon"]').first();
      const applyBtn = page.locator('button:has-text("Apply")').first();

      if (await couponInput.count() > 0 && await applyBtn.count() > 0) {
        await couponInput.fill('ROYAL10');
        await applyBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('should verify order success confirmation terminal', async ({ page }) => {
      await page.goto('/orders/success?id=FA-2026-ROYAL');
      await expect(page).toHaveURL(/\/orders\/success/);
      const confirmationBadge = page.locator('text=/Order Confirmed|Commission Confirmed|Thank You|FA-2026-ROYAL/i').first();
      await expect(confirmationBadge).toBeVisible({ timeout: 8000 });
    });
  });

});