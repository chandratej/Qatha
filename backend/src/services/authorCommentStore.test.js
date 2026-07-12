import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('authorCommentStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates, resolves, and deletes author comment', async () => {
    const {
      createAuthorComment,
      listAuthorComments,
      updateAuthorComment,
      deleteAuthorComment,
    } = await import(`./authorCommentStore.js?test=${Date.now()}`);

    const storyId = `story-ac-${Date.now()}`;
    const chapterNumber = 1;
    const comment = await createAuthorComment(storyId, chapterNumber, 'author-1', {
      scene_id: 'scene-1',
      body: 'Check continuity with Ananya arc.',
      selected_text: 'village',
      start_offset: 12,
      end_offset: 19,
    });
    assert.equal(comment.status, 'open');
    assert.equal(comment.start_offset, 12);
    assert.equal(comment.end_offset, 19);

    const list = await listAuthorComments(storyId, chapterNumber);
    assert.equal(list.length, 1);

    const resolved = await updateAuthorComment(storyId, chapterNumber, comment.id, { status: 'resolved' });
    assert.equal(resolved.status, 'resolved');

    await deleteAuthorComment(storyId, chapterNumber, comment.id);
    const after = await listAuthorComments(storyId, chapterNumber);
    assert.equal(after.length, 0);
  });
});