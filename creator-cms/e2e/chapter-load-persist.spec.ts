import { test, expect } from '@playwright/test';
import {
  enterStudio,
  typeIntoManuscript,
  waitForManuscriptEditor,
} from './helpers/studio';

/**
 * Settles the "silent keystroke loss on chapter open" question with a
 * reliable harness (no Ctrl+A, assert immediately + after settle window).
 *
 * Markers use digits/symbols only so live Telugu phonetic conversion does not
 * rewrite the token mid-assert (that false-negative looked like "loss").
 *
 * Demo chapters use the sync isDemo load path — still exercises readiness,
 * SPA chapter switches, and survival past autosave debounce.
 *
 * Async generation-guard unit coverage: src/lib/chapterLoadGuard.test.ts
 */
function uniqueMarker(prefix: string) {
  // No roman letters — phonetic engine would rewrite "persist" → Telugu glyphs.
  return `${prefix}-${Date.now()}`;
}

test.describe('Chapter load typing persistence', () => {
  test('typed prose lands immediately and survives a long settle window', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);

    const marker = uniqueMarker('99');
    await typeIntoManuscript(editor, marker);

    // Immediate — distinguishes "never landed" from "landed then reverted"
    await expect(editor).toContainText(marker);

    // Well past typical autosave / late-fetch windows
    await page.waitForTimeout(5_000);
    await expect(editor).toContainText(marker);
  });

  test('SPA chapter switch then type — content sticks after settle', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/1');
    await waitForManuscriptEditor(page);

    // Real in-app SPA hop via chapter list (React Router navigate), not hard reload.
    // Chapter nav can sit in a scrollable side panel — DOM click avoids viewport flakiness.
    const chapterList = page.getByRole('listbox', { name: /Switch chapter|అధ్యాయం మార్చండి/i });
    await expect(chapterList).toBeVisible({ timeout: 10_000 });

    const other = chapterList.locator('[role="option"]:not([aria-selected="true"])').first();
    if (await other.count()) {
      await other.evaluate((el) => (el as HTMLButtonElement).click());
      await page.waitForURL(/\/chapters\/\d+/, { timeout: 10_000 });
      await waitForManuscriptEditor(page);
    }

    // Prefer empty-ish chapter 99 when listed; else hard-load it once
    const ch99 = chapterList.locator('[role="option"]').filter({ hasText: /99/ }).first();
    if (await ch99.count()) {
      await ch99.evaluate((el) => (el as HTMLButtonElement).click());
      await page.waitForURL(/\/chapters\/99/, { timeout: 10_000 });
    } else {
      await page.goto('/stories/demo-valley-te/chapters/99');
    }

    const editor = await waitForManuscriptEditor(page);
    const marker = uniqueMarker('77');
    await typeIntoManuscript(editor, marker);
    await expect(editor).toContainText(marker);
    await page.waitForTimeout(3_000);
    await expect(editor).toContainText(marker);
  });

  test('editor is only typed after ready — content lands', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);
    await expect(editor).toBeEditable();

    const marker = uniqueMarker('55');
    await typeIntoManuscript(editor, marker);
    await expect(editor).toContainText(marker);
  });
});
