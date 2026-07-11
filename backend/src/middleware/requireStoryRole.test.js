import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('requireStoryRole permissions map', () => {
  it('owner can publish and edit', async () => {
    const { assertStoryPermission } = await import('./requireStoryRole.js');
    // Mock mode returns owner without DB
    process.env.MOCK_MODE = 'true';
    const req = { auth: { userId: 'demo-creator-001' } };
    const access = await assertStoryPermission(req, 'any-story', 'story.publish');
    assert.equal(access.role, 'owner');
    assert.equal(access.mock, true);
    delete process.env.MOCK_MODE;
  });
});