'use client';

import { useState } from 'react';
import { normalizeChapterHtml } from '@/lib/chapter';
import { BASE_AUTHOR_SHARE_PCT, MAX_AUTHOR_SHARE_PCT } from '@/lib/constants';

interface PaywallProps {
  storySlug: string;
  chapterNumber: number;
  chapterId: string;
  storyId: string;
  priceInr: string;
  pricePaise: number;
  accessToken: string | null;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, cb: (resp: { error?: { description?: string } }) => void) => void;
    };
  }
}

const BENEFITS = [
  'Finish this chapter instantly after payment',
  'Support the author through literary patronage — not coins or tips',
  'Or subscribe in the Katha app for unlimited stories (₹99/mo)',
] as const;

export function Paywall({
  storySlug,
  chapterNumber,
  chapterId,
  storyId,
  priceInr,
  accessToken,
}: PaywallProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [lockedContent, setLockedContent] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'checkout' | 'confirming'>('idle');

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  };

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    setStep('checkout');

    try {
      const res = await fetch('/api/payments/unlock', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          story_slug: storySlug,
          chapter_number: chapterNumber,
          chapter_id: chapterId,
          story_id: storyId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Sign in to unlock, or open this story in the Katha app.');
        }
        if (res.status === 503) {
          throw new Error(
            data.error ||
              'This chapter is not available for purchase yet. Open the Katha app for subscription access.',
          );
        }
        throw new Error(data.error || 'Payment could not be started');
      }

      if (data.already_unlocked && data.content) {
        setUnlocked(true);
        setLockedContent(data.content);
        setStep('idle');
        return;
      }

      if (!data.razorpay_key_id || !data.order_id) {
        throw new Error(
          data.error ||
            'Payments are not fully configured. Please try the Katha reader app subscription.',
        );
      }

      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const rzp = new window.Razorpay!({
        key: data.razorpay_key_id,
        amount: data.amount_paise,
        currency: data.currency || 'INR',
        name: 'Katha',
        description: `Unlock chapter — ₹${priceInr}`,
        order_id: data.order_id,
        prefill: {},
        notes: {
          story_id: storyId,
          chapter_id: chapterId,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setStep('confirming');
          setLoading(true);
          try {
            const confirm = await fetch('/api/payments/unlock/confirm', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                transaction_id: data.transaction_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const confirmed = await confirm.json();
            if (!confirm.ok) {
              setError(confirmed.error || 'Unlock failed — payment may still settle. Refresh shortly.');
              return;
            }
            setUnlocked(true);
            setLockedContent(confirmed.content);
          } catch {
            setError('Could not confirm payment. If you were charged, refresh this page in a moment.');
          } finally {
            setLoading(false);
            setStep('idle');
          }
        },
        theme: { color: '#C4A052' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStep('idle');
          },
        },
      });

      rzp.on?.('payment.failed', (resp) => {
        setError(resp?.error?.description || 'Payment failed. You can try again.');
        setLoading(false);
        setStep('idle');
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
      setStep('idle');
    }
  };

  if (unlocked && lockedContent) {
    return (
      <div
        className="chapter-body"
        dangerouslySetInnerHTML={{ __html: normalizeChapterHtml(lockedContent) }}
      />
    );
  }

  const ctaLabel =
    step === 'confirming'
      ? 'Confirming payment…'
      : loading
        ? 'Opening secure checkout…'
        : `Unlock for ₹${priceInr}`;

  return (
    <section className="paywall" aria-label="Unlock chapter">
      <div className="paywall__panel">
        <div className="paywall__ornament" aria-hidden />
        <p className="paywall__eyebrow" lang="te">
          కథ · Literary patronage
        </p>
        <h2>Continue reading</h2>
        <p className="paywall__subtitle">
          Support the author through literary patronage — unlock this chapter. No ads. No coins.
        </p>

        <div className="paywall__price-row">
          <span className="paywall__price">₹{priceInr}</span>
          <span className="paywall__price-note">this chapter</span>
        </div>

        <ul className="paywall__benefits">
          {BENEFITS.map((b) => (
            <li key={b}>{b}</li>
          ))}
          <li className="paywall__benefits-share">
            Author share: {BASE_AUTHOR_SHARE_PCT}% base · up to {MAX_AUTHOR_SHARE_PCT}% at Apex Story Trust
          </li>
        </ul>

        {error && (
          <p className="paywall__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary paywall__cta"
          onClick={() => {
            void handleUnlock();
          }}
          disabled={loading}
        >
          {ctaLabel}
        </button>

        <p className="paywall__fine" style={{ marginTop: 12 }}>
          Prefer unlimited?{' '}
          <a
            href={
              process.env.NEXT_PUBLIC_READER_APP_URL
                ? `${process.env.NEXT_PUBLIC_READER_APP_URL.replace(/\/$/, '')}`
                : 'https://katha.app'
            }
          >
            Open the Katha app
          </a>{' '}
          and subscribe — no dead unlock if payments are not configured on web.
        </p>

        <p className="paywall__fine">
          Secure payment via Razorpay · Cancel anytime on subscription plans in the Katha app · Prefer
          unlimited? Subscribe in the reader for ₹99/mo
        </p>
      </div>
    </section>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-sdk')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Payment SDK failed to load'));
    document.body.appendChild(script);
  });
}
