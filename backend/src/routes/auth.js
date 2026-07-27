import { Router } from 'express';
import crypto from 'crypto';
import { createAppError } from '../middleware/errorHandler.js';
import { getLaunchOfferConfig, grantLaunchTrial } from '../services/launchOffer.js';
import { getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { requireAuth, getAuthenticatedUserId } from '../middleware/authenticate.js';
import { isValidMobile, phoneValidationMessage } from '../config/phone.js';

// Pure Supabase Auth (per katha-auth-architecture-decision_auth.md)
// Phone OTP delivery: whatsapp-otp edge function (wired via Supabase Send SMS Hook). No Firebase.
//
// Reader sign-in: Google (primary) + email magic link — handled entirely by Supabase client SDK.
// Creator sign-in: phone OTP via Supabase client SDK (mandatory for payout/KYC in Creator CMS).
// These routes exist only for MOCK_MODE dev convenience; production clients use Supabase directly.

// ===== Production Constants from Blueprint (Phase 1.2) =====
const OTP_VALIDITY_MINUTES = 10;
const OTP_REQUEST_LIMIT = 3;
const OTP_REQUEST_WINDOW_HOURS = 1;
const OTP_ATTEMPT_LIMIT = 10;
const OTP_COOLDOWN_HOURS = 24;

export const authRouter = Router();

// In-memory stores (used always for speed; persisted to Supabase when available)
const otpStore = new Map(); // phone -> { otp, role, expires, deviceFp? }
const requestCounts = new Map(); // phoneHash -> [{ts}, ...]
const failureCounts = new Map(); // phoneHash -> [{ts}, ...]

// ===== Helpers (Blueprint-aligned) =====
function hashPhone(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
}

function getDeviceFingerprint(req) {
  // Simple: combine UA + a stable header. Real: use device_info from client.
  const ua = req.headers['user-agent'] || 'unknown';
  const hdr = req.headers['x-device-id'] || req.headers['x-client-version'] || '';
  return crypto.createHash('sha256').update(`${ua}|${hdr}`).digest('hex').slice(0, 32);
}

function isWithinWindow(ts, hours) {
  return (Date.now() - ts) < hours * 60 * 60 * 1000;
}

function countRecent(entries, hours) {
  return (entries || []).filter(e => isWithinWindow(e.ts || e, hours)).length;
}

function cleanupOld(map, hours) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  for (const [k, arr] of map.entries()) {
    const filtered = (arr || []).filter(e => (e.ts || e) > cutoff);
    if (filtered.length === 0) map.delete(k);
    else map.set(k, filtered);
  }
}

async function logOtpRequest(phoneHash, deviceFingerprint, ip) {
  // Always track in-mem for rate limits
  const now = Date.now();
  const reqs = requestCounts.get(phoneHash) || [];
  reqs.push({ ts: now });
  requestCounts.set(phoneHash, reqs.slice(-20)); // bound memory

  // Persist to Supabase if configured (for prod + audit)
  const sb = getSupabase();
  if (sb && !isMockMode()) {
    try {
      await sb.from('otp_requests').insert({
        phone_hash: phoneHash,
        device_fingerprint: deviceFingerprint,
        ip_address: ip,
      });
    } catch (e) { /* non-fatal */ }
  }
}

async function recordOtpFailure(phoneHash, errorCode, ip) {
  const now = Date.now();
  const fails = failureCounts.get(phoneHash) || [];
  fails.push({ ts: now, code: errorCode });
  failureCounts.set(phoneHash, fails.slice(-30));

  const sb = getSupabase();
  if (sb && !isMockMode()) {
    try {
      await sb.from('otp_failures').insert({
        phone_hash: phoneHash,
        error_code: errorCode,
        ip_address: ip,
      });
    } catch (e) { /* non-fatal */ }
  }
}

