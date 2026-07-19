import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CREATOR_AGREEMENT_VERSION,
  DPDP_PRIVACY_VERSION,
  recordMockConsent,
  hasRequiredCreatorConsents,
  getMockConsents,
  persistCreatorConsents,
} from './consent.js';

describe('consent store (mock)', () => {
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

  it('persistCreatorConsents degrades when table missing', async () => {
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
