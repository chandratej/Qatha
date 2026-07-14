import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Cloud, CloudOff, Eye, Loader2, MessageCircle, PenLine, Plus, Save } from 'lucide-react';
import { EpistolaryReaderPreview } from '../../components/editors/EpistolaryReaderPreview';
import { useLocale } from '../../context/LocaleContext';
import type { StudioStringKey } from '../../lib/studioLocale';
import { StudioGlyph } from '../../components/studio/StudioGlyph';
import type { StudioGlyphId } from '../../components/studio/StudioGlyph';
import type { ChatSpeaker, EpistolaryBubble } from '../../lib/alternateEditorCache';
import { saveEpistolaryDraft } from '../../lib/alternateEditorCache';
import { loadEpistolaryMerged, saveEpistolaryCloud } from '../../lib/alternateEditorSync';
import '../../styles/editor-prototype.css';

const LOCAL_AUTOSAVE_MS = 800;
const CLOUD_AUTOSAVE_MS = 2500;

const SPEAKER_ROLE_KEYS: Record<ChatSpeaker, StudioStringKey> = {
  protagonist: 'epistolaryEditor.roleProtagonist',
  antagonist: 'epistolaryEditor.roleAntagonist',
  narrator: 'epistolaryEditor.roleNarrator',
};

const SPEAKER_GLYPHS: Record<ChatSpeaker, StudioGlyphId> = {
  protagonist: 'users',
  antagonist: 'heart',
  narrator: 'sparkles',
};

const DEFAULT_BUBBLES: EpistolaryBubble[] = [
  {
    id: 'bubble-1',
    speaker: 'protagonist',
    speakerName: 'Ananya',
    text: 'Are you still coming tonight?',
    timestamp: '9:41 PM',
  },
  {
    id: 'bubble-2',
    speaker: 'antagonist',
    speakerName: 'Rohan',
    text: 'Maybe. Depends on whether you actually mean it this time.',
    timestamp: '9:42 PM',
  },
];

type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'local' | 'error';

function createBubble(index: number): EpistolaryBubble {
  return {
    id: `bubble-${Date.now()}-${index}`,
    speaker: 'protagonist',
    speakerName: 'Character',
    text: '',
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
  };
}

/**
 * Epistolary editor — chat-bubble shell with local + cloud draft persistence.
 * Route: /stories/:storyId/epistolary/:chapterNum
 */
