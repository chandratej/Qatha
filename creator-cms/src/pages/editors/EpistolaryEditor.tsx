import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clapperboard,
  Cloud,
  CloudOff,
  Eye,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { EpistolaryReaderPreview } from '../../components/editors/EpistolaryReaderPreview';
import { TeluguTextField } from '../../components/TeluguTextField';
import { useLocale } from '../../context/LocaleContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import type { StudioStringKey } from '../../lib/studioLocale';
import type {
  ChatSpeaker,
  EpistolaryBubble,
  EpistolaryCastMember,
  EpistolaryScene,
} from '../../lib/alternateEditorCache';
import {
  createCastMember,
  createScene,
  DEFAULT_EPISTOLARY_BUBBLES,
  DEFAULT_EPISTOLARY_CAST,
  flattenEpistolaryScenes,
  saveEpistolaryDraft,
} from '../../lib/alternateEditorCache';
import {
  loadEpistolaryMerged,
  publishEpistolaryChapter,
  saveEpistolaryCloud,
} from '../../lib/alternateEditorSync';
import '../../styles/editor-prototype.css';
import '../../styles/editor-eye-comfort.css';

const LOCAL_AUTOSAVE_MS = 1200;
const CLOUD_AUTOSAVE_MS = 3000;

const ROLE_KEYS: Record<ChatSpeaker, StudioStringKey> = {
  protagonist: 'epistolaryEditor.roleProtagonist',
  antagonist: 'epistolaryEditor.roleAntagonist',
  narrator: 'epistolaryEditor.roleNarrator',
};

const DEFAULT_CAST = DEFAULT_EPISTOLARY_CAST.map((c) => ({ ...c }));
const DEFAULT_BUBBLES = DEFAULT_EPISTOLARY_BUBBLES.map((b) => ({ ...b }));

type SyncState = 'idle' | 'syncing' | 'synced' | 'local' | 'error';

