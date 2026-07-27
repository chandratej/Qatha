/**
 * Versioned consent capture (DPDP + Creator Agreement).
 * Durable storage: user_consents + profiles columns (migration 041).
 * In-memory only allowed in MOCK_MODE — never a production legal record.
 */

import { isMockMode } from './mockMode.js';

export const CREATOR_AGREEMENT_VERSION = 'creator_agreement_v1';
export const DPDP_PRIVACY_VERSION = 'dpdp_privacy_v1';

/** In-memory store for mock mode only */
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

/**
 * Mock-mode only: whether in-memory store has current DPDP + Creator Agreement.
 * Returns null when not in mock mode (caller must use verifyRequiredCreatorConsents).
 */
export function hasRequiredCreatorConsents(userId) {
  if (!isMockMode()) return null;
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

function versionsMatch(dpdpVersion, agreementVersion) {
  return (
    dpdpVersion === DPDP_PRIVACY_VERSION &&
    agreementVersion === CREATOR_AGREEMENT_VERSION
  );
}

/**
 * Fail-closed check that the user has accepted current DPDP + Creator Agreement.
 * - MOCK_MODE: in-memory store
 * - Production: profiles columns and/or user_consents (migration 041)
 * Never treats process memory as durable outside mock.
 */
export async function verifyRequiredCreatorConsents(supabase, userId) {
  if (!userId) return false;

  if (isMockMode()) {
    return hasRequiredCreatorConsents(userId) === true;
  }

  if (!supabase) {
    return false;
  }

  // Preferred: profile denormalized versions (set on successful persist)
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('dpdp_consent_version, creator_agreement_version')
    .eq('id', userId)
    .maybeSingle();

  if (!pErr && profile && versionsMatch(profile.dpdp_consent_version, profile.creator_agreement_version)) {
    return true;
  }

  if (pErr && !isSchemaGap(pErr)) {
    console.warn('[consent] profiles consent read failed:', pErr.message);
    return false;
  }

  // Audit table (migration 041)
  const { data: rows, error: cErr } = await supabase
    .from('user_consents')
    .select('consent_type, policy_version, accepted')
    .eq('user_id', userId)
    .eq('accepted', true);

  if (!cErr && Array.isArray(rows)) {
    const hasDpdp = rows.some(
      (c) => c.consent_type === 'dpdp_privacy' && c.policy_version === DPDP_PRIVACY_VERSION,
    );
    const hasAgreement = rows.some(
      (c) => c.consent_type === 'creator_agreement' && c.policy_version === CREATOR_AGREEMENT_VERSION,
    );
    return hasDpdp && hasAgreement;
  }

  if (cErr && !isSchemaGap(cErr)) {
    console.warn('[consent] user_consents read failed:', cErr.message);
  }

  return false;
}

/**
 * Persist consents. Durable paths only outside MOCK_MODE.
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

    // Path 2: profile columns only (still durable; checklist requires 041 but columns may exist alone)
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

    console.warn('[consent] profiles consent columns missing. Apply migration 041.');
  }

  // Path 3: process memory — MOCK_MODE only (not a durable DPDP/agreement record)
  if (!isMockMode()) {
    const err = new Error(
      'Consent storage unavailable. Apply supabase/migrations/041_mvp1_legal_consent_search.sql (checklist ops.migrations_core) before recording consent.',
    );
    err.code = 'CONSENT_STORAGE_UNAVAILABLE';
    err.status = 503;
    err.userMessage = err.message;
    throw err;
  }

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
      'Consent stored in API memory only (MOCK_MODE). Apply supabase/migrations/041_mvp1_legal_consent_search.sql for durable records.',
  };
}
