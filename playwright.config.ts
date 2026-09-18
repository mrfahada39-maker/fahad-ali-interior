import { defineConfig, devices } from '@playwright/test';

/**
 * Fahad Ali Interior — Playwright E2E Test Configuration
 * Run: npm run test:e2e
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run all tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is accidentally left
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for all tests (local dev)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Ignore HTTPS errors in local dev
    ignoreHTTPSErrors: true,

    // Navigation timeout
    navigationTimeout: 60000,
  },

  // Test projects for major browsers (Desktop & Mobile Chrome)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Workers: 1 to ensure sequential execution and avoid dev server recompilation lock
  workers: 1,

  // Global timeout (60 seconds for Next.js compilation)
  timeout: 60000,
  expect: {
    timeout: 15000,
  },

  // Local dev server setup
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
