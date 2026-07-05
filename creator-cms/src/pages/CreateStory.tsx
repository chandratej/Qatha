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

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Per UI/UX decisions: simple guidelines, no design skills required. Recommended 2:3 or 3:4 for cards.

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let cover_url = undefined;
      if (coverFile) {
        try {
          const res = await api.uploadImage(coverFile);
          cover_url = res.url;
        } catch (uploadError) {
          console.warn('Cover upload failed, continuing without cover:', uploadError);
        }
      }
      const { story } = await api.createStory({ title, description, genre, release_schedule: schedule, cover_url });
      // Go to seasons view so author can organize seasons (sequels/prequels) then chapters
      navigate(`/stories/${story.id}`);
    } catch {
      navigate('/stories/story-001');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h2>Create Your Story</h2>
          <p>Step 2 of onboarding — set up your story for readers to discover.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
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

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Story & Write Chapter 1'}
          </button>
        </div>

        <div>
          <label className="input-group" style={{ cursor: 'pointer' }}>
            <span>Cover image *</span>
            <div style={{ 
              fontSize: '0.7rem', 
              color: 'var(--ink-muted)',
              background: 'var(--paper-warm)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #fde047',
              marginTop: '4px'
            }}>
              📌 Recommended: 600×900 (2:3) or 3:4 ratio, JPG/PNG &lt;1MB. Looks great in story cards. No design skills required.
            </div>
            <div
              className="card"
              style={{
                aspectRatio: '5/7',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <ImageIcon size={48} color="var(--ink-muted)" />
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