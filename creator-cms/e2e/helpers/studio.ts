import { expect, type Locator, type Page } from '@playwright/test';

export type MockLoginOptions = {
  email?: string;
  displayName?: string;
  /** Must match the userId segment of mock-token-${userId}-${issuedAt}. */
  userId?: string;
  role?: string;
  reviewerSlot?: string;
  /**
   * When true (default), navigate after seeding so AuthContext hydrates and
   * localStorage is on the app origin. Set false when only addInitScript is needed
   * before a later page.goto in the same test.
   */
  navigate?: boolean;
  /** Path used when navigate is true. Default `/`. */
  path?: string;
};

/**
 * Programmatic mock auth for E2E — bypasses flaky UI OTP login.
 *
 * Seeds the real AuthContext storage shape (`katha_creator_auth` +
 * `mock-token-${userId}-${issuedAt}`) via addInitScript so the first app
 * navigation already hydrates as authenticated (VITE_MOCK_MODE=true).
 */
export async function loginAsMockUser(page: Page, opts: MockLoginOptions = {}) {
  const userId = opts.userId ?? 'demo-creator-001';
  const email = opts.email ?? 'writer@katha.test';
  const displayName = opts.displayName ?? (email.split('@')[0] || 'E2E Creator');
  const role = opts.role ?? 'creator';
  const reviewerSlot = opts.reviewerSlot ?? 'slot-1';
  const issuedAt = Date.now();
  const token = `mock-token-${userId}-${issuedAt}`;
  const shouldNavigate = opts.navigate !== false;
  const path = opts.path ?? '/';

  await page.addInitScript(
    ({ userId: id, email: userEmail, displayName: name, role: userRole, token: sessionToken, reviewerSlot: slot }) => {
      try {
        localStorage.setItem('katha_studio_locale', 'en');
        localStorage.setItem('katha_onboarding_complete', 'true');
        localStorage.setItem(
          'katha_creator_legal_consent_v1',
          'dpdp_privacy_v1|creator_agreement_v1',
        );
        // platformStore key (not katha_linked_reviewer_slot)
        if (!localStorage.getItem('katha_reviewer_slot')) {
          localStorage.setItem('katha_reviewer_slot', slot);
        }
        // Only seed auth when absent so tests can promote role / mutate session and reload.
        if (!localStorage.getItem('katha_creator_auth')) {
          localStorage.setItem(
            'katha_creator_auth',
            JSON.stringify({
              user: {
                id,
                phone: '',
                email: userEmail,
                role: userRole,
                display_name: name,
                subscription_status: 'free',
                phone_verified: false,
              },
              token: sessionToken,
            }),
          );
        }
        sessionStorage.setItem('katha-narrative-os-arrival-dismissed', '1');
      } catch {
        // ignore quota / private-mode failures in CI
      }
    },
    { userId, email, displayName, role, token, reviewerSlot },
  );

  if (shouldNavigate) {
    await page.goto(path);
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  }
}

/**
 * Stable English locale + mock session for Creator Studio E2E.
 * Prefer this over UI OTP unless the test is specifically covering the login form.
 */
export async function enterStudio(page: Page, email = 'writer@katha.test') {
  await loginAsMockUser(page, {
    email,
    displayName: email.split('@')[0] || 'Writer',
    path: '/',
  });
}

/**
 * Full mock email OTP UI flow — use only when the test must exercise Login.tsx.
 * Prefer loginAsMockUser / enterStudio for setup in beforeEach.
 */
export async function enterStudioViaUi(page: Page, email = 'writer@katha.test') {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('katha_studio_locale', 'en');
    localStorage.setItem('katha_onboarding_complete', 'true');
    localStorage.setItem('katha_creator_legal_consent_v1', 'dpdp_privacy_v1|creator_agreement_v1');
    sessionStorage.setItem('katha-narrative-os-arrival-dismissed', '1');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });

  const continueBtn = page.getByRole('button', { name: /Continue with email/i });
  await continueBtn.waitFor({ state: 'visible', timeout: 20_000 });
  await continueBtn.click();

  const emailInput = page.getByLabel(/Email address/i);
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.fill(email);

  const sendCodeBtn = page.getByRole('button', { name: /Send verification code/i });
  await sendCodeBtn.waitFor({ state: 'visible', timeout: 20_000 });
  await sendCodeBtn.click();

  const codeInput = page.getByLabel(/6-digit code/i);
  await codeInput.waitFor({ state: 'visible', timeout: 10_000 });
  await codeInput.fill('123456');

  const enterBtn = page.getByRole('button', { name: /Enter your studio/i });
  await enterBtn.waitFor({ state: 'visible', timeout: 20_000 });
  await enterBtn.click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
}

