import { useState, useMemo, useEffect } from 'react';
import { X, Copy, RotateCcw } from 'lucide-react';
import type { SceneVersion } from '../../hooks/useVersionHistory';
import type { SceneBlock } from './SceneSidebar';
import { storedContentToPreviewText } from '../../lib/contentPreview';
import { formatRelativeTime } from '../../lib/relativeTime';

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

  const activeScene = scenes.find(s => s.id === selectedSceneId);
  const sceneVersions = useMemo(
    () => versions.filter(v => v.sceneId === selectedSceneId),
    [versions, selectedSceneId],
  );

  const currentDraftText = storedContentToPreviewText(activeScene?.content || '', 5000);
  const selectedVersion = sceneVersions.find(v => v.id === selectedVersionId);
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Version history"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Version History</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Compare past versions or copy text without reverting
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close" style={{ padding: 8 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {scenes.map(scene => (
            <button
              key={scene.id}
              type="button"
              onClick={() => { setSelectedSceneId(scene.id); setSelectedVersionId(null); }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: selectedSceneId === scene.id ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: selectedSceneId === scene.id ? 'var(--paper-warm)' : 'transparent',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {scene.title || 'Untitled'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: 220, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '8px 0' }}>
            <button
              type="button"
              onClick={() => setSelectedVersionId(null)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                border: 'none',
                background: selectedVersionId === null ? 'var(--paper)' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 600 }}>Current draft</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                {storedContentToPreviewText(activeScene?.content || '', 60)}
              </div>
            </button>

            {sceneVersions.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVersionId(v.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  border: 'none',
                  background: selectedVersionId === v.id ? 'var(--paper)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ fontWeight: 500 }}>{formatRelativeTime(v.timestamp)}</div>
                <div style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                  {storedContentToPreviewText(v.content, 60)}
                </div>
              </button>
            ))}

            {sceneVersions.length === 0 && (
              <p style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                No saved versions yet for this scene.
              </p>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, fontFamily: 'var(--font-telugu)', fontSize: '1rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {selectedText}
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={handleCopy} style={{ fontSize: '0.85rem' }}>
                <Copy size={14} /> Copy text
              </button>
              {selectedVersion && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { onRestore(selectedSceneId, selectedVersion.content); onClose(); }}
                  style={{ fontSize: '0.85rem' }}
                >
                  <RotateCcw size={14} /> Restore this version
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}