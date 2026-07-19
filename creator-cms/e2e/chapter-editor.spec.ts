import { test, expect } from '@playwright/test';
import { enterStudio, openDemoChapter } from './helpers/studio';

test.describe('Chapter editor (Narrative OS)', () => {
  test('demo chapter loads an editable manuscript canvas', async ({ page }) => {
    await openDemoChapter(page);
    const editor = page.locator('.narrative-os-app .ql-editor').first();
    await expect(editor).toBeVisible();
    await editor.click();
    await expect(editor).toBeEditable();
  });

  test('command palette opens via keyboard shortcut', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    await expect(page.locator('.narrative-os-app')).toBeVisible({ timeout: 20_000 });
    await page.locator('.narrative-os-app .ql-editor').first().click();
    await page.keyboard.press('Control+k');
    await expect(page.locator('.cmdk.open')).toBeVisible({ timeout: 5000 });
  });

  test('slash trigger types into the manuscript', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    await expect(page.locator('.narrative-os-app')).toBeVisible({ timeout: 20_000 });
    const editor = page.locator('.narrative-os-app .ql-editor').first();
    await editor.click();
    await page.keyboard.type('/');
    await expect(editor).toContainText('/');
  });

  test('empty demo chapter is immediately writable', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    await expect(page.locator('.narrative-os-app')).toBeVisible({ timeout: 20_000 });
    const editor = page.locator('.narrative-os-app .ql-editor').first();
    await expect(editor).toBeVisible();
    await expect(page.locator('.narrative-os-app .arrival:not(.hide)')).toHaveCount(0);
    await editor.click();
    await editor.pressSequentially('Test prose');
    await expect(editor).toContainText('Test prose');
  });
});