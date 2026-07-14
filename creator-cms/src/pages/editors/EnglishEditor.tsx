import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Cloud, CloudOff, Loader2, Save } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { InkProgress } from '../../components/studio/InkProgress';
import { loadEnglishProseMerged, saveEnglishProseCloud } from '../../lib/englishProseSync';
import { saveEnglishProse } from '../../lib/englishProseCache';
import '../../styles/editor-prototype.css';

const WORD_GOAL = 2000;
const LOCAL_AUTOSAVE_MS = 800;
const CLOUD_AUTOSAVE_MS = 2500;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'local' | 'error';

/**
 * English prose editor shell — separate from Telugu ChapterEditor.
 * Route: /stories/:storyId/en/chapters/:chapterNum
 */
export function EnglishEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const chapter = Number(chapterNum) || 1;
  const storyKey = storyId ?? '';

  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapter}`);
  const [prose, setProse] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cloudSync, setCloudSync] = useState<CloudSyncState>('idle');
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudInFlight = useRef(false);

  const wordCount = useMemo(() => countWords(prose), [prose]);
  const readMins = Math.max(1, Math.round(wordCount / 200));

  useEffect(() => {
    if (!storyKey) return;
    let cancelled = false;
    setLoading(true);
    loadEnglishProseMerged(storyKey, chapter, `Chapter ${chapter}`)
      .then((merged) => {
        if (cancelled) return;
        setChapterTitle(merged.title);
        setProse(merged.prose);
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

  const persistLocal = useCallback((title: string, body: string) => {
    if (!storyKey) return;
    saveEnglishProse(storyKey, chapter, { title, prose: body });
    setLastSaved(new Date());
    if (cloudSync === 'synced') setCloudSync('local');
  }, [storyKey, chapter, cloudSync]);

  const persistCloud = useCallback(async (title: string, body: string) => {
    if (!storyKey || cloudInFlight.current) return;
    cloudInFlight.current = true;
    setCloudSync('syncing');
    try {
      const result = await saveEnglishProseCloud(storyKey, chapter, { title, prose: body });
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
      persistLocal(chapterTitle, prose);
    }, LOCAL_AUTOSAVE_MS);
    return () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    };
  }, [chapterTitle, prose, storyKey, loading, persistLocal]);

  useEffect(() => {
    if (!storyKey || loading) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      void persistCloud(chapterTitle, prose);
    }, CLOUD_AUTOSAVE_MS);
    return () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [chapterTitle, prose, storyKey, loading, persistCloud]);

  const handleSaveDraft = useCallback(() => {
    setSaving(true);
    void persistCloud(chapterTitle, prose).finally(() => setSaving(false));
  }, [chapterTitle, prose, persistCloud]);

  const savedTimeLabel = lastSaved
    ? lastSaved.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    : null;

  const syncLabel = (() => {
    if (cloudSync === 'syncing') return t('englishEditor.cloudSyncing');
    if (cloudSync === 'synced') return t('englishEditor.cloudSynced');
    if (cloudSync === 'local') return t('englishEditor.cloudPending');
    if (cloudSync === 'error') return t('englishEditor.cloudError');
    return null;
  })();

  if (loading) {
    return (
      <div className="katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 english-editor english-editor--calm27 wc-page-enter" data-katha-mode="creation" lang="en" dir="ltr">
        <p className="cms-loading cms-loading--inline">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 english-editor english-editor--calm27 wc-page-enter" data-katha-mode="creation" lang="en" dir="ltr">
      <header className="katha-editor-chrome english-editor__chrome">
        <div className="katha-editor-chrome__row katha-editor-chrome__row--primary">
          <div className="katha-editor-chrome__leading">
            <button
              type="button"
              className="katha-icon-btn"
              onClick={() => navigate(`/stories/${storyId}`)}
              aria-label={t('englishEditor.back')}
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
            <span className="english-editor__badge">
              <BookOpen size={14} aria-hidden />
              {t('englishEditor.badge')}
            </span>
          </div>
          <div className="katha-editor-doc-actions">
            <button
              type="button"
              className="katha-btn katha-btn--ghost"
              disabled={saving || cloudSync === 'syncing'}
              onClick={handleSaveDraft}
            >
              {saving || cloudSync === 'syncing'
                ? <Loader2 size={16} className="cms-loading__spin" aria-hidden />
                : <Save size={16} aria-hidden />}
              {saving || cloudSync === 'syncing' ? t('englishEditor.saving') : t('englishEditor.saveDraft')}
            </button>
          </div>
        </div>
        <div className="katha-editor-chrome__row katha-editor-chrome__row--meta">
          <input
            className="katha-inline-title-input english-editor__title"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            aria-label={t('englishEditor.chapterTitle')}
          />
          <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
          <span className="katha-editor-doc-stats">
            {wordCount.toLocaleString()} {t('englishEditor.wordsLabel')} · ~{readMins} {t('englishEditor.minReadLabel')}
          </span>
          {savedTimeLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
              <span className="english-editor__autosave english-editor__autosave--saved">
                {t('englishEditor.savedPrefix')} {savedTimeLabel}
              </span>
            </>
          )}
          {syncLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>·</span>
              <span className={`english-editor__sync english-editor__sync--${cloudSync}`}>
                {cloudSync === 'syncing' && <Loader2 size={12} className="cms-loading__spin" aria-hidden />}
                {cloudSync === 'synced' && <Cloud size={12} aria-hidden />}
                {(cloudSync === 'local' || cloudSync === 'error') && <CloudOff size={12} aria-hidden />}
                {syncLabel}
              </span>
            </>
          )}
        </div>
      </header>

      <main className="english-editor__workspace">
        <div className="english-editor__canvas">
          <div className="english-editor__progress">
            <InkProgress
              wordsToday={wordCount}
              dailyGoal={WORD_GOAL}
              label={t('englishEditor.wordGoalLabel')}
            />
          </div>
          <p className="english-editor__hint input-hint">
            {t('englishEditor.hint')}
          </p>
          <textarea
            className="english-editor__prose"
            value={prose}
            onChange={(e) => setProse(e.target.value)}
            placeholder={t('englishEditor.placeholder')}
            spellCheck
            aria-label={t('englishEditor.chapterTitle')}
          />
        </div>
      </main>
    </div>
  );
}