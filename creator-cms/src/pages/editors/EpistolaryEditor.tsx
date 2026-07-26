import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Cloud,
  CloudOff,
  Eye,
  Loader2,
  MessageCircle,
  PenLine,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { EpistolaryReaderPreview } from '../../components/editors/EpistolaryReaderPreview';
import { useLocale } from '../../context/LocaleContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import type { StudioStringKey } from '../../lib/studioLocale';
import { StudioGlyph } from '../../components/studio/StudioGlyph';
import type { StudioGlyphId } from '../../components/studio/StudioGlyph';
import type {
  ChatSpeaker,
  EpistolaryBubble,
  EpistolaryCastMember,
} from '../../lib/alternateEditorCache';
import {
  createCastMember,
  DEFAULT_EPISTOLARY_CAST,
  saveEpistolaryDraft,
} from '../../lib/alternateEditorCache';
import { loadEpistolaryMerged, saveEpistolaryCloud } from '../../lib/alternateEditorSync';
import '../../styles/editor-prototype.css';
import '../../styles/editor-eye-comfort.css';

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

const DEFAULT_CAST: EpistolaryCastMember[] = DEFAULT_EPISTOLARY_CAST.map((c) => ({ ...c }));

const DEFAULT_BUBBLES: EpistolaryBubble[] = [
  {
    id: 'bubble-1',
    speaker: 'protagonist',
    speakerName: 'Ananya',
    castId: 'cast-p1',
    text: 'Are you still coming tonight?',
    timestamp: '9:41 PM',
  },
  {
    id: 'bubble-2',
    speaker: 'antagonist',
    speakerName: 'Rohan',
    castId: 'cast-a1',
    text: 'Maybe. Depends on whether you actually mean it this time.',
    timestamp: '9:42 PM',
  },
];

type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'local' | 'error';

