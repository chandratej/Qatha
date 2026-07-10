import { test, expect, type Page } from '@playwright/test';

/**
 * Golden path smoke — DEC-019 / DEC-007
 * Mock mode: email OTP code 123456 (see Login.tsx).
 */

/** Events are core nav — bypass onboarding gate for contest E2E */
async function enterStudioShell(page: Page, email: string) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Continue with email/i }).click();
  await page.getByLabel(/Email address/i).fill(email);
  await page.getByRole('button', { name: /Send verification code/i }).click();
  await page.getByLabel(/6-digit code/i).fill('123456');
  await page.getByRole('button', { name: /Enter your studio/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  await page.evaluate(() => localStorage.setItem('katha_onboarding_complete', 'true'));
  await page.goto('/');
  await page.waitForURL((url) => !url.pathname.includes('/onboarding'), { timeout: 15_000 });
}

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

  test('events are core nav and registration page loads', async ({ page }) => {
    await enterStudioShell(page, 'e2e.events@katha.test');

    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Events' }),
    ).toBeVisible({ timeout: 10_000 });

    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Events & Contests/i })).toBeVisible({ timeout: 15_000 });
    // Should NOT be Labs-locked
    await expect(page.getByText(/Studio Labs is off/i)).toHaveCount(0);
  });

  test('author can register for a free contest', async ({ page }) => {
    await enterStudioShell(page, 'e2e.register@katha.test');

    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Open for registration/i })).toBeVisible({ timeout: 15_000 });

    const freeContestLink = page.getByRole('link', { name: /Register free/i }).first();
    await freeContestLink.click();

    await expect(page.getByRole('navigation', { name: /Your contest progress/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Register free/i }).click();

    await expect(page.getByText(/You're registered/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('status')).toContainText(/Registered free/i);
  });

  test('author can request peer review when Labs is on', async ({ page }) => {
    await page.route('**/creators/stories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stories: [{
            id: 'e2e-story-review',
            title: 'E2E Manuscript for Review',
            chapter_count: 1,
            moderation_status: 'draft',
          }],
          mock: true,
        }),
      });
    });

    await enterStudioShell(page, 'e2e.review@katha.test');
    await page.evaluate(() => localStorage.setItem('katha_studio_labs', '1'));
    await page.reload();

    await page.goto('/reviewers');
    await expect(page.getByRole('heading', { name: /Professional Review Ecosystem/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Studio Labs is off/i)).toHaveCount(0);

    await page.getByRole('button', { name: /Request community review/i }).click();
    await expect(page.getByText(/community review queued|Literary Council matched/i)).toBeVisible({ timeout: 10_000 });
  });
});

