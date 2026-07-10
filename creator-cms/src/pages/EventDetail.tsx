import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, IndianRupee, Lock, Trophy, Upload } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import type { EventRegistration, KathaEvent } from '../types/platform';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { BackLink } from '../components/BackLink';
import {
  EVENT_TYPES, JUDGING_MODELS, SUBMISSION_WORKFLOW_STEPS, ESCROW_RELEASE_CONDITIONS, RUBRIC_DIMENSIONS,
} from '../lib/platformConstants';
import type { EscrowSplitResult } from '../business/escrow';
import {
  eventAcceptsRegistration,
  eventAcceptsSubmission,
  isAcquisitionEvent,
  registrationCtaLabel,
} from '../business/eventRegistration';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { buildEventProgress, formatEventDeadline } from '../business/eventProgress';
import { EventProgressStepper } from '../components/events/EventProgressStepper';

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const participantId = user?.id || 'anonymous-creator';
  const participantName = user?.display_name || 'Creator';

  const [event, setEvent] = useState<KathaEvent | null>(null);
  const [escrow, setEscrow] = useState<EscrowSplitResult | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [stories, setStories] = useState<Array<{ id: string; title: string }>>([]);
  const [storyId, setStoryId] = useState('');

  const reload = useCallback(async () => {
    if (!eventId) return;
    const r = await platformApi.getEvent(eventId);
    setEvent(r.event);
    setEscrow(r.escrowPreview);
    const mine = await platformApi.getMyRegistration(eventId, participantId);
    setRegistration(mine.registration);
  }, [eventId, participantId]);

  useEffect(() => {
    if (!eventId) return;
    reload().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [eventId, reload]);

  useEffect(() => {
    api.getCreatorStories()
      .then((r) => {
        const list = (r.stories || []).map((s) => ({ id: s.id, title: s.title }));
        setStories(list);
        if (list[0]) setStoryId(list[0].id);
      })
      .catch(() => setStories([]));
  }, []);

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
    setBusy(true);
    setStatusMsg(null);
    setError(null);
    try {
      // Paid path: demo checkout confirms immediately (Razorpay wires same pattern as subscriptions)
      const result = await platformApi.registerForEvent({
        eventId,
        participantId,
        participantName,
        markPaid: true,
      });
      setRegistration(result.registration);
      setEvent(result.event);
      trackCreatorEvent('event_registered', {
        event_id: eventId,
        entry_fee: event.entry_fee_inr,
        payment_status: result.registration.payment_status,
        platform_fee: result.registration.platform_fee_inr,
        already: result.alreadyRegistered,
      });
      setStatusMsg(
        result.alreadyRegistered
          ? 'You are already registered for this event.'
          : event.entry_fee_inr > 0
            ? `Registered! ₹${event.entry_fee_inr} entry locked in escrow (platform commission applied).`
            : 'Registered free — submit your manuscript when ready.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventId || !storyId) return;
    const story = stories.find((s) => s.id === storyId);
    if (!story) {
      setError('Choose a story from your library');
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
      setRegistration(result.registration);
      trackCreatorEvent('event_submission', { event_id: eventId, story_id: story.id });
      setStatusMsg(`Submitted “${story.title}” for judging. Validation pending.`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  if (error && !event) return <div className="cms-page cms-error-text">{error}</div>;
  if (!event) return <p className="cms-loading">Loading event…</p>;

  const typeLabel = EVENT_TYPES.find((t) => t.id === event.event_type)?.label;
  const judgingLabel = JUDGING_MODELS.find((j) => j.id === event.judging_model)?.label;
  const acquisition = isAcquisitionEvent(event);
  const progressSteps = buildEventProgress(event, registration);
  const regDeadline = formatEventDeadline(event.registration_closes_at);
  const subDeadline = formatEventDeadline(event.submissions_close_at);

  return (
    <div className="cms-page studio-page event-detail-page">
      <BackLink to="/events" label="All events" />
      <StudioPageHeader
        title={event.title}
        subtitle={event.description}
        eyebrow={acquisition ? 'Free growth contest' : 'Paid contest · Escrow protected'}
        eyebrowIcon={Trophy}
      />

      <EventProgressStepper steps={progressSteps} />

      {(regDeadline || subDeadline) && (
        <div className="event-deadlines" role="group" aria-label="Important dates">
          {regDeadline && (
            <span className="event-deadline">
              <Calendar size={14} aria-hidden />
              Registration closes {regDeadline}
            </span>
          )}
          {subDeadline && (
            <span className="event-deadline">
              <Calendar size={14} aria-hidden />
              Submissions close {subDeadline}
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
          <h3 className="dashboard-panel__title">Event details</h3>
          <dl className="platform-dl">
            <dt>Type</dt><dd>{typeLabel}</dd>
            <dt>Status</dt><dd>{event.status.replace(/_/g, ' ')}</dd>
            <dt>Judging</dt><dd>{judgingLabel}</dd>
            <dt>Entry fee</dt><dd>{event.entry_fee_inr === 0 ? 'Free' : `₹${event.entry_fee_inr}`}</dd>
            <dt>Prize pool</dt><dd>₹{event.prize_pool_inr.toLocaleString('en-IN')}</dd>
            <dt>Registered</dt><dd>{event.registration_count ?? 0}</dd>
            <dt>Submissions</dt><dd>{event.submission_count ?? 0}</dd>
          </dl>

          {registration ? (
            <div className="event-registration-card cms-mt-6">
              <p className="event-registration-card__badge">
                <CheckCircle2 size={16} aria-hidden /> You&apos;re registered
              </p>
              <p className="input-hint">
                Payment: {registration.payment_status}
                {registration.platform_fee_inr
                  ? ` · Platform fee ₹${registration.platform_fee_inr}`
                  : ''}
              </p>
              {registration.story_title && (
                <p className="input-hint event-registration-card__submitted">
                  Submitted: <strong>{registration.story_title}</strong> — judging in progress
                </p>
              )}
            </div>
          ) : canRegister ? (
            <div className="event-register-box cms-mt-6">
              {event.entry_fee_inr > 0 && escrow && (
                <p className="input-hint" style={{ marginBottom: 12 }}>
                  Your ₹{event.entry_fee_inr} splits: platform ₹{escrow.platformInr} · organizer ₹{escrow.organizerInr} · tax ₹{escrow.taxInr} · prize ₹{escrow.prizePoolInr}
                </p>
              )}
              <button
                type="button"
                className="katha-cta katha-cta--maroon"
                disabled={busy}
                onClick={() => { void handleRegister(); }}
              >
                {busy ? 'Registering…' : registrationCtaLabel(event)}
              </button>
              <p className="input-hint cms-mt-6">
                {event.entry_fee_inr > 0
                  ? 'Paid entry is held in escrow until winners are confirmed (fair contest finance).'
                  : 'Free entry grows the creator network — paid contests fund prize pools and platform operations.'}
              </p>
            </div>
          ) : (
            <p className="input-hint cms-mt-6">
              <Lock size={14} aria-hidden style={{ verticalAlign: 'middle' }} /> Registration closed for this event.
            </p>
          )}

          {canSubmit && !registration?.story_id && (
            <div className="event-submit-box cms-mt-6">
              <h4 className="dashboard-panel__title event-submit-box__title">
                <Upload size={16} aria-hidden /> Submit your story
              </h4>
              {stories.length === 0 ? (
                <p className="input-hint">
                  No stories yet.{' '}
                  <Link to="/stories/new">Create a manuscript</Link> then return to submit.
                </p>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="event-story">Story from your library</label>
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
                  <button
                    type="button"
                    className="katha-cta"
                    disabled={busy || !storyId}
                    onClick={() => { void handleSubmit(); }}
                  >
                    {busy ? 'Submitting…' : 'Submit for judging'}
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        <section className="cms-panel">
          <h3 className="dashboard-panel__title">Submission workflow</h3>
          <ol className="platform-workflow">
            {SUBMISSION_WORKFLOW_STEPS.map((step) => (
              <li key={step}>{step.replace(/_/g, ' ')}</li>
            ))}
          </ol>
        </section>

        <section className="cms-panel">
          <h3 className="dashboard-panel__title">
            <IndianRupee size={16} aria-hidden /> Escrow preview
          </h3>
          {escrow && event.entry_fee_inr > 0 ? (
            <dl className="platform-dl">
              <dt>Platform commission</dt><dd>₹{escrow.platformInr}</dd>
              <dt>Organizer commission</dt><dd>₹{escrow.organizerInr}</dd>
              <dt>Tax reserve</dt><dd>₹{escrow.taxInr}</dd>
              <dt>Prize pool</dt><dd>₹{escrow.prizePoolInr}</dd>
            </dl>
          ) : (
            <p className="input-hint">Free event — no entry fee. Platform gains discovery &amp; content supply; sponsors fund prizes.</p>
          )}
          <p className="input-hint">Funds locked until: {ESCROW_RELEASE_CONDITIONS.join(', ')}</p>
        </section>

        <section className="cms-panel">
          <h3 className="dashboard-panel__title">Judging rubric</h3>
          <ul className="platform-rubric">
            {RUBRIC_DIMENSIONS.map((d) => (
              <li key={d.id}><span>{d.label}</span><span>{Math.round(d.weight * 100)}%</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
