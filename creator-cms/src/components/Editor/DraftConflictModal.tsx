import { AlertTriangle } from 'lucide-react';
import type { DraftConflictChoice } from '../../lib/draftConflict';

interface Props {
  open: boolean;
  localUpdatedLabel: string;
  cloudUpdatedLabel: string;
  preferred: DraftConflictChoice;
  onChoose: (choice: DraftConflictChoice) => void;
}

/** DEC-023 — Keep local draft vs cloud when both diverged. */
export function DraftConflictModal({
  open,
  localUpdatedLabel,
  cloudUpdatedLabel,
  preferred,
  onChoose,
}: Props) {
  if (!open) return null;

  return (
    <div className="cms-modal-backdrop" role="presentation">
      <div
        className="cms-modal draft-conflict-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="draft-conflict-title"
        aria-describedby="draft-conflict-desc"
      >
        <div className="draft-conflict-modal__head">
          <AlertTriangle size={22} aria-hidden className="draft-conflict-modal__icon" />
          <h2 id="draft-conflict-title">Two versions of this chapter</h2>
        </div>
        <p id="draft-conflict-desc" className="draft-conflict-modal__body">
          Your device and the cloud both have unsaved differences. Choose which draft to keep so
          nothing is lost by accident.
        </p>
        <ul className="draft-conflict-modal__sides">
          <li>
            <strong>This device</strong>
            <span>{localUpdatedLabel}</span>
            {preferred === 'local' && <em>Suggested</em>}
          </li>
          <li>
            <strong>Cloud</strong>
            <span>{cloudUpdatedLabel}</span>
            {preferred === 'cloud' && <em>Suggested</em>}
          </li>
        </ul>
        <div className="draft-conflict-modal__actions">
          <button type="button" className="btn btn-secondary" onClick={() => onChoose('local')}>
            Keep this device
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onChoose('cloud')}>
            Keep cloud
          </button>
        </div>
      </div>
    </div>
  );
}
