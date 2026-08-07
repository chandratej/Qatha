import { test, expect } from '@playwright/test';
import {
  enterStudio,
  openDemoChapter,
  typeIntoManuscript,
  waitForManuscriptEditor,
} from './helpers/studio';

test.describe('Chapter editor (Narrative OS)', () => {
  test('demo chapter loads an editable manuscript canvas', async ({ page }) => {
    await openDemoChapter(page);
    const editor = await waitForManuscriptEditor(page);
    await editor.click();
    await expect(editor).toBeEditable({ timeout: 10_000 });
  });

  test('command palette opens via keyboard shortcut', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);
    await editor.click();
    await page.keyboard.press('Control+k');
    await expect(page.locator('.cmdk.open')).toBeVisible({ timeout: 10_000 });
  });

  test('slash trigger types into the manuscript', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);
    await editor.click();
    await page.keyboard.type('/');
    await expect(editor).toContainText('/', { timeout: 10_000 });
  });

  test('empty demo chapter is immediately writable', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);
    // Digit marker only — Telugu phonetic engine rewrites roman prose.
    const marker = `42-${Date.now()}`;
    await typeIntoManuscript(editor, marker, { confirm: true });
    await expect(editor).toContainText(marker, { timeout: 10_000 });
  });
});