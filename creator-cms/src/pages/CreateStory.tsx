import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, FileText, Library, Zap, MessageCircle, GitBranch,
  Sparkles, Cloud, ArrowRight, Check, ImageIcon, ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
} from '../lib/createStoryDraft';

const CONTENT_TYPE_ICONS: Record<string, typeof BookOpen> = {
  serialized_story: BookOpen,
  short_story: FileText,
  short_story_collection: Library,
  flash_fiction: Zap,
  epistolary_chat: MessageCircle,
  interactive_branching: GitBranch,
};

function contentTypeSubtitle(ct: ContentTypeDef, locale: string): string {
  const parts: string[] = [];
  if (ct.minChapters != null) {
    parts.push(locale === 'te'
      ? `${ct.minChapters}+ అధ్యాయాలు`
      : `${ct.minChapters}+ chapters`);
  }
  if (ct.minWordsPerChapter != null) {
    parts.push(locale === 'te'
      ? `${ct.minWordsPerChapter}+ పదాలు`
      : `${ct.minWordsPerChapter}+ words`);
  }
  if ('maxWords' in ct && ct.maxWords != null) {
    parts.push(locale === 'te'
      ? `గరిష్ఠ ${ct.maxWords} పదాలు`
      : `max ${ct.maxWords} words`);
  }
  return parts.join(' · ');
}

