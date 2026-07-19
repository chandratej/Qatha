import { test, expect, type Page } from '@playwright/test';

/**
 * ARC-01 strict-mode golden path — platform API is system of record.
 * Run: npm run test:e2e:strict
 * Engineering Council: route-mocked /api/platform proves UI wiring without localStorage SoT.
 */

async function loginMock(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Continue with email/i }).click();
  await page.getByLabel(/Email address/i).fill('e2e.strict@katha.test');
  await page.getByRole('button', { name: /Send verification code/i }).click();
  await page.getByLabel(/6-digit code/i).fill('123456');
  await page.getByRole('button', { name: /Enter your studio/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  await page.evaluate(() => localStorage.setItem('katha_onboarding_complete', 'true'));
}

async function promoteToAdmin(page: Page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem('katha_creator_auth');
    if (!raw) return;
    const data = JSON.parse(raw) as { user: { role: string }; token: string };
    data.user.role = 'admin';
    localStorage.setItem('katha_creator_auth', JSON.stringify(data));
  });
}

test.describe('Reviewer Pool strict platform path', () => {
  test.beforeEach(async ({ page }) => {
    const notifications: Array<Record<string, unknown>> = [];
    const assignmentId = 'asgn-strict-1';
    const requestId = 'pr-strict-1';
    let moderationPending = true;

    await page.route('**/api/platform/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.endsWith('/health') && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, mock_mode: true }) });
      }
      if (url.includes('/notifications') && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications }) });
      }
      if (url.includes('/notifications/read-all') && method === 'POST') {
        notifications.forEach((n) => { n.read_at = new Date().toISOString(); });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ marked: notifications.length }) });
      }
      if (url.match(/\/notifications\/[^/]+\/read/) && method === 'POST') {
        const id = url.split('/notifications/')[1].replace('/read', '');
        const row = notifications.find((n) => n.id === id);
        if (row) row.read_at = new Date().toISOString();
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notification: row }) });
      }
      if (url.includes('/reviewer-onboarding/pending') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            applications: moderationPending
              ? [{
                  user_id: 'rev-applicant-1',
                  status: 'pending_moderation',
                  genres: ['romance'],
                  motivation: 'I read Telugu fiction daily and want to give structured feedback.',
                  applied_at: new Date().toISOString(),
                }]
              : [],
          }),
        });
      }
      if (url.includes('/reviewer-onboarding/') && url.includes('/moderate') && method === 'POST') {
        moderationPending = false;
        notifications.unshift({
          id: 'ntf-mod-1',
          notification_type: 'moderation_outcome',
          domain: 'moderation',
          priority: 'actionable',
          title: 'Reviewer Pool application approved',
          body: 'Welcome to the Reviewer Pool.',
          action_url: '/earn/reviews',
          read_at: null,
          created_at: new Date().toISOString(),
        });
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            application: { user_id: 'rev-applicant-1', status: 'certified' },
            onboarding: { status: 'certified' },
          }),
        });
      }
      if (url.includes('/peer-reviews/assignments') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            assignments: [{
              id: assignmentId,
              request_id: requestId,
              reviewer_slot: 'slot-1',
              status: 'invited',
              manuscript_label: 'Manuscript #STRICT',
              professional_role: 'literary_reviewer',
              story_genre: 'romance',
              mode: 'volunteer',
              matching_score: 90,
              payout_inr: 0,
              invited_at: new Date().toISOString(),
            }],
          }),
        });
      }
      if (url.includes(`/peer-reviews/assignments/${assignmentId}/accept`) && method === 'POST') {
        notifications.unshift({
          id: 'ntf-review-1',
          notification_type: 'review_assigned',
          domain: 'reviews',
          priority: 'actionable',
          title: 'New review invitation',
          body: 'Council reviewer accepted your manuscript.',
          action_url: '/earn/reviews',
          read_at: null,
          created_at: new Date().toISOString(),
        });
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            assignment: {
              id: assignmentId,
              request_id: requestId,
              reviewer_slot: 'slot-1',
              status: 'accepted',
              manuscript_label: 'Manuscript #STRICT',
            },
          }),
        });
      }
      if (url.includes('/peer-reviews/council-audit') && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ entries: [] }) });
      }
      if (url.includes('/peer-reviews/author-feedback') && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ bundles: [] }) });
      }
      if (url.includes('/peer-reviews') && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ requests: [] }) });
      }
      if (url.includes('/reviewer-dashboard/stats') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stats: {
              slot: 'slot-1',
              rqi: 72,
              councilLevel: 'certified_reviewer',
              reputationTier: 'bronze',
              reviewsCompleted: 0,
              reviewsInProgress: 0,
              invitationsPending: 1,
              avgTurnaroundHours: 12,
              acceptanceRate: 100,
              badges: [],
              draftCount: 0,
              overdueCount: 0,
            },
          }),
        });
      }
      if (url.includes('/reviewer-pool/summary') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ summary: { total: 6, available: 4, canFulfill: true } }),
        });
      }
      if (url.includes('/reviewer-pool') && method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pool: [] }) });
      }
      if (url.includes('/reviewer-onboarding') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            onboarding: { status: 'not_applied', genres: [], languages: ['telugu'], motivation: '', trainingCompleted: false },
          }),
        });
      }

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await loginMock(page);
  });

  test('moderator approve surfaces in-app notification', async ({ page }) => {
    await promoteToAdmin(page);
    await page.reload();
    await page.goto('/earn/reviews');

    await page.getByRole('navigation', { name: 'Reviewer Pool' }).getByRole('button', { name: /Admin/i }).click();
    await expect(page.getByText(/pending moderation/i)).toBeVisible({ timeout: 10_000 });
    await page.locator('.reviewer-moderation-queue__actions .katha-cta--maroon').click();
    await expect(page.getByText(/No applications awaiting moderation/i)).toBeVisible({ timeout: 15_000 });

    await page.goto('/notifications');
    await expect(page.getByText(/Reviewer Pool application approved/i)).toBeVisible({ timeout: 10_000 });
  });

  test('reviewer accepts invitation via platform API', async ({ page }) => {
    await page.goto('/earn/reviews');
    await page.getByRole('navigation', { name: 'Reviewer Pool' }).getByRole('button', { name: /Review/i }).click();
    await expect(page.getByRole('heading', { name: /Your review inbox/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Accept & begin/i }).click();
    await expect(page.getByText(/In progress/i)).toBeVisible({ timeout: 10_000 });
  });
});