import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewAnalyticsEventStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('appends and summarizes analytics events', async () => {
    const {
      appendReviewAnalyticsEvent,
      getReviewAnalyticsSummary,
    } = await import(`./reviewAnalyticsEventStore.js?test=${Date.now()}`);

    await appendReviewAnalyticsEvent('assignment_accept', {
      assignment_id: 'asgn-1',
      request_id: 'req-1',
      actor_id: 'slot-1',
    });
    await appendReviewAnalyticsEvent('review_request_cancelled', {
      request_id: 'req-2',
      actor_id: 'author-1',
      metadata: { reason: 'story_withdrawn' },
    });

    const summary = await getReviewAnalyticsSummary({ days: 30 });
    assert.ok(summary.total_events >= 2);
    assert.ok(summary.event_counts.assignment_accept >= 1);
    assert.ok(summary.event_counts.review_request_cancelled >= 1);
  });

  it('exports anonymized warehouse records without PII fields', async () => {
    const {
      appendReviewAnalyticsEvent,
      exportReviewAnalyticsWarehouse,
    } = await import(`./reviewAnalyticsEventStore.js?test=${Date.now() + 1}`);

    await appendReviewAnalyticsEvent('author_satisfaction_submitted', {
      request_id: 'req-3',
      actor_id: 'author-sensitive-uuid-12345',
      metadata: { email: 'hidden@katha.in', rating: 5 },
    });

    const warehouse = await exportReviewAnalyticsWarehouse({ days: 30, limit: 100 });
    assert.equal(warehouse.export_version, '1.0');
    assert.ok(warehouse.record_count >= 1);
    const sat = warehouse.records.find((r) => r.event_type === 'author_satisfaction_submitted');
    assert.ok(sat);
    assert.ok(sat.actor_ref.startsWith('anon_'));
    assert.equal(sat.metadata.email, undefined);
    assert.equal(sat.metadata.rating, 5);
  });
});