'use client';

import { useState } from 'react';
import { normalizeChapterHtml } from '@/lib/chapter';

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
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

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

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  };

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);

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
          throw new Error('Sign in to unlock this chapter, or read in the Katha app.');
        }
        throw new Error(data.error || 'Payment could not be started');
      }

      if (data.already_unlocked && data.content) {
        setUnlocked(true);
        setLockedContent(data.content);
        return;
      }

      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const rzp = new window.Razorpay!({
        key: data.razorpay_key_id,
        amount: data.amount_paise,
        currency: data.currency,
        name: 'Katha',
        description: `Unlock chapter — ₹${priceInr}`,
        order_id: data.order_id,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
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
            setError(confirmed.error || 'Unlock failed');
            return;
          }
          setUnlocked(true);
          setLockedContent(confirmed.content);
        },
        theme: { color: '#9a7b3a' },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
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

  return (
    <section className="paywall" aria-label="Unlock chapter">
      <div className="paywall__panel">
        <h2>Continue reading</h2>
        <p className="paywall__price">₹{priceInr}</p>
        <p>Unlock the rest of this chapter, or read the full story in the Katha app.</p>
        {error && <p className="paywall__error">{error}</p>}
        <button
          type="button"
          className="btn btn-primary paywall__cta"
          onClick={handleUnlock}
          disabled={loading}
        >
          {loading ? 'Opening payment…' : `Unlock for ₹${priceInr}`}
        </button>
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