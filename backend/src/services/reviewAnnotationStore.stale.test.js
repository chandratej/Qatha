import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewAnnotationStore stale on revision', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('archives annotations when revision round advances', async () => {
    const ann = await import(`./reviewAnnotationStore.js?stale=${Date.now()}`);

    const requestId = `req-stale-${Date.now()}`;
    await ann.persistAnnotationsFromSubmit({
      requestId,
      assignmentId: 'asgn-1',
      storyId: 'story-1',
      reviewerSlot: 'slot-1',
      comments: [{ reason: 'Tighten opening', category: 'pacing' }],
    });

    const result = await ann.markAnnotationsStaleOnRevision(requestId, 0);
    assert.equal(result.archived, 1);

    const rows = await ann.listAnnotationsForRequest(requestId, { includeThreads: false });
    assert.equal(rows[0].status, 'archived');
  });
});