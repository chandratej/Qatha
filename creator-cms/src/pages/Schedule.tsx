import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Calendar, CalendarClock, ChevronLeft, ChevronRight, Clock, Loader2, Pencil, X,
} from 'lucide-react';
import { api, type ScheduledPublishItem } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useLocale } from '../context/LocaleContext';

function formatUpcomingMeta(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === 'te' ? 'te-IN' : undefined, {
    day: 'numeric',
    month: 'short',
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

const TE_WEEKDAYS = ['ఆ', 'సో', 'మం', 'బు', 'గు', 'శు', 'శ'];
const EN_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function OpsCalendar({
  items,
  month,
  onMonthChange,
  te,
}: {
  items: ScheduledPublishItem[];
  month: Date;
  onMonthChange: (next: Date) => void;
  te: boolean;
}) {
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

  const monthLabel = month.toLocaleString(te ? 'en-IN' : undefined, { month: 'long', year: 'numeric' });
  const weekdays = te ? TE_WEEKDAYS : EN_WEEKDAYS;

  return (
    <div className="ops-calendar-panel">
      <div className="ops-cal-head">
        <div className="ops-cal-nav">
          <button
            type="button"
            onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
            aria-label={te ? 'మునుపటి నెల' : 'Previous month'}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <span className="ops-cal-month">{monthLabel}</span>
          <button
            type="button"
            onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
            aria-label={te ? 'తదుపరి నెల' : 'Next month'}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>
      <div className="ops-cal-grid" role="grid" aria-label={te ? 'క్యాలెండర్' : 'Calendar'}>
        {weekdays.map((w) => (
          <span key={w} className="ops-cal-weekday">{w}</span>
        ))}
        {cells.map((day, idx) => {
          if (day == null) {
            return <span key={`e-${idx}`} className="ops-cal-cell ops-cal-cell--empty" />;
          }
          const dayItems = scheduledDays.get(day) ?? [];
          const classes = [
            'ops-cal-cell',
            isToday(day) ? 'ops-cal-cell--today' : '',
            dayItems.length > 0 ? 'ops-cal-cell--has-release' : '',
          ].filter(Boolean).join(' ');
          return (
            <div
              key={day}
              className={classes}
              role="gridcell"
              title={dayItems.map((i) => i.story_title || '').filter(Boolean).join(', ')}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Release Calendar — review/overview only (katha_calendar_v2.html parity).
 * New schedules originate from the chapter editor Publish step.
 */
export function Schedule() {
  const { t, locale } = useLocale();
  const te = locale === 'te';
  const { data: scheduledData, loading, error, reload } = useApi(() => api.getScheduledPublishes());
  const scheduledItems = scheduledData?.items ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const handleCancel = async (item: ScheduledPublishItem) => {
    const chapterLabel = item.chapter_title || `${t('schedule.chapter')} ${item.chapter_number}`;
    if (!confirm(`${t('schedule.cancelConfirm')} "${chapterLabel}"?`)) return;
    setActionId(item.id);
    try {
      await api.cancelScheduledPublish(item.story_id, item.chapter_number);
      await reload();
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

  const subtitle = te
    ? 'అన్ని కథలలో షెడ్యూల్ చేసిన ప్రచురణలు ఇక్కడ కనిపిస్తాయి. కొత్త షెడ్యూల్ ఎడిటర్‌లో "ప్రచురించు" దశలో సెట్ చేయండి.'
    : 'Scheduled releases across all your stories appear here. Create new schedules from a chapter Publish step in the editor.';

  const emptyText = te
    ? 'ఇప్పుడు షెడ్యూల్ చేసిన విడుదలలు లేవు. ఒక అధ్యాయాన్ని ప్రచురించేటప్పుడు, "ఇప్పుడు" లేదా "షెడ్యూల్ చేయండి" ఎంచుకోవచ్చు — అది ఇక్కడ కనిపిస్తుంది.'
    : 'No scheduled releases yet. When publishing a chapter, choose Publish now or Schedule — it will show up here.';

  return (
    <div className="cms-page katha-ops-v2-page">
      <div className="katha-ops-v2 katha-ops-v2--calendar">
        <header className="ops-page-head">
          <div>
            <p className="ops-eyebrow" lang={te ? 'te' : 'en'}>
              <Calendar size={14} aria-hidden />
              {te ? 'ప్రచురణ క్యాలెండర్' : 'Publishing calendar'}
            </p>
            <h1 className="ops-title" lang={te ? 'te' : 'en'}>
              {te ? 'రిలీజ్ క్యాలెండర్' : 'Release calendar'}
            </h1>
            <p className="ops-subtitle" lang={te ? 'te' : 'en'}>{subtitle}</p>
          </div>
          <Link to="/stories" className="ops-cta ops-cta--ghost">
            <BookOpen size={16} aria-hidden />
            {te ? 'కథలకు వెళ్ళండి' : 'Go to stories'}
          </Link>
        </header>

        {!loading && scheduledItems.length === 0 && (
          <div className="ops-empty-state" lang={te ? 'te' : 'en'}>
            <CalendarClock size={28} aria-hidden />
            <p>{emptyText}</p>
            <Link to="/stories" className="ops-cta ops-cta--ghost">
              <Pencil size={16} aria-hidden />
              {te ? 'మాన్యుస్క్రిప్ట్‌కు వెళ్ళండి' : 'Go to manuscripts'}
            </Link>
          </div>
        )}

        <OpsCalendar
          items={scheduledItems}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          te={te}
        />

        <div className="ops-section-head">
          <h3 className="ops-h3-sm" lang={te ? 'te' : 'en'}>
            {te ? 'రాబోయే విడుదలలు' : 'Upcoming releases'}
          </h3>
        </div>

        {loading && (
          <p className="ops-loading">
            <Loader2 size={16} className="cms-loading__spin" aria-hidden />
            {t('common.loading')}
          </p>
        )}

        {error && <p className="ops-error">{error}</p>}

        {!loading && scheduledItems.length > 0 && (
          <ul className="ops-upcoming-list">
            {scheduledItems.map((item) => (
              <li key={item.id} className="ops-upcoming-row">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="ops-upcoming-title" lang="te">
                    {item.chapter_title
                      ? `${item.chapter_title} — ${item.story_title || ''}`
                      : `Chapter ${item.chapter_number} — ${item.story_title || ''}`}
                  </p>
                  {editingId === item.id ? (
                    <div className="ops-reschedule-row">
                      <input
                        type="datetime-local"
                        value={editTime}
                        min={minScheduleInputValue()}
                        onChange={(e) => setEditTime(e.target.value)}
                        aria-label={t('schedule.newPublishTime')}
                      />
                      <button
                        type="button"
                        className="ops-primary"
                        onClick={() => void handleReschedule(item)}
                        disabled={actionId === item.id}
                      >
                        {t('common.save')}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <p className="ops-upcoming-meta">
                      <Clock size={12} aria-hidden style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {formatUpcomingMeta(item.scheduled_publish_at, locale)}
                    </p>
                  )}
                </div>
                {editingId !== item.id && (
                  <div className="ops-upcoming-actions">
                    <button
                      type="button"
                      className="ops-icon-btn"
                      title={te ? 'రీషెడ్యూల్' : 'Reschedule'}
                      onClick={() => {
                        setEditingId(item.id);
                        setEditTime(toLocalInputValue(item.scheduled_publish_at));
                      }}
                    >
                      <CalendarClock size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="ops-icon-btn"
                      title={te ? 'రద్దు చేయండి' : 'Cancel'}
                      onClick={() => void handleCancel(item)}
                      disabled={actionId === item.id}
                    >
                      {actionId === item.id
                        ? <Loader2 size={15} className="cms-loading__spin" aria-hidden />
                        : <X size={15} aria-hidden />}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
