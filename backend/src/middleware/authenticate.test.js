import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMockToken, resolveAuthFromRequest } from './authenticate.js';

describe('authenticate middleware', () => {
  it('parseMockToken extracts userId and issuedAt', () => {
    const parsed = parseMockToken('mock-token-demo-creator-001-1700000000000');
    assert.equal(parsed?.userId, 'demo-creator-001');
    assert.equal(parsed?.issuedAt, 1700000000000);
  });

  it('rejects forged x-creator-id when Bearer token is absent', async () => {
    const req = {
      headers: {
        'x-creator-id': 'attacker-id',
        'x-user-id': 'attacker-id',
        authorization: '',
      },
    };
    const auth = await resolveAuthFromRequest(req);
    assert.equal(auth, null);
  });

  it('rejects mismatched x-creator-id even when present alongside invalid token', async () => {
    const req = {
      headers: {
        'x-creator-id': 'not-the-jwt-sub',
        authorization: 'Bearer totally-invalid',
      },
    };
    const auth = await resolveAuthFromRequest(req);
    assert.equal(auth, null);
  });

  it('derives identity from JWT sub, ignoring forged x-creator-id', async () => {
    const issuedAt = Date.now();
    const req = {
      headers: {
        'x-creator-id': 'attacker-id',
        'x-user-id': 'attacker-id',
        authorization: `Bearer mock-token-demo-creator-001-${issuedAt}`,
      },
    };
    const auth = await resolveAuthFromRequest(req);
    assert.equal(auth?.userId, 'demo-creator-001');
    assert.notEqual(auth?.userId, 'attacker-id');
  });
});