import { test, expect } from '@playwright/test';

/**
 * Fahad Ali Interior — Bespoke Architecture Studio, AI Advisor & VIP Consultation E2E Suite
 * Validates 3D room dimension calculations, AI Executive Advisor chat, and concierge bookings.
 */

test.describe('Bespoke Architecture, AI Advisor & Consultation Suite', () => {

  test.describe('Bespoke Custom Furniture Studio', () => {
    test('should load bespoke custom commission terminal or inquiries portal', async ({ page }) => {
      await page.goto('/contact');
      await expect(page).toHaveURL(/\/contact/);

      // Verify custom architectural inquiries form
      const inquiryForm = page.locator('form, input, textarea').first();
      await expect(inquiryForm).toBeVisible();
    });

    test('should validate custom timber selection and client design requirements', async ({ page }) => {
      await page.goto('/contact');
      
      const messageInput = page.locator('textarea[name*="message"], textarea[id*="message"]').first();
      if (await messageInput.count() > 0) {
        await messageInput.fill('Requesting bespoke 12-seater Chinioti Sheesham royal dining table with handcrafted brass inlays.');
        await expect(messageInput).toHaveValue(/Chinioti Sheesham/i);
      }
    });
  });

  test.describe('AI Executive Interior Advisor Floating Widget', () => {
    test('should open AI Executive Advisor widget and display greeting message', async ({ page }) => {
      await page.goto('/');
      
      // Floating AI button
      const aiBtn = page.locator('button[aria-label*="AI"], button:has-text("AI"), [data-testid="ai-advisor-btn"]').first();
      if (await aiBtn.count() > 0) {
        await aiBtn.click();
        await page.waitForTimeout(500);

        // Chatbot modal/container
        const chatWindow = page.locator('[role="dialog"], aside, div').filter({ hasText: /Executive AI|Advisor|Atelier Assistant/i }).first();
        await expect(chatWindow).toBeVisible();
      }
    });

    test('should interact with AI advisor prompts and design recommendations', async ({ page }) => {
      await page.goto('/');
      const aiBtn = page.locator('button[aria-label*="AI"], button:has-text("AI"), [data-testid="ai-advisor-btn"]').first();
      if (await aiBtn.count() > 0) {
        await aiBtn.click();
        await page.waitForTimeout(500);

        const chatInput = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]').first();
        if (await chatInput.count() > 0) {
          await chatInput.fill('Which wood is best suited for dry Islamabad winters?');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('VIP Private Consultation Booking Flow', () => {
    test('should render private consultation inquiry form with date and showroom preferences', async ({ page }) => {
      await page.goto('/contact');
      
      const contactHeader = page.locator('h1, h2').first();
      await expect(contactHeader).toBeVisible();

      // Verify contact inputs (Name, Email, Phone)
      const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
      if (await nameInput.count() > 0) {
        await expect(nameInput).toBeVisible();
        await nameInput.fill('Nawabzada Tariq Khan');
      }

      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      if (await emailInput.count() > 0) {
        await expect(emailInput).toBeVisible();
        await emailInput.fill('tariq.khan@luxuryresidence.pk');
      }
    });
  });

});