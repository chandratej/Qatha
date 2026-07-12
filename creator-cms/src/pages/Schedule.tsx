import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2, Pencil, Trash2, BookOpen } from 'lucide-react';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { api, type ScheduledPublishItem, type StoryData } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useLocale } from '../context/LocaleContext';
import type { StudioStringKey } from '../lib/studioLocale';

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

const WEEKDAY_KEYS: StudioStringKey[] = [
  'schedule.weekdaySun',
  'schedule.weekdayMon',
  'schedule.weekdayTue',
  'schedule.weekdayWed',
  'schedule.weekdayThu',
  'schedule.weekdayFri',
  'schedule.weekdaySat',
];

function ScheduleCalendar({
  items,
  month,
  onMonthChange,
}: {
  items: ScheduledPublishItem[];
  month: Date;
  onMonthChange: (next: Date) => void;
}) {
  const { t } = useLocale();

  const scheduledDays = useMemo(() => {
    const map = new Map<number, ScheduledPublishItem[]>();
    for (const item of items) {
      const d = new Date(item.scheduled_publish_at);
      if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) continue;
      const day = d.getDate();
      const list = map.get(day) ?? [];
      list.push(item);
      map.set(day, list);
    }
    return map;
  }, [items, month]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day;

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = month.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="schedule-calendar">
      <div className="schedule-calendar__head">
        <button
          type="button"
          className="schedule-calendar__nav"
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          aria-label={t('schedule.prevMonth')}
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <h3 className="schedule-calendar__month">{monthLabel}</h3>
        <button
          type="button"
          className="schedule-calendar__nav"
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          aria-label={t('schedule.nextMonth')}
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
      <div className="schedule-calendar__weekdays" aria-hidden>
        {WEEKDAY_KEYS.map((key) => (
          <span key={key} className="schedule-calendar__weekday">{t(key)}</span>
        ))}
      </div>
      <div className="schedule-calendar__grid" role="grid" aria-label={t('schedule.calendar')}>
        {cells.map((day, idx) => {
          if (day == null) {
            return <span key={`empty-${idx}`} className="schedule-calendar__cell schedule-calendar__cell--empty" />;
          }
          const dayItems = scheduledDays.get(day) ?? [];
          return (
            <div
              key={day}
              className={`schedule-calendar__cell${isToday(day) ? ' schedule-calendar__cell--today' : ''}${dayItems.length > 0 ? ' schedule-calendar__cell--has-release' : ''}`}
              role="gridcell"
              title={dayItems.map((i) => i.story_title || t('schedule.story')).join(', ')}
            >
              <span className="schedule-calendar__day">{day}</span>
              {dayItems.length > 0 && (
                <span className="schedule-calendar__dots" aria-hidden>
                  {dayItems.slice(0, 3).map((item) => (
                    <span key={item.id} className="schedule-calendar__dot" />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Schedule() {
  const { t } = useLocale();
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
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

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
    const chapterLabel = item.chapter_title || `${t('schedule.chapter')} ${item.chapter_number}`;
    if (!confirm(`${t('schedule.cancelConfirm')} "${chapterLabel}"?`)) return;
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
    <div className="cms-page studio-page schedule-studio-page schedule-studio-page--premium wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('schedule.eyebrow')}
        eyebrowIcon={Calendar}
        title={t('schedule.title')}
        subtitle={t('schedule.subtitle')}
      />

      <div className="schedule-layout schedule-layout--calendar wc-stagger-children">
        <section className="cms-panel schedule-form-panel schedule-form-panel--pro">
          <div className="schedule-form-panel__intro">
            <div className="schedule-form-panel__icon" aria-hidden>
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="cms-panel__title">{t('schedule.formTitle')}</h2>
              <p className="schedule-form-panel__lead">{t('schedule.formLead')}</p>
            </div>
          </div>

          {storiesLoading && (
            <div className="cms-loading">
              <Loader2 size={18} className="cms-loading__spin" />
              {t('common.loading')}
            </div>
          )}

          {!storiesLoading && stories.length === 0 && (
            <div className="studio-empty studio-empty--v2 schedule-empty-state">
              <div className="studio-empty__glyph" aria-hidden><BookOpen size={28} /></div>
              <h3 className="studio-empty__title">{t('schedule.noScheduled')}</h3>
              <p className="studio-empty__text">{t('schedule.emptyStories')}</p>
              <Link to="/stories/new" className="katha-cta katha-cta--maroon">{t('stories.newStory')}</Link>
            </div>
          )}

          {stories.length > 0 && (
            <form className="schedule-form schedule-form--pro" onSubmit={handleSchedule}>
              <label className="schedule-field schedule-field--pro">
                <span className="schedule-field__label">{t('schedule.story')}</span>
                <select
                  className="cms-select"
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  aria-label={t('schedule.story')}
                >
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </label>

              <label className="schedule-field schedule-field--pro">
                <span className="schedule-field__label">{t('schedule.chapter')}</span>
                {chaptersLoading ? (
                  <div className="schedule-field__hint">
                    <Loader2 size={14} className="cms-loading__spin" />
                    {t('common.loading')}
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="schedule-field__hint">
                    {t('schedule.addChapter')}{' '}
                    {selectedStoryId && (
                      <Link to={`/stories/${selectedStoryId}/chapters/1`}>{t('stories.write')}</Link>
                    )}
                  </div>
                ) : (
                  <select
                    className="cms-select"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    aria-label={t('schedule.chapter')}
                  >
                    {chapters.map((ch) => (
                      <option key={ch.chapter_number} value={ch.chapter_number}>
                        {ch.title || `${t('schedule.chapter')} ${ch.chapter_number}`}
                        {ch.status === 'scheduled' ? ` (${t('schedule.alreadyScheduled')})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="schedule-field schedule-field--pro">
                <span className="schedule-field__label">{t('schedule.publishAt')}</span>
                <input
                  type="datetime-local"
                  className="cms-input"
                  value={publishAt}
                  min={minScheduleInputValue()}
                  onChange={(e) => setPublishAt(e.target.value)}
                  required
                  aria-label={t('schedule.publishAt')}
                />
              </label>

              {formError && <p className="cms-error-text">{formError}</p>}

              <button
                type="submit"
                className="katha-cta katha-cta--maroon schedule-form__submit"
                disabled={submitting || chapters.length === 0 || !selectedChapter}
              >
                {submitting ? <Loader2 size={16} className="cms-loading__spin" /> : <Clock size={16} />}
                {submitting ? t('schedule.confirming') : t('schedule.confirm')}
              </button>

              {selectedStory && (
                <p className="schedule-form__note">{t('schedule.formNote')}</p>
              )}
            </form>
          )}
        </section>

        <div className="schedule-calendar-column">
          <section className="cms-panel schedule-calendar-panel">
            <div className="cms-panel__head">
              <h2 className="cms-panel__title">{t('schedule.calendar')}</h2>
              <span className="schedule-count">{scheduledItems.length}</span>
            </div>
            <ScheduleCalendar
              items={scheduledItems}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
            />
          </section>

          <section className="cms-panel schedule-list-panel">
            <div className="cms-panel__head">
              <h2 className="cms-panel__title">{t('schedule.upcoming')}</h2>
            </div>

            {loading && (
              <div className="cms-loading">
                <Loader2 size={18} className="cms-loading__spin" />
                {t('common.loading')}
              </div>
            )}

            {error && <p className="cms-error-text">{error}</p>}

            {!loading && scheduledItems.length === 0 && (
              <p className="schedule-list-empty">{t('schedule.noScheduled')}</p>
            )}

            {!loading && scheduledItems.length > 0 && (
              <ul className="schedule-list schedule-list--compact">
                {scheduledItems.map((item) => (
                  <li key={item.id} className="schedule-item schedule-item--compact">
                    <div className="schedule-item__main">
                      <span className="schedule-item__story">{item.story_title}</span>
                      <span className="schedule-item__chapter">
                        {item.chapter_title || `${t('schedule.chapter')} ${item.chapter_number}`}
                      </span>
                      {editingId === item.id ? (
                        <div className="schedule-item__edit">
                          <input
                            type="datetime-local"
                            className="cms-input"
                            value={editTime}
                            min={minScheduleInputValue()}
                            onChange={(e) => setEditTime(e.target.value)}
                            aria-label={t('schedule.newPublishTime')}
                          />
                          <button
                            type="button"
                            className="schedule-item__btn schedule-item__btn--primary"
                            onClick={() => handleReschedule(item)}
                            disabled={actionId === item.id}
                          >
                            {t('common.save')}
                          </button>
                          <button
                            type="button"
                            className="schedule-item__btn"
                            onClick={() => setEditingId(null)}
                          >
                            {t('common.cancel')}
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
                          title={t('common.edit')}
                        >
                          <Pencil size={15} aria-hidden />
                        </Link>
                        <button
                          type="button"
                          className="schedule-item__btn"
                          title={t('schedule.title')}
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
                          title={t('common.cancel')}
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
    </div>
  );
}