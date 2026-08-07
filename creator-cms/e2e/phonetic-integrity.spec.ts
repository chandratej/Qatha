import { test, expect } from '@playwright/test';
import { enterStudio, waitForManuscriptEditor, typeIntoManuscript } from './helpers/studio';

/**
 * Telugu-first phonetic integrity (Pramukh-style).
 * Space/Enter/Tab accept the selected suggestion; rare English via $ / ` / ALL-CAPS.
 */
test.describe('Phonetic integrity', () => {
  test('Space accepts suggestion and continues typing (Pramukh-style)', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);
    await editor.click();

    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    // Roman input is intentionally converted — do not confirm exact latin text
    await typeIntoManuscript(editor, 'satyam', { confirm: false });
    // Space accepts selected suggestion + word break
    await page.keyboard.press('Space');
    await page.waitForTimeout(350);

    await expect(editor).toContainText('సత్యం', { timeout: 10_000 });

    await typeIntoManuscript(editor, 'amma', { confirm: false });
    await page.keyboard.press('Space');
    await page.waitForTimeout(350);

    const after = await editor.innerText();
    expect(after).toMatch(/సత్యం/);
    expect(after).toMatch(/అమ్మ/);
    expect(after).not.toMatch(/(.)\1{20,}/);
  });

  test('Enter accepts suggestion when menu is open', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);
    await editor.click();

    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    await typeIntoManuscript(editor, 'prema', { confirm: false });
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);

    const text = await editor.innerText();
    expect(text).toMatch(/ప్రేమ/);
  });

  test('literal English via $ and backtick escapes', async ({ page }) => {
    await enterStudio(page);
    await page.goto('/stories/demo-valley-te/chapters/99');
    const editor = await waitForManuscriptEditor(page);
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    // insertText avoids OS keyboard-layout issues with ` and $
    await editor.evaluate((el) => {
      el.focus();
      document.execCommand('insertText', false, '$Netflix `Amazon` satyam. ');
    });
    await page.waitForTimeout(450);

    const text = await editor.innerText();
    expect(text).toMatch(/Netflix/);
    expect(text).toMatch(/Amazon/);
    expect(text).toMatch(/సత్యం/);
    expect(text).not.toContain('$');
  });
});
