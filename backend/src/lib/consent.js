/**
 * Versioned consent capture (DPDP + Creator Agreement).
 * Resilient when migration 041 is not yet applied on Supabase.
 */

import { isMockMode } from './mockMode.js';

export const CREATOR_AGREEMENT_VERSION = 'creator_agreement_v1';
export const DPDP_PRIVACY_VERSION = 'dpdp_privacy_v1';

/** In-memory store for mock mode + schema-missing fallback */
const mockConsents = new Map(); // userId -> array

export function recordMockConsent(userId, row) {
  const list = mockConsents.get(userId) || [];
  list.push({ ...row, user_id: userId, accepted_at: new Date().toISOString() });
  mockConsents.set(userId, list);
  return list[list.length - 1];
}

export function getMockConsents(userId) {
  return mockConsents.get(userId) || [];
}

export function hasRequiredCreatorConsents(userId) {
  if (!isMockMode()) return null; // caller checks DB
  const list = getMockConsents(userId);
  const hasDpdp = list.some(
    (c) => c.consent_type === 'dpdp_privacy' && c.policy_version === DPDP_PRIVACY_VERSION && c.accepted,
  );
  const hasAgreement = list.some(
    (c) => c.consent_type === 'creator_agreement' && c.policy_version === CREATOR_AGREEMENT_VERSION && c.accepted,
  );
  return hasDpdp && hasAgreement;
}

function isSchemaGap(error) {
  if (!error) return false;
  const msg = `${error.message || ''} ${error.details || ''} ${error.hint || ''} ${error.code || ''}`;
  return /does not exist|Could not find|schema cache|PGRST205|PGRST204|42703|42P01/i.test(msg);
}

/**
 * Persist consents. Never throws on missing migration — degrades so Studio is not blocked.
 * @returns {{ ok: true, storage: 'db'|'profiles'|'memory', dpdp_consent_version, creator_agreement_version, warning?: string }}
 */
export async function persistCreatorConsents(supabase, {
  userId,
  creatorAgreement = false,
  userAgent = null,
}) {
  const now = new Date().toISOString();
  const dpdpVersion = DPDP_PRIVACY_VERSION;
  const agreementVersion = creatorAgreement ? CREATOR_AGREEMENT_VERSION : null;

  const inserts = [{
    user_id: userId,
    consent_type: 'dpdp_privacy',
    policy_version: dpdpVersion,
    accepted: true,
    user_agent: userAgent,
  }];
  if (creatorAgreement) {
    inserts.push({
      user_id: userId,
      consent_type: 'creator_agreement',
      policy_version: CREATOR_AGREEMENT_VERSION,
      accepted: true,
      user_agent: userAgent,
    });
  }

  // Path 1: dedicated audit table (migration 041)
  if (supabase) {
    const { error: cErr } = await supabase.from('user_consents').upsert(inserts, {
      onConflict: 'user_id,consent_type,policy_version',
    });

    if (!cErr) {
      const profilePatch = {
        dpdp_consent_version: dpdpVersion,
        dpdp_consent_at: now,
      };
      if (creatorAgreement) {
        profilePatch.creator_agreement_version = CREATOR_AGREEMENT_VERSION;
        profilePatch.creator_agreement_at = now;
      }
      const { error: pErr } = await supabase.from('profiles').update(profilePatch).eq('id', userId);
      if (pErr && !isSchemaGap(pErr)) {
        console.warn('[consent] profiles update failed after user_consents ok:', pErr.message);
      }
      return {
        ok: true,
        storage: 'db',
        dpdp_consent_version: dpdpVersion,
        creator_agreement_version: agreementVersion,
      };
    }

    if (!isSchemaGap(cErr)) {
      // Real data error (FK, RLS, etc.) — surface it
      const err = new Error(cErr.message || 'Consent save failed');
      err.code = 'INTERNAL_ERROR';
      err.status = 500;
      err.userMessage = cErr.message;
      throw err;
    }

    console.warn('[consent] user_consents missing — falling back to profiles columns. Apply migration 041.');

    // Path 2: profile columns only
    const profilePatch = {
      dpdp_consent_version: dpdpVersion,
      dpdp_consent_at: now,
    };
    if (creatorAgreement) {
      profilePatch.creator_agreement_version = CREATOR_AGREEMENT_VERSION;
      profilePatch.creator_agreement_at = now;
    }
    const { error: pErr } = await supabase.from('profiles').update(profilePatch).eq('id', userId);
    if (!pErr) {
      return {
        ok: true,
        storage: 'profiles',
        dpdp_consent_version: dpdpVersion,
        creator_agreement_version: agreementVersion,
        warning: 'user_consents table missing — apply migration 041_mvp1_legal_consent_search.sql',
      };
    }

    if (!isSchemaGap(pErr)) {
      const err = new Error(pErr.message || 'Consent profile update failed');
      err.code = 'INTERNAL_ERROR';
      err.status = 500;
      err.userMessage = pErr.message;
      throw err;
    }

    console.warn('[consent] profiles consent columns missing — using memory fallback. Apply migration 041.');
  }

  // Path 3: process memory (dev / pre-migration) so Creator Studio is not blocked
  for (const row of inserts) {
    recordMockConsent(userId, row);
  }
  return {
    ok: true,
    storage: 'memory',
    mock: true,
    dpdp_consent_version: dpdpVersion,
    creator_agreement_version: agreementVersion,
    warning:
      'Consent stored in API memory only. Apply supabase/migrations/041_mvp1_legal_consent_search.sql for durable records.',
  };
}
