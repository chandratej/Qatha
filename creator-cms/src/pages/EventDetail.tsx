import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { platformApi } from '../lib/platformApi';
import type { KathaEvent } from '../types/platform';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { BackLink } from '../components/BackLink';
import {
  EVENT_TYPES, JUDGING_MODELS, SUBMISSION_WORKFLOW_STEPS, ESCROW_RELEASE_CONDITIONS, RUBRIC_DIMENSIONS,
} from '../lib/platformConstants';
import type { EscrowSplitResult } from '../business/escrow';

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<KathaEvent | null>(null);
  const [escrow, setEscrow] = useState<EscrowSplitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    platformApi.getEvent(eventId)
      .then((r) => { setEvent(r.event); setEscrow(r.escrowPreview); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [eventId]);

  if (error) return <div className="cms-page cms-error-text">{error}</div>;
  if (!event) return <p className="cms-loading">Loading event…</p>;

  const typeLabel = EVENT_TYPES.find((t) => t.id === event.event_type)?.label;
  const judgingLabel = JUDGING_MODELS.find((j) => j.id === event.judging_model)?.label;

  return (
    <div className="cms-page studio-page">
      <BackLink to="/events" label="All events" />
      <StudioPageHeader
        title={event.title}
        subtitle={event.description}
      />

      <div className="platform-detail-grid">
        <section className="cms-panel">
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
          {event.status === 'registration_open' && (
            <button type="button" className="katha-cta katha-cta--maroon cms-mt-6">Register &amp; submit</button>
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
          <h3 className="dashboard-panel__title">Escrow preview</h3>
          {escrow && (
            <dl className="platform-dl">
              <dt>Platform commission</dt><dd>₹{escrow.platformInr}</dd>
              <dt>Organizer commission</dt><dd>₹{escrow.organizerInr}</dd>
              <dt>Tax reserve</dt><dd>₹{escrow.taxInr}</dd>
              <dt>Prize pool</dt><dd>₹{escrow.prizePoolInr}</dd>
            </dl>
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