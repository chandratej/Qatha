import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('memberInviteStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates and accepts invite', async () => {
    const { createStoryInvite, listStoryInvites, acceptStoryInvite } = await import(
      `./memberInviteStore.js?test=${Date.now()}`
    );

    const storyId = `story-inv-${Date.now()}`;
    const invite = await createStoryInvite(storyId, 'owner-1', {
      invitee_email: 'coauthor@example.com',
      role: 'co_author',
      chapter_number: 2,
    });
    assert.equal(invite.status, 'pending');
    assert.equal(invite.role, 'co_author');

    const list = await listStoryInvites(storyId);
    assert.equal(list.length, 1);

    const result = await acceptStoryInvite(invite.id, 'user-2', 'coauthor@example.com');
    assert.equal(result.invite.status, 'accepted');
    assert.equal(result.member.role, 'co_author');
  });
});