import { test, expect, type Page } from '@playwright/test';
import { enterStudio as enterStudioEnglish } from './helpers/studio';

/**
 * Golden path smoke — DEC-019 / V09-13-D3
 * Mock mode: email OTP code 123456 (see Login.tsx).
 * Product + Quality Council: Reviewer Pool author → reviewer → workspace loop.
 *
 * Keep the two flags below in sync with `src/config/feature_flags.ts`.
 * Events + marketplace are off for MVP1 launch (P1-21) until staffed; those
 * routes are not mounted in App.tsx, so the gated tests skip rather than fail.
 * Full coverage when flags are on: e2e/events-strict.spec.ts,
 * e2e/reviewer-pool-strict.spec.ts (run with E2E_STRICT_PLATFORM / npm scripts).
 */
const FEATURE_EVENTS = false; // FEATURE_FLAGS.events
const FEATURE_MARKETPLACE = false; // FEATURE_FLAGS.marketplace

/** Events are core nav — bypass onboarding gate for contest E2E */
async function enterStudioShell(page: Page, email: string) {
  await enterStudioEnglish(page, email);
  await page.goto('/');
  await page.waitForURL((url) => !url.pathname.includes('/onboarding'), { timeout: 15_000 });
}

async function openReviewerPool(page: Page) {
  await page.goto('/earn/reviews');
  await expect(page.getByRole('heading', { name: /Trusted reviewers/i })).toBeVisible({ timeout: 15_000 });
}

function reviewerPoolNav(page: Page) {
  return page.getByRole('navigation', { name: 'Reviewer Pool' });
}

async function switchToAuthorView(page: Page) {
  await reviewerPoolNav(page).getByRole('button', { name: /Request/i }).click();
  await expect(page.getByRole('button', { name: /Request community review/i })).toBeVisible({ timeout: 10_000 });
}

async function seedDevReviewScenario(page: Page) {
  await page.getByRole('button', { name: /Open dev review sandbox/i }).click();
  await page.getByRole('button', { name: /Load demo/i }).click();
  await expect(page.getByText(/Dev scenario ready/i)).toBeVisible({ timeout: 10_000 });
}

/** Prevent dev auto-seed from masking fresh review-request invitations (slot-1). */
async function resetReviewState(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('katha_review_dev_seed_v', '3');
    localStorage.removeItem('katha_peer_review_requests');
    localStorage.removeItem('katha_reviewer_assignments');
    localStorage.removeItem('katha_reviewer_slot');
  });
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
    await page.evaluate(() => localStorage.setItem('katha_studio_locale', 'en'));
    await page.reload();

    await page.getByRole('button', { name: /Continue with email/i }).click();
    await page.getByLabel(/Email address/i).fill('e2e.creator@katha.test');
    await page.getByRole('button', { name: /Send verification code/i }).click();

    await expect(page.getByLabel(/6-digit code/i)).toBeVisible({ timeout: 15_000 });
    await page.getByLabel(/Pen name/i).fill('E2E Creator');
    await page.getByLabel(/6-digit code/i).fill('123456');

    await page.getByRole('button', { name: /Enter your studio/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.locator('body')).toContainText(/కథ|Dashboard|Stories|Onboarding|Studio|shelf/i);
  });

  test('events are core nav and registration page loads', async ({ page }) => {
    test.skip(!FEATURE_EVENTS, 'FEATURE_FLAGS.events=false (P1-21); see e2e/events-strict.spec.ts');
    await enterStudioShell(page, 'e2e.events@katha.test');

    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Events' }),
    ).toBeVisible({ timeout: 10_000 });

    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Events & Contests/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Studio Labs is off/i)).toHaveCount(0);
  });

  test('author can register for a free contest', async ({ page }) => {
    test.skip(!FEATURE_EVENTS, 'FEATURE_FLAGS.events=false (P1-21); see e2e/events-strict.spec.ts');
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

  test('author can request peer review and reviewer sees invitation', async ({ page }) => {
    test.skip(!FEATURE_MARKETPLACE, 'FEATURE_FLAGS.marketplace=false (P1-21); see e2e/reviewer-pool-strict.spec.ts');
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
            genre: 'romance',
            total_readers: 120,
          }],
          mock: true,
        }),
      });
    });

    await enterStudioShell(page, 'e2e.review@katha.test');
    await resetReviewState(page);
    await openReviewerPool(page);
    await switchToAuthorView(page);
    await page.getByRole('button', { name: /Request community review/i }).click();
    await expect(page.getByText(/Community review queued|reviewers matched/i)).toBeVisible({ timeout: 10_000 });

    await reviewerPoolNav(page).getByRole('button', { name: /Review/i }).click();
    await expect(page.getByRole('heading', { name: /Your review inbox/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Invitations' })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.reviewer-dashboard__kpi').filter({ hasText: 'Invitations' })).toContainText(/[1-9]/);
  });

  test('reviewer can open workspace from dev seed assignment', async ({ page }) => {
    test.skip(!FEATURE_MARKETPLACE, 'FEATURE_FLAGS.marketplace=false (P1-21); see e2e/reviewer-pool-strict.spec.ts');
    await enterStudioShell(page, 'e2e.workspace@katha.test');
    await openReviewerPool(page);
    await seedDevReviewScenario(page);

    await page.getByRole('link', { name: /Open workspace/i }).click();
    await expect(page).toHaveURL(/\/reviewers\/assignments\//, { timeout: 10_000 });
    await expect(page.locator('body')).toContainText(/Submit review|సమీక్ష/i);
  });

  test('author feedback inbox shows waiting manuscripts after request', async ({ page }) => {
    test.skip(!FEATURE_MARKETPLACE, 'FEATURE_FLAGS.marketplace=false (P1-21); see e2e/reviewer-pool-strict.spec.ts');
    await page.route('**/creators/stories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stories: [{
            id: 'e2e-story-feedback',
            title: 'E2E Feedback Manuscript',
            chapter_count: 2,
            moderation_status: 'draft',
            genre: 'mythology',
            total_readers: 80,
          }],
          mock: true,
        }),
      });
    });

    await enterStudioShell(page, 'e2e.feedback@katha.test');
    await openReviewerPool(page);
    await switchToAuthorView(page);
    await page.getByRole('button', { name: /Request community review/i }).click();
    await expect(page.getByText(/Community review queued|reviewers matched/i)).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole('heading', { name: /Your council feedback/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Awaiting reviewers' })).toBeVisible();
  });
});