async function checkRateLimits(phone, phoneHash, ip) {
  cleanupOld(requestCounts, OTP_REQUEST_WINDOW_HOURS + 1);
  cleanupOld(failureCounts, OTP_COOLDOWN_HOURS + 1);

  // 1. Recent OTP requests
  const recentReqs = countRecent(requestCounts.get(phoneHash) || [], OTP_REQUEST_WINDOW_HOURS);
  if (recentReqs >= OTP_REQUEST_LIMIT) {
    throw createAppError('RATE_LIMITED', `Too many OTP requests. Try again after ${OTP_REQUEST_WINDOW_HOURS} hour.`, 429);
  }

  // 2. Cooldown after failures
  const recentFails = (failureCounts.get(phoneHash) || []).filter(f => isWithinWindow(f.ts, OTP_COOLDOWN_HOURS));
  if (recentFails.length >= OTP_ATTEMPT_LIMIT) {
    const last = Math.max(...recentFails.map(f => f.ts));
    const remainingMin = Math.ceil((OTP_COOLDOWN_HOURS * 60 * 60 * 1000 - (Date.now() - last)) / 60000);
    throw createAppError('RATE_LIMITED', `Too many failed attempts. Try again in ~${remainingMin} minutes.`, 429);
  }
}

authRouter.post('/send-otp', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !isValidMobile(phone)) {
      throw createAppError('INVALID_PHONE', phoneValidationMessage(), 400);
    }

    // In pure Supabase path, rate limiting / OTP is handled inside Supabase Auth + Send SMS Hook.
    // This endpoint is retained only for backward-compat / mock during transition.
    if (isMockMode()) {
      const MOCK_OTP = '123456';
      otpStore.set(phone, { otp: MOCK_OTP, expires: Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000 });
      return res.json({ sent: true, phone, hint: 'MOCK MODE — enter 123456 (Supabase path preferred)' });
    }

    res.json({
      sent: true,
      phone,
      message: 'Use Supabase client.auth.signInWithOtp(phone) directly. See katha-auth-architecture-decision_auth.md',
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    // Pure Supabase Auth path — clients should authenticate directly via Supabase client.
    // This endpoint retained only for mock / transition compatibility.
    const { phone, otp, role = 'reader', display_name } = req.body;

    if (isMockMode()) {
      const stored = otpStore.get(phone);
      const isValid = stored && stored.otp === (otp || '') && Date.now() <= (stored.expires || 0);

      if (!isValid) {
        throw createAppError('INVALID_OTP', 'Invalid OTP. In MOCK_MODE use 123456', 401);
      }

      const mockUid = 'mock-' + (phone || 'user').replace(/\D/g, '').slice(0, 20);
      const isCreator = role === 'creator';
      const trial = isCreator ? {} : grantLaunchTrial(mockUid, { isNewUser: true });

      const user = {
        id: mockUid,
        phone: phone || '',
        role: isCreator ? 'creator' : 'reader',
        display_name: display_name || (isCreator ? 'Demo Creator' : 'Demo Reader'),
        subscription_status: trial.subscription_status || 'free',
        trial_ends_at: trial.trial_ends_at || null,
        launch_trial_granted: trial.launch_trial_granted || false,
        launch_trial_days: trial.launch_trial_days || null,
        launch_trial_waitlist: trial.launch_trial_waitlist || false,
        is_new_user: true,
      };

      otpStore.delete(phone || '');

      // Note: in pure path, Supabase session JWT is used instead of katha-token
      return res.json({
        user,
        token: `katha-token-${user.id}-${Date.now()}`,
        launch_offer: getLaunchOfferConfig(),
        note: 'Prefer direct Supabase auth per architecture decision',
      });
    }

    // For real Supabase, clients call supabase.auth.verifyOTP directly.
    // No custom token issued.
    throw createAppError('USE_SUPABASE_AUTH', 'Use Supabase client for OTP verification. See katha-auth-architecture-decision_auth.md', 400);
  } catch (err) {
    next(err);
  }
});

