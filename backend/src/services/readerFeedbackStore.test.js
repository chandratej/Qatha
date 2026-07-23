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

  it('lets a reader submit praise, and the author choose to publish it as a testimonial', async () => {
    const { createReaderFeedback, listPublicPraise, updateReaderFeedback } =
      await import(`./readerFeedbackStore.js?test=${Date.now()}-praise`);

    const storyId = `story-praise-${Date.now()}`;
    const created = await createReaderFeedback(storyId, 'reader-2', {
      body: 'This chapter made me cry — beautifully written.',
      feedback_type: 'praise',
    });
    assert.equal(created.status, 'pending');
    assert.equal(created.moderation_flagged, false);

    // Not visible publicly until the author explicitly publishes it.
    assert.deepEqual(await listPublicPraise(storyId), []);

    await updateReaderFeedback(storyId, created.id, { status: 'published' });
    const published = await listPublicPraise(storyId);
    assert.equal(published.length, 1);
    assert.equal(published[0].id, created.id);
  });

  it('auto-filters spam/abuse praise before it ever reaches the author', async () => {
    const { createReaderFeedback, listPendingFeedbackForCreator } =
      await import(`./readerFeedbackStore.js?test=${Date.now()}-spam`);

    const storyId = `story-spam-${Date.now()}`;
    // The heuristic provider (no OPENAI_API_KEY in tests) flags overtly abusive text
    // once 3+ toxic-pattern hits accumulate.
    const flagged = await createReaderFeedback(storyId, 'reader-3', {
      body: 'I hate this, the author is stupid and an idiot, someone should kill this whole story',
      feedback_type: 'praise',
    });
    assert.equal(flagged.moderation_flagged, true);
    assert.equal(flagged.status, 'archived');
  });
});