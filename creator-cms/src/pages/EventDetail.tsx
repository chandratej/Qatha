import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle, Award, Calendar, CheckCircle2, Lock, Trophy, Upload,
} from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import type { EventRegistration, KathaEvent } from '../types/platform';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { BackLink } from '../components/BackLink';
import {
  EVENT_TYPES,
  EVENT_PRIZE_TIERS,
  JUDGING_MODELS,
  RUBRIC_DIMENSIONS,
  DEBUT_SEASON_EVALUATION_WEIGHTS,
} from '../lib/platformConstants';
import {
  eventAcceptsRegistration,
  eventAcceptsSubmission,
  registrationCtaLabel,
} from '../business/eventRegistration';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { api } from '../lib/api';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { buildEventProgress, formatEventDeadline } from '../business/eventProgress';
import { EventProgressStepper } from '../components/events/EventProgressStepper';
import {
  validateStoryEligibilityForEvent,
  type ContestStoryInput,
} from '../lib/eventEligibility';
import type { StoryData } from '../types/database';
import type { CompetitionRulesDocument } from '../../../packages/shared/competitionRules';
import {
  CURRENT_COMPETITION_RULES_VERSION,
  DEFAULT_COMPETITION_RULES_V1,
} from '../../../packages/shared/competitionRules';

