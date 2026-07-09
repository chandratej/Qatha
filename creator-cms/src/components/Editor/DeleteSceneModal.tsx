import { Trash2 } from 'lucide-react';
import { CmsModal } from '../CmsModal';

interface DeleteSceneModalProps {
  open: boolean;
  sceneTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteSceneModal({ open, sceneTitle, onClose, onConfirm }: DeleteSceneModalProps) {
  if (!open) return null;

  return (
    <CmsModal
      title="Delete scene?"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary katha-delete-scene__cta" onClick={onConfirm}>
            <Trash2 size={15} aria-hidden />
            Delete scene
          </button>
        </>
      }
    >
      <p className="katha-delete-scene__body">
        <strong>{sceneTitle || 'Untitled scene'}</strong> will be removed from this chapter. You can
        still recover text from version history if it was saved.
      </p>
    </CmsModal>
  );
}