export function CreateStory() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();

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

  useEffect(() => {
    platformApi.getTags().then((r) => setAllTags(r.tags.map((tag) => ({ slug: tag.slug, label: tag.label }))));
    const draft = loadCreateStoryDraft();
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description);
      setContentType(draft.contentType);
      setGenre(draft.genre);
      setSecondaryGenres(draft.secondaryGenres);
      setAgeRating(draft.ageRating);
      setLanguage(draft.language);
      setStoryStatus(draft.storyStatus);
      setSetting(draft.setting);
      setThemes(draft.themes);
      setSelectedTags(draft.selectedTags);
      setSchedule(draft.schedule);
      setDraftSavedAt(draft.savedAt);
    }
  }, []);

  const persistDraft = useCallback(() => {
    saveCreateStoryDraft({
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
    });
    setDraftSavedAt(Date.now());
  }, [
    title, description, contentType, genre, secondaryGenres,
    ageRating, language, storyStatus, setting, themes, selectedTags, schedule,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(persistDraft, 1200);
    return () => window.clearTimeout(timer);
  }, [persistDraft]);

  const tagResults = searchTags(allTags, tagSearch).slice(0, 12);

  const selectedContentType = useMemo(
    () => CREATABLE_CONTENT_TYPES.find((ct) => ct.id === contentType),
    [contentType],
  );

  const contentTypeGuide = selectedContentType
    ? (locale === 'te' ? selectedContentType.guideTelugu : selectedContentType.guideEnglish)
    : null;

  const genreLabel = (id: string) => {
    const g = PRD_GENRES.find((item) => item.id === id);
    if (!g) return id;
    return locale === 'te' ? g.labelTelugu : g.label;
  };

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

  const handleSaveDraft = () => {
    persistDraft();
    setDraftFlash(true);
    window.setTimeout(() => setDraftFlash(false), 2000);
  };

  const renderContentTypeCard = (ct: ContentTypeDef, isMoat = false) => {
    const label = locale === 'te' ? ct.labelTelugu : ct.label;
    const active = contentType === ct.id;
    const Icon = CONTENT_TYPE_ICONS[ct.id] ?? BookOpen;
    const subtitle = contentTypeSubtitle(ct, locale);
    return (
      <button
        key={ct.id}
        type="button"
        role="radio"
        aria-checked={active}
        className={[
          'cs-v21__type-card',
          active ? 'cs-v21__type-card--active' : '',
          isMoat ? 'cs-v21__type-card--moat' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => setContentType(ct.id)}
      >
        <span className="cs-v21__type-check" aria-hidden>
          <Check size={12} strokeWidth={3} />
        </span>
        <span className="cs-v21__type-icon" aria-hidden>
          <Icon size={18} />
        </span>
        {isMoat && (
          <span className="cs-v21__type-badge">{t('createStory.formatBadge')}</span>
        )}
        <span className="cs-v21__type-label">{label}</span>
        {subtitle && (
          <span className="cs-v21__type-sub">{subtitle}</span>
        )}
      </button>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverFile) {
      setError(t('createStory.coverRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { url: cover_url } = await api.uploadImage(coverFile);
      const { story } = await api.createStory({
        title,
        description,
        genre,
        release_schedule: schedule,
        cover_url,
        content_type: contentType,
        age_rating: ageRating,
        language,
        story_status: storyStatus,
        secondary_genres: secondaryGenres,
        setting: setting || undefined,
        themes: themes.split(',').map((item) => item.trim()).filter(Boolean),
        tags: selectedTags,
      });
      clearCreateStoryDraft();
      navigate(chapterEditorPath(story.id, 1, { contentType, language }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cs-v21">
      <Link to="/stories" className="cs-v21__back">
        <ArrowLeft size={16} aria-hidden />
        {t('createStory.backToStories')}
      </Link>
      <nav className="cs-v21__progress" aria-label={t('createStory.wizardSteps')}>
        <span className="cs-v21__progress-step cs-v21__progress-step--active">
          <span className="cs-v21__progress-dot">1</span>
          {t('createStory.stepStory')}
        </span>
        <span className="cs-v21__progress-line" aria-hidden />
        <span className="cs-v21__progress-step">
          <span className="cs-v21__progress-dot">2</span>
          {t('createStory.stepDetails')}
        </span>
        <span className="cs-v21__progress-line" aria-hidden />
        <span className="cs-v21__progress-step">
          <span className="cs-v21__progress-dot">3</span>
          {t('createStory.stepPublish')}
        </span>
      </nav>

      <header className="cs-v21__hero">
        <h1>{t('createStory.title')}</h1>
        <p>{t('createStory.subtitleV21')}</p>
      </header>

      <form onSubmit={handleSubmit} className="cs-v21__form">
        <div className="cs-v21__main">
          <div className="cs-v21__field">
            <label htmlFor="story-title">{t('createStory.storyTitle')}</label>
            <input
              id="story-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, PAYWALL.maxStoryTitleChars))}
              placeholder={t('createStory.storyTitlePlaceholderV21')}
              required
              minLength={3}
              className="cs-v21__title-input"
              lang={locale === 'te' ? 'te' : undefined}
            />
            <span className="cs-v21__counter">{title.length} / {PAYWALL.maxStoryTitleChars}</span>
          </div>

          <div className="cs-v21__field">
            <label htmlFor="description">{t('createStory.description')}</label>
            <textarea
              id="description"
              className="cs-v21__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, PAYWALL.maxStoryDescChars))}
              placeholder={t('createStory.descriptionPlaceholderV21')}
              rows={4}
            />
            <span className="cs-v21__counter">{description.length} / {PAYWALL.maxStoryDescChars}</span>
          </div>

          <section className="cs-v21__section">
            <h2>{t('createStory.contentType')}</h2>
            <div role="radiogroup" aria-label={t('createStory.contentType')}>
              <p className="cs-v21__section-label">{t('createStory.contentTypeCore')}</p>
              <div className="cs-v21__type-grid">
                {CORE_CONTENT_TYPES.map((ct) => renderContentTypeCard(ct))}
              </div>
              <p className="cs-v21__section-label cs-v21__section-label--moat">{t('createStory.contentTypeMoat')}</p>
              <div className="cs-v21__type-grid">
                {MOAT_CONTENT_TYPES.map((ct) => renderContentTypeCard(ct, true))}
              </div>
            </div>
            {contentTypeGuide && <p className="cs-v21__guide" role="status">{contentTypeGuide}</p>}
          </section>

          <section className="cs-v21__section">
            <div className="cs-v21__meta-grid">
              <div className="cs-v21__field">
                <label htmlFor="primary-genre">{t('createStory.primaryGenre')}</label>
                <select id="primary-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
                  {PRD_GENRES.map((g) => (
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

          <details className="cs-v21__advanced">
            <summary>{t('createStory.advancedDetails')} <Sparkles size={16} aria-hidden /></summary>
            <div className="cs-v21__advanced-body">
              <h3>{t('createStory.secondaryGenres')}</h3>
              <div className="cs-v21__chips">
                {PRD_GENRES.filter((g) => g.id !== genre).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`cs-v21__chip${secondaryGenres.includes(g.id) ? ' cs-v21__chip--active' : ''}`}
                    onClick={() => toggleSecondaryGenre(g.id)}
                  >
                    {genreLabel(g.id)}
                  </button>
                ))}
              </div>
              <div className="cs-v21__meta-grid">
                <div className="cs-v21__field">
                  <label htmlFor="setting">{t('createStory.setting')}</label>
                  <input id="setting" value={setting} onChange={(e) => setSetting(e.target.value)} placeholder={t('createStory.settingPlaceholder')} />
                </div>
                <div className="cs-v21__field">
                  <label htmlFor="themes">{t('createStory.themes')}</label>
                  <input id="themes" value={themes} onChange={(e) => setThemes(e.target.value)} placeholder={t('createStory.themesPlaceholder')} />
                </div>
              </div>
              <div className="cs-v21__field">
                <label htmlFor="tag-search">{t('createStory.communityTags')}</label>
                <input id="tag-search" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} placeholder={t('createStory.tagSearchPlaceholder')} />
                <div className="cs-v21__chips">
                  {tagResults.map((tag) => (
                    <button
                      key={tag.slug}
                      type="button"
                      className={`cs-v21__chip${selectedTags.includes(tag.slug) ? ' cs-v21__chip--active' : ''}`}
                      onClick={() => toggleTag(tag.slug)}
                    >
                      #{tag.slug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          <p className="cs-v21__note">{t('createStory.changeNote')}</p>
          {error && <p className="cs-v21__error">{error}</p>}
        </div>

        <aside className="cs-v21__side">
          <div className="cs-v21__card">
            <h3>{t('createStory.coverImage')}</h3>
            <label className="cs-v21__cover" aria-label={t('createStory.coverUpload')}>
              {coverPreview ? (
                <img src={coverPreview} alt="" />
              ) : (
                <>
                  <ImageIcon size={32} strokeWidth={1.5} aria-hidden />
                  <span>{t('createStory.coverDragHint')}</span>
                  <span className="cs-v21__cover-meta">{t('createStory.coverPlaceholder')}</span>
                  <span className="cs-v21__cover-meta">PNG, JPG, WEBP · 5MB</span>
                </>
              )}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="cs-v21__cover-input" />
            </label>
          </div>
          <div className="cs-v21__card">
            <h3>{t('createStory.writingTips')}</h3>
            <ul className="cs-v21__tips">
              <li>{t('createStory.tipCover')}</li>
              <li>{t('createStory.tipTitle')}</li>
              <li>{t('createStory.tipHook')}</li>
            </ul>
          </div>
          <p className="cs-v21__autosave" role="status">
            <span className="cs-v21__autosave-dot" aria-hidden />
            {draftFlash ? t('createStory.draftSaved') : draftSavedAt ? t('createStory.autoSaved') : t('createStory.autoSaving')}
          </p>
        </aside>

        <div className="cs-v21__actions">
          <button type="button" className="cs-v21__draft-btn" onClick={handleSaveDraft}>
            <Cloud size={16} aria-hidden />
            {t('createStory.saveDraft')}
          </button>
          <button type="submit" className="cs-v21__continue-btn" disabled={submitting}>
            {submitting ? t('createStory.submitting') : t('createStory.continue')}
            {!submitting && <ArrowRight size={16} aria-hidden />}
          </button>
        </div>
      </form>
    </div>
  );
}