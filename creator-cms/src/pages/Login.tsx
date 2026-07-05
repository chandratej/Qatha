import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, Leaf, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../lib/api';
import { ONBOARDING_KEY } from '../lib/constants';

const RESEND_COOLDOWN_SEC = 60;

export function Login() {
  const { sendOtp, verifyOtp, isMockMode } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+91');
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

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setStep('otp');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendSecs > 0) return;
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setOtp('');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, otp, name || undefined);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
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
            Sign in with your phone to publish stories and receive payouts.
          </p>
          {isMockMode && (
            <p style={{ fontSize: '0.75rem', marginTop: 10, color: 'var(--gold)', fontWeight: 500 }}>
              MOCK MODE · OTP = 123456
            </p>
          )}
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Phone number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--ink-muted)' }} />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
              <span className="input-hint">Indian mobile — required for creator payout verification</span>
            </div>
            <button type="submit" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center', border: 'none' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="cms-loading__spin" /> : <ArrowRight size={18} />}
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Pen name (optional)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="How readers see you" />
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>6-digit OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                required
                maxLength={6}
              />
              <span className="input-hint">Sent to {phone}</span>
            </div>
            <button type="submit" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center', border: 'none', marginBottom: 12 }} disabled={loading}>
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={handleResendOtp}
              disabled={loading || resendSecs > 0}
            >
              <RotateCcw size={16} />
              {resendSecs > 0 ? `Resend OTP in ${resendSecs}s` : 'Resend OTP'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%' }}
              onClick={() => { setStep('phone'); setOtp(''); setError(null); setResendSecs(0); }}
            >
              Change number
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