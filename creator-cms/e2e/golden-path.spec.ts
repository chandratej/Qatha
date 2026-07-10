import { test, expect } from '@playwright/test';

/**
 * Golden path smoke — DEC-019 / DEC-007
 * Mock mode: email OTP code 123456 (see Login.tsx).
 */
test.describe('Creator Studio golden path', () => {
  test('login is branded Katha', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toContainText(/కథ|Katha|Creator/i);
    await expect(page.getByText(/MOCK MODE/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /^Events$/i })).toHaveCount(0);
  });

  test('mock email OTP reaches studio shell', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /Continue with email/i }).click();
    await page.getByLabel(/Email address/i).fill('e2e.creator@katha.test');
    await page.getByRole('button', { name: /Send verification code/i }).click();

    await expect(page.getByLabel(/6-digit code/i)).toBeVisible({ timeout: 15_000 });
    await page.getByLabel(/Pen name/i).fill('E2E Creator');
    await page.getByLabel(/6-digit code/i).fill('123456');

    await page.getByRole('button', { name: /Enter your studio/i }).click();

    // Onboarding or dashboard
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.locator('body')).toContainText(/కథ|Dashboard|Stories|Onboarding|Studio|shelf/i);
  });

  test('labs routes show locked state when disabled', async ({ page }) => {
    // Authenticate first so LabsRoute (not login) is hit
    await page.goto('/login');
    await page.getByRole('button', { name: /Continue with email/i }).click();
    await page.getByLabel(/Email address/i).fill('e2e.labs@katha.test');
    await page.getByRole('button', { name: /Send verification code/i }).click();
    await page.getByLabel(/6-digit code/i).fill('123456');
    await page.getByRole('button', { name: /Enter your studio/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });

    await page.goto('/events');
    await expect(page.getByText(/Studio Labs is off/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Back to Stories/i })).toBeVisible();
  });
});