// Optional: endpoint to allow client to refresh FCM token (future-proof for Phase 2)
authRouter.post('/fcm-token', requireAuth(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { fcm_token, device_fingerprint } = req.body;
    if (!fcm_token) {
      return res.json({ ok: false });
    }
    const sb = getSupabase();
    if (sb) {
      await sb.from('fcm_tokens').upsert({
        user_id: userId,
        fcm_token,
        device_fingerprint: device_fingerprint || 'unknown',
        last_refreshed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,fcm_token' });
    }
    res.json({ ok: true });
  } catch (err) {
    // non-fatal
    res.json({ ok: true });
  }
});

authRouter.get('/me', requireAuth(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const sb = getSupabase();
    let role = req.auth?.role || 'reader';
    let subscription_status = 'free';
    let dpdp_consent_version = null;
    let creator_agreement_version = null;

    if (sb) {
      const { data: profile } = await sb.from('profiles')
        .select('role, subscription_status, dpdp_consent_version, creator_agreement_version')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        role = profile.role || role;
        subscription_status = profile.subscription_status || subscription_status;
        dpdp_consent_version = profile.dpdp_consent_version || null;
        creator_agreement_version = profile.creator_agreement_version || null;
      }
    } else if (isMockMode()) {
      const { getMockConsents, DPDP_PRIVACY_VERSION, CREATOR_AGREEMENT_VERSION } = await import('../lib/consent.js');
      const list = getMockConsents(userId);
      if (list.some((c) => c.consent_type === 'dpdp_privacy' && c.policy_version === DPDP_PRIVACY_VERSION)) {
        dpdp_consent_version = DPDP_PRIVACY_VERSION;
      }
      if (list.some((c) => c.consent_type === 'creator_agreement' && c.policy_version === CREATOR_AGREEMENT_VERSION)) {
        creator_agreement_version = CREATOR_AGREEMENT_VERSION;
      }
    }

    res.json({
      user: {
        id: userId,
        role,
        subscription_status,
        dpdp_consent_version,
        creator_agreement_version,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/consent
 * Body: { dpdp: true, creator_agreement?: true, user_agent?: string }
 * Records versioned DPDP (+ optional Creator Agreement) consent.
 * Durable outside MOCK_MODE (user_consents / profiles — migration 041).
 * No in-memory legal fallback in production (checklist ops.migrations_core).
 */
authRouter.post('/consent', requireAuth(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      throw createAppError('OTP_REQUIRED', 'Authentication required', 401);
    }

    const { dpdp, creator_agreement, user_agent } = req.body || {};
    // Accept common truthy shapes from clients
    const dpdpOk = dpdp === true || dpdp === 'true' || dpdp === 1 || dpdp === '1';
    const agreementOk =
      creator_agreement === true ||
      creator_agreement === 'true' ||
      creator_agreement === 1 ||
      creator_agreement === '1';

    if (!dpdpOk) {
      throw createAppError('VALIDATION_ERROR', 'DPDP privacy consent is required', 400);
    }

    const { persistCreatorConsents, recordMockConsent, DPDP_PRIVACY_VERSION, CREATOR_AGREEMENT_VERSION } =
      await import('../lib/consent.js');

    const ua = user_agent || req.headers['user-agent'] || null;

    if (isMockMode()) {
      recordMockConsent(userId, {
        consent_type: 'dpdp_privacy',
        policy_version: DPDP_PRIVACY_VERSION,
        accepted: true,
        user_agent: ua,
      });
      if (agreementOk) {
        recordMockConsent(userId, {
          consent_type: 'creator_agreement',
          policy_version: CREATOR_AGREEMENT_VERSION,
          accepted: true,
          user_agent: ua,
        });
      }
      return res.json({
        ok: true,
        mock: true,
        storage: 'memory',
        dpdp_consent_version: DPDP_PRIVACY_VERSION,
        creator_agreement_version: agreementOk ? CREATOR_AGREEMENT_VERSION : null,
      });
    }

    const sb = getSupabase();
    const result = await persistCreatorConsents(sb, {
      userId,
      creatorAgreement: agreementOk,
      userAgent: ua,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});