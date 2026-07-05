import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { sendOtp, verifyOtp, isMockMode } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
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
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card-elevated animate-in" style={{ maxWidth: 420, width: '100%', padding: 48 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-telugu)', fontSize: '2.5rem', marginBottom: 8 }}>కథ</h1>
          <p style={{ color: 'var(--ink-muted)' }}>Creator Studio</p>
          <p style={{ fontSize: '0.875rem', marginTop: 12, color: 'var(--ink-soft)' }}>
            Sign in with your phone to publish stories
          </p>
          {isMockMode && (
            <p style={{ fontSize: '0.75rem', marginTop: 8, color: 'var(--gold)', fontWeight: 500 }}>
              MOCK MODE • OTP = 123456 (no Supabase needed)
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
              <span className="input-hint">Indian mobile number with country code</span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={18} />}
              {loading ? 'Sending...' : 'Send OTP'}
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
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
              {loading ? 'Verifying...' : 'Sign in'}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: '100%' }} onClick={() => {
              setStep('phone');
              setOtp('');
              setError(null);
            }}>
              Change number
            </button>
          </form>
        )}

        {error && (
          <p style={{ color: 'var(--gold-dark)', fontSize: '0.875rem', marginTop: 16, textAlign: 'center' }}>{error}</p>
        )}

        {/* Supabase handles OTP via configured Send SMS Hook (no client reCAPTCHA container needed) */}
      </div>
    </div>
  );
}