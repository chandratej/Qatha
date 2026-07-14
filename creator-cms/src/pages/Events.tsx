import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, PenLine, Plus, Sparkles, Trophy, Users, Award, BookOpen, Send, Star,
} from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import type { KathaEvent } from '../types/platform';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import {
  DEBUT_SEASON_EVALUATION_WEIGHTS,
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
import { ChampionshipSpotlight } from '../components/events/ChampionshipSpotlight';
import { ContestLegalPanel } from '../components/events/ContestLegalPanel';
import { StudioEmptyState } from '../components/studio/StudioEmptyState';
import { StudioIllustration } from '../components/studio/StudioIllustration';

function eventTypeLabel(id: string, locale: 'te' | 'en') {
  const match = EVENT_TYPES.find((t) => t.id === id);
  if (!match) return id;
  if (locale === 'te' && 'labelTelugu' in match && match.labelTelugu) {
    return match.labelTelugu as string;
  }
  return match.label;
}

const JOURNEY_STEPS = [
  { id: 'register', icon: Users },
  { id: 'write', icon: PenLine },
  { id: 'submit', icon: Send },
  { id: 'evaluate', icon: Star },
  { id: 'recognition', icon: Award },
] as const;

export function Events() {
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const [events, setEvents] = useState<KathaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRegEventIds, setMyRegEventIds] = useState<Set<string>>(new Set());
  const [maxChapters, setMaxChapters] = useState(0);
  const [championshipEnabled, setChampionshipEnabled] = useState(false);
  const [magazineEnabled, setMagazineEnabled] = useState(false);
  const [debutEnrolled, setDebutEnrolled] = useState(false);
  const [debutGraduated, setDebutGraduated] = useState(false);

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
      setDebutEnrolled(Boolean(debut?.progress?.enrolled));
      setDebutGraduated(Boolean(debut?.progress?.graduated));
      if (debut?.progress?.enrolled && debut.progress.chapter_count > chapters) {
        setMaxChapters(debut.progress.chapter_count);
      }
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

  const debutProgress = debutSeasonProgressPct(maxChapters);
  const journeyLabels = [
    t('events.journeyRegister'),
    t('events.journeyWrite'),
    t('events.journeySubmit'),
    t('events.journeyEvaluate'),
    t('events.journeyRecognition'),
  ];

  return (
    <div className="cms-page studio-page events-studio-page events-studio--wave20 events-studio--wave24 events-studio--wave26 studio-page--calm26 wc-page-enter">
      <StudioPageHeader
        variant="hero"
        eyebrow={t('events.eyebrow')}
        eyebrowIcon={Trophy}
        title={t('events.title')}
        subtitle={t('events.subtitle')}
        actions={mayHost ? (
          <Link to="/events/new" className="katha-cta katha-cta--maroon">
            <Plus size={18} aria-hidden />
            {t('events.hostEvent')}
          </Link>
        ) : undefined}
      />

      <div className="wc-stagger-children">
      <ContestLegalPanel compact />

      <section className="debut-season-hero debut-season-hero--streamlined cms-panel" aria-labelledby="debut-season-title">
        <StudioIllustration id="diya-flame" tone="gold" size={72} className="debut-season-hero__illus" />
        <div className="debut-season-hero__head">
          <div>
            <p className="debut-season-hero__eyebrow katha-token-eyebrow">
              <Sparkles size={16} aria-hidden />
              {t('events.debutSeasonBadge')}
            </p>
            <h2 id="debut-season-title" className="debut-season-hero__title">
              {t('events.debutHeroTitle')}
            </h2>
            <p className="debut-season-hero__subtitle">{t('events.debutHeroSubtitle')}</p>
          </div>
          <div className="debut-season-hero__badge" aria-hidden>
            <Trophy size={24} />
          </div>
        </div>

        <div className="debut-season-hero__progress">
          <div className="debut-season-hero__progress-head">
            <span className="debut-season-hero__progress-label">{t('events.debutProgress')}</span>
            <span className="debut-season-hero__progress-numbers">
              {maxChapters}
              <span className="debut-season-hero__progress-goal">
                {' '}/ {DEBUT_SEASON_REQUIREMENTS.chapterCount} {t('events.debutChapters')}
              </span>
            </span>
          </div>
          <div
            className="debut-season-hero__progress-bar"
            role="progressbar"
            aria-valuenow={debutProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('events.debutProgress')}
          >
            <span
              className="debut-season-hero__progress-fill"
              style={{ width: `${debutProgress}%` }}
            />
          </div>
        </div>

        <div className="debut-season-hero__body">
          <div className="debut-season-journey">
            <h3 className="debut-season-journey__title">{t('events.debutJourney')}</h3>
            <ol className="debut-season-journey__steps">
              {JOURNEY_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <li key={step.id} className="debut-season-journey__step">
                    <span className="debut-season-journey__marker" aria-hidden>
                      <Icon size={14} />
                    </span>
                    <span className="debut-season-journey__label">{journeyLabels[i]}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <details className="debut-season-metrics debut-season-metrics--collapsible">
            <summary>{t('events.debutEvaluation')}</summary>
            <table className="debut-season-metrics__table">
              <thead>
                <tr>
                  <th scope="col">{t('events.dimension')}</th>
                  <th scope="col">{t('events.weight')}</th>
                </tr>
              </thead>
              <tbody>
                {DEBUT_SEASON_EVALUATION_WEIGHTS.map((dim) => (
                  <tr key={dim.id}>
                    <td>{locale === 'te' ? dim.labelTelugu : dim.label}</td>
                    <td>{Math.round(dim.weight * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </section>

      <ChampionshipSpotlight
        championshipEnabled={championshipEnabled}
        magazineEnabled={magazineEnabled}
        debutChapterCount={maxChapters}
        debutChapterGoal={DEBUT_SEASON_REQUIREMENTS.chapterCount}
        debutProgressPct={debutProgress}
        debutGraduated={debutGraduated}
        debutEnrolled={debutEnrolled}
      />

      {!mayHost && (
        <p className="events-host-privilege" role="note">
          <BookOpen size={16} aria-hidden />
          {t('events.hostPrivilege')}
        </p>
      )}

      <div className="studio-metrics events-metrics" role="list" aria-label={t('events.openEvents')}>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Sparkles size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{openEvents.length}</span>
            <span className="studio-metric__label">{t('events.openEvents')}</span>
          </span>
        </div>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Users size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{myEvents.length}</span>
            <span className="studio-metric__label">{t('events.myEvents')}</span>
          </span>
        </div>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Trophy size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{DEBUT_SEASON_REQUIREMENTS.chapterCount}</span>
            <span className="studio-metric__label">
              {t('events.debutArcChapters')}
            </span>
          </span>
        </div>
      </div>

      {loading && <p className="cms-loading cms-loading--inline">{t('common.loading')}</p>}

      {!loading && myEvents.length > 0 && (
        <>
          <h2 className="dashboard-panel__title cms-mt-6">{t('events.myEvents')}</h2>
          <div className="platform-events-grid" role="list">
            {myEvents.map((event) => (
              <EventCard
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

      {!loading && openEvents.length === 0 && otherEvents.length === 0 && (
        <StudioEmptyState
          className="events-empty cms-mt-6"
          icon={Trophy}
          iconSize={32}
          title={t('events.emptyTitle')}
          text={t('events.emptyText')}
          as="h2"
        />
      )}

      {!loading && openEvents.length > 0 && (
        <>
          <h2 className="dashboard-panel__title cms-mt-6">{t('events.openEvents')}</h2>
          <div className="platform-events-grid" role="list">
            {openEvents.map((event) => (
              <EventCard
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

      {!loading && otherEvents.length > 0 && (
        <>
          <h2 className="dashboard-panel__title cms-mt-6">{t('events.upcomingClosed')}</h2>
          <div className="platform-events-grid" role="list">
            {otherEvents.map((event) => (
              <EventCard
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
      </div>
    </div>
  );
}

function EventCard({
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
  const isDebut = event.event_type === 'debut_season';

  let ctaLabel = t('events.viewEvent');
  if (registered) ctaLabel = t('events.viewRegistration');
  else if (open) ctaLabel = registrationCtaLabel(event, locale);

  return (
    <article className={`platform-event-card cms-panel${isDebut ? ' platform-event-card--debut' : ''}`} role="listitem">
      <div className="platform-event-card__head">
        <span className="platform-event-card__type">{eventTypeLabel(event.event_type, locale)}</span>
        <span className={`platform-event-card__status platform-event-card__status--${event.status}`}>
          {event.status.replace(/_/g, ' ')}
        </span>
      </div>

      {isDebut && (
        <span className="platform-event-card__ribbon">
          {t('events.debutSeasonFree')}
        </span>
      )}

      <h3 className="platform-event-card__title">{event.title}</h3>
      {event.description && <p className="platform-event-card__desc">{event.description}</p>}

      <div className="platform-event-card__meta">
        <span>
          <Users size={14} aria-hidden />
          {event.registration_count ?? 0} {t('events.registeredCount')}
        </span>
        <span>
          <Award size={14} aria-hidden />
          {t('events.recognitionPrizes')}
        </span>
        {event.registration_closes_at && (
          <span>
            <Calendar size={14} aria-hidden />
            {t('events.deadline')}:{' '}
            {new Date(event.registration_closes_at).toLocaleDateString(
              locale === 'te' ? 'te-IN' : 'en-IN',
              { day: 'numeric', month: 'short' },
            )}
          </span>
        )}
      </div>

      <Link
        to={`/events/${event.id}`}
        className="katha-cta katha-cta--maroon platform-event-card__cta"
      >
        {ctaLabel} →
      </Link>
    </article>
  );
}