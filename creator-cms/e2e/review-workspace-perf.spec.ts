import { test, expect, type Page } from '@playwright/test';

/**
 * Performance CI gate — LRC-20-D8
 * Review Studio shell visible within budget on mocked API path.
 */

const ASSIGNMENT_ID = 'asgn-perf-1';
const REQUEST_ID = 'pr-perf-1';
const WORKSPACE_BUDGET_MS = 8000;
const DASHBOARD_BUDGET_MS = 5000;

async function loginMock(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Continue with email/i }).click();
  await page.getByLabel(/Email address/i).fill('perf.reviewer@katha.test');
  await page.getByRole('button', { name: /Send verification code/i }).click();
  await page.getByLabel(/6-digit code/i).fill('123456');
  await page.getByRole('button', { name: /Enter your studio/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  await page.evaluate(() => localStorage.setItem('katha_onboarding_complete', 'true'));
}

async function mockWorkspaceApi(page: Page) {
  await page.route('**/api/platform/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes(`/peer-reviews/assignments/${ASSIGNMENT_ID}/start`) && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          assignment: {
            id: ASSIGNMENT_ID,
            request_id: REQUEST_ID,
            reviewer_slot: 'slot-1',
            status: 'in_review',
            manuscript_label: 'Manuscript #PERF',
            professional_role: 'literary_reviewer',
            story_genre: 'romance',
            mode: 'volunteer',
          },
        }),
      });
    }

    if (url.includes(`/peer-reviews/assignments/${ASSIGNMENT_ID}`) && method === 'GET' && !url.includes('/draft') && !url.includes('/manuscript')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          assignment: {
            id: ASSIGNMENT_ID,
            request_id: REQUEST_ID,
            reviewer_slot: 'slot-1',
            status: 'accepted',
            manuscript_label: 'Manuscript #PERF',
            professional_role: 'literary_reviewer',
            story_genre: 'romance',
            mode: 'volunteer',
            matching_score: 88,
            payout_inr: 0,
            invited_at: new Date().toISOString(),
          },
          request: {
            id: REQUEST_ID,
            author_id: 'author-perf',
            story_id: 'story-perf',
            story_title: 'Perf Test Story',
            status: 'in_review',
            mode: 'volunteer',
            reviews_received: 0,
            reviewers_matched: 3,
            double_blind: true,
            created_at: new Date().toISOString(),
          },
        }),
      });
    }

    if (url.includes(`/peer-reviews/assignments/${ASSIGNMENT_ID}/manuscript`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          manuscript: {
            label: 'Manuscript #PERF',
            genre: 'romance',
            reviewType: 'literary_reviewer',
            wordCount: 420,
            estimatedReadingMinutes: 15,
            trustLevel: 'Emerging Author',
            reviewFee: 0,
            mode: 'volunteer',
            deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
            chapters: [{
              num: 1,
              label: 'Chapter 1',
              wordCount: 420,
              scenes: [{
                id: 'scene-1',
                index: 0,
                title: 'Opening',
                wordCount: 420,
                estimatedMinutes: 3,
                paragraphs: [{
                  id: 'p-1',
                  index: 0,
                  sceneId: 'scene-1',
                  plainText: 'Perf test paragraph for timing gate.',
                  html: '<p>Perf test paragraph for timing gate.</p>',
                }],
              }],
              paragraphs: [{
                id: 'p-1',
                index: 0,
                sceneId: 'scene-1',
                plainText: 'Perf test paragraph for timing gate.',
                html: '<p>Perf test paragraph for timing gate.</p>',
              }],
            }],
          },
        }),
      });
    }

    if (url.includes(`/peer-reviews/assignments/${ASSIGNMENT_ID}/draft`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ draft: null, saved_at: null, assignment_status: 'accepted' }),
      });
    }

    if (url.includes(`/assignments/${ASSIGNMENT_ID}/advisory-suggestions`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ suggestions: [], generated: false, advisory_ai_live: false }),
      });
    }

    if (url.includes('/reviewer-dashboard/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stats: {
            slot: 'slot-1',
            rqi: 57.1,
            councilLevel: 'certified_reviewer',
            reputationTier: 'silver',
            reviewsCompleted: 0,
            reviewsInProgress: 0,
            invitationsPending: 0,
            avgTurnaroundHours: 24,
            acceptanceRate: 100,
            badges: [],
            draftCount: 0,
            overdueCount: 0,
            isAvailable: true,
          },
        }),
      });
    }

    if (url.includes('/peer-reviews/assignments') && method === 'GET' && !url.includes(ASSIGNMENT_ID)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ assignments: [] }),
      });
    }

    if (url.includes('/peer-reviews/reviewer-feedback')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ bundles: [] }) });
    }

    if (url.includes('/peer-reviews/author-feedback')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ bundles: [] }) });
    }

    if (url.endsWith('/peer-reviews') || (url.includes('/peer-reviews') && method === 'GET' && !url.includes('assignments'))) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ requests: [] }) });
    }

    if (url.includes('/notifications') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [] }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
}

test.describe('Review Workspace performance', () => {
  test.beforeEach(async ({ page }) => {
    await mockWorkspaceApi(page);
    await loginMock(page);
    await page.evaluate(() => localStorage.setItem('katha_linked_reviewer_slot', 'slot-1'));
  });

  test('Review Studio shell loads within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto(`/reviewers/assignments/${ASSIGNMENT_ID}`);
    await expect(page.locator('#rw-main-reading')).toBeVisible({ timeout: WORKSPACE_BUDGET_MS });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(WORKSPACE_BUDGET_MS);
  });

  test('Reviewer dashboard loads within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/reviewers');
    await expect(page.getByRole('region', { name: /Reviewer dashboard/i })).toBeVisible({ timeout: DASHBOARD_BUDGET_MS });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(DASHBOARD_BUDGET_MS);
  });
});