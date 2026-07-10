import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { KathaEvent } from '../../types/platform';
import { eventAcceptsRegistration, registrationCtaLabel } from '../../business/eventRegistration';
import { useAuth } from '../../context/AuthContext';

export function EventsSpotlight() {
  const { user } = useAuth();
  const [openEvents, setOpenEvents] = useState<KathaEvent[]>([]);
  const [myRegIds, setMyRegIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      platformApi.getEvents(),
      user?.id
        ? platformApi.getMyRegistrations(user.id)
        : Promise.resolve({ registrations: [] }),
    ])
      .then(([ev, mine]) => {
        const open = ev.events.filter((e) => eventAcceptsRegistration(e));
        setOpenEvents(open.slice(0, 2));
        setMyRegIds(new Set(mine.registrations.map((r) => r.event_id)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const featured = useMemo(
    () => openEvents.find((e) => !myRegIds.has(e.id)) ?? openEvents[0],
    [openEvents, myRegIds],
  );

  if (loading || openEvents.length === 0) return null;

  return (
    <section className="dashboard-panel events-spotlight" aria-labelledby="events-spotlight-title">
      <div className="events-spotlight__head">
        <Trophy size={18} aria-hidden className="events-spotlight__icon" />
        <div>
          <h3 id="events-spotlight-title" className="dashboard-panel__title">Open contests</h3>
          <p className="events-spotlight__sub">
            {openEvents.length} event{openEvents.length === 1 ? '' : 's'} accepting entries
          </p>
        </div>
        <Link to="/events" className="events-spotlight__all">
          All events <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      {featured && (
        <Link to={`/events/${featured.id}`} className="events-spotlight__card">
          <span className="events-spotlight__card-eyebrow">
            {featured.entry_fee_inr === 0 ? 'Free · Growth' : `₹${featured.entry_fee_inr} · Escrow`}
          </span>
          <span className="events-spotlight__card-title">{featured.title}</span>
          <span className="events-spotlight__card-meta">
            ₹{(featured.prize_pool_inr ?? 0).toLocaleString('en-IN')} prize pool
          </span>
          <span className="events-spotlight__card-cta">
            {myRegIds.has(featured.id) ? 'View registration' : registrationCtaLabel(featured)}
          </span>
        </Link>
      )}
    </section>
  );
}