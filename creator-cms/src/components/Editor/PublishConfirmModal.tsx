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
}: PublishConfirmModalProps) {
  if (!open) return null;

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
            </dd>
          </div>
          <div>
            <dt>Review time</dt>
            <dd>Typically 1–2 hours</dd>
          </div>
        </dl>
        <p className="katha-publish-confirm__note">
          You can keep editing while it is under review. Autosave continues to protect your draft.
        </p>
      </div>
    </CmsModal>
  );
}
