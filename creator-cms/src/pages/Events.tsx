import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Trophy, Users } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import type { KathaEvent } from '../types/platform';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { EVENT_TYPES } from '../lib/platformConstants';

function eventTypeLabel(id: string) {
  return EVENT_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function Events() {
  const [events, setEvents] = useState<KathaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformApi.getEvents().then((r) => {
      setEvents(r.events);
      setLoading(false);
    });
  }, []);

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="సృజనాత్మక కార్యక్రమాలు · Creator Events"
        eyebrowIcon={Trophy}
        title="Events & Contests"
        subtitle="Writing contests, festival challenges, sprints, and collaborative activities — the operating system for the Telugu creator economy."
        actions={(
          <Link to="/events/new" className="katha-cta katha-cta--maroon">
            <Plus size={18} aria-hidden />
            Host an event
          </Link>
        )}
      />

      {loading && <p className="cms-loading cms-loading--inline">Loading events…</p>}

      <div className="platform-events-grid" role="list">
        {events.map((event) => (
          <article key={event.id} className="platform-event-card cms-panel" role="listitem">
            <div className="platform-event-card__head">
              <span className="platform-event-card__type">{eventTypeLabel(event.event_type)}</span>
              <span className={`platform-event-card__status platform-event-card__status--${event.status}`}>
                {event.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="platform-event-card__title">{event.title}</h3>
            {event.description && <p className="platform-event-card__desc">{event.description}</p>}
            <div className="platform-event-card__meta">
              <span><Users size={14} aria-hidden /> {event.registration_count ?? 0} registered</span>
              <span><Trophy size={14} aria-hidden /> ₹{(event.prize_pool_inr ?? 0).toLocaleString('en-IN')} pool</span>
              <span><Calendar size={14} aria-hidden /> {event.entry_fee_inr === 0 ? 'Free entry' : `₹${event.entry_fee_inr} entry`}</span>
            </div>
            <Link to={`/events/${event.id}`} className="katha-cta katha-cta--soft platform-event-card__cta">
              View event →
            </Link>
          </article>
        ))}
      </div>

      <section className="cms-panel platform-roadmap cms-mt-6">
        <h3 className="dashboard-panel__title">Contest roadmap</h3>
        <p className="studio-page-header__subtitle">All contest types from the Master PRD — launch, recurring, and advanced.</p>
        <ul className="platform-roadmap__list">
          {['launch', 'recurring', 'advanced'].map((phase) => (
            <li key={phase}>
              <strong>{phase}</strong>
              <span> — see Platform map for full catalog</span>
            </li>
          ))}
        </ul>
        <Link to="/platform" className="katha-cta katha-cta--soft">View full platform map →</Link>
      </section>
    </div>
  );
}