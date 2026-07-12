import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('readerFeedbackStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates, lists, and resolves reader feedback', async () => {
    const {
      seedMockReaderFeedback,
      createReaderFeedback,
      listReaderFeedback,
      updateReaderFeedback,
    } = await import(`./readerFeedbackStore.js?test=${Date.now()}`);

    const storyId = `story-rf-${Date.now()}`;
    seedMockReaderFeedback(storyId);

    const created = await createReaderFeedback(storyId, 'reader-1', {
      chapter_number: 3,
      body: 'Loved the cliffhanger ending.',
      feedback_type: 'written_review',
    });
    assert.equal(created.chapter_number, 3);

    const list = await listReaderFeedback(storyId);
    assert.ok(list.length >= 3);

    const resolved = await updateReaderFeedback(storyId, list[0].id, { status: 'resolved' });
    assert.equal(resolved.status, 'resolved');

    const { listPendingFeedbackForCreator } = await import(`./readerFeedbackStore.js?test=${Date.now()}-pending`);
    const pending = await listPendingFeedbackForCreator('demo-creator-001');
    assert.ok(Array.isArray(pending));
  });
});