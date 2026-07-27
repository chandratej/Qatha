import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  CREATOR_AGREEMENT_VERSION,
  DPDP_PRIVACY_VERSION,
  CREATOR_AGREEMENT_SUMMARY,
  DPDP_CONSENT_SUMMARY,
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
          // Never fall back to localhost in production builds — missing VITE_API_URL must fail closed.
          const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
          if (!apiBase) {
            if (!cancelled) {
              setError('Studio API URL is not configured (VITE_API_URL).');
              setNeedsConsent(true);
              setReady(true);
            }
            return;
          }
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
      setError('Please accept both the Privacy Policy and Creator Agreement to continue.');
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
      // Backend already soft-degrades schema lag; true errors must surface and retry.
      const message =
        e instanceof Error
          ? e.message
          : 'Could not save consent. Please try again.';
      setError(
        `${message} Studio unlocks only after consent is recorded on the server.`,
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
        Loading…
      </div>
    );
  }
  if (!user || !needsConsent) return <Outlet />;

  return (
    <div className="cms-auth-page cms-auth-page--v2">
      <div className="cms-auth-card cms-auth-card--wide animate-in" style={{ maxWidth: 560 }}>
        <div className="cms-auth-card__brand">
          <Scale size={28} aria-hidden />
          <h1 className="cms-auth-card__logo" style={{ fontSize: '1.5rem' }}>
            Legal essentials
          </h1>
          <p className="cms-auth-card__tagline-telugu">
            DPDP consent + Creator Agreement — required before publishing on Katha
          </p>
        </div>

        <label
          className="legal-consent-row"
          style={{ display: 'flex', gap: 12, marginTop: 20, alignItems: 'flex-start' }}
        >
          <input type="checkbox" checked={dpdp} onChange={(e) => setDpdp(e.target.checked)} />
          <span>
            <strong>Privacy (DPDP)</strong> — {DPDP_CONSENT_SUMMARY}{' '}
            <Link to="/legal#privacy">Privacy Policy</Link>
            <span style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>
              Version {DPDP_PRIVACY_VERSION}
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
            <strong>Creator Agreement</strong> — {CREATOR_AGREEMENT_SUMMARY}{' '}
            <Link to="/legal#creator-agreement">Full agreement</Link>
            <span style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>
              Version {CREATOR_AGREEMENT_VERSION}
            </span>
          </span>
        </label>

        <p style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>
          Grievance officer:{' '}
          <a href="mailto:grievance@katha.in">grievance@katha.in</a>
          {' · '}
          <Link to="/legal">Legal & transparency</Link>
        </p>

        {error && (
          <p role="alert" style={{ color: '#8B3A62', marginTop: 12 }}>
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
          {submitting ? 'Saving…' : 'Accept & continue to Creator Studio'}
        </button>
      </div>
    </div>
  );
}
