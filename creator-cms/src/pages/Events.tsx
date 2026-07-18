import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, Flame, Lock, Plus, Scale, Trophy, Users, Award,
} from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import type { KathaEvent } from '../types/platform';
import {
  DEBUT_SEASON_REQUIREMENTS,
  EVENT_TYPES,
} from '../lib/platformConstants';
import {
  eventAcceptsRegistration,
  registrationCtaLabel,
} from '../business/eventRegistration';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { canHostEvent } from '../lib/hostEventEligibility';
import { debutSeasonProgressPct } from '../lib/eventEligibility';
import { api } from '../lib/api';
import { StudioEmptyState } from '../components/studio/StudioEmptyState';

function eventTypeLabel(id: string, locale: 'te' | 'en') {
  const match = EVENT_TYPES.find((t) => t.id === id);
  if (!match) return id;
  if (locale === 'te' && 'labelTelugu' in match && match.labelTelugu) {
    return match.labelTelugu as string;
  }
  return match.label;
}

export function Events() {
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const [events, setEvents] = useState<KathaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRegEventIds, setMyRegEventIds] = useState<Set<string>>(new Set());
  const [maxChapters, setMaxChapters] = useState(0);
  const [championshipEnabled, setChampionshipEnabled] = useState(false);
  const [magazineEnabled, setMagazineEnabled] = useState(false);

  const mayHost = canHostEvent(user);

  useEffect(() => {
    trackCreatorEvent('events_list_view');
    Promise.all([
      platformApi.getEvents(),
      user?.id
        ? platformApi.getMyRegistrations(user.id)
        : Promise.resolve({ registrations: [] }),
      api.getCreatorStories().catch(() => ({ stories: [] })),
      api.getFounderOsConfig().catch(() => null),
      api.getDebutSeasonProgress().catch(() => ({ progress: { enrolled: false, chapter_count: 0, graduated: false } })),
    ]).then(([ev, mine, stories, founderOs, debut]) => {
      setEvents(ev.events);
      setMyRegEventIds(new Set(mine.registrations.map((r) => r.event_id)));
      const chapters = (stories.stories ?? []).reduce(
        (max, s) => Math.max(max, s.chapter_count ?? 0),
        0,
      );
      setMaxChapters(chapters);
      const features = founderOs?.config?.features;
      setChampionshipEnabled(Boolean(features?.championship_ecosystem?.enabled));
      setMagazineEnabled(Boolean(features?.premium_magazine?.enabled));
      if (debut?.progress?.enrolled && debut.progress.chapter_count > chapters) {
        setMaxChapters(debut.progress.chapter_count);
      }
      setLoading(false);
    });
  }, [user?.id]);

  const openEvents = useMemo(
    () => events.filter((e) => eventAcceptsRegistration(e) && !myRegEventIds.has(e.id)),
    [events, myRegEventIds],
  );
  const otherEvents = useMemo(
    () => events.filter((e) => !eventAcceptsRegistration(e)),
    [events],
  );
  const myEvents = useMemo(
    () => events.filter((e) => myRegEventIds.has(e.id)),
    [events, myRegEventIds],
  );

  const debutProgress = debutSeasonProgressPct(maxChapters);
  const lockedFeatures = !championshipEnabled && !magazineEnabled;

  return (
    <div className="sv21 sv21--events">
      <p className="sv21__eyebrow">
        <Trophy size={14} aria-hidden />
        {t('events.eyebrow')}
      </p>
      <h1 className="sv21__title">{t('events.title')}</h1>
      <p className="sv21__subtitle">{t('events.subtitle')}</p>

      {mayHost && (
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/events/new" className="sv21__cta">
            <Plus size={16} aria-hidden />
            {t('events.hostEvent')}
          </Link>
        </div>
      )}

      <div className="sv21__progress-strip">
        <div className="sv21__progress-strip__left">
          <div className="sv21__progress-strip__icon">
            <Flame size={18} aria-hidden />
          </div>
          <div>
            <p className="sv21__streak-label">{t('events.debutProgress')}</p>
            <p className="sv21__streak-value">
              {maxChapters} / {DEBUT_SEASON_REQUIREMENTS.chapterCount} {t('events.debutChapters')}
            </p>
          </div>
        </div>
        <div
          className="sv21__progress-track"
          style={{ maxWidth: 260 }}
          role="progressbar"
          aria-valuenow={debutProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="sv21__progress-fill" style={{ width: `${debutProgress}%` }} />
        </div>
        <p className="sv21__progress-strip__note">{t('events.recognitionOnly')}</p>
      </div>

      <div className="sv21__compliance">
        <Scale size={15} aria-hidden />
        <span>{t('events.complianceNote')}</span>
      </div>

      {loading && <p className="sv21__loading">{t('common.loading')}</p>}

      {!loading && myEvents.length > 0 && (
        <>
          <div className="sv21__section-head sv21__section-head--lg">
            <h3>{t('events.myEvents')}</h3>
            <span className="sv21__count">{myEvents.length}</span>
          </div>
          <div className="sv21__events-grid">
            {myEvents.map((event) => (
              <EventCardV21
                key={event.id}
                event={event}
                registered
                locale={locale}
                t={t}
              />
            ))}
          </div>
        </>
      )}

      {!loading && openEvents.length === 0 && otherEvents.length === 0 && myEvents.length === 0 && (
        <StudioEmptyState
          icon={Trophy}
          iconSize={32}
          title={t('events.emptyTitle')}
          text={t('events.emptyText')}
          as="h2"
        />
      )}

      {!loading && openEvents.length > 0 && (
        <>
          <div className="sv21__section-head sv21__section-head--lg">
            <h3>{t('events.openEvents')}</h3>
            <span className="sv21__count">{openEvents.length}</span>
          </div>
          <div className="sv21__events-grid">
            {openEvents.map((event) => (
              <EventCardV21
                key={event.id}
                event={event}
                registered={false}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        </>
      )}

      {!loading && otherEvents.length > 0 && (
        <>
          <div className="sv21__section-head sv21__section-head--lg">
            <h3>{t('events.upcomingClosed')}</h3>
            <span className="sv21__count">{otherEvents.length}</span>
          </div>
          <div className="sv21__events-grid">
            {otherEvents.map((event) => (
              <EventCardV21
                key={event.id}
                event={event}
                registered={myRegEventIds.has(event.id)}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        </>
      )}

      {lockedFeatures && (
        <div className="sv21__locked">
          <Lock size={16} aria-hidden />
          <span>{t('events.lockedFeaturesNote')}</span>
        </div>
      )}
    </div>
  );
}

function EventCardV21({
  event,
  registered,
  locale,
  t,
}: {
  event: KathaEvent;
  registered: boolean;
  locale: 'te' | 'en';
  t: (key: import('../lib/studioLocale').StudioStringKey) => string;
}) {
  const open = eventAcceptsRegistration(event);

  let ctaLabel = t('events.viewEvent');
  if (registered) ctaLabel = t('events.viewRegistration');
  else if (open) ctaLabel = registrationCtaLabel(event, locale);

  const statusClass = registered
    ? 'sv21__badge sv21__badge--registered'
    : open
      ? 'sv21__badge sv21__badge--open'
      : 'sv21__badge sv21__badge--draft';

  const statusText = registered
    ? t('events.registeredStatus')
    : open
      ? t('events.openRegistration')
      : event.status.replace(/_/g, ' ');

  return (
    <article className="sv21__event-card">
      <div className="sv21__event-card__head">
        <span className="sv21__event-type">{eventTypeLabel(event.event_type, locale)}</span>
        <span className={statusClass}>{statusText}</span>
      </div>
      <h3 className="sv21__event-title">{event.title}</h3>
      {event.description && <p className="sv21__event-desc">{event.description}</p>}
      <div className="sv21__event-meta">
        <span>
          <Users size={13} aria-hidden />
          {event.registration_count ?? 0} {t('events.registeredCount')}
        </span>
        <span>
          <Award size={13} aria-hidden />
          {t('events.recognitionPrizes')}
        </span>
        {event.registration_closes_at && (
          <span>
            <Calendar size={13} aria-hidden />
            {new Date(event.registration_closes_at).toLocaleDateString(
              locale === 'te' ? 'te-IN' : 'en-IN',
              { day: 'numeric', month: 'short' },
            )}
          </span>
        )}
      </div>
      <Link to={`/events/${event.id}`} className="sv21__event-cta">
        {ctaLabel}
        <ArrowRight size={14} aria-hidden />
      </Link>
    </article>
  );
}