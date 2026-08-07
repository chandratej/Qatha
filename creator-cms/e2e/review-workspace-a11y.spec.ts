import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAsMockUser } from './helpers/studio';

/**
 * WCAG 2.2 AA CI gate — LRC-18-D5 / LRC-20-D7
 * Run: npm run test:a11y
 */

const ASSIGNMENT_ID = 'asgn-a11y-1';
const REQUEST_ID = 'pr-a11y-1';

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
            manuscript_label: 'Manuscript #A11Y',
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
            manuscript_label: 'Manuscript #A11Y',
            professional_role: 'literary_reviewer',
            story_genre: 'romance',
            mode: 'volunteer',
            matching_score: 88,
            payout_inr: 0,
            invited_at: new Date().toISOString(),
          },
          request: {
            id: REQUEST_ID,
            author_id: 'author-a11y',
            story_id: 'story-a11y',
            story_title: 'A11Y Test Story',
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
            label: 'Manuscript #A11Y',
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
                  plainText: 'The village slept beneath monsoon clouds while lamps flickered in narrow lanes.',
                  html: '<p>The village slept beneath monsoon clouds while lamps flickered in narrow lanes.</p>',
                }],
              }],
              paragraphs: [{
                id: 'p-1',
                index: 0,
                sceneId: 'scene-1',
                plainText: 'The village slept beneath monsoon clouds while lamps flickered in narrow lanes.',
                html: '<p>The village slept beneath monsoon clouds while lamps flickered in narrow lanes.</p>',
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

    if (url.includes('/notifications') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [] }) });
    }

    // Do not stub unknown platform endpoints with { ok: true } — that can break auth / health shapes.
    return route.continue();
  });
}

test.describe('Review Workspace accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockWorkspaceApi(page);
    await loginAsMockUser(page, {
      email: 'a11y.reviewer@katha.test',
      displayName: 'A11Y Reviewer',
      navigate: false,
    });
  });

  test('Review Studio has no serious or critical axe violations', async ({ page }) => {
    await page.goto(`/reviewers/assignments/${ASSIGNMENT_ID}`);
    await expect(page.locator('.rw-shell')).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole('main')).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/Manuscript #A11Y|Chapter 1/i).first()).toBeVisible({ timeout: 15_000 });

    const results = await new AxeBuilder({ page })
      .include('.rw-shell')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    if (serious.length > 0) {
      console.error(JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2));
    }
    expect(serious).toEqual([]);
  });

  test('skip link targets main reading landmark', async ({ page }) => {
    await page.goto(`/reviewers/assignments/${ASSIGNMENT_ID}`);
    await expect(page.locator('#rw-main-reading')).toBeAttached({ timeout: 20_000 });
    const skip = page.getByRole('link', { name: /Skip to manuscript/i });
    await skip.focus();
    await expect(skip).toBeFocused();
  });
});
