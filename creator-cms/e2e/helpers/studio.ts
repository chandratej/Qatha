import { expect, type Locator, type Page } from '@playwright/test';

/** Stable English locale + onboarding bypass for Creator Studio E2E. */
export async function enterStudio(page: Page, email = 'writer@katha.test') {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('katha_studio_locale', 'en');
    localStorage.setItem('katha_onboarding_complete', 'true');
    // Legal Wave 0 — pre-accept DPDP + Creator Agreement (versions from packages/shared/creatorAgreement)
    localStorage.setItem('katha_creator_legal_consent_v1', 'dpdp_privacy_v1|creator_agreement_v1');
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

/** Wait until the Quill manuscript is interactive (not the loading skeleton). */
export async function waitForManuscriptEditor(page: Page): Promise<Locator> {
  const editor = page.locator('.narrative-os-app .ql-editor').first();
  await expect(editor).toBeVisible({ timeout: 20_000 });
  await expect(editor).toBeEditable();
  // Arrival overlay must not steal focus/clicks
  await expect(page.locator('.narrative-os-app .arrival:not(.hide)')).toHaveCount(0);
  return editor;
}

/**
 * Type into Quill without Ctrl+A / select-all.
 * Chrome-automation Ctrl+A is unreliable against this editor and was a major
 * source of false "keystroke loss" reports (prepend vs replace confusion).
 */
export async function typeIntoManuscript(
  editor: Locator,
  text: string,
  opts?: { clearFirst?: boolean },
) {
  await editor.click();
  if (opts?.clearFirst) {
    // Prefer Quill's own empty state over select-all
    await editor.evaluate((el) => {
      el.focus();
      // Place caret at end so we append predictably
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  }
  await editor.pressSequentially(text, { delay: 15 });
}