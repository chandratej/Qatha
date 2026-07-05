import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import { GENRES, RELEASE_SCHEDULES, PAYWALL } from '../lib/constants';

export function CreateStory() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('romance');
  const [schedule, setSchedule] = useState('irregular');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { story } = await api.createStory({ title, description, genre, release_schedule: schedule, cover_url });
      navigate(`/stories/${story.id}/chapters/1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cms-page">
      <header className="cms-page-header">
        <div>
          <h1 className="cms-page-header__title">Create Your Story</h1>
          <p className="cms-page-header__subtitle">
            Set up your story for readers to discover — title, genre, cover, and release schedule.
          </p>
        </div>
      </header>

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
            <label>Genre *</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label} — {g.labelTelugu}
                </option>
              ))}
            </select>
            <span className="input-hint">Choose the best fit for discoverability</span>
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
              {RELEASE_SCHEDULES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <span className="input-hint">Readers see when to expect your next chapter</span>
          </div>

          {error && <p className="cms-error-text">{error}</p>}
          <button type="submit" className="dashboard-cta" style={{ alignSelf: 'flex-start', border: 'none' }} disabled={submitting}>
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
                  <ImageIcon size={44} color="var(--ink-muted)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>500×700px recommended</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>PNG, JPG, WebP · max 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverUpload}
                required
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
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