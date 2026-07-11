import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';

function formatUpcoming(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ScheduleCalendarWidget() {
  const { data, loading } = useApi(() => api.getScheduledPublishes().catch(() => ({ items: [] })));

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (data?.items ?? [])
      .filter((item) => new Date(item.scheduled_publish_at).getTime() > now)
      .sort((a, b) => new Date(a.scheduled_publish_at).getTime() - new Date(b.scheduled_publish_at).getTime())
      .slice(0, 3);
  }, [data]);

  return (
    <section className="cms-panel dashboard-schedule-widget" aria-labelledby="dash-schedule-title">
      <div className="dashboard-schedule-widget__head">
        <Calendar size={16} aria-hidden />
        <h3 id="dash-schedule-title" className="dashboard-panel__title">Upcoming publishes</h3>
      </div>
      {loading ? (
        <p className="input-hint">Loading schedule…</p>
      ) : upcoming.length === 0 ? (
        <p className="input-hint">No chapters scheduled. Plan your next release from the editor or schedule page.</p>
      ) : (
        <ul className="dashboard-schedule-widget__list">
          {upcoming.map((item) => (
            <li key={`${item.story_id}-${item.chapter_number}`} className="dashboard-schedule-widget__item">
              <strong>Ch. {item.chapter_number}</strong>
              <span>{formatUpcoming(item.scheduled_publish_at)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/schedule" className="katha-cta katha-cta--soft katha-cta--compact">
        Open schedule
      </Link>
    </section>
  );
}