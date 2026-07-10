import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Loader2, Pencil, Trash2, BookOpen } from 'lucide-react';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { api, type ScheduledPublishItem, type StoryData } from '../lib/api';
import { useApi } from '../hooks/useApi';

function formatScheduleDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toLocalInputValue(iso?: string) {
  if (!iso) {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  }
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function minScheduleInputValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 5);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function Schedule() {
  const { data: storiesData, loading: storiesLoading } = useApi(() => api.getCreatorStories());
  const { data: scheduledData, loading: scheduledLoading, error, reload } = useApi(() => api.getScheduledPublishes());

  const stories = storiesData?.stories ?? [];
  const scheduledItems = scheduledData?.items ?? [];

  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [publishAt, setPublishAt] = useState(() => toLocalInputValue());
  const [chapters, setChapters] = useState<Array<{ chapter_number: number; title?: string; status?: string }>>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStoryId && stories.length > 0) {
      setSelectedStoryId(stories[0].id);
    }
  }, [stories, selectedStoryId]);

  const loadChapters = useCallback(async (storyId: string) => {
    if (!storyId) return;
    setChaptersLoading(true);
    try {
      const { chapters: list } = await api.getStoryChapters(storyId);
      const schedulable = (list ?? []).filter(
        (ch) => ch.status !== 'published' && ch.status !== 'pending_review',
      );
      setChapters(schedulable);
      if (schedulable.length > 0) {
        setSelectedChapter(String(schedulable[0].chapter_number));
      } else {
        setSelectedChapter('');
      }
    } catch {
      setChapters([]);
      setSelectedChapter('');
    } finally {
      setChaptersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStoryId) loadChapters(selectedStoryId);
  }, [selectedStoryId, loadChapters]);

  const selectedStory = useMemo(
    () => stories.find((s: StoryData) => s.id === selectedStoryId),
    [stories, selectedStoryId],
  );

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoryId || !selectedChapter || !publishAt) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const iso = new Date(publishAt).toISOString();
      await api.scheduleChapter(selectedStoryId, {
        chapter_number: Number(selectedChapter),
        scheduled_publish_at: iso,
      });
      setPublishAt(toLocalInputValue());
      await reload();
      await loadChapters(selectedStoryId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not schedule publish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (item: ScheduledPublishItem) => {
    if (!confirm(`Cancel scheduled publish for "${item.chapter_title || `Chapter ${item.chapter_number}`}"?`)) return;
    setActionId(item.id);
    try {
      await api.cancelScheduledPublish(item.story_id, item.chapter_number);
      await reload();
      if (selectedStoryId === item.story_id) await loadChapters(item.story_id);
    } finally {
      setActionId(null);
    }
  };

  const handleReschedule = async (item: ScheduledPublishItem) => {
    if (!editTime) return;
    setActionId(item.id);
    try {
      await api.rescheduleChapter(item.story_id, item.chapter_number, new Date(editTime).toISOString());
      setEditingId(null);
      await reload();
    } finally {
      setActionId(null);
    }
  };

  const loading = storiesLoading || scheduledLoading;

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="Publishing calendar"
        eyebrowIcon={Calendar}
        title="Schedule"
        subtitle="Pick when a chapter goes live. It will publish automatically — you don't need to be online."
      />

      <div className="schedule-layout">
        <section className="cms-panel schedule-form-panel">
          <div className="cms-panel__head">
            <h2 className="cms-panel__title">Schedule a publish</h2>
            <Calendar size={20} color="var(--dash-gold)" aria-hidden />
          </div>

          {storiesLoading && (
            <div className="cms-loading">
              <Loader2 size={18} className="cms-loading__spin" />
              Loading stories…
            </div>
          )}

          {!storiesLoading && stories.length === 0 && (
            <div className="studio-empty" style={{ padding: '32px 24px' }}>
              <div className="studio-empty__glyph" aria-hidden><BookOpen size={28} /></div>
              <h3 className="studio-empty__title">Nothing to schedule yet</h3>
              <p className="studio-empty__text">Create a story and write a chapter before scheduling a publish.</p>
              <Link to="/stories/new" className="katha-cta katha-cta--maroon" style={{ display: 'inline-flex' }}>New manuscript</Link>
            </div>
          )}

          {stories.length > 0 && (
            <form className="schedule-form" onSubmit={handleSchedule}>
              <label className="schedule-field">
                <span>Story</span>
                <select
                  className="cms-select"
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  aria-label="Select story"
                >
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </label>

              <label className="schedule-field">
                <span>Chapter</span>
                {chaptersLoading ? (
                  <div className="schedule-field__hint">
                    <Loader2 size={14} className="cms-loading__spin" />
                    Loading chapters…
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="schedule-field__hint">
                    No draft chapters yet.{' '}
                    {selectedStoryId && (
                      <Link to={`/stories/${selectedStoryId}/chapters/1`}>Write a chapter</Link>
                    )}
                  </div>
                ) : (
                  <select
                    className="cms-select"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    aria-label="Select chapter"
                  >
                    {chapters.map((ch) => (
                      <option key={ch.chapter_number} value={ch.chapter_number}>
                        {ch.title || `Chapter ${ch.chapter_number}`}
                        {ch.status === 'scheduled' ? ' (already scheduled)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="schedule-field">
                <span>Publish date &amp; time</span>
                <input
                  type="datetime-local"
                  className="cms-input"
                  value={publishAt}
                  min={minScheduleInputValue()}
                  onChange={(e) => setPublishAt(e.target.value)}
                  required
                  aria-label="Publish date and time"
                />
              </label>

              {formError && <p className="cms-error-text">{formError}</p>}

              <button
                type="submit"
                className="katha-cta katha-cta--maroon schedule-form__submit"
                disabled={submitting || chapters.length === 0 || !selectedChapter}
              >
                {submitting ? <Loader2 size={16} className="cms-loading__spin" /> : <Clock size={16} />}
                {submitting ? 'Confirming…' : 'Schedule publish'}
              </button>

              {selectedStory && (
                <p className="schedule-form__note">
                  Your chapter will go live at the time you choose. You can reschedule or cancel anytime before then.
                </p>
              )}
            </form>
          )}
        </section>

        <section className="cms-panel schedule-list-panel">
          <div className="cms-panel__head">
            <h2 className="cms-panel__title">Upcoming</h2>
            <span className="schedule-count">{scheduledItems.length}</span>
          </div>

          {loading && (
            <div className="cms-loading">
              <Loader2 size={18} className="cms-loading__spin" />
              Loading schedule…
            </div>
          )}

          {error && <p className="cms-error-text">{error}</p>}

          {!loading && scheduledItems.length === 0 && (
            <p className="schedule-list-empty">No scheduled publishes yet. Set one above when you&apos;re ready.</p>
          )}

          {!loading && scheduledItems.length > 0 && (
            <ul className="schedule-list">
              {scheduledItems.map((item) => (
                <li key={item.id} className="schedule-item">
                  <div className="schedule-item__main">
                    <span className="schedule-item__story">{item.story_title}</span>
                    <span className="schedule-item__chapter">
                      {item.chapter_title || `Chapter ${item.chapter_number}`}
                    </span>
                    {editingId === item.id ? (
                      <div className="schedule-item__edit">
                        <input
                          type="datetime-local"
                          className="cms-input"
                          value={editTime}
                          min={minScheduleInputValue()}
                          onChange={(e) => setEditTime(e.target.value)}
                          aria-label="New publish time"
                        />
                        <button
                          type="button"
                          className="schedule-item__btn schedule-item__btn--primary"
                          onClick={() => handleReschedule(item)}
                          disabled={actionId === item.id}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="schedule-item__btn"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="schedule-item__time">
                        <Clock size={14} aria-hidden />
                        {formatScheduleDate(item.scheduled_publish_at)}
                      </span>
                    )}
                  </div>
                  {editingId !== item.id && (
                    <div className="schedule-item__actions">
                      <Link
                        to={`/stories/${item.story_id}/chapters/${item.chapter_number}`}
                        className="schedule-item__btn"
                        title="Edit chapter"
                      >
                        <Pencil size={15} aria-hidden />
                      </Link>
                      <button
                        type="button"
                        className="schedule-item__btn"
                        title="Reschedule"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditTime(toLocalInputValue(item.scheduled_publish_at));
                        }}
                      >
                        <Calendar size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="schedule-item__btn schedule-item__btn--danger"
                        title="Cancel schedule"
                        onClick={() => handleCancel(item)}
                        disabled={actionId === item.id}
                      >
                        {actionId === item.id
                          ? <Loader2 size={15} className="cms-loading__spin" />
                          : <Trash2 size={15} aria-hidden />}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}