import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('communityStore', () => {
  beforeEach(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates and lists community posts', async () => {
    const {
      createCommunityPost,
      listCommunityPosts,
      __resetMockCommunityForTests,
    } = await import(`./communityStore.js?test=${Date.now()}-create`);

    __resetMockCommunityForTests();
    const authorId = `author-${Date.now()}`;

    const post = await createCommunityPost(authorId, {
      author_name: 'Test Creator',
      type: 'chapter_share',
      body: 'Just published chapter 5!',
      story_id: 'story-1',
      story_title: 'My Story',
      chapter_number: 5,
    });

    assert.ok(post.id);
    assert.equal(post.author_name, 'Test Creator');
    assert.equal(post.reactions.love, 0);

    const list = await listCommunityPosts(authorId);
    assert.equal(list.length, 1);
    assert.equal(list[0].body, 'Just published chapter 5!');
  });

  it('toggles love reactions', async () => {
    const {
      createCommunityPost,
      togglePostLove,
      listCommunityPosts,
      __resetMockCommunityForTests,
    } = await import(`./communityStore.js?test=${Date.now()}-love`);

    __resetMockCommunityForTests();
    const authorId = 'author-1';
    const readerId = 'reader-1';

    const post = await createCommunityPost(authorId, {
      author_name: 'Author',
      body: 'Hello community',
    });

    const loved = await togglePostLove(post.id, readerId);
    assert.ok(loved);
    assert.equal(loved.reactions.love, 1);
    assert.equal(loved.viewer_loved, true);

    const unloved = await togglePostLove(post.id, readerId);
    assert.ok(unloved);
    assert.equal(unloved.reactions.love, 0);
    assert.equal(unloved.viewer_loved, false);

    const list = await listCommunityPosts(readerId);
    assert.equal(list[0].reactions.love, 0);
  });
});