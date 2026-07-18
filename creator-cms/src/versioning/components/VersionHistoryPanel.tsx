import { useCallback, useEffect, useState } from 'react';
import { Clock, Loader2, RotateCcw, Save, X } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { formatRelativeTime } from '../../lib/relativeTime';
import {
  buildChapterContent,
  createVersion,
  getVersion,
  listVersions,
  restoreVersion,
} from '../versionClient';
import type { StoryVersion, VersionContent } from '../types';
import { versionTypeLabel } from '../types';
import { RestoreConfirmDialog } from './RestoreConfirmDialog';
import { SaveVersionDialog } from './SaveVersionDialog';
import { VersionTimeline } from './VersionTimeline';
import { VersionEmptyState } from './VersionEmptyState';
import '../../styles/versioning.css';

export interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  storyId: string;
  chapterNumber: number;
  chapterTitle: string;
  scenes: Array<{ id: string; title: string; content: string; narrativeFormat?: string }>;
  onRestored: (content: VersionContent) => void;
  /** When true, hide manual save (e.g. published immutable chapter) */
  readOnly?: boolean;
}

export function VersionHistoryPanel({
  open,
  onClose,
  storyId,
  chapterNumber,
  chapterTitle,
  scenes,
  onRestored,
  readOnly = false,
}: VersionHistoryPanelProps) {
  const { locale } = useLocale();
  const te = locale === 'te';
  const chapterId = String(chapterNumber);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<StoryVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<StoryVersion | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listVersions(storyId, chapterId, 50);
      setVersions(list);
      if (list[0] && !selectedId) setSelectedId(list[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load versions');
    } finally {
      setLoading(false);
    }
  }, [storyId, chapterId, selectedId]);

  useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, storyId, chapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    const cached = versions.find((v) => v.id === selectedId);
    if (cached?.content) {
      setSelected(cached);
      return;
    }
    void getVersion(selectedId, storyId).then((v) => setSelected(v));
  }, [selectedId, versions, storyId]);

  if (!open) return null;

  const handleSave = async (name: string) => {
    setBusy(true);
    try {
      await createVersion({
        storyId,
        chapterId,
        versionType: 'Manual',
        versionName: name,
        content: buildChapterContent({ title: chapterTitle, scenes }),
      });
      setSaveOpen(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const restored = await restoreVersion(selectedId, storyId);
      if (restored?.content) {
        onRestored(restored.content);
      } else if (selected?.content) {
        // Local restore may return new version; apply selected content if needed
        const full = await getVersion(selectedId, storyId);
        if (full?.content) onRestored(full.content);
      }
      setRestoreOpen(false);
      await reload();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  };

  const previewText = (() => {
    const c = selected?.content;
    if (!c) return te ? 'వెర్షన్ ఎంచుకోండి' : 'Select a version';
    if (c.plainContent) return c.plainContent.replace(/<[^>]+>/g, ' ').trim().slice(0, 4000);
    if (c.scenes?.length) {
      return c.scenes
        .map((s) => `${s.title}\n${(s.content || '').replace(/<[^>]+>/g, ' ').trim()}`)
        .join('\n\n---\n\n')
        .slice(0, 4000);
    }
    return te ? 'కంటెంట్ లేదు' : 'No content';
  })();

  return (
    <div className="vh-overlay" role="dialog" aria-modal="true" aria-labelledby="vh-title">
      <div className="vh-panel">
        <header className="vh-panel__head">
          <div>
            <p className="vh-panel__eyebrow">
              <Clock size={14} aria-hidden />
              {te ? 'వెర్షన్ చరిత్ర' : 'Version history'}
            </p>
            <h2 id="vh-title" className="vh-panel__title">
              {te ? 'కథా టైమ్‌లైన్' : 'Story timeline'}
            </h2>
            <p className="vh-panel__sub">
              {te
                ? 'మీరు ఎప్పుడైనా మునుపటి చెక్‌పాయింట్‌కు తిరిగి వెళ్లవచ్చు — చరిత్ర ఎప్పుడూ తొలగించబడదు.'
                : 'Restore any checkpoint without losing history — every milestone is kept.'}
            </p>
          </div>
          <div className="vh-panel__actions">
            {!readOnly && (
              <button type="button" className="vh-btn vh-btn--primary" onClick={() => setSaveOpen(true)}>
                <Save size={14} aria-hidden />
                {te ? 'వెర్షన్ సేవ్' : 'Save version'}
              </button>
            )}
            <button type="button" className="vh-btn vh-btn--ghost" onClick={onClose} aria-label={te ? 'మూసివేయి' : 'Close'}>
              <X size={16} aria-hidden />
            </button>
          </div>
        </header>

        {error && <p className="vh-error" role="alert">{error}</p>}

        {loading ? (
          <div className="vh-loading">
            <Loader2 size={18} className="cms-loading__spin" aria-hidden />
            {te ? 'లోడ్ అవుతోంది…' : 'Loading versions…'}
          </div>
        ) : versions.length === 0 ? (
          <VersionEmptyState
            te={te}
            onSave={!readOnly ? () => setSaveOpen(true) : undefined}
          />
        ) : (
          <div className="vh-body">
            <aside className="vh-sidebar">
              <VersionTimeline
                versions={versions}
                selectedId={selectedId}
                onSelect={setSelectedId}
                te={te}
              />
            </aside>
            <section className="vh-detail">
              {selected ? (
                <>
                  <div className="vh-detail__meta">
                    <strong>{selected.version_name}</strong>
                    <span className="vh-chip">{versionTypeLabel(selected.version_type, te)}</span>
                    {selected.status === 'Restored' && (
                      <span className="vh-chip vh-chip--restored">{te ? 'పునరుద్ధరించబడింది' : 'Restored'}</span>
                    )}
                    <span className="vh-detail__time">
                      {formatRelativeTime(Date.parse(selected.created_at))}
                      {selected.word_count != null ? ` · ${selected.word_count} ${te ? 'పదాలు' : 'words'}` : ''}
                    </span>
                  </div>
                  <pre className="vh-detail__preview" lang="te">{previewText}</pre>
                  {!readOnly && (
                    <button
                      type="button"
                      className="vh-btn vh-btn--primary"
                      onClick={() => setRestoreOpen(true)}
                      disabled={busy}
                    >
                      <RotateCcw size={14} aria-hidden />
                      {te ? 'ఈ వెర్షన్‌కు తిరిగి' : 'Restore this version'}
                    </button>
                  )}
                </>
              ) : (
                <p className="vh-detail__empty">{te ? 'ఒక వెర్షన్ ఎంచుకోండి' : 'Select a version'}</p>
              )}
            </section>
          </div>
        )}
      </div>

      <SaveVersionDialog
        open={saveOpen}
        te={te}
        busy={busy}
        onClose={() => setSaveOpen(false)}
        onConfirm={handleSave}
      />
      <RestoreConfirmDialog
        open={restoreOpen}
        te={te}
        busy={busy}
        versionName={selected?.version_name || ''}
        onClose={() => setRestoreOpen(false)}
        onConfirm={handleRestore}
      />
    </div>
  );
}
