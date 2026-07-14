import { test, expect, type Page } from '@playwright/test';

async function enterStudio(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Continue with email/i }).click();
  await page.getByLabel(/Email address/i).fill('writer@katha.test');
  await page.getByRole('button', { name: /Send verification code/i }).click();
  await page.getByLabel(/6-digit code/i).fill('123456');
  await page.getByRole('button', { name: /Enter your studio/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  await page.evaluate(() => localStorage.setItem('katha_onboarding_complete', 'true'));
}

test.describe('Chapter editor (Narrative OS)', () => {
  test('demo chapter loads centered canvas without focus ring on click', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-rrr/chapters/1');
    await expect(page.locator('.narrative-os-app')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.narrative-stage-shell .canvas')).toBeVisible();
    const editor = page.locator('.narrative-os-app .ql-editor').first();
    await editor.click();
    const outline = await editor.evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(outline === '0px' || outline === '0').toBeTruthy();
  });

  test('slash opens command palette', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-rrr/chapters/1');
    await expect(page.locator('.narrative-os-app')).toBeVisible({ timeout: 20_000 });
    const editor = page.locator('.narrative-os-app .ql-editor').first();
    await editor.click();
    await editor.pressSequentially('/');
    await expect(page.locator('.cmdk.open')).toBeVisible({ timeout: 5000 });
  });
});