import { defineConfig, devices } from '@playwright/test';

/**
 * Fahad Ali Interior — Playwright E2E Test Configuration
 * Run: npm run test:e2e
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

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
  ],

  // Shared settings for all projects
  use: {
    // Base URL for all tests (local dev)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Ignore HTTPS errors in local dev
    ignoreHTTPSErrors: true,
  },

  // Test projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Global timeout
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  // Local dev server setup
  // Uncomment this if you want Playwright to auto-start the dev server:
  // webServer: {
  //   command: 'npm run dev:web',
  //   url: 'http://localhost:3002',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
