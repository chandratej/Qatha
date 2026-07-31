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

const DEFAULT_MIN = 800;
const DEFAULT_MAX = 1200;
const DEFAULT_HARD = 1200;

/**
 * Failsafe publish-block dialog. Uses createPortal + fully inline styles
 * so Narrative OS / CSS stacking can never hide it.
 */
export function WordBandBlockModal({
  open,
  onClose,
  wordCount,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  hardMax = DEFAULT_HARD,
  reason = 'below_min',
  locale = 'en',
}: WordBandBlockModalProps) {
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
  const need = below ? Math.max(0, min - wordCount) : Math.max(0, wordCount - hardMax);

  const title = below
    ? te
      ? 'ప్రచురణ బ్లాక్ అయింది — పదాలు సరిపోలేదు'
      : 'Publishing blocked — not enough words'
    : te
      ? 'ప్రచురణ బ్లాక్ అయింది — చాలా పొడవు'
      : 'Publishing blocked — chapter too long';

  const lead = below
    ? te
      ? `కనీసం ${min.toLocaleString('te')} పదాలు అవసరం. మీకు ${wordCount.toLocaleString('te')} పదాలు ఉన్నాయి. ఇంకా ~${need.toLocaleString('te')} పదాలు రాయండి. డ్రాఫ్ట్ సేవ్ అయింది — ప్రచురణ జరగలేదు.`
      : `You need at least ${min.toLocaleString()} words to publish. You have ${wordCount.toLocaleString()} words — write about ${need.toLocaleString()} more. Your draft is saved; publishing did not complete.`
    : te
      ? `గరిష్ఠ ${hardMax.toLocaleString('te')} పదాలు. మీకు ${wordCount.toLocaleString('te')} ఉన్నాయి — ~${need.toLocaleString('te')} తగ్గించండి.`
      : `Hard maximum is ${hardMax.toLocaleString()} words. You have ${wordCount.toLocaleString()} — trim about ${need.toLocaleString()} words.`;

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
              {te ? 'గరిష్ఠం' : 'Hard max'}
            </div>
            <div style={{ fontWeight: 600 }}>{hardMax.toLocaleString()}</div>
          </div>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, lineHeight: 1.45, opacity: 0.8 }}>
          {te
            ? 'ఇది characters కాదు — పదాలు. అవసరమైన పదాలు రాసిన తర్వాత Publish మళ్ళీ నొక్కండి.'
            : 'This is a word count (not characters). Click Publish again after you meet the minimum.'}
        </p>
        <button type="button" style={btn} onClick={onClose} autoFocus>
          {te ? 'సరే — సవరించడం కొనసాగించు' : 'OK — keep editing'}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** Imperative failsafe when React state alone is unreliable. */
export function showWordBandBlockedAlert(opts: {
  wordCount: number;
  min?: number;
  hardMax?: number;
  reason?: WordBandBlockReason;
}): void {
  const min = opts.min ?? DEFAULT_MIN;
  const hardMax = opts.hardMax ?? DEFAULT_HARD;
  const count = opts.wordCount;
  if (opts.reason === 'over_hard_max') {
    window.alert(
      `Publishing blocked — chapter too long.\n\n` +
        `Hard maximum: ${hardMax.toLocaleString()} words\n` +
        `Your words: ${count.toLocaleString()}\n\n` +
        `Trim the chapter, then publish again. Your draft is saved.`,
    );
    return;
  }
  const need = Math.max(0, min - count);
  window.alert(
    `Publishing blocked — not enough words.\n\n` +
      `Minimum to publish: ${min.toLocaleString()} words\n` +
      `Recommended: ${min.toLocaleString()}–${DEFAULT_MAX.toLocaleString()} words\n` +
      `Your words: ${count.toLocaleString()}\n` +
      `Still need about: ${need.toLocaleString()} words\n\n` +
      `Your draft is saved. Write more, then click Publish again.`,
  );
}