function tentativeResultsDate(event: KathaEvent): string | null {
  if (event.results_announced_at) {
    return formatEventDeadline(event.results_announced_at);
  }
  if (event.submissions_close_at) {
    const close = Date.parse(event.submissions_close_at);
    if (Number.isFinite(close)) {
      const tentative = new Date(close + 14 * 24 * 60 * 60 * 1000);
      return formatEventDeadline(tentative.toISOString());
    }
  }
  return null;
}

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const participantId = user?.id || 'anonymous-creator';
  const participantName = user?.display_name || 'Creator';

  const [event, setEvent] = useState<KathaEvent | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [stories, setStories] = useState<ContestStoryInput[]>([]);
  const [storyId, setStoryId] = useState('');
  const [rules, setRules] = useState<CompetitionRulesDocument>(DEFAULT_COMPETITION_RULES_V1);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const reload = useCallback(async () => {
    if (!eventId) return;
    const r = await platformApi.getEvent(eventId);
    setEvent(r.event);
    const mine = await platformApi.getMyRegistration(eventId, participantId);
    setRegistration(mine.registration);
  }, [eventId, participantId]);

  useEffect(() => {
    if (!eventId) return;
    reload().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [eventId, reload]);

  useEffect(() => {
    platformApi.getCompetitionRules()
      .then((r) => setRules(r.rules))
      .catch(() => setRules(DEFAULT_COMPETITION_RULES_V1));
  }, []);

  useEffect(() => {
    api.getCreatorStories()
      .then((r) => {
        const list = (r.stories || []).map(storyToContestInput);
        setStories(list);
        if (list[0]) setStoryId(list[0].id);
      })
      .catch(() => setStories([]));
  }, []);

  const selectedStory = useMemo(
    () => stories.find((s) => s.id === storyId) ?? null,
    [stories, storyId],
  );

  const eligibility = useMemo(() => {
    if (!event || !selectedStory) return null;
    return validateStoryEligibilityForEvent(selectedStory, event.event_type, locale);
  }, [event, selectedStory, locale]);

  const canRegister = useMemo(
    () => (event ? eventAcceptsRegistration(event) && !registration : false),
    [event, registration],
  );
  const canSubmit = useMemo(
    () => (event && registration
      ? eventAcceptsSubmission(event)
        && (registration.payment_status === 'paid' || registration.payment_status === 'waived')
      : false),
    [event, registration],
  );

  const handleRegister = async () => {
    if (!eventId || !event) return;
    if (!rulesAccepted) {
      setError(t('events.rulesMustAccept'));
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    setError(null);
    try {
      const result = await platformApi.registerForEvent({
        eventId,
        participantId,
        participantName,
        markPaid: true,
        rulesVersion: rules.version ?? CURRENT_COMPETITION_RULES_VERSION,
        rulesAccepted: true,
      });
      setRegistration(result.registration);
      setEvent(result.event);
      trackCreatorEvent('event_registered', {
        event_id: eventId,
        entry_fee: 0,
        payment_status: result.registration.payment_status,
        already: result.alreadyRegistered,
      });
      setStatusMsg(
        result.alreadyRegistered
          ? t('events.alreadyRegistered')
          : t('events.registrationComplete'),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventId || !storyId || !event) return;
    const story = stories.find((s) => s.id === storyId);
    if (!story) {
      setError(t('events.chooseStoryError'));
      return;
    }
    const check = validateStoryEligibilityForEvent(story, event.event_type, locale);
    if (!check.eligible) {
      setError(check.reasons[0] ?? t('events.eligibilityBlocked'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await platformApi.submitToEvent({
        eventId,
        participantId,
        storyId: story.id,
        storyTitle: story.title,
      });
      if (result.registration) setRegistration(result.registration);
      trackCreatorEvent('event_submission', { event_id: eventId, story_id: story.id });
      setStatusMsg(`“${story.title}” ${t('events.submittedFor')}.`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  if (error && !event) return <div className="cms-page cms-error-text">{error}</div>;
  if (!event) return <p className="cms-loading">{t('common.loading')}</p>;

  const typeMatch = EVENT_TYPES.find((et) => et.id === event.event_type);
  const typeLabel = locale === 'te' && typeMatch && 'labelTelugu' in typeMatch
    ? (typeMatch.labelTelugu as string)
    : typeMatch?.label;
  const judgingLabel = JUDGING_MODELS.find((j) => j.id === event.judging_model)?.label;
  const progressSteps = buildEventProgress(event, registration);
  const regDeadline = formatEventDeadline(event.registration_closes_at);
  const subDeadline = formatEventDeadline(event.submissions_close_at);
  const resultsDate = tentativeResultsDate(event);
  const rubric = event.event_type === 'debut_season'
    ? DEBUT_SEASON_EVALUATION_WEIGHTS
    : RUBRIC_DIMENSIONS;
  const isDebut = event.event_type === 'debut_season';

  return (
    <div className="cms-page studio-page event-detail-page event-detail-page--premium">
      <BackLink to="/events" label={t('events.title')} />
      <StudioPageHeader
        title={event.title}
        subtitle={event.description}
        eyebrow={isDebut ? t('events.debutSeasonEyebrow') : t('events.creativeContest')}
        eyebrowIcon={Trophy}
      />

      <EventProgressStepper steps={progressSteps} />

      {(regDeadline || subDeadline || resultsDate) && (
        <div className="event-deadlines" role="group" aria-label={t('events.deadline')}>
          {regDeadline && (
            <span className="event-deadline">
              <Calendar size={14} aria-hidden />
              {t('events.registrationCloses')} {regDeadline}
            </span>
          )}
          {subDeadline && (
            <span className="event-deadline">
              <Calendar size={14} aria-hidden />
              {t('events.submissionsClose')} {subDeadline}
            </span>
          )}
          {resultsDate && (
            <span className="event-deadline event-deadline--results">
              <Award size={14} aria-hidden />
              {t('events.resultsDate')}: {resultsDate}
            </span>
          )}
        </div>
      )}

      {statusMsg && (
        <div className="cms-panel cms-panel--flat event-status-banner" role="status">
          <p className="event-status-banner__text">
            <CheckCircle2 size={18} aria-hidden className="event-status-banner__icon" />
            <span>{statusMsg}</span>
          </p>
        </div>
      )}
      {error && <p className="cms-error-text" role="alert">{error}</p>}

      <div className="platform-detail-grid">
        <section className="cms-panel event-detail-primary">
          <h3 className="dashboard-panel__title">{t('events.eventDetails')}</h3>
          <dl className="platform-dl">
            <dt>{t('events.type')}</dt><dd>{typeLabel}</dd>
            <dt>{t('events.status')}</dt><dd>{formatEventStatus(event.status, t)}</dd>
            <dt>{t('events.judging')}</dt><dd>{judgingLabel}</dd>
            <dt>{t('events.entry')}</dt><dd>{t('events.freeEntry')}</dd>
            <dt>{t('events.registeredCount')}</dt><dd>{event.registration_count ?? 0}</dd>
            <dt>{t('events.submissions')}</dt><dd>{event.submission_count ?? 0}</dd>
          </dl>

          {registration ? (
            <div className="event-registration-card cms-mt-6">
              <p className="event-registration-card__badge">
                <CheckCircle2 size={16} aria-hidden /> {t('events.registered')}
              </p>
              {registration.story_title && (
                <p className="input-hint event-registration-card__submitted">
                  {t('events.submittedStory')}:{' '}
                  <strong>{registration.story_title}</strong>
                </p>
              )}
            </div>
          ) : canRegister ? (
            <div className="event-register-box cms-mt-6">
              <CompetitionRulesPanel rules={rules} locale={locale} t={t} />
              <label className="event-rules-accept reviewer-onboarding__agreement cms-mt-6">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                />
                <span>
                  {locale === 'te' ? rules.summaryTelugu : rules.summary}
                  {' '}
                  <span className="input-hint">
                    ({t('events.rulesVersion')}: {rules.version})
                  </span>
                </span>
              </label>
              <button
                type="button"
                className="katha-cta katha-cta--maroon cms-mt-6"
                disabled={busy || !rulesAccepted}
                onClick={() => { void handleRegister(); }}
              >
                {busy ? t('events.registering') : registrationCtaLabel(event, locale)}
              </button>
              {!rulesAccepted && (
                <p className="input-hint cms-mt-6" role="note">{t('events.rulesMustAccept')}</p>
              )}
              <p className="input-hint cms-mt-6">{t('events.freeRegistrationHint')}</p>
            </div>
          ) : (
            <p className="input-hint cms-mt-6">
              <Lock size={14} aria-hidden style={{ verticalAlign: 'middle' }} />{' '}
              {t('events.registrationClosed')}
            </p>
          )}

          {canSubmit && !registration?.story_id && (
            <div className="event-submit-box cms-mt-6">
              <h4 className="dashboard-panel__title event-submit-box__title">
                <Upload size={16} aria-hidden /> {t('events.submit')}
              </h4>
              {stories.length === 0 ? (
                <p className="input-hint">
                  {t('events.noStories')}{' '}
                  <Link to="/stories/new">{t('events.createManuscript')}</Link>
                </p>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="event-story">{t('events.selectStory')}</label>
                    <select
                      id="event-story"
                      className="cms-select"
                      value={storyId}
                      onChange={(e) => setStoryId(e.target.value)}
                    >
                      {stories.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  {eligibility && !eligibility.eligible && (
                    <div className="event-eligibility-block event-eligibility-panel--premium" role="alert">
                      <p className="event-eligibility-block__title">
                        <AlertCircle size={16} aria-hidden />
                        {t('events.eligibilityBlocked')}
                      </p>
                      <ul className="event-eligibility-block__list">
                        {eligibility.reasons.map((r) => <li key={r}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {eligibility && eligibility.warnings.length > 0 && (
                    <ul className="event-eligibility-warnings">
                      {eligibility.warnings.map((w) => <li key={w}>{w}</li>)}
                    </ul>
                  )}

                  <button
                    type="button"
                    className="katha-cta katha-cta--maroon"
                    disabled={busy || !storyId || (eligibility != null && !eligibility.eligible)}
                    onClick={() => { void handleSubmit(); }}
                  >
                    {busy ? t('events.submitting') : t('events.submit')}
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        <section className="cms-panel event-prize-tiers event-prize-tiers--premium">
          <h3 className="dashboard-panel__title">
            <Award size={16} aria-hidden /> {t('events.recognitionPrizes')}
          </h3>
          <ul className="event-prize-tier-list event-prize-tier-list--premium">
            {EVENT_PRIZE_TIERS.map((tier) => (
              <li key={tier.id} className="event-prize-tier event-prize-tier--premium">
                <div className="event-prize-tier__head">
                  <span className="event-prize-tier__rank">{tier.rank}</span>
                  <strong>{locale === 'te' ? tier.labelTelugu : tier.label}</strong>
                </div>
                <ul className="event-prize-tier__recognition">
                  {(locale === 'te' ? tier.recognitionTelugu : tier.recognition).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="cms-panel">
          <h3 className="dashboard-panel__title">{t('events.evaluationRubric')}</h3>
          <ul className="platform-rubric">
            {rubric.map((d) => (
              <li key={d.id}>
                <span>{locale === 'te' && 'labelTelugu' in d ? d.labelTelugu : d.label}</span>
                <span>{Math.round(d.weight * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function formatEventStatus(
  status: string,
  t: (key: import('../lib/studioLocale').StudioStringKey) => string,
): string {
  const map: Record<string, import('../lib/studioLocale').StudioStringKey> = {
    registration_open: 'events.statusRegistrationOpen',
    submissions_open: 'events.statusSubmissionsOpen',
    published: 'events.statusPublished',
    judging: 'events.statusJudging',
    completed: 'events.statusCompleted',
    draft: 'events.statusDraft',
    cancelled: 'events.statusCancelled',
  };
  const key = map[status];
  return key ? t(key) : status.replace(/_/g, ' ');
}

function CompetitionRulesPanel({
  rules,
  locale,
  t,
}: {
  rules: CompetitionRulesDocument;
  locale: 'te' | 'en';
  t: (key: import('../lib/studioLocale').StudioStringKey) => string;
}) {
  const isTe = locale === 'te';
  const eligibilityNotes = isTe ? rules.eligibility.notesTelugu : rules.eligibility.notes;

  return (
    <section className="event-rules-panel cms-panel cms-panel--flat" aria-labelledby="event-rules-title">
      <h4 id="event-rules-title" className="dashboard-panel__title">
        {t('events.rulesTitle')}
        <span className="input-hint"> ({rules.version})</span>
      </h4>

      <div className="event-rules-panel__grid">
        <div>
          <h5 className="event-rules-panel__heading">{t('events.rulesEligibility')}</h5>
          <ul className="event-rules-panel__list">
            {eligibilityNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </div>

        <div>
          <h5 className="event-rules-panel__heading">{t('events.rulesJudging')}</h5>
          <p className="input-hint">
            {isTe ? rules.judging.modelLabelTelugu : rules.judging.modelLabel}
            {' — '}
            {isTe ? rules.judging.rubricSummaryTelugu : rules.judging.rubricSummary}
          </p>
        </div>

        <div>
          <h5 className="event-rules-panel__heading">{t('events.rulesPrizes')}</h5>
          <p className="input-hint">{t('events.rulesRecognitionOnly')}</p>
          <ul className="event-rules-panel__list">
            {rules.prizes.tiers.slice(0, 3).map((tier) => (
              <li key={tier.id}>
                <strong>{isTe ? tier.labelTelugu : tier.label}</strong>
                {' — '}
                {(isTe ? tier.recognitionTelugu : tier.recognition).join(', ')}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="event-rules-panel__heading">{t('events.rulesTimeline')}</h5>
          <ol className="event-rules-panel__list event-rules-panel__list--ordered">
            {rules.timeline.phases.map((phase) => (
              <li key={phase.id}>
                <strong>{isTe ? phase.labelTelugu : phase.label}</strong>
                {' — '}
                {isTe ? phase.descriptionTelugu : phase.description}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function storyToContestInput(story: StoryData): ContestStoryInput {
  return {
    id: story.id,
    title: story.title,
    chapter_count: story.chapter_count ?? 0,
    moderation_status: story.moderation_status,
    is_published: story.is_published,
    content_type: (story as StoryData & { content_type?: string }).content_type,
    story_status: (story as StoryData & { story_status?: string }).story_status,
    language: (story as StoryData & { language?: string }).language,
  };
}