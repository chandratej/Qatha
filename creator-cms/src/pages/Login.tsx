import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, Leaf, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../lib/api';
import { ONBOARDING_KEY } from '../lib/constants';

const RESEND_COOLDOWN_SEC = 60;

export function Login() {
  const { user, loading: authLoading, signInWithGoogle, sendEmailOtp, verifyEmailOtp, isMockMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true });
  }, [user, authLoading, navigate]);
  const [mode, setMode] = useState<'choose' | 'email' | 'otp'>('choose');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSecs, setResendSecs] = useState(0);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  const startResendCooldown = useCallback(() => setResendSecs(RESEND_COOLDOWN_SEC), []);

  const finishLogin = async () => {
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === 'true';
    if (!onboardingDone) {
      try {
        const { stories } = await api.getCreatorStories();
        if ((stories?.length ?? 0) === 0) {
          navigate('/onboarding');
          return;
        }
      } catch {
        navigate('/onboarding');
        return;
      }
    }
    navigate('/');
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (isMockMode) await finishLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendEmailOtp(email);
      setMode('otp');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSecs > 0) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailOtp(email);
      setOtp('');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyEmailOtp(email, otp, name || undefined);
      await finishLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-auth-page">
      <div className="cms-auth-page__theme">
        <ThemeToggle compact />
      </div>
      <div className="cms-auth-card animate-in">
        <div className="cms-auth-card__brand">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div className="premium-sidebar__brand-icon">
              <Leaf size={20} />
            </div>
          </div>
          <h1 className="cms-auth-card__logo">కథ</h1>
          <p className="cms-auth-card__tagline">Creator Studio</p>
          <p style={{ fontSize: '0.875rem', marginTop: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            Create your free creator account with Google or email. WhatsApp verification happens later when you publish.
          </p>
          {isMockMode && (
            <p style={{ fontSize: '0.75rem', marginTop: 10, color: 'var(--gold)', fontWeight: 500 }}>
              MOCK MODE · Email OTP = 123456
            </p>
          )}
        </div>

        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              className="dashboard-cta"
              style={{ width: '100%', justifyContent: 'center', border: 'none' }}
              onClick={handleGoogle}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="cms-loading__spin" /> : null}
              Continue with Google
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => { setMode('email'); setError(null); }}
              disabled={loading}
            >
              <Mail size={18} />
              Continue with email
            </button>
          </div>
        )}

        {mode === 'email' && (
          <form onSubmit={handleSendEmail}>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center', border: 'none', marginBottom: 12 }} disabled={loading}>
              {loading ? <Loader2 size={18} className="cms-loading__spin" /> : <ArrowRight size={18} />}
              {loading ? 'Sending…' : 'Send verification code'}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setMode('choose'); setError(null); }}>
              Back
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerify}>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Pen name (optional)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="How readers see you" />
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>6-digit code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                required
                maxLength={6}
              />
              <span className="input-hint">Sent to {email}</span>
            </div>
            <button type="submit" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center', border: 'none', marginBottom: 12 }} disabled={loading}>
              {loading ? 'Verifying…' : 'Create account'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: 8 }} onClick={handleResend} disabled={loading || resendSecs > 0}>
              <RotateCcw size={16} />
              {resendSecs > 0 ? `Resend in ${resendSecs}s` : 'Resend code'}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setMode('email'); setOtp(''); setError(null); }}>
              Change email
            </button>
          </form>
        )}

        {error && <p className="cms-error-text" style={{ marginTop: 16, textAlign: 'center' }}>{error}</p>}

        <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 24, textAlign: 'center', lineHeight: 1.5 }}>
          By continuing you agree to our Terms &amp; Privacy
        </p>
      </div>
    </div>
  );
}