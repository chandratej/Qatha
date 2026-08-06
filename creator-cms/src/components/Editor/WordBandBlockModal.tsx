import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type WordBandBlockReason = 'below_min' | 'over_hard_max';

interface WordBandBlockModalProps {
  open: boolean;
  onClose: () => void;
  wordCount: number;
  min?: number;
  max?: number;
  hardMax?: number;
  reason?: WordBandBlockReason;
  locale?: string;
}

/** Soft recommended band defaults (guidance only — length never blocks publish). */
const DEFAULT_MIN = 1000;
const DEFAULT_MAX = 1500;

/**
 * @deprecated Chapter length is never a publish barrier.
 * Kept for call-site compatibility only. Prefer soft guidance UI.
 * Do not wire this into publish — production no longer hard-blocks on length.
 */
export function WordBandBlockModal({
  open,
  onClose,
  wordCount,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  hardMax,
  reason = 'below_min',
  locale = 'en',
}: WordBandBlockModalProps) {
  // No hard max by product rule — only surface a soft recommended upper if a caller passes one.
  const effectiveHardMax = hardMax ?? null;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const te = locale === 'te';
  const below = reason === 'below_min';
  const need = below
    ? Math.max(0, min - wordCount)
    : effectiveHardMax != null
      ? Math.max(0, wordCount - effectiveHardMax)
      : Math.max(0, wordCount - max);

  // Soft guidance only — never frame length as a hard publish block.
  const title = below
    ? te
      ? 'సిఫార్సు కంటే తక్కువ పదాలు'
      : 'Below recommended word count'
    : te
      ? 'సిఫార్సు కంటే ఎక్కువ పదాలు'
      : 'Above recommended word count';

  const lead = below
    ? te
      ? `సిఫార్సు కనీసం ${min.toLocaleString('te')} పదాలు. మీకు ${wordCount.toLocaleString('te')} ఉన్నాయి (~${need.toLocaleString('te')} తక్కువ). ఏ పొడవు అయినా ప్రచురించవచ్చు.`
      : `Recommended at least ${min.toLocaleString()} words. You have ${wordCount.toLocaleString()} (~${need.toLocaleString()} short). You can still publish any length.`
    : te
      ? `సిఫార్సు గరిష్ఠం ${max.toLocaleString('te')} పదాలు. మీకు ${wordCount.toLocaleString('te')} ఉన్నాయి. ఏ పొడవు అయినా ప్రచురించవచ్చు.`
      : `Recommended up to ${max.toLocaleString()} words. You have ${wordCount.toLocaleString()}. You can still publish any length.`;

  const backdrop: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 2147483000,
    background: 'rgba(20, 16, 12, 0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    boxSizing: 'border-box',
  };

  const panel: React.CSSProperties = {
    width: '100%',
    maxWidth: 440,
    background: '#faf7f2',
    color: '#1a1410',
    borderRadius: 14,
    border: '1px solid #d4c4a8',
    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
    padding: '22px 22px 18px',
    fontFamily: 'system-ui, Segoe UI, sans-serif',
  };

  const btn: React.CSSProperties = {
    marginTop: 16,
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderRadius: 10,
    background: '#6b2d3c',
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
  };

  return createPortal(
    <div
      style={backdrop}
      role="presentation"
      onClick={onClose}
      data-testid="word-band-block-modal"
    >
      <div
        style={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="word-band-block-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="word-band-block-title"
          style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#6b2d3c' }}
        >
          {title}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.5 }}>{lead}</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            padding: 12,
            borderRadius: 10,
            background: 'rgba(107, 45, 60, 0.08)',
            fontSize: 14,
          }}
        >
          <div>
            <div style={{ opacity: 0.7, fontSize: 11, textTransform: 'uppercase' }}>
              {te ? 'మీ పదాలు' : 'Your words'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#6b2d3c' }}>
              {wordCount.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.7, fontSize: 11, textTransform: 'uppercase' }}>
              {te ? 'కనీసం' : 'Minimum'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{min.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ opacity: 0.7, fontSize: 11, textTransform: 'uppercase' }}>
              {te ? 'సిఫార్సు' : 'Recommended'}
            </div>
            <div style={{ fontWeight: 600 }}>
              {min.toLocaleString()}–{max.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.7, fontSize: 11, textTransform: 'uppercase' }}>
              {te ? 'గరిష్ఠం (సూచన)' : 'Soft max'}
            </div>
            <div style={{ fontWeight: 600 }}>{max.toLocaleString()}</div>
          </div>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, lineHeight: 1.45, opacity: 0.8 }}>
          {te
            ? 'ఇది characters కాదు — పదాలు. పొడవు ప్రచురణను బ్లాక్ చేయదు — కావాలంటే Publish నొక్కండి.'
            : 'This is a word count (not characters). Length does not block publish — you can publish anytime.'}
        </p>
        <button type="button" style={btn} onClick={onClose} autoFocus>
          {te ? 'సరే — కొనసాగించు' : 'OK — continue'}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** @deprecated Length never blocks publish — soft guidance alert only. */
export function showWordBandBlockedAlert(opts: {
  wordCount: number;
  min?: number;
  hardMax?: number | null;
  reason?: WordBandBlockReason;
}): void {
  const min = opts.min ?? DEFAULT_MIN;
  const count = opts.wordCount;
  if (opts.reason === 'over_hard_max') {
    window.alert(
      `Above recommended range (soft guidance only).\n\n` +
        `Recommended up to: ${DEFAULT_MAX.toLocaleString()} words\n` +
        `Your words: ${count.toLocaleString()}\n\n` +
        `You can still publish any length.`,
    );
    return;
  }
  const need = Math.max(0, min - count);
  window.alert(
    `Below recommended range (soft guidance only).\n\n` +
      `Recommended: ${min.toLocaleString()}–${DEFAULT_MAX.toLocaleString()} words\n` +
      `Your words: ${count.toLocaleString()}\n` +
      `About ${need.toLocaleString()} words short of the soft minimum\n\n` +
      `You can still publish any length.`,
  );
}
