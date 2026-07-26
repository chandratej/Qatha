import { createPortal } from 'react-dom';
import { FileWarning } from 'lucide-react';

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

const DEFAULT_MIN = 1500;
const DEFAULT_MAX = 2500;
const DEFAULT_HARD = 3000;

/**
 * Blocking popup when serialized word-band fails.
 * Portaled to document.body so Narrative OS stacking never hides it.
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
  if (!open || typeof document === 'undefined') return null;

  const te = locale === 'te';
  const below = reason === 'below_min';
  const need = below ? Math.max(0, min - wordCount) : Math.max(0, wordCount - hardMax);

  const title = below
    ? te
      ? 'ప్రచురణకు ఇంకా సరిపడా పదాలు లేవు'
      : 'Not enough words to publish'
    : te
      ? 'అధ్యాయం చాలా పొడవుగా ఉంది'
      : 'Chapter is too long to publish';

  const lead = below
    ? te
      ? `ధారావాహిక అధ్యాయాలకు కనీసం ${min.toLocaleString('te')} పదాలు అవసరం. ప్రస్తుతం ${wordCount.toLocaleString('te')} పదాలు — ఇంకా ${need.toLocaleString('te')} పదాలు రాయండి. మీ డ్రాఫ్ట్ సేవ్ అయింది; ప్రచురణ జరగలేదు.`
      : `Serialized chapters need at least ${min.toLocaleString()} words. You have ${wordCount.toLocaleString()} words — write about ${need.toLocaleString()} more. Your draft is saved; publish did not go through.`
    : te
      ? `గరిష్ఠ ${hardMax.toLocaleString('te')} పదాలు. ప్రస్తుతం ${wordCount.toLocaleString('te')} — ${need.toLocaleString('te')} పదాలు తగ్గించండి.`
      : `Serialized chapters cannot exceed ${hardMax.toLocaleString()} words. You have ${wordCount.toLocaleString()} — trim about ${need.toLocaleString()} words.`;

  return createPortal(
    <div
      className="cms-modal-backdrop katha-word-band-block-backdrop"
      role="presentation"
      onClick={onClose}
      style={{ zIndex: 20000 }}
    >
      <div
        className="cms-modal katha-word-band-block-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="word-band-block-title"
        aria-describedby="word-band-block-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cms-modal__head">
          <h2 id="word-band-block-title" className="cms-modal__title">
            {title}
          </h2>
          <button type="button" className="cms-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="cms-modal__body">
          <div className="katha-word-band-block">
            <div className="katha-word-band-block__icon" aria-hidden>
              <FileWarning size={28} strokeWidth={1.75} />
            </div>
            <p id="word-band-block-desc" className="katha-word-band-block__lead">
              {lead}
            </p>
            <dl className="katha-word-band-block__meta">
              <div>
                <dt>{te ? 'మీ పదాలు' : 'Your words'}</dt>
                <dd className="katha-word-band-block__bad">{wordCount.toLocaleString()}</dd>
              </div>
              <div>
                <dt>{te ? 'కనీసం (publish)' : 'Minimum to publish'}</dt>
                <dd>{min.toLocaleString()}</dd>
              </div>
              <div>
                <dt>{te ? 'సిఫార్సు' : 'Recommended'}</dt>
                <dd>
                  {min.toLocaleString()}–{max.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>{te ? 'గరిష్ఠం' : 'Hard maximum'}</dt>
                <dd>{hardMax.toLocaleString()}</dd>
              </div>
            </dl>
            <p className="katha-word-band-block__note">
              {te
                ? 'ఇది characters కాదు — పదాల లెక్క. సరిపడా పదాలు రాసిన తర్వాత Publish మళ్ళీ నొక్కండి.'
                : 'This is a word count, not a character limit. Click Publish again after you meet the minimum.'}
            </p>
          </div>
        </div>
        <footer className="cms-modal__footer">
          <div className="cms-modal__footer-actions">
            <button type="button" className="btn btn-primary" onClick={onClose} autoFocus>
              {te ? 'సరే — సవరించడం కొనసాగించు' : 'OK — keep editing'}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
