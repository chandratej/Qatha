import { useState } from 'react';
import { X } from 'lucide-react';
import { api, type StoryData } from '../lib/api';
import { GENRES, RELEASE_SCHEDULES, PAYWALL } from '../lib/constants';

interface StoryEditModalProps {
  story: StoryData;
  onClose: () => void;
  onSaved: () => void;
}

export function StoryEditModal({ story, onClose, onSaved }: StoryEditModalProps) {
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description || '');
  const [genre, setGenre] = useState(story.genre);
  const [schedule, setSchedule] = useState(story.release_schedule || 'irregular');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateStory(story.id, { title, description, genre, release_schedule: schedule });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="milestone-modal-backdrop" onClick={onClose}>
      <div className="cms-panel" style={{ maxWidth: 520, width: '100%', margin: 16 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="cms-panel__title" style={{ margin: 0 }}>Edit story</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, PAYWALL.maxStoryTitleChars))} required />
          </div>
          <div className="input-group">
            <label>Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, PAYWALL.maxStoryDescChars))} rows={3} />
          </div>
          <div className="input-group">
            <label>Release schedule</label>
            <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
              {RELEASE_SCHEDULES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="cms-error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="dashboard-cta" style={{ border: 'none' }} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}