function nowTimestamp(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Pick a natural next speaker: alternate protag ↔ antag when possible. */
function pickNextCastMember(
  cast: EpistolaryCastMember[],
  bubbles: EpistolaryBubble[],
): EpistolaryCastMember {
  if (cast.length === 0) {
    return { id: 'cast-fallback', role: 'protagonist', name: 'Character' };
  }
  const last = bubbles[bubbles.length - 1];
  if (!last) {
    return cast.find((c) => c.role === 'protagonist') ?? cast[0]!;
  }
  const lastId = last.castId;
  if (last.speaker === 'protagonist') {
    return (
      cast.find((c) => c.role === 'antagonist') ??
      cast.find((c) => c.id !== lastId) ??
      cast[0]!
    );
  }
  if (last.speaker === 'antagonist') {
    return (
      cast.find((c) => c.role === 'protagonist') ??
      cast.find((c) => c.id !== lastId) ??
      cast[0]!
    );
  }
  return cast.find((c) => c.role === 'protagonist') ?? cast.find((c) => c.id !== lastId) ?? cast[0]!;
}

function bubbleFromCast(member: EpistolaryCastMember, index: number): EpistolaryBubble {
  return {
    id: `bubble-${Date.now()}-${index}`,
    speaker: member.role,
    speakerName: member.name,
    castId: member.id,
    text: '',
    timestamp: nowTimestamp(),
  };
}

/**
 * Epistolary editor — chat-bubble shell with cast-first speaker names.
 * Route: /stories/:storyId/epistolary/:chapterNum
 */
export function EpistolaryEditor() {
  const { storyId, chapterNum } = useParams<{ storyId: string; chapterNum: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const chapter = Number(chapterNum) || 1;
  const storyKey = storyId ?? '';

  const [chapterTitle, setChapterTitle] = useState(`Chapter ${chapter}`);
  const [cast, setCast] = useState<EpistolaryCastMember[]>(DEFAULT_CAST);
  const [bubbles, setBubbles] = useState<EpistolaryBubble[]>(DEFAULT_BUBBLES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [cloudSync, setCloudSync] = useState<CloudSyncState>('idle');
  const [previewMode, setPreviewMode] = useState(false);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudInFlight = useRef(false);
  const focusTextRef = useRef<string | null>(null);

  // Match regular story editor: creation mode + body scroll lock for long sessions.
  useEffect(() => {
    const root = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    document.body.classList.add('epistolary-editor-body');
    root.setAttribute('data-katha-editor', 'epistolary');
    return () => {
      document.body.classList.remove('epistolary-editor-body');
      root.removeAttribute('data-katha-editor');
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (!storyKey) return;
    let cancelled = false;
    setLoading(true);
    loadEpistolaryMerged(storyKey, chapter, `Chapter ${chapter}`, DEFAULT_BUBBLES, DEFAULT_CAST)
      .then((merged) => {
        if (cancelled) return;
        setChapterTitle(merged.title);
        setCast(merged.cast.length ? merged.cast : DEFAULT_CAST.map((c) => ({ ...c })));
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
    return () => {
      cancelled = true;
    };
  }, [storyKey, chapter]);

  const persistLocal = useCallback(
    (title: string, items: EpistolaryBubble[], castList: EpistolaryCastMember[]) => {
      if (!storyKey) return;
      saveEpistolaryDraft(storyKey, chapter, { title, bubbles: items, cast: castList });
      setLastSaved(new Date());
      if (cloudSync === 'synced') setCloudSync('local');
    },
    [storyKey, chapter, cloudSync],
  );

  const persistCloud = useCallback(
    async (title: string, items: EpistolaryBubble[], castList: EpistolaryCastMember[]) => {
      if (!storyKey || cloudInFlight.current) return;
      cloudInFlight.current = true;
      setCloudSync('syncing');
      try {
        const result = await saveEpistolaryCloud(storyKey, chapter, {
          title,
          bubbles: items,
          cast: castList,
        });
        setLastSaved(new Date(result.updated_at));
        setCloudSync('synced');
      } catch {
        setCloudSync('error');
      } finally {
        cloudInFlight.current = false;
      }
    },
    [storyKey, chapter],
  );

  useEffect(() => {
    if (!storyKey || loading) return;
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      persistLocal(chapterTitle, bubbles, cast);
    }, LOCAL_AUTOSAVE_MS);
    return () => {
      if (localTimer.current) clearTimeout(localTimer.current);
    };
  }, [chapterTitle, bubbles, cast, storyKey, loading, persistLocal]);

  useEffect(() => {
    if (!storyKey || loading) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      void persistCloud(chapterTitle, bubbles, cast);
    }, CLOUD_AUTOSAVE_MS);
    return () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [chapterTitle, bubbles, cast, storyKey, loading, persistCloud]);

  // Focus newly added message body
  useEffect(() => {
    if (!focusTextRef.current) return;
    const id = focusTextRef.current;
    focusTextRef.current = null;
    const el = document.querySelector<HTMLTextAreaElement>(
      `textarea[data-bubble-id="${CSS.escape(id)}"]`,
    );
    el?.focus();
  }, [bubbles]);

  const handleSaveDraft = useCallback(() => {
    setSaving(true);
    void persistCloud(chapterTitle, bubbles, cast).finally(() => setSaving(false));
  }, [chapterTitle, bubbles, cast, persistCloud]);

  const addBubble = useCallback(
    (member?: EpistolaryCastMember) => {
      setBubbles((prev) => {
        const who = member ?? pickNextCastMember(cast, prev);
        const next = bubbleFromCast(who, prev.length);
        focusTextRef.current = next.id;
        return [...prev, next];
      });
    },
    [cast],
  );

  const assignBubbleCast = useCallback((bubbleId: string, member: EpistolaryCastMember) => {
    setBubbles((prev) =>
      prev.map((b) =>
        b.id === bubbleId
          ? {
              ...b,
              castId: member.id,
              speaker: member.role,
              speakerName: member.name,
            }
          : b,
      ),
    );
  }, []);

  const updateBubbleText = useCallback((id: string, text: string) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  }, []);

  const removeBubble = useCallback((id: string) => {
    setBubbles((prev) => (prev.length <= 1 ? prev : prev.filter((b) => b.id !== id)));
  }, []);

  /** Rename / re-role a cast member and cascade names into all linked messages. */
  const updateCastMember = useCallback((id: string, patch: Partial<Pick<EpistolaryCastMember, 'name' | 'role'>>) => {
    setCast((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.castId !== id) return b;
        const nextName = patch.name !== undefined ? patch.name : b.speakerName;
        const nextRole = patch.role !== undefined ? patch.role : b.speaker;
        return { ...b, speakerName: nextName, speaker: nextRole };
      }),
    );
  }, []);

  const addCastMember = useCallback((role: ChatSpeaker) => {
    setCast((prev) => [...prev, createCastMember(role, prev)]);
  }, []);

  const removeCastMember = useCallback((id: string) => {
    setCast((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((c) => c.id !== id);
      const fallback = next[0]!;
      setBubbles((bubblesPrev) =>
        bubblesPrev.map((b) =>
          b.castId === id
            ? {
                ...b,
                castId: fallback.id,
                speaker: fallback.role,
                speakerName: fallback.name,
              }
            : b,
        ),
      );
      return next;
    });
  }, []);

  const castByRole = useMemo(() => {
    const groups: Record<ChatSpeaker, EpistolaryCastMember[]> = {
      protagonist: [],
      antagonist: [],
      narrator: [],
    };
    for (const m of cast) groups[m.role].push(m);
    return groups;
  }, [cast]);

  const castLabel = useCallback(
    (member: EpistolaryCastMember) => {
      const roleLabel = t(SPEAKER_ROLE_KEYS[member.role]);
      const sameRole = cast.filter((c) => c.role === member.role);
      if (sameRole.length > 1) {
        const idx = sameRole.findIndex((c) => c.id === member.id) + 1;
        return `${member.name} · ${roleLabel} ${idx}`;
      }
      return `${member.name} · ${roleLabel}`;
    },
    [cast, t],
  );

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
      <div
        className="katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 epistolary-editor epistolary-editor--v2 wc-page-enter"
        data-katha-mode="creation"
      >
        <p className="cms-loading cms-loading--inline">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div
      className={`katha-proto-layout katha-proto-layout--premium katha-proto-layout--calm26 epistolary-editor epistolary-editor--v2 epistolary-editor--split${previewMode ? ' epistolary-editor--preview-focus' : ''} wc-page-enter`}
      data-katha-mode="creation"
    >
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
            <button type="button" className="katha-btn katha-btn--ghost" onClick={() => addBubble()}>
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
            <ThemeToggle compact />
            <button
              type="button"
              className="katha-btn katha-btn--ghost"
              disabled={saving || cloudSync === 'syncing'}
              onClick={handleSaveDraft}
            >
              {saving || cloudSync === 'syncing' ? (
                <Loader2 size={16} className="cms-loading__spin" aria-hidden />
              ) : (
                <Save size={16} aria-hidden />
              )}
              {saving || cloudSync === 'syncing'
                ? t('epistolaryEditor.saving')
                : t('epistolaryEditor.saveDraft')}
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
          <span className="katha-editor-doc-meta__sep" aria-hidden>
            ·
          </span>
          <span className="input-hint">
            {bubbles.length} {t('epistolaryEditor.messageCount')}
          </span>
          <span className="katha-editor-doc-meta__sep" aria-hidden>
            ·
          </span>
          <span className="input-hint">
            {cast.length} {t('epistolaryEditor.castCount')}
          </span>
          {savedTimeLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>
                ·
              </span>
              <span className="alternate-editor__autosave">
                {t('epistolaryEditor.savedPrefix')} {savedTimeLabel}
              </span>
            </>
          )}
          {syncLabel && (
            <>
              <span className="katha-editor-doc-meta__sep" aria-hidden>
                ·
              </span>
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
          {/* ── Cast panel: define names once ── */}
          <section className="epistolary-cast" aria-labelledby="epistolary-cast-title">
            <div className="epistolary-cast__head">
              <span className="epistolary-cast__title" id="epistolary-cast-title">
                <Users size={15} aria-hidden />
                {t('epistolaryEditor.castTitle')}
              </span>
              <p className="epistolary-cast__hint input-hint">{t('epistolaryEditor.castHint')}</p>
            </div>

            <div className="epistolary-cast__groups">
              {(['protagonist', 'antagonist', 'narrator'] as ChatSpeaker[]).map((role) => (
                <div key={role} className={`epistolary-cast__group epistolary-cast__group--${role}`}>
                  <div className="epistolary-cast__group-head">
                    <span className="epistolary-cast__role-label">
                      <StudioGlyph id={SPEAKER_GLYPHS[role]} variant="soft" size={14} />
                      {t(SPEAKER_ROLE_KEYS[role])}
                      <span className="epistolary-cast__role-count">{castByRole[role].length}</span>
                    </span>
                    <button
                      type="button"
                      className="epistolary-cast__add-role"
                      onClick={() => addCastMember(role)}
                      title={t('epistolaryEditor.addCastMember')}
                    >
                      <Plus size={14} aria-hidden />
                      {t('epistolaryEditor.addCastMember')}
                    </button>
                  </div>
                  <ul className="epistolary-cast__list">
                    {castByRole[role].map((member) => (
                      <li key={member.id} className="epistolary-cast__item">
                        <input
                          className="epistolary-cast__name"
                          value={member.name}
                          onChange={(e) => updateCastMember(member.id, { name: e.target.value })}
                          aria-label={`${t(SPEAKER_ROLE_KEYS[role])} ${t('epistolaryEditor.speakerName')}`}
                          placeholder={t('epistolaryEditor.speakerName')}
                        />
                        <button
                          type="button"
                          className="epistolary-cast__msg-btn"
                          onClick={() => addBubble(member)}
                          title={t('epistolaryEditor.addAsCharacter')}
                        >
                          <MessageCircle size={14} aria-hidden />
                          {t('epistolaryEditor.addAsCharacter')}
                        </button>
                        <button
                          type="button"
                          className="epistolary-cast__remove"
                          onClick={() => removeCastMember(member.id)}
                          disabled={cast.length <= 1}
                          aria-label={t('epistolaryEditor.removeCastMember')}
                          title={t('epistolaryEditor.removeCastMember')}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </li>
                    ))}
                    {castByRole[role].length === 0 && (
                      <li className="epistolary-cast__empty input-hint">{t('epistolaryEditor.castEmptyRole')}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <div className="epistolary-editor__thread-head">
            <span className="katha-token-eyebrow">{t('epistolaryEditor.threadLabel')}</span>
            <span className="epistolary-editor__message-count">
              {bubbles.length} {t('epistolaryEditor.messageCount')}
            </span>
          </div>
          <p className="epistolary-editor__persist-hint input-hint" role="note">
            {t('epistolaryEditor.persistHint')}
          </p>

          <div className="wc-stagger-children">
            {bubbles.map((bubble) => {
              const member =
                cast.find((c) => c.id === bubble.castId) ??
                cast.find((c) => c.role === bubble.speaker) ??
                cast[0];
              const selectValue = member?.id ?? bubble.castId ?? '';
              return (
                <article
                  key={bubble.id}
                  className={`epistolary-bubble epistolary-bubble--${bubble.speaker}`}
                >
                  <header className="epistolary-bubble__head">
                    <span className="epistolary-bubble__avatar-ring" aria-hidden>
                      <StudioGlyph id={SPEAKER_GLYPHS[bubble.speaker]} variant="soft" size={16} />
                    </span>
                    <div className="epistolary-bubble__meta">
                      {/* Character dropdown — name auto-fills from cast */}
                      <select
                        className="epistolary-bubble__cast-select"
                        value={selectValue}
                        onChange={(e) => {
                          const next = cast.find((c) => c.id === e.target.value);
                          if (next) assignBubbleCast(bubble.id, next);
                        }}
                        aria-label={t('epistolaryEditor.selectCharacter')}
                      >
                        {cast.map((c) => (
                          <option key={c.id} value={c.id}>
                            {castLabel(c)}
                          </option>
                        ))}
                      </select>
                      <span className="epistolary-bubble__name-display" title={t('epistolaryEditor.nameFromCast')}>
                        {bubble.speakerName}
                      </span>
                      <span className={`epistolary-bubble__role-chip epistolary-bubble__role-chip--${bubble.speaker}`}>
                        {t(SPEAKER_ROLE_KEYS[bubble.speaker])}
                      </span>
                      <time className="epistolary-bubble__time">{bubble.timestamp}</time>
                      <button
                        type="button"
                        className="epistolary-bubble__delete"
                        onClick={() => removeBubble(bubble.id)}
                        disabled={bubbles.length <= 1}
                        aria-label={t('epistolaryEditor.removeMessage')}
                        title={t('epistolaryEditor.removeMessage')}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </header>
                  <textarea
                    className="epistolary-bubble__body"
                    data-bubble-id={bubble.id}
                    value={bubble.text}
                    onChange={(e) => updateBubbleText(bubble.id, e.target.value)}
                    placeholder={
                      bubble.speakerName
                        ? t('epistolaryEditor.messagePlaceholderNamed').replace(
                            '{name}',
                            bubble.speakerName,
                          )
                        : t('epistolaryEditor.messagePlaceholder')
                    }
                    rows={2}
                  />
                </article>
              );
            })}
          </div>

          <div className="epistolary-editor__quick-add">
            <span className="epistolary-editor__quick-add-label input-hint">
              {t('epistolaryEditor.quickAdd')}
            </span>
            <div className="epistolary-editor__quick-add-chips">
              {cast.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`epistolary-editor__chip epistolary-editor__chip--${member.role}`}
                  onClick={() => addBubble(member)}
                >
                  <Plus size={12} aria-hidden />
                  {member.name}
                </button>
              ))}
              <button
                type="button"
                className="epistolary-editor__chip epistolary-editor__chip--next"
                onClick={() => addBubble()}
              >
                <Plus size={12} aria-hidden />
                {t('epistolaryEditor.addMessage')}
              </button>
            </div>
          </div>
        </main>
        <EpistolaryReaderPreview chapterTitle={chapterTitle} bubbles={bubbles} />
      </div>
    </div>
  );
}
