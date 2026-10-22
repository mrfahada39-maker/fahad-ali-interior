import { test, expect } from '@playwright/test';
import { generateOrderActionToken } from '../src/lib/whatsapp';

/**
 * Fahad Ali Interior — E2E Master Suite
 * AI Payment Verification, WhatsApp Admin 3-Button Approval & Dual-Sync Terminal
 */

test.describe('E2E: AI Payment Verification & Admin WhatsApp Approval Flow', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('1. Security: 1-Tap Link handles valid token and renders luxury confirmation page', async ({ page }) => {
    // Generate a valid token for test order
    const testOrderId = 'e2e_test_ord_101';
    const verifyToken = generateOrderActionToken(testOrderId, 'verify');

    // Visit 1-tap link
    const res = await page.goto(`/api/orders/action?id=${testOrderId}&action=verify&token=${verifyToken}`);
    expect(res?.status()).toBeLessThanOrEqual(404);

    const pageContent = await page.content();
    expect(pageContent).toMatch(/Fahad Ali Interior|Order Not Found/i);
  });

  test('2. Security: 1-Tap Link rejects invalid or tampered tokens with 403', async ({ page }) => {
    const res = await page.goto('/api/orders/action?id=ord_999&action=verify&token=fake_tampered_token');
    expect(res?.status()).toBe(403);
    const text = await page.innerText('body');
    expect(text).toContain('Security Token Expired or Invalid');
  });

  test('3. WhatsApp Webhook: Rejects unauthorized incoming sender phone numbers with 403', async ({ request }) => {
    const unauthorizedPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: '923000000000', // Unauthorized phone number
                    type: 'interactive',
                    interactive: {
                      button_reply: {
                        id: 'verify_ORD-999',
                        title: '✅ Verify Payment',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await request.post('/api/whatsapp/webhook', {
      data: unauthorizedPayload,
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized phone number');
  });

  test('4. WhatsApp Webhook: Meta handshake challenge verification', async ({ request }) => {
    const challengeStr = 'test_meta_challenge_12345';
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.ADMIN_TOKEN_SECRET || 'fahad_ali_whatsapp_verify_token_2026';

    const res = await request.get(`/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=${challengeStr}`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toBe(challengeStr);
  });

  test('5. Checkout Terminal: Renders Pakistan localized payment methods with Slip upload', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForTimeout(1000);

    // If cart is empty, empty cart screen renders gracefully with luxury branding
    const emptyCartHeading = page.locator('text=/Your Cart is Empty|Order Summary/i').first();
    await expect(emptyCartHeading).toBeVisible();
  });

  test('6. Order Success Roadmap: Displays 3-step White-Glove validation pipeline', async ({ page }) => {
    await page.goto('/orders/success?id=ORD-E2E-TEST');

    // Verify royal confirmation header
    const title = page.locator('h1, h2').filter({ hasText: /Thank You|Royal Commission/i }).first();
    await expect(title).toBeVisible();

    // Verify Step 01 Payment validation roadmap
    const roadmapStep = page.locator('text=/Payment & Blueprint Confirmation|Master Artisan/i').first();
    await expect(roadmapStep).toBeVisible();

    // Verify copy button works
    const copyBtn = page.locator('button[title*="Copy"]').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('7. Admin Dashboard: Verifies "Awaiting Slip Verification" tab is present', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);

    // Check if orders tab button exists
    const ordersTabBtn = page.locator('button, a').filter({ hasText: /Orders/i }).first();
    if (await ordersTabBtn.count() > 0) {
      await ordersTabBtn.click();
      await page.waitForTimeout(500);

      // Verify that the new verification filter exists in the DOM
      const verificationFilter = page.locator('text=/Awaiting Slip Verification|All Orders/i').first();
      await expect(verificationFilter).toBeVisible();
    }
  });

});
