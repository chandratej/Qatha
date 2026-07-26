import { Rocket } from 'lucide-react';
import { CmsModal } from '../CmsModal';

interface PublishConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chapterTitle: string;
  chapterNum: number;
  wordCount: number;
  sceneCount: number;
  isResubmit?: boolean;
  publishing?: boolean;
  /** Soft band + hard max for Serialized Story (e.g. 1500–2500 soft, 3000 hard). */
  softWordTarget?: { min: number; max: number; hardMax?: number | null } | null;
}

export function PublishConfirmModal({
  open,
  onClose,
  onConfirm,
  chapterTitle,
  chapterNum,
  wordCount,
  sceneCount,
  isResubmit = false,
  publishing = false,
  softWordTarget = null,
}: PublishConfirmModalProps) {
  if (!open) return null;

  const hardMax = softWordTarget?.hardMax ?? null;
  const inSoftBand =
    softWordTarget != null &&
    wordCount >= softWordTarget.min &&
    wordCount <= softWordTarget.max;
  const underSoftMin = softWordTarget != null && wordCount < softWordTarget.min;
  const overHard = hardMax != null && wordCount > hardMax;
  const overSoftOk =
    softWordTarget != null &&
    wordCount > softWordTarget.max &&
    (hardMax == null || wordCount <= hardMax);
  let bandLabel = '';
  if (softWordTarget) {
    if (inSoftBand) bandLabel = ' · in recommended range';
    else if (underSoftMin) bandLabel = ' · below minimum';
    else if (overHard) bandLabel = ' · over hard max';
    else if (overSoftOk) bandLabel = ' · above soft max (OK until hard max)';
  }

  return (
    <CmsModal
      title={isResubmit ? 'Resubmit for review?' : 'Publish chapter?'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={publishing}>
            Keep editing
          </button>
          <button
            type="button"
            className="btn btn-primary katha-publish-confirm__cta"
            onClick={onConfirm}
            disabled={publishing}
          >
            <Rocket size={15} aria-hidden />
            {publishing ? 'Submitting…' : isResubmit ? 'Resubmit' : 'Submit for review'}
          </button>
        </>
      }
    >
      <div className="katha-publish-confirm">
        <p className="katha-publish-confirm__lead">
          {isResubmit
            ? 'Your revised chapter will go back to the moderation queue.'
            : 'Your chapter will be reviewed before it goes live for readers.'}
        </p>
        <dl className="katha-publish-confirm__meta">
          <div>
            <dt>Chapter</dt>
            <dd>
              {chapterNum}. {chapterTitle || 'Untitled Chapter'}
            </dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>
              {wordCount.toLocaleString()} words · {sceneCount} scene{sceneCount === 1 ? '' : 's'}
              {softWordTarget && (
                <>
                  <br />
                  <span className={inSoftBand ? 'katha-publish-confirm__ok' : 'katha-publish-confirm__soft'}>
                    Soft {softWordTarget.min.toLocaleString()}–{softWordTarget.max.toLocaleString()}
                    {hardMax != null ? ` · hard max ${hardMax.toLocaleString()}` : ''}
                    {bandLabel}
                  </span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Review time</dt>
            <dd>Typically 1–2 hours</dd>
          </div>
        </dl>
        {underSoftMin && softWordTarget && (
          <p className="katha-publish-confirm__warn">
            Add more content — need at least {softWordTarget.min.toLocaleString()} words
            (recommended {softWordTarget.min.toLocaleString()}–{softWordTarget.max.toLocaleString()},
            hard max {(hardMax ?? 3000).toLocaleString()} words).
          </p>
        )}
        {overHard && hardMax != null && (
          <p className="katha-publish-confirm__warn">
            Trim this chapter — hard maximum is {hardMax.toLocaleString()} words
            (recommended {softWordTarget!.min.toLocaleString()}–{softWordTarget!.max.toLocaleString()}).
            You have {wordCount.toLocaleString()}.
          </p>
        )}
        <p className="katha-publish-confirm__note">
          You can keep editing while it is under review. Autosave continues to protect your draft.
        </p>
      </div>
    </CmsModal>
  );
}
