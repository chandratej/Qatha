import { defineConfig, devices } from '@playwright/test';

/**
 * Creator Studio browser E2E — multi-browser golden path (DEC-019).
 *
 *   npx playwright install
 *   npm run test:e2e
 *   npm run test:e2e:chromium   # single browser
 *
 * CI installs chromium+firefox+webkit via --with-deps.
 */
const isCI = !!process.env.CI;
const argvJoined = process.argv.join(' ');
const strictPlatform =
  process.env.E2E_STRICT_PLATFORM === 'true'
  || /reviewer-pool-strict|events-strict|review-workspace-a11y|review-workspace-perf/.test(argvJoined);
const enableEvents = process.env.VITE_FEATURE_EVENTS === 'true'
  || /events-strict/.test(argvJoined);
const enableMarketplace = process.env.VITE_FEATURE_MARKETPLACE === 'true'
  || strictPlatform;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_MOCK_MODE: 'true',
      VITE_USE_PLATFORM_API: strictPlatform ? 'true' : 'false',
      // Product-gated surfaces (P1-21) re-enabled only for the e2e suites that need them.
      VITE_FEATURE_MARKETPLACE: enableMarketplace ? 'true' : 'false',
      VITE_FEATURE_EVENTS: enableEvents ? 'true' : 'false',
      VITE_API_URL: process.env.VITE_API_URL || 'http://127.0.0.1:3001/api',
      VITE_STUDIO_LABS: 'false',
    },
  },
});
