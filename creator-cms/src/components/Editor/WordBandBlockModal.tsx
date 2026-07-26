import { FileWarning } from 'lucide-react';
import { CmsModal } from '../CmsModal';

export type WordBandBlockReason = 'below_min' | 'over_hard_max';

interface WordBandBlockModalProps {
  open: boolean;
  onClose: () => void;
  wordCount: number;
  min: number;
  max: number;
  hardMax: number;
  reason: WordBandBlockReason;
  locale?: string;
}

/**
 * Explains why publish was blocked for serialized word-band rules.
 * Shown on publish click so creators never wonder why the chapter stayed draft.
 */
export function WordBandBlockModal({
  open,
  onClose,
  wordCount,
  min,
  max,
  hardMax,
  reason,
  locale = 'en',
}: WordBandBlockModalProps) {
  if (!open) return null;

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
      ? `ధారావాహిక అధ్యాయాలకు కనీసం ${min.toLocaleString('te')} పదాలు అవసరం. ప్రస్తుతం ${wordCount.toLocaleString('te')} పదాలు ఉన్నాయి — ఇంకా ${need.toLocaleString('te')} పదాలు రాయండి.`
      : `Serialized chapters need at least ${min.toLocaleString()} words before they can be submitted. You currently have ${wordCount.toLocaleString()} words — write about ${need.toLocaleString()} more.`
    : te
      ? `గరిష్ఠ ${hardMax.toLocaleString('te')} పదాలు. ప్రస్తుతం ${wordCount.toLocaleString('te')} — ${need.toLocaleString('te')} పదాలు తగ్గించండి.`
      : `Serialized chapters cannot exceed ${hardMax.toLocaleString()} words. You have ${wordCount.toLocaleString()} — trim about ${need.toLocaleString()} words.`;

  return (
    <CmsModal
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose} autoFocus>
          {te ? 'సరే — సవరించడం కొనసాగించు' : 'OK — keep editing'}
        </button>
      }
    >
      <div className="katha-word-band-block">
        <div className="katha-word-band-block__icon" aria-hidden>
          <FileWarning size={28} strokeWidth={1.75} />
        </div>
        <p className="katha-word-band-block__lead">{lead}</p>
        <dl className="katha-word-band-block__meta">
          <div>
            <dt>{te ? 'మీ పదాలు' : 'Your words'}</dt>
            <dd className={below ? 'katha-word-band-block__bad' : 'katha-word-band-block__bad'}>
              {wordCount.toLocaleString()}
            </dd>
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
            ? 'మీ డ్రాఫ్ట్ సేవ్ అయింది. అవసరమైన పదాలు రాసిన తర్వాత మళ్ళీ Publish నొక్కండి. ఇది characters కాదు — పదాల లెక్క.'
            : 'Your draft is saved. Publish again once you meet the word requirement. This is a word count, not a character limit.'}
        </p>
      </div>
    </CmsModal>
  );
}
