import { useState } from 'react';
import { api, type StoryData } from '../lib/api';
import { GENRES, RELEASE_SCHEDULES, PAYWALL } from '../lib/constants';
import { CmsModal } from './CmsModal';

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
    <CmsModal
      title="Edit story"
      onClose={onClose}
      footer={(
        <div className="cms-modal__footer-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="story-edit-form" className="dashboard-cta" style={{ border: 'none' }} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    >
      <form id="story-edit-form" onSubmit={handleSave} className="cms-form-stack">
        <label className="input-group">
          <span>Title</span>
          <input className="cms-input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, PAYWALL.maxStoryTitleChars))} required />
        </label>
        <label className="input-group">
          <span>Genre</span>
          <select className="cms-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
            {GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <label className="input-group">
          <span>Description</span>
          <textarea className="cms-input cms-textarea" value={description} onChange={(e) => setDescription(e.target.value.slice(0, PAYWALL.maxStoryDescChars))} rows={3} />
        </label>
        <label className="input-group">
          <span>Release schedule</span>
          <select className="cms-select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
            {RELEASE_SCHEDULES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        {error && <p className="cms-error-text">{error}</p>}
      </form>
    </CmsModal>
  );
}