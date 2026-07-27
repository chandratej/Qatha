import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { resolveStudioApiBase } from '../config/api_config';
import { api } from '../lib/api';
import {
  CREATOR_AGREEMENT_VERSION,
  DPDP_PRIVACY_VERSION,
  CREATOR_AGREEMENT_SUMMARY,
  CREATOR_AGREEMENT_SUMMARY_TE,
  DPDP_CONSENT_SUMMARY,
  DPDP_CONSENT_SUMMARY_TE,
} from '../../../packages/shared/creatorAgreement';

const LOCAL_KEY = 'katha_creator_legal_consent_v1';

function expectedLocalValue() {
  return `${DPDP_PRIVACY_VERSION}|${CREATOR_AGREEMENT_VERSION}`;
}

/**
 * Legal Wave 0 — block Studio until DPDP + Creator Agreement accepted.
 * Durable record via POST /auth/consent when authenticated.
 * localStorage is a cache after server confirmation (and the store in mock mode only).
 */
export function LegalConsentGate() {
  const { user, token, isMockMode } = useAuth();
  const { locale } = useLocale();
  const te = locale === 'te';
  const [ready, setReady] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [dpdp, setDpdp] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReady(true);
      setNeedsConsent(false);
      return;
    }

    const localOk = localStorage.getItem(LOCAL_KEY) === expectedLocalValue();

    // Mock / offline Studio: localStorage is the only consent store.
    if (isMockMode) {
      setNeedsConsent(!localOk);
      setReady(true);
      return;
    }

    // Authenticated production path: localStorage alone is never sufficient —
    // server must report matching DPDP + Creator Agreement versions.
    let cancelled = false;
    (async () => {
      try {
        if (token) {
          // Production default lives in resolveStudioApiBase (never localhost in PROD).
          const apiBase = resolveStudioApiBase();
          const res = await fetch(`${apiBase}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const body = await res.json();
            const u = body.user || {};
            if (
              u.dpdp_consent_version === DPDP_PRIVACY_VERSION &&
              u.creator_agreement_version === CREATOR_AGREEMENT_VERSION
            ) {
              localStorage.setItem(LOCAL_KEY, expectedLocalValue());
              if (!cancelled) {
                setNeedsConsent(false);
                setReady(true);
              }
              return;
            }
            // Stale client cache must not unlock Studio.
            localStorage.removeItem(LOCAL_KEY);
          }
        }
      } catch {
        /* fall through — fail closed until server confirms */
      }
      if (!cancelled) {
        setNeedsConsent(true);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, token, isMockMode]);

  const submit = async () => {
    if (!dpdp || !agreement) {
      setError(
        te
          ? 'కొనసాగడానికి ప్రైవసీ పాలసీ మరియు క్రియేటర్ అగ్రిమెంట్ రెండింటినీ అంగీకరించండి.'
          : 'Please accept both the Privacy Policy and Creator Agreement to continue.',
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isMockMode) {
        // No durable backend in mock mode — local acceptance unlocks Studio.
        localStorage.setItem(LOCAL_KEY, expectedLocalValue());
        setNeedsConsent(false);
        return;
      }

      const result = await api.recordConsent({
        dpdp: true,
        creator_agreement: true,
        user_agent: navigator.userAgent,
      });
      // Cache only after server accepted (API degrades to memory/profiles but returns 200).
      localStorage.setItem(LOCAL_KEY, expectedLocalValue());
      setNeedsConsent(false);
      if (result && 'warning' in result && result.warning) {
        console.warn('[LegalConsentGate]', result.warning);
      }
    } catch (e) {
      // Fail closed: do not treat localStorage as durable DPDP / Creator Agreement.
      const message =
        e instanceof Error
          ? e.message
          : te
            ? 'సమ్మతి సేవ్ కాలేదు. మళ్లీ ప్రయత్నించండి.'
            : 'Could not save consent. Please try again.';
      setError(
        te
          ? `${message} సర్వర్‌లో సమ్మతి నమోదు అయిన తర్వాతే Studio తెరుస్తుంది.`
          : `${message} Studio unlocks only after consent is recorded on the server.`,
      );
      console.warn(
        '[LegalConsentGate] API consent failed — Studio remains locked until retry succeeds.',
        message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="cms-loading-shell" aria-busy="true" style={{ padding: '2rem', textAlign: 'center' }}>
        {te ? 'లోడ్ అవుతోంది…' : 'Loading…'}
      </div>
    );
  }
  if (!user || !needsConsent) return <Outlet />;

  const dpdpSummary = te ? DPDP_CONSENT_SUMMARY_TE : DPDP_CONSENT_SUMMARY;
  const agreementSummary = te ? CREATOR_AGREEMENT_SUMMARY_TE : CREATOR_AGREEMENT_SUMMARY;

  return (
    <div className="cms-auth-page cms-auth-page--v2">
      <div className="cms-auth-card cms-auth-card--wide animate-in" style={{ maxWidth: 560 }}>
        <div className="cms-auth-card__brand">
          <Scale size={28} aria-hidden />
          <h1 className="cms-auth-card__logo" style={{ fontSize: '1.5rem' }}>
            {te ? 'చట్టపరమైన అవసరాలు' : 'Legal essentials'}
          </h1>
          <p className="cms-auth-card__tagline-telugu">
            {te
              ? 'ప్రైవసీ సమ్మతి + క్రియేటర్ అగ్రిమెంట్ — స్టూడియో తెరవడానికి రెండూ అవసరం'
              : 'Privacy consent + Creator Agreement — required to unlock Creator Studio'}
          </p>
        </div>

        <label
          className="legal-consent-row"
          style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'flex-start' }}
        >
          <input type="checkbox" checked={dpdp} onChange={(e) => setDpdp(e.target.checked)} />
          <span>
            <strong>{te ? 'ప్రైవసీ (DPDP)' : 'Privacy (DPDP)'}</strong>
            {' — '}
            {te ? 'నేను అంగీకరిస్తున్నాను: ' : 'I accept: '}
            {dpdpSummary}{' '}
            <Link to="/legal#privacy">{te ? 'ప్రైవసీ పాలసీ' : 'Privacy Policy'}</Link>
            <span style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>
              {te ? 'వెర్షన్' : 'Version'} {DPDP_PRIVACY_VERSION}
            </span>
          </span>
        </label>

        <label
          className="legal-consent-row"
          style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'flex-start' }}
        >
          <input
            type="checkbox"
            checked={agreement}
            onChange={(e) => setAgreement(e.target.checked)}
          />
          <span>
            <strong>{te ? 'క్రియేటర్ అగ్రిమెంట్' : 'Creator Agreement'}</strong>
            {' — '}
            {te ? 'నేను అంగీకరిస్తున్నాను: ' : 'I accept: '}
            {agreementSummary}{' '}
            <Link to="/legal#creator-agreement">{te ? 'పూర్తి అగ్రిమెంట్' : 'Full agreement'}</Link>
            <span style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>
              {te ? 'వెర్షన్' : 'Version'} {CREATOR_AGREEMENT_VERSION}
            </span>
          </span>
        </label>

        <p style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>
          {te ? 'గ్రీవెన్స్ ఆఫీసర్: ' : 'Grievance officer: '}
          <a href="mailto:grievance@katha.in">grievance@katha.in</a>
          {' · '}
          <Link to="/legal">{te ? 'చట్టం & పారదర్శకత' : 'Legal & transparency'}</Link>
        </p>

        {error && (
          <p className="cms-error-banner" role="alert" aria-live="assertive" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 20, width: '100%' }}
          disabled={submitting || !dpdp || !agreement}
          onClick={() => void submit()}
        >
          {submitting
            ? te
              ? 'సేవ్ అవుతోంది…'
              : 'Saving…'
            : te
              ? 'అంగీకరించి స్టూడియోకి వెళ్ళండి'
              : 'Accept & continue to Creator Studio'}
        </button>
      </div>
    </div>
  );
}
