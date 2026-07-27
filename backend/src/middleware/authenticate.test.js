import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMockToken,
  resolveAuthFromRequest,
  requireCreatorConsent,
} from './authenticate.js';
import {
  recordMockConsent,
  DPDP_PRIVACY_VERSION,
  CREATOR_AGREEMENT_VERSION,
} from '../lib/consent.js';

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

describe('requireCreatorConsent middleware', () => {
  let prevMock;
  before(() => {
    prevMock = process.env.MOCK_MODE;
    process.env.MOCK_MODE = 'true';
  });
  after(() => {
    if (prevMock === undefined) delete process.env.MOCK_MODE;
    else process.env.MOCK_MODE = prevMock;
  });

  it('returns CONSENT_REQUIRED when creator has not accepted current versions', async () => {
    const mw = requireCreatorConsent();
    const req = { auth: { userId: `no-consent-${Date.now()}` } };
    let err = null;
    await mw(req, {}, (e) => {
      err = e || null;
    });
    assert.ok(err);
    assert.equal(err.code, 'CONSENT_REQUIRED');
    assert.equal(err.status, 403);
  });

  it('allows request after mock DPDP + Creator Agreement recorded', async () => {
    const userId = `with-consent-${Date.now()}`;
    recordMockConsent(userId, {
      consent_type: 'dpdp_privacy',
      policy_version: DPDP_PRIVACY_VERSION,
      accepted: true,
    });
    recordMockConsent(userId, {
      consent_type: 'creator_agreement',
      policy_version: CREATOR_AGREEMENT_VERSION,
      accepted: true,
    });
    const mw = requireCreatorConsent();
    const req = { auth: { userId } };
    let called = false;
    let err = null;
    await mw(req, {}, (e) => {
      if (e) err = e;
      else called = true;
    });
    assert.equal(err, null);
    assert.equal(called, true);
  });
});