import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('auditLogStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('lists mock transition logs', async () => {
    const { logStateTransition } = await import(`./transitionLog.js?test=${Date.now()}`);
    const { listAuditLogEntries, getAuditLogSummary } =
      await import(`./auditLogStore.js?test=${Date.now()}`);

    await logStateTransition({
      entityType: 'peer_review_request',
      entityId: 'req-1',
      fromState: 'in_review',
      toState: 'decision_ready',
      eventName: 'quorum_submitted',
      actorId: 'slot-1',
    });

    const entries = await listAuditLogEntries({ limit: 10 });
    assert.ok(entries.length >= 1);
    assert.equal(entries[0].event_name, 'quorum_submitted');

    const summary = await getAuditLogSummary({ days: 30 });
    assert.ok(summary.total_events >= 1);
  });
});