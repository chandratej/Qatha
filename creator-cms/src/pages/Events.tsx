import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Trophy, Users, IndianRupee, Sparkles } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import type { KathaEvent } from '../types/platform';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { EVENT_TYPES } from '../lib/platformConstants';
import {
  eventAcceptsRegistration,
  isAcquisitionEvent,
  registrationCtaLabel,
} from '../business/eventRegistration';
import { useAuth } from '../context/AuthContext';
import { trackCreatorEvent } from '../lib/analyticsEvents';

function eventTypeLabel(id: string) {
  return EVENT_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<KathaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState({
    totalPlatformFeesInr: 0,
    totalEntryFeesInr: 0,
    paidRegistrations: 0,
    freeRegistrations: 0,
  });
  const [myRegEventIds, setMyRegEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    trackCreatorEvent('events_list_view');
    Promise.all([
      platformApi.getEvents(),
      platformApi.getEventRevenueSummary(),
      user?.id
        ? platformApi.getMyRegistrations(user.id)
        : Promise.resolve({ registrations: [] }),
    ]).then(([ev, rev, mine]) => {
      setEvents(ev.events);
      setRevenue(rev);
      setMyRegEventIds(new Set(mine.registrations.map((r) => r.event_id)));
      setLoading(false);
    });
  }, [user?.id]);

  const openEvents = useMemo(
    () => events.filter((e) => eventAcceptsRegistration(e)),
    [events],
  );
  const otherEvents = useMemo(
    () => events.filter((e) => !eventAcceptsRegistration(e)),
    [events],
  );
  const myEvents = useMemo(
    () => events.filter((e) => myRegEventIds.has(e.id)),
    [events, myRegEventIds],
  );

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="సృజనాత్మక కార్యక్రమాలు · Creator Events"
        eyebrowIcon={Trophy}
        title="Events & Contests"
        subtitle="Register, submit, and grow — free challenges for acquisition, paid contests for prize pools and platform commission (15% escrow default)."
        actions={(
          <Link to="/events/new" className="katha-cta katha-cta--maroon">
            <Plus size={18} aria-hidden />
            Host an event
          </Link>
        )}
      />

      <div className="studio-metrics" role="list" aria-label="Contest economics">
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Sparkles size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{openEvents.length}</span>
            <span className="studio-metric__label">Open to register</span>
          </span>
        </div>
        <div className="studio-metric studio-metric--earnings" role="listitem">
          <span className="studio-metric__icon"><IndianRupee size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">₹{revenue.totalPlatformFeesInr.toLocaleString('en-IN')}</span>
            <span className="studio-metric__label">Platform fees (demo)</span>
          </span>
        </div>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Users size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{revenue.paidRegistrations + revenue.freeRegistrations}</span>
            <span className="studio-metric__label">Your ecosystem regs</span>
          </span>
        </div>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Trophy size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{revenue.freeRegistrations}</span>
            <span className="studio-metric__label">Free (growth) regs</span>
          </span>
        </div>
      </div>

      {loading && <p className="cms-loading cms-loading--inline">Loading events…</p>}

      {!loading && myEvents.length > 0 && (
        <>
          <h2 className="dashboard-panel__title cms-mt-6">Your contests</h2>
          <div className="platform-events-grid" role="list">
            {myEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registered
              />
            ))}
          </div>
        </>
      )}

      {!loading && openEvents.length === 0 && otherEvents.length === 0 && (
        <div className="studio-empty events-empty cms-mt-6">
          <div className="studio-empty__glyph" aria-hidden><Trophy size={32} /></div>
          <h2 className="studio-empty__title">No contests yet</h2>
          <p className="studio-empty__text">
            Host your first event to grow your community, or check back when platform contests open.
          </p>
          <Link to="/events/new" className="katha-cta katha-cta--maroon">Host an event</Link>
        </div>
      )}

      {!loading && openEvents.length > 0 && (
        <>
          <h2 className="dashboard-panel__title cms-mt-6">Open for registration</h2>
          <div className="platform-events-grid" role="list">
            {openEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registered={myRegEventIds.has(event.id)}
              />
            ))}
          </div>
        </>
      )}

      {!loading && otherEvents.length > 0 && (
        <>
          <h2 className="dashboard-panel__title cms-mt-6">Upcoming & closed</h2>
          <div className="platform-events-grid" role="list">
            {otherEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registered={myRegEventIds.has(event.id)}
              />
            ))}
          </div>
        </>
      )}

      <section className="cms-panel platform-roadmap cms-mt-6">
        <h3 className="dashboard-panel__title">How contests make money (research-backed)</h3>
        <ul className="platform-roadmap__list">
          <li><strong>Free First Chapter / sprints</strong> — acquisition & content supply; badge prestige</li>
          <li><strong>Paid genre / festival (₹49–₹999)</strong> — escrow: 15% platform · 10% organizer · tax · prize pool</li>
          <li><strong>Sponsored prize pools</strong> — brands fund prizes; Katha keeps marketplace fee</li>
          <li><strong>Submission → reader funnel</strong> — contest stories feed discovery and subscriptions</li>
        </ul>
      </section>
    </div>
  );
}

function EventCard({ event, registered }: { event: KathaEvent; registered: boolean }) {
  const open = eventAcceptsRegistration(event);
  const free = isAcquisitionEvent(event);
  return (
    <article className="platform-event-card cms-panel" role="listitem">
      <div className="platform-event-card__head">
        <span className="platform-event-card__type">{eventTypeLabel(event.event_type)}</span>
        <span className={`platform-event-card__status platform-event-card__status--${event.status}`}>
          {event.status.replace(/_/g, ' ')}
        </span>
      </div>
      {free && (
        <span className="badge badge-gold" style={{ marginBottom: 8 }}>Growth · Free entry</span>
      )}
      {!free && event.entry_fee_inr > 0 && (
        <span className="badge badge-warning" style={{ marginBottom: 8 }}>Paid · Escrow</span>
      )}
      <h3 className="platform-event-card__title">{event.title}</h3>
      {event.description && <p className="platform-event-card__desc">{event.description}</p>}
      <div className="platform-event-card__meta">
        <span><Users size={14} aria-hidden /> {event.registration_count ?? 0} registered</span>
        <span><Trophy size={14} aria-hidden /> ₹{(event.prize_pool_inr ?? 0).toLocaleString('en-IN')} pool</span>
        <span>
          <Calendar size={14} aria-hidden />{' '}
          {event.entry_fee_inr === 0 ? 'Free entry' : `₹${event.entry_fee_inr} entry`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <Link to={`/events/${event.id}`} className="katha-cta katha-cta--soft platform-event-card__cta">
          {registered ? 'View registration →' : open ? `${registrationCtaLabel(event)} →` : 'View event →'}
        </Link>
      </div>
    </article>
  );
}
