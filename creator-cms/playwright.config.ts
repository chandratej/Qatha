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
const strictPlatform =
  process.env.E2E_STRICT_PLATFORM === 'true'
  || process.argv.some((arg) => arg.includes('reviewer-pool-strict'));

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
      VITE_API_URL: process.env.VITE_API_URL || 'http://127.0.0.1:3001/api',
      VITE_STUDIO_LABS: 'false',
    },
  },
});
