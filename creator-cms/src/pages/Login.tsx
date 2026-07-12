import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandMark } from '../components/studio/BrandMark';
import { api } from '../lib/api';
import { ONBOARDING_KEY, BRAND } from '../lib/constants';

const RESEND_COOLDOWN_SEC = 60;

export function Login() {
  const { user, loading: authLoading, signInWithGoogle, sendEmailOtp, verifyEmailOtp, isMockMode } = useAuth();
  const { t, locale, setLocale } = useLocale();
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
    const timer = setInterval(() => setResendSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
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
    <div className="cms-auth-page cms-auth-page--v2 wc-page-enter">
      <div className="cms-auth-page__theme">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setLocale(locale === 'te' ? 'en' : 'te')}
          aria-label={t('nav.languageToggleAria')}
        >
          {t('nav.languageToggle')}
        </button>
        <ThemeToggle compact />
      </div>
      <div className="cms-auth-card animate-in">
        <div className="cms-auth-card__brand">
          <div className="cms-auth-card__brand-seal">
            <BrandMark size="lg" ornate label="Katha" />
          </div>
          <h1 className="cms-auth-card__logo">{BRAND.nameTelugu}</h1>
          <p className="cms-auth-card__product">{BRAND.productName}</p>
          <p className="cms-auth-card__tagline-telugu">{BRAND.taglineTelugu}</p>
          <p className="cms-auth-card__promise">{BRAND.creatorPromise}</p>
          <p className="cms-auth-card__pride">{BRAND.prideLineTelugu}</p>
          {isMockMode && (
            <p className="cms-auth-card__mock">{t('login.mockMode')}</p>
          )}
        </div>

        {mode === 'choose' && (
          <div className="cms-auth-actions">
            <button
              type="button"
              className="dashboard-cta cms-auth-cta"
              onClick={handleGoogle}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="cms-loading__spin" /> : null}
              {t('login.continueGoogle')}
            </button>
            <button
              type="button"
              className="btn btn-secondary cms-auth-cta"
              onClick={() => { setMode('email'); setError(null); }}
              disabled={loading}
            >
              <Mail size={18} aria-hidden />
              {t('login.continueEmail')}
            </button>
          </div>
        )}

        {mode === 'email' && (
          <form onSubmit={handleSendEmail} className="cms-auth-form">
            <div className="input-group">
              <label htmlFor="login-email">{t('login.emailLabel')}</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <button type="submit" className="dashboard-cta cms-auth-cta" disabled={loading}>
              {loading ? <Loader2 size={18} className="cms-loading__spin" /> : <ArrowRight size={18} aria-hidden />}
              {loading ? t('login.sending') : t('login.sendCode')}
            </button>
            <button type="button" className="btn btn-ghost cms-auth-cta" onClick={() => { setMode('choose'); setError(null); }}>
              {t('login.back')}
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerify} className="cms-auth-form">
            <div className="input-group">
              <label htmlFor="login-pen-name">{t('login.penName')}</label>
              <input
                id="login-pen-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('login.penNamePlaceholder')}
                autoComplete="nickname"
              />
            </div>
            <div className="input-group">
              <label htmlFor="login-otp">{t('login.otpLabel')}</label>
              <input
                id="login-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('login.otpPlaceholder')}
                className="cms-auth-otp"
                required
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
              />
              <span className="input-hint">{t('login.sentTo')} {email}</span>
            </div>
            <button type="submit" className="dashboard-cta cms-auth-cta" disabled={loading || otp.length < 6}>
              {loading ? t('login.verifying') : t('login.enterStudio')}
            </button>
            <button type="button" className="btn btn-secondary cms-auth-cta" onClick={handleResend} disabled={loading || resendSecs > 0}>
              <RotateCcw size={16} aria-hidden />
              {resendSecs > 0 ? `${t('login.resendIn')} ${resendSecs}s` : t('login.resend')}
            </button>
            <button type="button" className="btn btn-ghost cms-auth-cta" onClick={() => { setMode('email'); setOtp(''); setError(null); }}>
              {t('login.changeEmail')}
            </button>
          </form>
        )}

        {error && <p className="cms-error-text cms-auth-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}