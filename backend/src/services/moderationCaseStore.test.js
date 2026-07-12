import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('moderationCaseStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates and lists moderation cases', async () => {
    const store = await import('./moderationCaseStore.js');

    const created = await store.createModerationCase({
      case_type: 'review_dispute',
      reporter_id: 'author-1',
      request_id: 'req-1',
      reason: 'Reviewer feedback felt retaliatory and not craft-focused.',
    });

    assert.equal(created.status, 'open');
    assert.equal(created.case_type, 'review_dispute');

    const listed = await store.listModerationCases({ status: 'open' });
    assert.ok(listed.some((c) => c.id === created.id));
  });

  it('assigns and resolves non-appeal cases', async () => {
    const store = await import(`./moderationCaseStore.js?basic-${Date.now()}`);

    const created = await store.createModerationCase({
      case_type: 'reviewer_conduct',
      reporter_id: 'author-1',
      reason: 'Reviewer shared identifying details despite double-blind policy.',
    });

    const assigned = await store.assignModerationCase(created.id, 'mod-1');
    assert.equal(assigned.status, 'investigating');

    const resolved = await store.resolveModerationCase(created.id, 'dismissed', 'No policy breach found.', 'mod-1');
    assert.equal(resolved.status, 'dismissed');
  });
});