function nowTs(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function initial(name: string): string {
  const t = name.trim();
  return t ? ([...t][0] ?? '·') : '·';
}

function nextSpeaker(cast: EpistolaryCastMember[], bubbles: EpistolaryBubble[]): EpistolaryCastMember {
  if (!cast.length) return { id: 'x', role: 'protagonist', name: 'నాయకుడు' };
  const last = bubbles[bubbles.length - 1];
  if (!last) return cast.find((c) => c.role === 'protagonist') ?? cast[0]!;
  if (last.speaker === 'protagonist') {
    return cast.find((c) => c.role === 'antagonist') ?? cast.find((c) => c.id !== last.castId) ?? cast[0]!;
  }
  if (last.speaker === 'antagonist') {
    return cast.find((c) => c.role === 'protagonist') ?? cast.find((c) => c.id !== last.castId) ?? cast[0]!;
  }
  return cast.find((c) => c.role === 'protagonist') ?? cast[0]!;
}

/**
 * Epistolary v4 — scene-based chat fiction studio.
 * Telugu-first input, cast sheet, publish, delete confirm.
 */
export function EpistolaryEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const isTe = locale === 'te';
  const chapter = Number(chapterNum) || 1;
  const storyKey = storyId ?? '';
  const defaultTitle = isTe ? `అధ్యాయం ${chapter}` : `Chapter ${chapter}`;

  const [chapterTitle, setChapterTitle] = useState(defaultTitle);
  const [cast, setCast] = useState<EpistolaryCastMember[]>(DEFAULT_CAST);
  const [scenes, setScenes] = useState<EpistolaryScene[]>([
    { id: 'scene-1', title: 'సీన్ 1', bubbles: DEFAULT_BUBBLES },
  ]);
  const [activeSceneId, setActiveSceneId] = useState('scene-1');
  const [activeCastId, setActiveCastId] = useState(DEFAULT_CAST[0]?.id ?? '');
  const [composer, setComposer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sync, setSync] = useState<SyncState>('idle');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [castOpen, setCastOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EpistolaryCastMember | null>(null);

  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudBusy = useRef(false);
  const statusRef = useRef({ lastSaved: null as Date | null, sync: 'idle' as SyncState });

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>('.epi-v4__compose-input')?.focus();
    });
  }, []);

  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? scenes[0];
  const activeBubbles = activeScene?.bubbles ?? [];
  const allBubbles = useMemo(() => flattenEpistolaryScenes(scenes), [scenes]);
  const activeMember = cast.find((c) => c.id === activeCastId) ?? cast[0] ?? null;

  useEffect(() => {
    document.body.classList.add('epistolary-editor-body');
    document.documentElement.setAttribute('data-katha-editor', 'epistolary');
    return () => {
      document.body.classList.remove('epistolary-editor-body');
      document.documentElement.removeAttribute('data-katha-editor');
    };
  }, []);

  useEffect(() => {
    if (!storyKey) return;
    let cancelled = false;
    setLoading(true);
    loadEpistolaryMerged(storyKey, chapter, defaultTitle, DEFAULT_BUBBLES, DEFAULT_CAST)
      .then((m) => {
        if (cancelled) return;
        setChapterTitle(m.title || defaultTitle);
        setCast(m.cast.length ? m.cast : DEFAULT_CAST.map((c) => ({ ...c })));
        setScenes(m.scenes);
        setActiveSceneId(m.scenes[0]?.id ?? 'scene-1');
        setActiveCastId(m.cast[0]?.id ?? DEFAULT_CAST[0]!.id);
        if (m.updated_at > 0) {
          const d = new Date(m.updated_at);
          setLastSaved(d);
          statusRef.current.lastSaved = d;
        }
        setSync(m.source === 'cloud' ? 'synced' : m.source === 'local' ? 'local' : 'idle');
      })
      .catch(() => {
        if (!cancelled) setSync('error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storyKey, chapter, defaultTitle]);

  const persistLocal = useCallback(
    (title: string, nextScenes: EpistolaryScene[], nextCast: EpistolaryCastMember[]) => {
      if (!storyKey) return;
      const bubbles = flattenEpistolaryScenes(nextScenes);
      saveEpistolaryDraft(storyKey, chapter, {
        title,
        bubbles,
        cast: nextCast,
        scenes: nextScenes,
      });
      const d = new Date();
      statusRef.current.lastSaved = d;
      statusRef.current.sync = statusRef.current.sync === 'synced' ? 'local' : statusRef.current.sync;
      setLastSaved(d);
      setSync((s) => (s === 'synced' ? 'local' : s));
    },
    [storyKey, chapter],
  );

  const persistCloud = useCallback(
    async (title: string, nextScenes: EpistolaryScene[], nextCast: EpistolaryCastMember[]) => {
      if (!storyKey || cloudBusy.current) return;
      cloudBusy.current = true;
      setSync('syncing');
      try {
        const result = await saveEpistolaryCloud(storyKey, chapter, {
          title,
          scenes: nextScenes,
          cast: nextCast,
        });
        const d = new Date(result.updated_at);
        statusRef.current.lastSaved = d;
        statusRef.current.sync = 'synced';
        setLastSaved(d);
        setSync('synced');
      } catch {
        setSync('error');
      } finally {
        cloudBusy.current = false;
      }
    },
    [storyKey, chapter],
  );

  useEffect(() => {
    if (!storyKey || loading) return;
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      persistLocal(chapterTitle, scenes, cast);
    }, LOCAL_AUTOSAVE_MS);
    return () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    };
  }, [chapterTitle, scenes, cast, storyKey, loading, persistLocal]);

  useEffect(() => {
    if (!storyKey || loading) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      void persistCloud(chapterTitle, scenes, cast);
    }, CLOUD_AUTOSAVE_MS);
    return () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [chapterTitle, scenes, cast, storyKey, loading, persistCloud]);

  const patchActiveScene = useCallback(
    (fn: (scene: EpistolaryScene) => EpistolaryScene) => {
      setScenes((prev) =>
        prev.map((s) => (s.id === activeSceneId ? fn(s) : s)),
      );
    },
    [activeSceneId],
  );

  const sendMessage = useCallback(() => {
    const text = composer.trim();
    if (!text || !activeMember || !activeScene) return;
    const bubble: EpistolaryBubble = {
      id: `bubble-${Date.now()}`,
      speaker: activeMember.role,
      speakerName: activeMember.name,
      castId: activeMember.id,
      text,
      timestamp: nowTs(),
    };
    patchActiveScene((s) => ({ ...s, bubbles: [...s.bubbles, bubble] }));
    setComposer('');
    const next = nextSpeaker(cast, [...activeBubbles, bubble]);
    setActiveCastId(next.id);
    focusComposer();
  }, [composer, activeMember, activeScene, patchActiveScene, cast, activeBubbles, focusComposer]);

  const updateBubbleText = useCallback(
    (id: string, text: string) => {
      patchActiveScene((s) => ({
        ...s,
        bubbles: s.bubbles.map((b) => (b.id === id ? { ...b, text } : b)),
      }));
    },
    [patchActiveScene],
  );

  const assignBubble = useCallback(
    (bubbleId: string, member: EpistolaryCastMember) => {
      patchActiveScene((s) => ({
        ...s,
        bubbles: s.bubbles.map((b) =>
          b.id === bubbleId
            ? { ...b, castId: member.id, speaker: member.role, speakerName: member.name }
            : b,
        ),
      }));
    },
    [patchActiveScene],
  );

  const removeBubble = useCallback(
    (id: string) => {
      patchActiveScene((s) => ({
        ...s,
        bubbles: s.bubbles.length <= 1 ? s.bubbles : s.bubbles.filter((b) => b.id !== id),
      }));
    },
    [patchActiveScene],
  );

  const updateCast = useCallback((id: string, patch: Partial<Pick<EpistolaryCastMember, 'name' | 'role'>>) => {
    setCast((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setScenes((prev) =>
      prev.map((s) => ({
        ...s,
        bubbles: s.bubbles.map((b) => {
          if (b.castId !== id) return b;
          return {
            ...b,
            speakerName: patch.name !== undefined ? patch.name : b.speakerName,
            speaker: patch.role !== undefined ? patch.role : b.speaker,
          };
        }),
      })),
    );
  }, []);

  const addCast = useCallback((role: ChatSpeaker) => {
    setCast((prev) => {
      const m = createCastMember(role, prev);
      setActiveCastId(m.id);
      return [...prev, m];
    });
  }, []);

  const confirmDeleteCast = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setCast((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((c) => c.id !== id);
      const fallback = next[0]!;
      setScenes((scenesPrev) =>
        scenesPrev.map((s) => ({
          ...s,
          // Remove messages belonging to deleted character (simultaneous with cast removal)
          bubbles: s.bubbles.filter((b) => b.castId !== id),
        })),
      );
      setActiveCastId((cur) => (cur === id ? fallback.id : cur));
      return next;
    });
    setDeleteTarget(null);
  }, [deleteTarget]);

  const addScene = useCallback(() => {
    setScenes((prev) => {
      const s = createScene(prev.length + 1);
      setActiveSceneId(s.id);
      return [...prev, s];
    });
  }, []);

  const removeScene = useCallback(
    (id: string) => {
      setScenes((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((s) => s.id !== id);
        if (activeSceneId === id) setActiveSceneId(next[0]!.id);
        return next;
      });
    },
    [activeSceneId],
  );

  const renameScene = useCallback((id: string, title: string) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  const handleSave = useCallback(() => {
    setSaving(true);
    void persistCloud(chapterTitle, scenes, cast).finally(() => setSaving(false));
  }, [chapterTitle, scenes, cast, persistCloud]);

  const handlePublish = useCallback(async () => {
    if (!storyKey) return;
    if (!allBubbles.some((b) => b.text.trim())) {
      setPublishMsg(t('epistolaryEditor.publishEmpty'));
      return;
    }
    setPublishing(true);
    setPublishMsg(null);
    try {
      await persistCloud(chapterTitle, scenes, cast);
      await publishEpistolaryChapter(storyKey, chapter, {
        title: chapterTitle,
        cast,
        scenes,
      });
      setPublishMsg(t('epistolaryEditor.publishSuccess'));
      setSync('synced');
    } catch (e) {
      setPublishMsg(e instanceof Error ? e.message : t('epistolaryEditor.publishError'));
    } finally {
      setPublishing(false);
    }
  }, [storyKey, allBubbles, chapterTitle, scenes, cast, chapter, persistCloud, t]);

  const msgCountForCast = useCallback(
    (id: string) => allBubbles.filter((b) => b.castId === id).length,
    [allBubbles],
  );

  if (loading) {
    return (
      <div className="epi-v4" data-katha-mode="creation" lang={isTe ? 'te' : 'en'}>
        <p className="cms-loading cms-loading--inline">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div
      className={`epi-v4${previewOpen ? ' epi-v4--preview' : ''}${castOpen ? ' epi-v4--cast' : ''}`}
      data-katha-mode="creation"
      lang={isTe ? 'te' : 'en'}
    >
      {/* ── Top bar ── */}
      <header className="epi-v4__bar">
        <div className="epi-v4__bar-left">
          <button
            type="button"
            className="epi-v4__icon-btn"
            onClick={() => navigate(`/stories/${storyId}`)}
            aria-label={t('epistolaryEditor.back')}
          >
            <ArrowLeft size={18} />
          </button>
          <span className="epi-v4__badge">{t('epistolaryEditor.badge')}</span>
        </div>

        <TeluguTextField
          className="epi-v4__title"
          value={chapterTitle}
          onChange={setChapterTitle}
          phonetic
          lang="te"
          aria-label={t('epistolaryEditor.chapterTitle')}
          placeholder={t('epistolaryEditor.chapterTitlePlaceholder')}
        />

        <div className="epi-v4__bar-right">
          <span className="epi-v4__sync" title={sync}>
            {sync === 'syncing' && <Loader2 size={13} className="cms-loading__spin" />}
            {sync === 'synced' && <Cloud size={13} />}
            {(sync === 'local' || sync === 'error') && <CloudOff size={13} />}
            {lastSaved && (
              <span>
                {t('epistolaryEditor.savedPrefix')}{' '}
                {lastSaved.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </span>

          <button
            type="button"
            className={`epi-v4__chip-btn${castOpen ? ' is-on' : ''}`}
            onClick={() => setCastOpen((v) => !v)}
          >
            <Users size={15} />
            {t('epistolaryEditor.castTitle')}
            <span className="epi-v4__count">{cast.length}</span>
          </button>

          <button
            type="button"
            className={`epi-v4__icon-btn${previewOpen ? ' is-on' : ''}`}
            onClick={() => setPreviewOpen((v) => !v)}
            aria-pressed={previewOpen}
            title={t('epistolaryEditor.previewMode')}
          >
            <Eye size={16} />
          </button>

          <Link
            to={`/stories/${storyId}/read/epistolary/${chapter}`}
            className="epi-v4__icon-btn"
            target="_blank"
            rel="noopener noreferrer"
            title={t('epistolaryEditor.openReader')}
          >
            <BookOpen size={16} />
          </Link>

          <ThemeToggle compact />

          <button
            type="button"
            className="epi-v4__ghost"
            disabled={saving || sync === 'syncing'}
            onClick={handleSave}
          >
            {saving ? <Loader2 size={14} className="cms-loading__spin" /> : <Save size={14} />}
            {t('epistolaryEditor.saveDraft')}
          </button>

          <button
            type="button"
            className="epi-v4__publish"
            disabled={publishing}
            onClick={() => void handlePublish()}
          >
            {publishing ? <Loader2 size={14} className="cms-loading__spin" /> : <Upload size={14} />}
            {t('epistolaryEditor.publish')}
          </button>
        </div>
      </header>

      {publishMsg && (
        <div className="epi-v4__toast" role="status">
          {publishMsg}
          <button type="button" onClick={() => setPublishMsg(null)} aria-label="Close">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="epi-v4__main">
        {/* ── Scenes rail ── */}
        <aside className="epi-v4__scenes" aria-label={t('epistolaryEditor.scenesLabel')}>
          <div className="epi-v4__scenes-head">
            <Clapperboard size={14} />
            <span>{t('epistolaryEditor.scenesLabel')}</span>
          </div>
          <ul className="epi-v4__scene-list">
            {scenes.map((s, i) => (
              <li
                key={s.id}
                className={`epi-v4__scene-item${s.id === activeSceneId ? ' is-active' : ''}`}
              >
                <button
                  type="button"
                  className="epi-v4__scene-select"
                  onClick={() => setActiveSceneId(s.id)}
                  aria-current={s.id === activeSceneId ? 'true' : undefined}
                >
                  <span className="epi-v4__scene-num">{i + 1}</span>
                </button>
                <TeluguTextField
                  className="epi-v4__scene-title"
                  value={s.title}
                  onChange={(v) => renameScene(s.id, v)}
                  onFocus={() => setActiveSceneId(s.id)}
                  phonetic
                  lang="te"
                  aria-label={t('epistolaryEditor.sceneTitle')}
                />
                <span className="epi-v4__scene-count">{s.bubbles.length}</span>
                {scenes.length > 1 && (
                  <button
                    type="button"
                    className="epi-v4__scene-del"
                    onClick={() => removeScene(s.id)}
                    aria-label={t('epistolaryEditor.removeScene')}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="epi-v4__add-scene" onClick={addScene}>
            <Plus size={14} />
            {t('epistolaryEditor.addScene')}
          </button>
        </aside>

        {/* ── Writing stage ── */}
        <section className="epi-v4__stage">
          <p className="epi-v4__pride">{t('epistolaryEditor.prideLine')}</p>

          <div className="epi-v4__thread">
            {activeBubbles.length === 0 && (
              <p className="epi-v4__empty">{t('epistolaryEditor.emptyScene')}</p>
            )}
            {activeBubbles.map((b) => (
              <article key={b.id} className={`epi-v4__msg epi-v4__msg--${b.speaker}`}>
                <div className="epi-v4__msg-meta">
                  <select
                    className="epi-v4__msg-who"
                    value={b.castId && cast.some((c) => c.id === b.castId) ? b.castId : cast[0]?.id}
                    onChange={(e) => {
                      const m = cast.find((c) => c.id === e.target.value);
                      if (m) assignBubble(b.id, m);
                    }}
                  >
                    {cast.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <time>{b.timestamp}</time>
                  <button
                    type="button"
                    className="epi-v4__msg-del"
                    onClick={() => removeBubble(b.id)}
                    disabled={activeBubbles.length <= 1 && scenes.length === 1}
                    aria-label={t('epistolaryEditor.removeMessage')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <TeluguTextField
                  multiline
                  className="epi-v4__msg-body"
                  value={b.text}
                  onChange={(v) => updateBubbleText(b.id, v)}
                  phonetic
                  lang="te"
                  rows={2}
                  placeholder={t('epistolaryEditor.messagePlaceholderNamed').replace(
                    '{name}',
                    b.speakerName,
                  )}
                />
              </article>
            ))}
          </div>

          <footer className="epi-v4__composer">
            <div className="epi-v4__who-row">
              {cast.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`epi-v4__who-pill epi-v4__who-pill--${m.role}${m.id === activeCastId ? ' is-on' : ''}`}
                  onClick={() => {
                    setActiveCastId(m.id);
                    focusComposer();
                  }}
                >
                  <span className="epi-v4__who-av">{initial(m.name)}</span>
                  {m.name}
                </button>
              ))}
            </div>
            <div className="epi-v4__compose-box">
              <TeluguTextField
                multiline
                className="epi-v4__compose-input"
                value={composer}
                onChange={setComposer}
                phonetic
                lang="te"
                rows={2}
                placeholder={
                  activeMember
                    ? t('epistolaryEditor.composerPlaceholder').replace('{name}', activeMember.name)
                    : t('epistolaryEditor.messagePlaceholder')
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as KeyboardEvent).isComposing) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                type="button"
                className="epi-v4__send"
                onClick={sendMessage}
                disabled={!composer.trim() || !activeMember}
                aria-label={t('epistolaryEditor.sendMessage')}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="epi-v4__compose-hint">{t('epistolaryEditor.composerHint')}</p>
          </footer>
        </section>

        {/* ── Preview ── */}
        {previewOpen && (
          <EpistolaryReaderPreview
            chapterTitle={chapterTitle}
            bubbles={activeBubbles}
            sceneTitle={activeScene?.title}
          />
        )}
      </div>

      {/* ── Cast sheet (not a permanent bloat bar) ── */}
      {castOpen && (
        <div className="epi-v4__cast-backdrop" role="presentation" onClick={() => setCastOpen(false)}>
          <div
            className="epi-v4__cast-sheet"
            role="dialog"
            aria-label={t('epistolaryEditor.castTitle')}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="epi-v4__cast-head">
              <div>
                <h2>{t('epistolaryEditor.castTitle')}</h2>
                <p>{t('epistolaryEditor.castHintShort')}</p>
              </div>
              <button type="button" className="epi-v4__icon-btn" onClick={() => setCastOpen(false)}>
                <X size={18} />
              </button>
            </header>

            <ul className="epi-v4__cast-list">
              {cast.map((m) => (
                <li key={m.id} className={`epi-v4__cast-row epi-v4__cast-row--${m.role}`}>
                  <span className="epi-v4__cast-av">{initial(m.name)}</span>
                  <div className="epi-v4__cast-fields">
                    <TeluguTextField
                      className="epi-v4__cast-name"
                      value={m.name}
                      onChange={(v) => updateCast(m.id, { name: v })}
                      phonetic
                      lang="te"
                      placeholder={t('epistolaryEditor.speakerNamePlaceholder')}
                      aria-label={t('epistolaryEditor.speakerName')}
                    />
                    <select
                      value={m.role}
                      onChange={(e) => updateCast(m.id, { role: e.target.value as ChatSpeaker })}
                      aria-label={t('epistolaryEditor.speakerRole')}
                    >
                      {(Object.keys(ROLE_KEYS) as ChatSpeaker[]).map((r) => (
                        <option key={r} value={r}>
                          {t(ROLE_KEYS[r])}
                        </option>
                      ))}
                    </select>
                    <span className="epi-v4__cast-msgs">
                      {msgCountForCast(m.id)} {t('epistolaryEditor.messageCount')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="epi-v4__cast-del"
                    disabled={cast.length <= 1}
                    onClick={() => setDeleteTarget(m)}
                    aria-label={t('epistolaryEditor.removeCastMember')}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="epi-v4__cast-add-row">
              {(Object.keys(ROLE_KEYS) as ChatSpeaker[]).map((role) => (
                <button key={role} type="button" onClick={() => addCast(role)}>
                  <Plus size={14} />
                  {t(ROLE_KEYS[role])}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete character confirm ── */}
      {deleteTarget && (
        <div className="epi-v4__modal-backdrop" role="presentation">
          <div className="epi-v4__modal" role="alertdialog" aria-modal="true" aria-labelledby="cast-del-title">
            <h3 id="cast-del-title">{t('epistolaryEditor.deleteCastTitle')}</h3>
            <p>
              {t('epistolaryEditor.deleteCastBody')
                .replace('{name}', deleteTarget.name)
                .replace('{count}', String(msgCountForCast(deleteTarget.id)))}
            </p>
            <div className="epi-v4__modal-actions">
              <button type="button" className="epi-v4__ghost" onClick={() => setDeleteTarget(null)}>
                {t('epistolaryEditor.deleteCastCancel')}
              </button>
              <button type="button" className="epi-v4__danger" onClick={confirmDeleteCast}>
                {t('epistolaryEditor.deleteCastConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
