import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, PenLine, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { PAYWALL } from '../lib/constants';
import {
  PRD_GENRES,
  CREATABLE_CONTENT_TYPES,
  AGE_RATINGS,
  LANGUAGES,
  STORY_STATUSES,
  MOOD_TAGS,
} from '../lib/platformConstants';
import { platformApi } from '../lib/platformApi';
import { searchTags } from '../business/tagWorkflow';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { useLocale } from '../context/LocaleContext';

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

  useEffect(() => {
    platformApi.getTags().then((r) => setAllTags(r.tags.map((tag) => ({ slug: tag.slug, label: tag.label }))));
  }, []);

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
      const editorPath = language === 'en'
        ? `/stories/${story.id}/en/chapters/1`
        : `/stories/${story.id}/chapters/1`;
      navigate(editorPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cms-page studio-page create-story-studio create-story-studio--premium wc-page-enter">
      <div className="create-story-steps" aria-label={t('createStory.wizardSteps')}>
        <span className="create-story-step create-story-step--active">
          <span className="create-story-step__num">1</span>
          {t('createStory.stepIdentity')}
        </span>
        <span className="create-story-step create-story-step--active">
          <span className="create-story-step__num">2</span>
          {t('createStory.stepFormat')}
        </span>
        <span className="create-story-step">
          <span className="create-story-step__num">3</span>
          {t('createStory.stepPublish')}
        </span>
      </div>

      <StudioPageHeader
        variant="hero"
        eyebrow={t('createStory.eyebrow')}
        eyebrowIcon={PenLine}
        title={t('createStory.title')}
        subtitle={t('createStory.subtitle')}
      />

      <form onSubmit={handleSubmit} className="create-story-bento wc-stagger-children">
        <div className="create-story-bento__hero">
          <div className="create-story-bento__title-wrap">
            <label htmlFor="story-title" className="create-story-bento__title-label">
              {t('createStory.storyTitle')}
            </label>
            <input
              id="story-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, PAYWALL.maxStoryTitleChars))}
              placeholder={t('createStory.storyTitlePlaceholder')}
              required
              minLength={3}
              className="create-story-bento__title-input"
              lang={locale === 'te' ? 'te' : undefined}
            />
            <span className="input-counter">{title.length} / {PAYWALL.maxStoryTitleChars}</span>
          </div>
          <label className="create-story-bento__cover" aria-label={t('createStory.coverUpload')}>
            {coverPreview ? (
              <img src={coverPreview} alt="" />
            ) : (
              <>
                <ImageIcon size={36} color="var(--ink-muted)" aria-hidden />
                <span className="cms-cover-zone__placeholder">{t('createStory.coverPlaceholder')}</span>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleCoverUpload}
              required
              className="create-story-bento__cover-input"
            />
          </label>
        </div>

        <div className="create-story-bento__main">
          <section className="create-story-panel">
            <div className="create-story-panel__head">
              <h3 className="create-story-panel__title">{t('createStory.contentType')}</h3>
            </div>
            <div className="create-story-content-types create-story-types--premium" role="radiogroup" aria-label={t('createStory.contentType')}>
              {CREATABLE_CONTENT_TYPES.map((ct) => {
                const label = locale === 'te' ? ct.labelTelugu : ct.label;
                const active = contentType === ct.id;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`create-story-content-type${active ? ' create-story-content-type--active' : ''}`}
                    onClick={() => setContentType(ct.id)}
                  >
                    <span className="create-story-content-type__label">{label}</span>
                    <span className="create-story-content-type__meta">
                      {ct.minChapters != null && `${ct.minChapters}+ ch`}
                      {ct.minChapters != null && ct.minWordsPerChapter != null && ' · '}
                      {ct.minWordsPerChapter != null && `${ct.minWordsPerChapter}+ w`}
                    </span>
                  </button>
                );
              })}
            </div>
            {contentTypeGuide && (
              <p className="create-story-guide--premium" role="status">{contentTypeGuide}</p>
            )}
          </section>

          <section className="create-story-panel">
            <h3 className="create-story-panel__title">{t('createStory.essentials')}</h3>
            <div className="create-story-meta-grid">
              <div className="input-group">
                <label htmlFor="primary-genre">{t('createStory.primaryGenre')}</label>
                <select id="primary-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
                  {PRD_GENRES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {locale === 'te' ? g.labelTelugu : g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="age-rating">{t('createStory.ageRating')}</label>
                <select id="age-rating" value={ageRating} onChange={(e) => setAgeRating(e.target.value)}>
                  {AGE_RATINGS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="language">{t('createStory.language')}</label>
                <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.labelNative}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="release-schedule">{t('createStory.releaseSchedule')}</label>
                <select id="release-schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                  <option value="weekly">{t('schedule.weekly')}</option>
                  <option value="biweekly">{t('schedule.biweekly')}</option>
                  <option value="irregular">{t('schedule.irregular')}</option>
                  <option value="complete">{t('schedule.complete')}</option>
                </select>
              </div>
            </div>
          </section>

          <details className="create-story-advanced">
            <summary className="create-story-advanced__summary">
              {t('createStory.advancedDetails')}
              <Sparkles size={16} aria-hidden />
            </summary>
            <div className="create-story-advanced__body">
              <div className="input-group">
                <label htmlFor="completion-status">{t('createStory.completionStatus')}</label>
                <select id="completion-status" value={storyStatus} onChange={(e) => setStoryStatus(e.target.value)}>
                  {STORY_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <h4 className="create-story-panel__title">{t('createStory.secondaryGenres')}</h4>
                <div className="create-story-genres">
                  {PRD_GENRES.filter((g) => g.id !== genre).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`create-story-genre-chip${secondaryGenres.includes(g.id) ? ' create-story-genre-chip--active' : ''}`}
                      onClick={() => toggleSecondaryGenre(g.id)}
                    >
                      {genreLabel(g.id)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="create-story-meta-grid">
                <div className="input-group">
                  <label htmlFor="setting">{t('createStory.setting')}</label>
                  <input
                    id="setting"
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                    placeholder={t('createStory.settingPlaceholder')}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="themes">{t('createStory.themes')}</label>
                  <input
                    id="themes"
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    placeholder={t('createStory.themesPlaceholder')}
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="tag-search">{t('createStory.communityTags')}</label>
                <input
                  id="tag-search"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder={t('createStory.tagSearchPlaceholder')}
                />
                <div className="create-story-genres cms-mt-2">
                  {tagResults.map((tag) => (
                    <button
                      key={tag.slug}
                      type="button"
                      className={`create-story-genre-chip${selectedTags.includes(tag.slug) ? ' create-story-genre-chip--active' : ''}`}
                      onClick={() => toggleTag(tag.slug)}
                    >
                      #{tag.slug}
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="description">{t('createStory.description')}</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, PAYWALL.maxStoryDescChars))}
                  placeholder={t('createStory.descriptionPlaceholder')}
                  rows={3}
                />
                <span className="input-counter">{description.length} / {PAYWALL.maxStoryDescChars}</span>
              </div>
            </div>
          </details>

          {error && <p className="cms-error-text">{error}</p>}
        </div>

        <aside className="create-story-bento__side">
          <div className="create-story-side-card">
            <h4 className="create-story-side-card__title">{t('createStory.sidecardTitle')}</h4>
            <p className="create-story-side-card__text">{t('createStory.sidecardText')}</p>
          </div>
          <div className="create-story-side-card">
            <h4 className="create-story-side-card__title">{t('createStory.coverImage')}</h4>
            <p className="create-story-side-card__text">{t('createStory.coverHint')}</p>
            <p className="input-hint" style={{ marginTop: 8 }}>
              <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} aria-hidden />
              {t('createStory.coverUpload')}
            </p>
          </div>
        </aside>

        <div className="create-story-submit-bar">
          <p className="create-story-submit-bar__hint">{t('createStory.submitHint')}</p>
          <button
            type="submit"
            className="katha-cta katha-cta--maroon"
            disabled={submitting}
          >
            {submitting ? t('createStory.submitting') : t('createStory.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}