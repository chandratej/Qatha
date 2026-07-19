import { expect, type Page } from '@playwright/test';

/** Stable English locale + onboarding bypass for Creator Studio E2E. */
export async function enterStudio(page: Page, email = 'writer@katha.test') {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('katha_studio_locale', 'en');
    localStorage.setItem('katha_onboarding_complete', 'true');
    sessionStorage.setItem('katha-narrative-os-arrival-dismissed', '1');
  });
  await page.reload();

  await page.getByRole('button', { name: /Continue with email/i }).click();
  await page.getByLabel(/Email address/i).fill(email);
  await page.getByRole('button', { name: /Send verification code/i }).click();
  await page.getByLabel(/6-digit code/i).fill('123456');
  await page.getByRole('button', { name: /Enter your studio/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
}

export async function openDemoChapter(page: Page, chapterNum = 1) {
  await enterStudio(page);
  await page.goto(`/stories/demo-valley-te/chapters/${chapterNum}`);
  await expect(page.locator('.narrative-os-app')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.narrative-stage-shell .canvas')).toBeVisible();
}