import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Loader2, RotateCcw, X } from 'lucide-react';
import { triggerPhoneVerification, verifyPhoneVerification } from '../lib/phoneVerification';

const RESEND_COOLDOWN_SEC = 60;

interface PhoneVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function PhoneVerificationModal({
  open,
  onClose,
  onVerified,
  title = 'Verify via WhatsApp',
  description = 'To publish and receive payouts, verify your Indian mobile number. We send a 6-digit code on WhatsApp — not SMS.',
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSecs, setResendSecs] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setOtp('');
      setError(null);
      setResendSecs(0);
    }
  }, [open]);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  const startCooldown = useCallback(() => setResendSecs(RESEND_COOLDOWN_SEC), []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await triggerPhoneVerification(phone);
      setStep('otp');
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send WhatsApp code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSecs > 0) return;
    setLoading(true);
    setError(null);
    try {
      await triggerPhoneVerification(phone);
      setOtp('');
      startCooldown();
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
      await verifyPhoneVerification(phone, otp);
      onVerified();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="cms-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wa-verify-title">
      <div className="cms-modal cms-modal--warm">
        <button type="button" className="cms-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="cms-modal__icon">
          <MessageCircle size={28} />
        </div>
        <h2 id="wa-verify-title" className="cms-modal__title">{title}</h2>
        <p className="cms-modal__desc">{description}</p>

        {step === 'phone' ? (
          <form onSubmit={handleSend}>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>WhatsApp number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                required
              />
              <span className="input-hint">Must match your active WhatsApp account</span>
            </div>
            <button type="submit" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center', border: 'none' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="cms-loading__spin" /> : <MessageCircle size={18} />}
              {loading ? 'Sending…' : 'Send code on WhatsApp'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>6-digit WhatsApp code</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                required
                maxLength={6}
              />
              <span className="input-hint">Sent to {phone} on WhatsApp</span>
            </div>
            <button type="submit" className="dashboard-cta" style={{ width: '100%', justifyContent: 'center', border: 'none', marginBottom: 12 }} disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: 8 }} onClick={handleResend} disabled={loading || resendSecs > 0}>
              <RotateCcw size={16} />
              {resendSecs > 0 ? `Resend in ${resendSecs}s` : 'Resend on WhatsApp'}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={() => { setStep('phone'); setOtp(''); setError(null); }}>
              Change number
            </button>
          </form>
        )}

        {error && <p className="cms-error-text" style={{ marginTop: 16, textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
}