export async function openDemoChapter(page: Page, chapterNum = 1) {
  await enterStudio(page);
  await page.goto(`/stories/demo-valley-te/chapters/${chapterNum}`);
  await waitForManuscriptEditor(page);
}

/**
 * Wait until Narrative OS shell + Quill manuscript are interactive.
 * Call after navigating to a chapter route (not Review Workspace — that uses #rw-main-reading).
 */
export async function waitForManuscriptEditor(
  page: Page,
  timeout = 25_000,
): Promise<Locator> {
  const editorSelector = '.narrative-os-app .ql-editor';

  // App shell must mount before the editor attaches
  await page.locator('.narrative-os-app').waitFor({ state: 'visible', timeout });

  // Optional canvas chrome (some builds omit stage shell briefly)
  const canvas = page.locator('.narrative-stage-shell .canvas, .narrative-os-app .ql-container');
  await canvas.first().waitFor({ state: 'attached', timeout }).catch(() => {});

  // Vite HMR / long-polls often never go fully idle — best-effort only
  await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 8_000) }).catch(() => {});

  await page.waitForSelector(editorSelector, { state: 'attached', timeout });

  const editor = page.locator(editorSelector).first();
  await expect(editor).toBeVisible({ timeout });
  await expect(editor).toBeEditable({ timeout });

  // contentEditable must be live (not a loading skeleton)
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      return Boolean(el && (el.isContentEditable || el.getAttribute('contenteditable') === 'true'));
    },
    editorSelector,
    { timeout },
  );

  // Arrival overlay must not steal focus/clicks
  await expect(page.locator('.narrative-os-app .arrival:not(.hide)')).toHaveCount(0, {
    timeout,
  });

  return editor;
}

/**
 * Wait for Review Studio shell readiness (assignment workspace, not chapter editor).
 */
export async function waitForReviewWorkspace(page: Page, timeout = 25_000) {
  await page.locator('#rw-main-reading').waitFor({ state: 'attached', timeout }).catch(async () => {
    await page.getByRole('main').waitFor({ state: 'visible', timeout });
  });
  await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 8_000) }).catch(() => {});
  await expect(page.locator('#rw-main-reading, .rw-shell').first()).toBeVisible({ timeout });
}

/**
 * Type into Quill without Ctrl+A / select-all.
 * Chrome-automation Ctrl+A is unreliable against this editor and was a major
 * source of false "keystroke loss" reports (prepend vs replace confusion).
 *
 * By default, confirms the typed string landed only when it has no A–Z letters
 * (digit/symbol markers survive the Telugu phonetic engine). Pass
 * `confirm: true` to always poll, or `confirm: false` for phonetic roman input.
 */
export async function typeIntoManuscript(
  editor: Locator,
  text: string,
  opts?: { clearFirst?: boolean; confirm?: boolean; timeout?: number },
) {
  const timeout = opts?.timeout ?? 12_000;
  await editor.waitFor({ state: 'visible', timeout });
  await editor.click();
  await editor.focus();

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

  // Small per-key delay so Quill / phonetic handlers do not drop strokes in CI
  await editor.pressSequentially(text, { delay: 30 });

  const shouldConfirm =
    opts?.confirm ?? !/[a-zA-Z]/.test(text);

  if (!shouldConfirm) return;

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const content = await editor.innerText();
    if (content.includes(text)) return;
    await editor.page().waitForTimeout(100);
  }
  throw new Error(`Timed out waiting for manuscript editor to contain: ${JSON.stringify(text)}`);
}