export function EpistolaryEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const chapter = Number(chapterNum) || 1;
  const storyKey = storyId ?? '';

  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapter}`);
  const [bubbles, setBubbles] = useState<EpistolaryBubble[]>(DEFAULT_BUBBLES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [cloudSync, setCloudSync] = useState<CloudSyncState>('idle');
  const [previewMode, setPreviewMode] = useState(false);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudInFlight = useRef(false);

  const speakerRoles = useMemo(
    () => (Object.keys(SPEAKER_ROLE_KEYS) as ChatSpeaker[]),
    [],
  );

  useEffect(() => {
    if (!storyKey) return;
    let cancelled = false;
    setLoading(true);
    loadEpistolaryMerged(storyKey, chapter, `Chapter ${chapter}`, DEFAULT_BUBBLES)
      .then((merged) => {
        if (cancelled) return;
        setChapterTitle(merged.title);
        setBubbles(merged.data);
        if (merged.updated_at > 0) setLastSaved(new Date(merged.updated_at));
        setCloudSync(merged.source === 'cloud' ? 'synced' : merged.source === 'local' ? 'local' : 'idle');
      })
      .catch(() => {
        if (!cancelled) setCloudSync('error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [storyKey, chapter]);

  const persistLocal = useCallback((title: string, items: EpistolaryBubble[]) => {
    if (!storyKey) return;
    saveEpistolaryDraft(storyKey, chapter, { title, bubbles: items });
    setLastSaved(new Date());
    if (cloudSync === 'synced') setCloudSync('local');
  }, [storyKey, chapter, cloudSync]);

  const persistCloud = useCallback(async (title: string, items: EpistolaryBubble[]) => {
    if (!storyKey || cloudInFlight.current) return;
    cloudInFlight.current = true;
    setCloudSync('syncing');
    try {
      const result = await saveEpistolaryCloud(storyKey, chapter, { title, bubbles: items });
      setLastSaved(new Date(result.updated_at));
      setCloudSync('synced');
    } catch {
      setCloudSync('error');
    } finally {
      cloudInFlight.current = false;
    }
  }, [storyKey, chapter]);

  useEffect(() => {
    if (!storyKey || loading) return;
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      persistLocal(chapterTitle, bubbles);
    }, LOCAL_AUTOSAVE_MS);
    return () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    };
  }, [chapterTitle, bubbles, storyKey, loading, persistLocal]);

  useEffect(() => {
    if (!storyKey || loading) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      void persistCloud(chapterTitle, bubbles);
    }, CLOUD_AUTOSAVE_MS);
    return () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [chapterTitle, bubbles, storyKey, loading, persistCloud]);

  const handleSaveDraft = useCallback(() => {
    setSaving(true);
    void persistCloud(chapterTitle, bubbles).finally(() => setSaving(false));
  }, [chapterTitle, bubbles, persistCloud]);

  const addBubble = useCallback(() => {
    setBubbles((prev) => [...prev, createBubble(prev.length)]);
  }, []);

  const updateBubble = useCallback((id: string, patch: Partial<EpistolaryBubble>) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const savedTimeLabel = lastSaved
    ? lastSaved.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : null;

  const syncLabel = (() => {
    if (cloudSync === 'syncing') return t('epistolaryEditor.cloudSyncing');
    if (cloudSync === 'synced') return t('epistolaryEditor.cloudSynced');
    if (cloudSync === 'local') return t('epistolaryEditor.cloudPending');
    if (cloudSync === 'error') return t('epistolaryEditor.cloudError');
    return null;
  })();

  if (loading) {
    return (
      <div className="katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 epistolary-editor epistolary-editor--v2 wc-page-enter" data-katha-mode="creation">
        <p className="cms-loading cms-loading--inline">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className={`katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 epistolary-editor epistolary-editor--v2 epistolary-editor--split${previewMode ? ' epistolary-editor--preview-focus' : ''} wc-page-enter`} data-katha-mode="creation">
      <header className="katha-editor-chrome epistolary-editor__chrome">
        <div className="katha-editor-chrome__row katha-editor-chrome__row--primary">
          <div className="katha-editor-chrome__leading">
            <button
              type="button"
              className="katha-icon-btn"
              onClick={() => navigate(`/stories/${storyId}`)}
              aria-label={t('epistolaryEditor.back')}
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
            <span className="epistolary-editor__badge">
              <MessageCircle size={14} aria-hidden />
              {t('epistolaryEditor.badge')}
            </span>
          </div>
          <div className="katha-editor-doc-actions">
            <button type="button" className="katha-btn katha-btn--ghost" onClick={addBubble}>
              <Plus size={16} aria-hidden />
              {t('epistolaryEditor.addMessage')}
            </button>
            <Link
              to={`/stories/${storyId}/read/epistolary/${chapter}`}
              className="katha-btn katha-btn--ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BookOpen size={16} aria-hidden />
              {t('epistolaryEditor.openReader')}
            </Link>
            <button
              type="button"
              className="katha-btn katha-btn--ghost epistolary-editor__mode-toggle"
              onClick={() => setPreviewMode((v) => !v)}
              aria-pressed={previewMode}
            >
              {previewMode ? <PenLine size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              {previewMode ? t('epistolaryEditor.editMode') : t('epistolaryEditor.previewMode')}
            </button>
            <button
              type="button"
              className="katha-btn katha-btn--ghost"
              disabled={saving || cloudSync === 'syncing'}
              onClick={handleSaveDraft}
            >
              {saving || cloudSync === 'syncing'
                ? <Loader2 size={16} className="cms-loading__spin" aria-hidden />
                : <Save size={16} aria-hidden />}
              {saving || cloudSync === 'syncing' ? t('epistolaryEditor.saving') : t('epistolaryEditor.saveDraft')}
            </button>
          </div>
        </div>
        <div className="katha-editor-chrome__row katha-editor-chrome__row--meta">
          <input
            className="katha-inline-title-input epistolary-editor__title"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            aria-label={t('epistolaryEditor.chapterTitle')}
          />
          <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
          <span className="input-hint">{bubbles.length} {t('epistolaryEditor.messageCount')}</span>
          {savedTimeLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
              <span className="alternate-editor__autosave">
                {t('epistolaryEditor.savedPrefix')} {savedTimeLabel}
              </span>
            </>
          )}
          {syncLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
              <span className={`alternate-editor__sync alternate-editor__sync--${cloudSync}`}>
                {cloudSync === 'syncing' && <Loader2 size={12} className="cms-loading__spin" aria-hidden />}
                {cloudSync === 'synced' && <Cloud size={12} aria-hidden />}
                {(cloudSync === 'local' || cloudSync === 'error') && <CloudOff size={12} aria-hidden />}
                {syncLabel}
              </span>
            </>
          )}
        </div>
      </header>

      <div className="epistolary-editor__split">
      <main className="epistolary-editor__thread" aria-label="Chat thread">
        <div className="epistolary-editor__thread-head">
          <span className="katha-token-eyebrow">{t('epistolaryEditor.threadLabel')}</span>
          <span className="epistolary-editor__message-count">{bubbles.length} {t('epistolaryEditor.messageCount')}</span>
        </div>
        <p className="epistolary-editor__persist-hint input-hint" role="note">{t('epistolaryEditor.persistHint')}</p>
        <div className="wc-stagger-children">
        {bubbles.map((bubble) => (
          <article
            key={bubble.id}
            className={`epistolary-bubble epistolary-bubble--${bubble.speaker}`}
          >
            <header className="epistolary-bubble__head">
              <span className="epistolary-bubble__avatar-ring" aria-hidden>
                <StudioGlyph id={SPEAKER_GLYPHS[bubble.speaker]} variant="soft" size={16} />
              </span>
              <div className="epistolary-bubble__meta">
                <input
                  className="epistolary-bubble__name"
                  value={bubble.speakerName}
                  onChange={(e) => updateBubble(bubble.id, { speakerName: e.target.value })}
                  aria-label={t('epistolaryEditor.speakerName')}
                />
                <select
                  className="epistolary-bubble__role"
                  value={bubble.speaker}
                  onChange={(e) => updateBubble(bubble.id, { speaker: e.target.value as ChatSpeaker })}
                  aria-label={t('epistolaryEditor.speakerRole')}
                >
                  {speakerRoles.map((role) => (
                    <option key={role} value={role}>{t(SPEAKER_ROLE_KEYS[role])}</option>
                  ))}
                </select>
                <time className="epistolary-bubble__time">{bubble.timestamp}</time>
              </div>
            </header>
            <textarea
              className="epistolary-bubble__body"
              value={bubble.text}
              onChange={(e) => updateBubble(bubble.id, { text: e.target.value })}
              placeholder={t('epistolaryEditor.messagePlaceholder')}
              rows={2}
            />
          </article>
        ))}
        </div>
      </main>
      <EpistolaryReaderPreview chapterTitle={chapterTitle} bubbles={bubbles} />
      </div>
    </div>
  );
}