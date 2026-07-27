import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, FileText, Library, Zap, MessageCircle, GitBranch,
  Sparkles, Cloud, ArrowRight, ArrowLeft, ImageIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { PAYWALL } from '../lib/constants';
import {
  PRD_GENRES,
  CREATABLE_CONTENT_TYPES,
  CORE_CONTENT_TYPES,
  MOAT_CONTENT_TYPES,
  AGE_RATINGS,
  LANGUAGES,
  STORY_STATUSES,
} from '../lib/platformConstants';
import { chapterEditorPath } from '../lib/storyEditorRoutes';
import type { ContentTypeDef } from '../../../packages/shared/content-types';
import { platformApi } from '../lib/platformApi';
import { searchTags } from '../business/tagWorkflow';
import { useLocale } from '../context/LocaleContext';
import {
  loadCreateStoryDraft,
  saveCreateStoryDraft,
  clearCreateStoryDraft,
  type CreateStoryDraftInput,
} from '../lib/createStoryDraft';
import { TeluguTextField } from '../components/TeluguTextField';
import { defaultStoryCoverUrl } from '../lib/storyCover';

const CONTENT_TYPE_ICONS: Record<string, typeof BookOpen> = {
  serialized_story: BookOpen,
  short_story: FileText,
  short_story_collection: Library,
  flash_fiction: Zap,
  epistolary_chat: MessageCircle,
  interactive_branching: GitBranch,
  interactive_flash: GitBranch,
};

function contentTypeSubtitle(ct: ContentTypeDef, locale: string): string {
  const te = locale === 'te';
  if (ct.confidence === 'placeholder') {
    return te ? 'ప్రారంభ మార్గదర్శకం · మారవచ్చు' : 'Early guidance · subject to change';
  }
  if (ct.confidence === 'none') {
    return te ? 'ప్రయోగాత్మక · అధికారిక specs లేవు' : 'Experimental · no formal length specs';
  }
  const parts: string[] = [];
  if (ct.softWordTargetMin != null && ct.softWordTargetMax != null) {
    parts.push(
      te
        ? `${ct.softWordTargetMin}–${ct.softWordTargetMax} పదాలు/అధ్యాయం (సూచన)`
        : `${ct.softWordTargetMin}–${ct.softWordTargetMax} words/chapter (soft)`,
    );
  } else if (ct.minWordsPerChapter != null && ct.maxWordsPerChapter != null) {
    parts.push(
      te
        ? `${ct.minWordsPerChapter}–${ct.maxWordsPerChapter} పదాలు (సూచన)`
        : `${ct.minWordsPerChapter}–${ct.maxWordsPerChapter} words (soft)`,
    );
  }
  if (ct.suggestedLaunchChaptersMin != null && ct.suggestedLaunchChaptersMax != null) {
    parts.push(
      te
        ? `లాంచ్‌కు ~${ct.suggestedLaunchChaptersMin}–${ct.suggestedLaunchChaptersMax} అధ్యాయాలు`
        : `~${ct.suggestedLaunchChaptersMin}–${ct.suggestedLaunchChaptersMax} ch before launch`,
    );
  }
  return parts.join(' · ');
}

type WizardStep = 1 | 2 | 3;

