import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';

const GENRES = [
  { id: 'romance', label: 'Romance', telugu: 'ప్రేమ కథలు' },
  { id: 'family_drama', label: 'Family Drama', telugu: 'కుటుంబ నాటకం' },
  { id: 'suspense', label: 'Suspense', telugu: 'సస్పెన్స్' },
];

const SCHEDULES = [
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every other week' },
  { id: 'irregular', label: 'When ready' },
  { id: 'complete', label: 'Story complete' },
];

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
    setSubmitting(true);
    setError(null);
    try {
      let cover_url: string | undefined;
      if (coverFile) {
        const res = await api.uploadImage(coverFile);
        cover_url = res.url;
      }
      const { story } = await api.createStory({ title, description, genre, release_schedule: schedule, cover_url });
      navigate(`/stories/${story.id}`);
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
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="Enter your story title in Telugu or English"
              required
              minLength={3}
            />
            <span className="input-counter">{title.length} / 100</span>
          </div>

          <div className="input-group">
            <label>Genre *</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label} — {g.telugu}
                </option>
              ))}
            </select>
            <span className="input-hint">Choose the best fit for discoverability</span>
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="A brief hook for readers browsing stories..."
              rows={4}
            />
            <span className="input-counter">{description.length} / 300</span>
          </div>

          <div className="input-group">
            <label>Release schedule</label>
            <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
              {SCHEDULES.map((s) => (
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
            <span>Cover image</span>
            <div className="cms-cover-hint">
              Recommended: 600×900 (2:3) or 3:4 ratio, JPG/PNG under 1MB. Looks great in story cards.
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