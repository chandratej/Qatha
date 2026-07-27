import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthorScope } from './platform.js';

describe('resolveAuthorScope (peer-review author lists)', () => {
  it('ignores query.author_id for normal creators (uses JWT subject)', () => {
    const req = {
      auth: { userId: 'session-user', role: 'creator' },
      query: { author_id: 'other-user' },
    };
    assert.equal(resolveAuthorScope(req), 'session-user');
  });

  it('allows moderator to scope by query.author_id', () => {
    const req = {
      auth: { userId: 'mod-1', role: 'moderator' },
      query: { author_id: 'author-2' },
    };
    assert.equal(resolveAuthorScope(req), 'author-2');
  });

  it('allows admin to scope by query.author_id', () => {
    const req = {
      auth: { userId: 'admin-1', role: 'admin' },
      query: { author_id: 'author-3' },
    };
    assert.equal(resolveAuthorScope(req), 'author-3');
  });

  it('falls back to session when staff omits author_id', () => {
    const req = {
      auth: { userId: 'admin-1', role: 'admin' },
      query: {},
    };
    assert.equal(resolveAuthorScope(req), 'admin-1');
  });
});
