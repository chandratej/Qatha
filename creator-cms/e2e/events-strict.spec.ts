import { test, expect, type Page } from '@playwright/test';

/**
 * ARC-01 events strict path — platform API is system of record for registrations.
 * Run: npm run test:e2e:events-strict
 */

async function loginMock(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /Continue with email/i }).click();
  await page.getByLabel(/Email address/i).fill('e2e.events@katha.test');
  await page.getByRole('button', { name: /Send verification code/i }).click();
  await page.getByLabel(/6-digit code/i).fill('123456');
  await page.getByRole('button', { name: /Enter your studio/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  await page.evaluate(() => localStorage.setItem('katha_onboarding_complete', 'true'));
}

test.describe('Events strict platform path', () => {
  test.beforeEach(async ({ page }) => {
    const eventId = 'evt-strict-1';
    const events = [{
      id: eventId,
      organizer_id: 'platform',
      title: 'Strict E2E Telugu Contest',
      description: 'Platform API registration test event.',
      event_type: 'first_chapter_challenge',
      status: 'registration_open',
      judging_model: 'double_blind',
      entry_fee_inr: 0,
      prize_pool_inr: 10000,
      platform_commission_pct: 15,
      organizer_commission_pct: 0,
      registration_count: 0,
      submission_count: 0,
      registration_opens_at: new Date(Date.now() - 86400000).toISOString(),
      registration_closes_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    }];

    const registrations: Array<Record<string, unknown>> = [];

    await page.route('**/api/platform/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.endsWith('/health') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, mock_mode: true }),
        });
      }
      if (url.endsWith('/events') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ events }),
        });
      }
      if (url.includes('/events/revenue/summary') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            summary: {
              totalEntryFeesInr: 0,
              totalPlatformFeesInr: 0,
              paidRegistrations: 0,
              freeRegistrations: registrations.length,
            },
          }),
        });
      }
      if (url.includes('/events/registrations/me') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ registrations }),
        });
      }
      if (url.includes(`/events/${eventId}`) && !url.includes('/register') && !url.includes('/submit') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            event: events[0],
            escrowPreview: null,
            acceptsRegistration: true,
          }),
        });
      }
      if (url.includes(`/events/${eventId}/register`) && method === 'POST') {
        const reg = {
          id: 'ereg-strict-1',
          event_id: eventId,
          participant_id: 'e2e-user',
          entry_fee_paid_inr: 0,
          payment_status: 'waived',
          registered_at: new Date().toISOString(),
        };
        registrations.push(reg);
        events[0].registration_count = 1;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ registration: reg, event: events[0], alreadyRegistered: false }),
        });
      }

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await loginMock(page);
  });

  test('register via event detail surfaces contest in Your contests', async ({ page }) => {
    await page.goto(`/events/${'evt-strict-1'}`);
    await expect(page.getByRole('heading', { name: /Strict E2E Telugu Contest/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Register free/i }).click();
    await expect(page.getByText(/Registered free/i)).toBeVisible({ timeout: 10_000 });

    await page.goto('/events');
    const yourContests = page.locator('h2.dashboard-panel__title', { hasText: 'Your contests' })
      .locator('xpath=following-sibling::*[1]');
    await expect(yourContests.getByRole('heading', { name: /Strict E2E Telugu Contest/i })).toBeVisible({ timeout: 10_000 });
  });

  test('pre-enrolled registration from API appears on events list', async ({ page }) => {
    await page.route('**/api/platform/events/registrations/me', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          registrations: [{
            id: 'ereg-pre-1',
            event_id: 'evt-strict-1',
            participant_id: 'e2e-user',
            entry_fee_paid_inr: 0,
            payment_status: 'waived',
            registered_at: new Date().toISOString(),
          }],
        }),
      });
    });

    await page.goto('/events');
    const yourContests = page.locator('h2.dashboard-panel__title', { hasText: 'Your contests' })
      .locator('xpath=following-sibling::*[1]');
    await expect(yourContests.getByRole('heading', { name: /Strict E2E Telugu Contest/i })).toBeVisible({ timeout: 10_000 });
  });
});