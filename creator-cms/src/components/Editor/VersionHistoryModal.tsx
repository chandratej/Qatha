import { useState, useMemo, useEffect } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { CmsModal } from '../CmsModal';
import type { SceneVersion } from '../../hooks/useVersionHistory';
import type { SceneBlock } from './SceneSidebar';
import { storedContentToPreviewText } from '../../lib/contentPreview';
import { formatRelativeTime } from '../../lib/relativeTime';
import { versionSourceLabel } from '../../lib/versionLabels';

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  scenes: SceneBlock[];
  activeSceneId: string;
  versions: SceneVersion[];
  onRestore: (sceneId: string, content: string) => void;
}

export function VersionHistoryModal({
  open,
  onClose,
  scenes,
  activeSceneId,
  versions,
  onRestore,
}: VersionHistoryModalProps) {
  const [selectedSceneId, setSelectedSceneId] = useState(activeSceneId);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedSceneId(activeSceneId);
      setSelectedVersionId(null);
    }
  }, [open, activeSceneId]);

  const activeScene = scenes.find((s) => s.id === selectedSceneId);
  const sceneVersions = useMemo(
    () => versions.filter((v) => v.sceneId === selectedSceneId),
    [versions, selectedSceneId],
  );

  const currentDraftText = storedContentToPreviewText(activeScene?.content || '', 5000);
  const selectedVersion = sceneVersions.find((v) => v.id === selectedVersionId);
  const selectedText = selectedVersion
    ? storedContentToPreviewText(selectedVersion.content, 5000)
    : currentDraftText;

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
    } catch {
      /* ignore */
    }
  };

  return (
    <CmsModal
      className="cms-modal--wide"
      title="Version history"
      onClose={onClose}
      footer={(
        <div className="cms-modal__footer-actions">
          <button type="button" className="btn btn-secondary katha-version-history__copy" onClick={handleCopy}>
            <Copy size={14} aria-hidden />
            Copy text
          </button>
          {selectedVersion && (
            <button
              type="button"
              className="btn btn-primary katha-version-history__restore"
              onClick={() => {
                onRestore(selectedSceneId, selectedVersion.content);
                onClose();
              }}
            >
              <RotateCcw size={14} aria-hidden />
              Restore this version
            </button>
          )}
        </div>
      )}
    >
      <div className="katha-version-history">
        <p className="katha-version-history__lead">
          Compare past versions or copy text without reverting your current draft.
        </p>

        <div className="katha-version-history__scenes" role="tablist" aria-label="Scenes">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              role="tab"
              aria-selected={selectedSceneId === scene.id}
              className={`katha-version-history__scene-tab${selectedSceneId === scene.id ? ' katha-version-history__scene-tab--active' : ''}`}
              onClick={() => {
                setSelectedSceneId(scene.id);
                setSelectedVersionId(null);
              }}
            >
              {scene.title || 'Untitled'}
            </button>
          ))}
        </div>

        <div className="katha-version-history__body">
          <div className="katha-version-history__list" role="listbox" aria-label="Saved versions">
            <button
              type="button"
              role="option"
              aria-selected={selectedVersionId === null}
              className={`katha-version-history__entry${selectedVersionId === null ? ' katha-version-history__entry--active' : ''}`}
              onClick={() => setSelectedVersionId(null)}
            >
              <span className="katha-version-history__entry-label">Current draft</span>
              <span className="katha-version-history__entry-meta">
                {storedContentToPreviewText(activeScene?.content || '', 60) || 'Empty scene'}
              </span>
            </button>

            {sceneVersions.map((v) => (
              <button
                key={v.id}
                type="button"
                role="option"
                aria-selected={selectedVersionId === v.id}
                className={`katha-version-history__entry${selectedVersionId === v.id ? ' katha-version-history__entry--active' : ''}`}
                onClick={() => setSelectedVersionId(v.id)}
              >
                <span className="katha-version-history__entry-label">
                  {versionSourceLabel(v.source)}
                </span>
                <span className="katha-version-history__entry-time">
                  {formatRelativeTime(v.timestamp)}
                </span>
                <span className="katha-version-history__entry-meta">
                  {storedContentToPreviewText(v.content, 60)}
                </span>
              </button>
            ))}

            {sceneVersions.length === 0 && (
              <p className="katha-version-history__empty">No saved versions yet for this scene.</p>
            )}
          </div>

          <div className="katha-version-history__preview" aria-live="polite">
            {selectedText || 'No content to preview.'}
          </div>
        </div>
      </div>
    </CmsModal>
  );
}