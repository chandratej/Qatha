import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  CREATOR_AGREEMENT_VERSION,
  DPDP_PRIVACY_VERSION,
  recordMockConsent,
  hasRequiredCreatorConsents,
  getMockConsents,
  persistCreatorConsents,
  verifyRequiredCreatorConsents,
} from './consent.js';

describe('consent store (mock)', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  after(() => {
    delete process.env.MOCK_MODE;
  });

  it('tracks DPDP + creator agreement versions', () => {
    const userId = `u-consent-${Date.now()}`;
    assert.equal(hasRequiredCreatorConsents(userId), false);
    recordMockConsent(userId, {
      consent_type: 'dpdp_privacy',
      policy_version: DPDP_PRIVACY_VERSION,
      accepted: true,
    });
    assert.equal(hasRequiredCreatorConsents(userId), false);
    recordMockConsent(userId, {
      consent_type: 'creator_agreement',
      policy_version: CREATOR_AGREEMENT_VERSION,
      accepted: true,
    });
    assert.equal(hasRequiredCreatorConsents(userId), true);
    assert.equal(getMockConsents(userId).length, 2);
  });

  it('verifyRequiredCreatorConsents uses memory in mock mode', async () => {
    const userId = `u-verify-${Date.now()}`;
    assert.equal(await verifyRequiredCreatorConsents(null, userId), false);
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
    assert.equal(await verifyRequiredCreatorConsents(null, userId), true);
  });

  it('persistCreatorConsents degrades to memory in MOCK_MODE when table missing', async () => {
    const fakeSb = {
      from(table) {
        return {
          upsert: async () => ({
            error: { message: `Could not find the table 'public.${table}' in the schema cache`, code: 'PGRST205' },
          }),
          update: () => ({
            eq: async () => ({
              error: { message: "Could not find the 'dpdp_consent_version' column", code: 'PGRST204' },
            }),
          }),
        };
      },
    };
    const result = await persistCreatorConsents(fakeSb, {
      userId: 'user-1',
      creatorAgreement: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.storage, 'memory');
    assert.equal(result.dpdp_consent_version, DPDP_PRIVACY_VERSION);
    assert.equal(result.creator_agreement_version, CREATOR_AGREEMENT_VERSION);
  });
});

describe('consent store (non-mock durable only)', () => {
  let prevMock;
  before(() => {
    prevMock = process.env.MOCK_MODE;
    process.env.MOCK_MODE = 'false';
  });
  after(() => {
    if (prevMock === undefined) delete process.env.MOCK_MODE;
    else process.env.MOCK_MODE = prevMock;
  });

  it('persistCreatorConsents refuses memory when schema missing outside mock', async () => {
    const fakeSb = {
      from(table) {
        return {
          upsert: async () => ({
            error: { message: `Could not find the table 'public.${table}' in the schema cache`, code: 'PGRST205' },
          }),
          update: () => ({
            eq: async () => ({
              error: { message: "Could not find the 'dpdp_consent_version' column", code: 'PGRST204' },
            }),
          }),
        };
      },
    };
    await assert.rejects(
      () => persistCreatorConsents(fakeSb, { userId: 'user-prod', creatorAgreement: true }),
      (err) => err?.code === 'CONSENT_STORAGE_UNAVAILABLE' && err?.status === 503,
    );
  });

  it('verifyRequiredCreatorConsents fails closed without supabase outside mock', async () => {
    assert.equal(await verifyRequiredCreatorConsents(null, 'user-prod'), false);
  });

  it('verifyRequiredCreatorConsents accepts matching profile versions', async () => {
    const fakeSb = {
      from(table) {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    dpdp_consent_version: DPDP_PRIVACY_VERSION,
                    creator_agreement_version: CREATOR_AGREEMENT_VERSION,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    };
    assert.equal(await verifyRequiredCreatorConsents(fakeSb, 'user-ok'), true);
  });
});
