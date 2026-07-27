import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isUuid, parseUuidOrThrow } from './uuid.js';

describe('uuid helpers', () => {
  it('accepts standard UUIDs', () => {
    assert.equal(isUuid('550e8400-e29b-41d4-a716-446655440000'), true);
  });

  it('rejects garbage', () => {
    assert.equal(isUuid('not-a-uuid'), false);
    assert.equal(isUuid(''), false);
    assert.equal(isUuid(null), false);
  });

  it('parseUuidOrThrow raises 400-shaped error', () => {
    try {
      parseUuidOrThrow('oops', 'story id');
      assert.fail('expected throw');
    } catch (e) {
      assert.equal(e.status, 400);
      assert.equal(e.code, 'BAD_REQUEST');
    }
  });
});
