import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, PenLine } from 'lucide-react';
import { api } from '../lib/api';
import { PAYWALL } from '../lib/constants';
import {
  GENRES, CONTENT_TYPES, AGE_RATINGS, LANGUAGES, STORY_STATUSES, MOOD_TAGS,
} from '../lib/platformConstants';
import { platformApi } from '../lib/platformApi';
import { searchTags } from '../business/tagWorkflow';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';

export function CreateStory() {
  const navigate = useNavigate();
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
    platformApi.getTags().then((r) => setAllTags(r.tags.map((t) => ({ slug: t.slug, label: t.label }))));
  }, []);

  const tagResults = searchTags(allTags, tagSearch).slice(0, 12);

  const toggleSecondaryGenre = (id: string) => {
    setSecondaryGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : prev.length < 8 ? [...prev, slug] : prev,
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
      setError('Cover image is required before publishing your story.');
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
        themes: themes.split(',').map((t) => t.trim()).filter(Boolean),
        tags: selectedTags,
      });
      navigate(`/stories/${story.id}/chapters/1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cms-page studio-page create-story-studio">
      <StudioPageHeader
        eyebrow="కొత్త కథ · New manuscript"
        eyebrowIcon={PenLine}
        title="Create your story"
        subtitle="Full PRD metadata — content type, genres, age rating, language, tags, and cover."
      />

      <form onSubmit={handleSubmit} className="cms-form-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="input-group">
            <label>Story title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, PAYWALL.maxStoryTitleChars))}
              placeholder="Enter your story title in Telugu or English"
              required
              minLength={3}
            />
            <span className="input-counter">{title.length} / {PAYWALL.maxStoryTitleChars}</span>
          </div>

          <div className="input-group">
            <label>Content type *</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              {CONTENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label} — {t.labelTelugu}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Primary genre *</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.slice(0, 14).map((g) => (
                <option key={g.id} value={g.id}>{g.label} — {g.labelTelugu}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Secondary genres (up to 3)</label>
            <div className="profile-genres">
              {GENRES.filter((g) => g.id !== genre).slice(0, 14).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`profile-genre-chip${secondaryGenres.includes(g.id) ? ' profile-genre-chip--active' : ''}`}
                  onClick={() => toggleSecondaryGenre(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Age rating *</label>
            <select value={ageRating} onChange={(e) => setAgeRating(e.target.value)}>
              {AGE_RATINGS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Language *</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.labelNative}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Completion status</label>
            <select value={storyStatus} onChange={(e) => setStoryStatus(e.target.value)}>
              {STORY_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Setting</label>
            <input value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="e.g. Hyderabad, 1990s village" />
          </div>

          <div className="input-group">
            <label>Themes (comma-separated)</label>
            <input value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="family, identity, revenge" />
          </div>

          <div className="input-group">
            <label>Community tags</label>
            <input value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} placeholder="Search tags…" />
            <div className="profile-genres cms-mt-2">
              {tagResults.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  className={`profile-genre-chip${selectedTags.includes(t.slug) ? ' profile-genre-chip--active' : ''}`}
                  onClick={() => toggleTag(t.slug)}
                >
                  #{t.slug}
                </button>
              ))}
            </div>
            <span className="input-hint">Mood tags: {MOOD_TAGS.slice(0, 5).join(', ')}… · <a href="/tags">Request new tag</a></span>
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, PAYWALL.maxStoryDescChars))}
              placeholder="A brief hook for readers browsing stories..."
              rows={4}
            />
            <span className="input-counter">{description.length} / {PAYWALL.maxStoryDescChars}</span>
          </div>

          <div className="input-group">
            <label>Release schedule</label>
            <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
              <option value="weekly">Every week</option>
              <option value="biweekly">Every other week</option>
              <option value="irregular">When ready</option>
              <option value="complete">Story complete</option>
            </select>
          </div>

          {error && <p className="cms-error-text">{error}</p>}
          <button type="submit" className="katha-cta katha-cta--maroon" style={{ alignSelf: 'flex-start', border: 'none' }} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Story & Write Chapter 1'}
          </button>
        </div>

        <div>
          <label className="input-group" style={{ cursor: 'pointer' }}>
            <span>Cover image *</span>
            <div className="cms-cover-hint">
              Required before your story goes live. 600×900 (2:3) recommended, JPG/PNG under 1MB.
            </div>
            <div className="cms-cover-zone">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" />
              ) : (
                <>
                  <ImageIcon size={44} color="var(--ink-muted)" aria-hidden />
                  <span className="cms-cover-zone__placeholder">600×900 (2:3) recommended</span>
                </>
              )}
              <input
                id="cover-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverUpload}
                required
                aria-label="Upload cover image"
                className="cms-cover-zone__input"
              />
            </div>
            <span className="input-hint">
              <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Click to upload cover
            </span>
          </label>
        </div>
      </form>
    </div>
  );
}