export function CreateStory() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const [step, setStep] = useState<WizardStep>(1);
  const [showFormatPicker, setShowFormatPicker] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('serialized_story');
  const [genre, setGenre] = useState('romance');
  const [secondaryGenres, setSecondaryGenres] = useState<string[]>([]);
  const [ageRating, setAgeRating] = useState('all_ages');
  const [language, setLanguage] = useState('te');
  const [storyStatus, setStoryStatus] = useState('draft');
  const [setting, setSetting] = useState('');
  const [themes, setThemes] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [schedule, setSchedule] = useState('irregular');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<{ slug: string; label: string }[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [draftFlash, setDraftFlash] = useState(false);
  /** Server unpublished shell id created by wizard Save Draft / autosave */
  const serverStoryIdRef = useRef<string | null>(null);
  const syncChainRef = useRef<Promise<unknown>>(Promise.resolve());
  const skipAutosaveRef = useRef(true);

  useEffect(() => {
    platformApi.getTags().then((r) => setAllTags(r.tags.map((tag) => ({ slug: tag.slug, label: tag.label }))));
    const draft = loadCreateStoryDraft();
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description);
      setContentType(draft.contentType);
      // Map legacy genre aliases (family_drama → drama, suspense → thriller)
      const genreMeta = PRD_GENRES.find((g) => g.id === draft.genre);
      const resolvedGenre =
        genreMeta && 'mapsTo' in genreMeta && genreMeta.mapsTo
          ? String(genreMeta.mapsTo)
          : draft.genre;
      setGenre(resolvedGenre);
      setSecondaryGenres(
        draft.secondaryGenres.map((id) => {
          const g = PRD_GENRES.find((item) => item.id === id);
          return g && 'mapsTo' in g && g.mapsTo ? String(g.mapsTo) : id;
        }),
      );
      setAgeRating(draft.ageRating);
      setLanguage(draft.language);
      setStoryStatus(draft.storyStatus);
      setSetting(draft.setting);
      setThemes(draft.themes);
      setSelectedTags(draft.selectedTags);
      setSchedule(draft.schedule);
      setDraftSavedAt(draft.savedAt);
      if (draft.storyId) {
        serverStoryIdRef.current = draft.storyId;
      }
    }
    // Avoid creating a server row from the initial hydrate tick
    window.setTimeout(() => {
      skipAutosaveRef.current = false;
    }, 0);
  }, []);

  const draftFields = useCallback((): CreateStoryDraftInput => ({
    title,
    description,
    contentType,
    genre,
    secondaryGenres,
    ageRating,
    language,
    storyStatus,
    setting,
    themes,
    selectedTags,
    schedule,
    storyId: serverStoryIdRef.current,
  }), [
    title, description, contentType, genre, secondaryGenres,
    ageRating, language, storyStatus, setting, themes, selectedTags, schedule,
  ]);

  const persistLocalDraft = useCallback(() => {
    saveCreateStoryDraft(draftFields());
    setDraftSavedAt(Date.now());
  }, [draftFields]);

  /** Create or update unpublished story shell so it appears on Stories / Dashboard. */
  const syncServerDraft = useCallback(async (opts?: { coverUrl?: string }): Promise<string | null> => {
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      persistLocalDraft();
      return serverStoryIdRef.current;
    }

    const run = async (): Promise<string | null> => {
      let cover_url = opts?.coverUrl;
      if (!cover_url && coverFile) {
        const uploaded = await api.uploadImage(coverFile);
        cover_url = uploaded.url;
      }

      let id = serverStoryIdRef.current;
      if (id) {
        try {
          await api.updateStory(id, {
            title: trimmed,
            description,
            genre,
            release_schedule: schedule,
            ...(cover_url ? { cover_url } : {}),
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          // Only recreate when the shell is gone; other errors must not fork a duplicate.
          if (/not found|404|unauthorized|forbidden|403/i.test(msg)) {
            id = null;
            serverStoryIdRef.current = null;
          } else {
            throw err;
          }
        }
      }

      if (!id) {
        const { story } = await api.createStory({
          title: trimmed,
          description,
          genre,
          release_schedule: schedule,
          cover_url: cover_url || defaultStoryCoverUrl(),
          content_type: contentType,
          age_rating: ageRating,
          language,
          story_status: storyStatus || 'draft',
          secondary_genres: secondaryGenres,
          setting: setting || undefined,
          themes: themes.split(',').map((item) => item.trim()).filter(Boolean),
          tags: selectedTags,
        });
        id = story.id;
        serverStoryIdRef.current = id;
      }

      saveCreateStoryDraft({ ...draftFields(), storyId: id });
      setDraftSavedAt(Date.now());
      return id;
    };

    const next = syncChainRef.current.then(run, run);
    syncChainRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, [
    title, description, genre, schedule, coverFile, contentType, ageRating,
    language, storyStatus, secondaryGenres, setting, themes, selectedTags,
    draftFields, persistLocalDraft,
  ]);

  // Local + server autosave (debounced). Server row only when title is valid.
  useEffect(() => {
    if (skipAutosaveRef.current) return;
    const timer = window.setTimeout(() => {
      persistLocalDraft();
      if (title.trim().length >= 3) {
        void syncServerDraft().catch(() => {
          /* autosave stays best-effort; manual Save Draft surfaces errors */
        });
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [persistLocalDraft, syncServerDraft, title]);

  const tagResults = searchTags(allTags, tagSearch).slice(0, 12);
  const selectedContentType = useMemo(
    () => CREATABLE_CONTENT_TYPES.find((ct) => ct.id === contentType),
    [contentType],
  );
  const FormatIcon = CONTENT_TYPE_ICONS[contentType] ?? BookOpen;
  const formatLabel = selectedContentType
    ? (locale === 'te' ? selectedContentType.labelTelugu : selectedContentType.label)
    : contentType;
  const formatSub = selectedContentType ? contentTypeSubtitle(selectedContentType, locale) : '';

  /** Primary catalog — hide legacy aliases that map into another PRD genre */
  const primaryGenres = useMemo(
    () => PRD_GENRES.filter((g) => !('mapsTo' in g && g.mapsTo)),
    [],
  );

  const genreLabel = (id: string) => {
    const g = PRD_GENRES.find((item) => item.id === id);
    if (!g) return id;
    return locale === 'te' ? g.labelTelugu : g.label;
  };

  const useTeluguPhonetic = locale === 'te' || language === 'te';

  const toggleSecondaryGenre = (id: string) => {
    setSecondaryGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((tag) => tag !== slug) : prev.length < 8 ? [...prev, slug] : prev,
    );
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveDraft = async () => {
    setError(null);
    try {
      await syncServerDraft();
      setDraftFlash(true);
      window.setTimeout(() => setDraftFlash(false), 2000);
    } catch (err) {
      persistLocalDraft();
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const canAdvanceStep1 = title.trim().length >= 3;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Cover optional at create — only pass when user uploaded (create path still defaults).
      let coverOpts: { coverUrl?: string } | undefined;
      if (coverFile) {
        const uploaded = await api.uploadImage(coverFile);
        coverOpts = { coverUrl: uploaded.url };
      }
      // Reuse shell from wizard Save Draft / autosave so we do not create a duplicate.
      const storyId = await syncServerDraft(coverOpts);
      if (!storyId) {
        throw new Error(t('common.error'));
      }
      clearCreateStoryDraft();
      navigate(chapterEditorPath(storyId, 1, { contentType, language }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const allFormats = [...CORE_CONTENT_TYPES, ...MOAT_CONTENT_TYPES];

  return (
    <div className="cs-v21 cs-v21--narrow">
      <Link to="/stories" className="cs-v21__back">
        <ArrowLeft size={16} aria-hidden />
        {t('createStory.backToStories')}
      </Link>

      <nav className="cs-v21__progress" aria-label={t('createStory.wizardSteps')}>
        <span className={`cs-v21__progress-step${step === 1 ? ' cs-v21__progress-step--active' : ''}`}>
          <span className="cs-v21__progress-dot">1</span>
          {t('createStory.stepStory')}
        </span>
        <span className="cs-v21__progress-line" aria-hidden />
        <span className={`cs-v21__progress-step${step === 2 ? ' cs-v21__progress-step--active' : ''}`}>
          <span className="cs-v21__progress-dot">2</span>
          {t('createStory.stepDetails')}
        </span>
        <span className="cs-v21__progress-line" aria-hidden />
        <span className={`cs-v21__progress-step${step === 3 ? ' cs-v21__progress-step--active' : ''}`}>
          <span className="cs-v21__progress-dot">3</span>
          {t('createStory.stepPublish')}
        </span>
      </nav>

      {step === 1 && (
        <>
          <header className="cs-v21__hero">
            <h1>{t('createStory.title')}</h1>
            <p>{t('createStory.step1Subtitle')}</p>
          </header>

          <div className="cs-v21__field">
            <label htmlFor="story-title">{t('createStory.storyTitle')}</label>
            <TeluguTextField
              id="story-title"
              value={title}
              onChange={(v) => setTitle(v.slice(0, PAYWALL.maxStoryTitleChars))}
              placeholder={t('createStory.storyTitlePlaceholderV21')}
              required
              minLength={3}
              className="cs-v21__title-input katha-telugu-field"
              phonetic={useTeluguPhonetic}
              lang={useTeluguPhonetic ? 'te' : 'en'}
            />
            <span className="cs-v21__counter">{title.length} / {PAYWALL.maxStoryTitleChars}</span>
          </div>

          <div className="cs-v21__field">
            <label htmlFor="description">
              {t('createStory.descriptionOneLine')}{' '}
              <span style={{ fontWeight: 400, color: 'var(--cs-muted)' }}>({t('createStory.optional')})</span>
            </label>
            <TeluguTextField
              id="description"
              multiline
              className="cs-v21__textarea katha-telugu-field"
              value={description}
              onChange={(v) => setDescription(v.slice(0, PAYWALL.maxStoryDescChars))}
              placeholder={t('createStory.descriptionPlaceholderV21')}
              rows={2}
              phonetic={useTeluguPhonetic}
              lang={useTeluguPhonetic ? 'te' : 'en'}
            />
          </div>

          <div className="cs-v21__format-pick">
            <span className="cs-v21__format-pick-icon" aria-hidden>
              <FormatIcon size={18} />
            </span>
            <div className="cs-v21__format-pick-body">
              <p className="cs-v21__format-pick-label">{formatLabel}</p>
              {formatSub && <p className="cs-v21__format-pick-sub">{formatSub}</p>}
            </div>
            <button type="button" className="cs-v21__format-pick-change" onClick={() => setShowFormatPicker((o) => !o)}>
              {t('createStory.changeFormat')}
            </button>
          </div>

          {selectedContentType && (
            <div className="cs-v21__format-guide" role="note">
              <p className="cs-v21__format-guide-body">
                {locale === 'te'
                  ? selectedContentType.selectionGuideTelugu
                  : selectedContentType.selectionGuideEnglish}
              </p>
              {(selectedContentType.confidence as string) === 'placeholder' && (
                <p className="cs-v21__format-guide-flag">
                  {locale === 'te'
                    ? 'Early guidance — alpha రచయితల డేటా తర్వాత మారవచ్చు. Publishకు నియమం కాదు.'
                    : 'Early guidance — subject to change after alpha writers. Never a publish requirement.'}
                </p>
              )}
              {selectedContentType.confidence === 'high' && (
                <p className="cs-v21__format-guide-flag">
                  {locale === 'te'
                    ? 'Format Spec v1 సూచనలు — మీ కథ, మీరు రాసినట్లు రాయండి. Soft targets publishను block చేయవు (hard max మాత్రమే).'
                    : 'Format Spec v1 guidance — this is your story. Soft targets never block publish (hard max only where set).'}
                </p>
              )}
            </div>
          )}

          {showFormatPicker && (
            <div className="cs-v21__format-alt">
              {allFormats.map((ct) => {
                const label = locale === 'te' ? ct.labelTelugu : ct.label;
                const sub = contentTypeSubtitle(ct, locale);
                const isMoat = 'moat' in ct && ct.moat;
                const guide = locale === 'te' ? ct.selectionGuideTelugu : ct.selectionGuideEnglish;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    className={`cs-v21__format-alt-option${contentType === ct.id ? ' cs-v21__format-alt-option--active' : ''}`}
                    onClick={() => { setContentType(ct.id); setShowFormatPicker(false); }}
                    title={guide}
                  >
                    <span>
                      {label}
                      {isMoat && <span className="cs-v21__type-badge" style={{ marginLeft: 6 }}>{t('createStory.formatBadge')}</span>}
                      {(ct.confidence as string) === 'placeholder' && (
                        <span className="cs-v21__type-badge cs-v21__type-badge--soft" style={{ marginLeft: 6 }}>
                          {locale === 'te' ? 'ప్రారంభం' : 'early'}
                        </span>
                      )}
                    </span>
                    <span className="sub">{sub || '—'}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="cs-v21__cover-row">
            <div className="cs-v21__cover-box">
              {coverPreview ? <img src={coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} /> : <ImageIcon size={20} aria-hidden />}
            </div>
            <p className="cs-v21__cover-defer">
              {t('createStory.coverDefer')}{' '}
              <button type="button" className="cs-v21__cover-defer-link" onClick={() => setStep(2)}>
                {t('createStory.coverDeferLink')}
              </button>
            </p>
          </div>

          {error && <p className="cs-v21__error">{error}</p>}

          <div className="cs-v21__actions cs-v21__actions--inline">
            <button type="button" className="cs-v21__draft-btn" onClick={() => { void handleSaveDraft(); }}>
              <Cloud size={16} aria-hidden />
              {draftFlash ? t('createStory.draftSaved') : t('createStory.saveDraft')}
            </button>
            <button
              type="button"
              className="cs-v21__continue-btn"
              disabled={!canAdvanceStep1}
              onClick={() => { setError(null); setStep(2); }}
            >
              {t('createStory.continueToDetails')}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <header className="cs-v21__hero">
            <h1>{t('createStory.stepDetails')}</h1>
            <p>{t('createStory.step2Subtitle')}</p>
          </header>

          <section className="cs-v21__section">
            <div className="cs-v21__meta-grid">
              <div className="cs-v21__field">
                <label htmlFor="primary-genre">{t('createStory.primaryGenre')}</label>
                <select id="primary-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
                  {primaryGenres.map((g) => (
                    <option key={g.id} value={g.id}>{locale === 'te' ? g.labelTelugu : g.label}</option>
                  ))}
                </select>
              </div>
              <div className="cs-v21__field">
                <label htmlFor="age-rating">{t('createStory.ageRating')}</label>
                <select id="age-rating" value={ageRating} onChange={(e) => setAgeRating(e.target.value)}>
                  {AGE_RATINGS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className="cs-v21__field">
                <label htmlFor="language">{t('createStory.language')}</label>
                <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.labelNative}</option>)}
                </select>
              </div>
              <div className="cs-v21__field">
                <label htmlFor="release-schedule">{t('createStory.releaseSchedule')}</label>
                <select id="release-schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                  <option value="weekly">{t('schedule.weekly')}</option>
                  <option value="biweekly">{t('schedule.biweekly')}</option>
                  <option value="irregular">{t('schedule.irregular')}</option>
                  <option value="complete">{t('schedule.complete')}</option>
                </select>
              </div>
              <div className="cs-v21__field">
                <label htmlFor="completion-status">{t('createStory.completionStatus')}</label>
                <select id="completion-status" value={storyStatus} onChange={(e) => setStoryStatus(e.target.value)}>
                  {STORY_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="cs-v21__section">
            <h2>
              {t('createStory.coverImage')}{' '}
              <span style={{ fontWeight: 400, color: 'var(--cs-muted)', fontSize: '0.9rem' }}>
                ({t('createStory.optional')})
              </span>
            </h2>
            <p className="input-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              {t('createStory.coverHint')}
            </p>
            <label className="cs-v21__cover cs-v21__cover--inline" aria-label={t('createStory.coverUpload')}>
              {coverPreview ? (
                <img src={coverPreview} alt="" />
              ) : (
                <>
                  <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
                  <span>{t('createStory.coverDragHint')}</span>
                  <span className="cs-v21__cover-meta">{t('createStory.coverOptionalAtCreate')}</span>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="cs-v21__cover-input" />
            </label>
          </section>

          <details className="cs-v21__advanced">
            <summary>{t('createStory.advancedDetails')} <Sparkles size={16} aria-hidden /></summary>
            <div className="cs-v21__advanced-body">
              <h3>{t('createStory.secondaryGenres')}</h3>
              <div className="cs-v21__chips">
                {primaryGenres.filter((g) => g.id !== genre).map((g) => (
                  <button key={g.id} type="button" className={`cs-v21__chip${secondaryGenres.includes(g.id) ? ' cs-v21__chip--active' : ''}`} onClick={() => toggleSecondaryGenre(g.id)}>
                    {genreLabel(g.id)}
                  </button>
                ))}
              </div>
              <div className="cs-v21__meta-grid">
                <div className="cs-v21__field">
                  <label htmlFor="setting">{t('createStory.setting')}</label>
                  <TeluguTextField
                    id="setting"
                    className="katha-telugu-field"
                    value={setting}
                    onChange={setSetting}
                    placeholder={t('createStory.settingPlaceholder')}
                    phonetic={useTeluguPhonetic}
                    lang={useTeluguPhonetic ? 'te' : 'en'}
                  />
                </div>
                <div className="cs-v21__field">
                  <label htmlFor="themes">{t('createStory.themes')}</label>
                  <TeluguTextField
                    id="themes"
                    className="katha-telugu-field"
                    value={themes}
                    onChange={setThemes}
                    placeholder={t('createStory.themesPlaceholder')}
                    phonetic={useTeluguPhonetic}
                    lang={useTeluguPhonetic ? 'te' : 'en'}
                  />
                </div>
              </div>
              <div className="cs-v21__field">
                <label htmlFor="tag-search">{t('createStory.communityTags')}</label>
                <input id="tag-search" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} placeholder={t('createStory.tagSearchPlaceholder')} />
                <div className="cs-v21__chips">
                  {tagResults.map((tag) => (
                    <button key={tag.slug} type="button" className={`cs-v21__chip${selectedTags.includes(tag.slug) ? ' cs-v21__chip--active' : ''}`} onClick={() => toggleTag(tag.slug)}>
                      #{tag.slug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          {error && <p className="cs-v21__error">{error}</p>}

          <div className="cs-v21__actions cs-v21__actions--inline">
            <button type="button" className="cs-v21__draft-btn" onClick={() => setStep(1)}>
              <ArrowLeft size={16} aria-hidden />
              {t('createStory.backToStory')}
            </button>
            <button type="button" className="cs-v21__continue-btn" onClick={() => { setError(null); setStep(3); }}>
              {t('createStory.continueToPublish')}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <header className="cs-v21__hero">
            <h1>{t('createStory.stepPublish')}</h1>
            <p>{t('createStory.step3Subtitle')}</p>
          </header>

          <div className="cs-v21__review">
            <div className="cs-v21__review-row">
              <span className="cs-v21__review-label">{t('createStory.storyTitle')}</span>
              <span className="cs-v21__review-value" lang="te">{title}</span>
            </div>
            {description && (
              <div className="cs-v21__review-row">
                <span className="cs-v21__review-label">{t('createStory.description')}</span>
                <span className="cs-v21__review-value">{description}</span>
              </div>
            )}
            <div className="cs-v21__review-row">
              <span className="cs-v21__review-label">{t('createStory.contentType')}</span>
              <span className="cs-v21__review-value">{formatLabel}</span>
            </div>
            <div className="cs-v21__review-row">
              <span className="cs-v21__review-label">{t('createStory.primaryGenre')}</span>
              <span className="cs-v21__review-value">{genreLabel(genre)}</span>
            </div>
            <div className="cs-v21__review-row">
              <span className="cs-v21__review-label">{t('createStory.coverImage')}</span>
              <span className="cs-v21__review-value">
                {coverFile ? coverFile.name : t('createStory.coverDefaultUntilPublish')}
              </span>
            </div>
          </div>

          <p className="cs-v21__autosave" role="status">
            <span className="cs-v21__autosave-dot" aria-hidden />
            {draftFlash ? t('createStory.draftSaved') : draftSavedAt ? t('createStory.autoSaved') : t('createStory.autoSaving')}
          </p>

          {error && <p className="cs-v21__error">{error}</p>}

          <div className="cs-v21__actions cs-v21__actions--inline">
            <button type="button" className="cs-v21__draft-btn" onClick={() => setStep(2)}>
              <ArrowLeft size={16} aria-hidden />
              {t('createStory.backToDetails')}
            </button>
            <button type="button" className="cs-v21__continue-btn" disabled={submitting} onClick={() => { void handleSubmit(); }}>
              {submitting ? t('createStory.submitting') : t('createStory.createAndWrite')}
              {!submitting && <ArrowRight size={16} aria-hidden />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}