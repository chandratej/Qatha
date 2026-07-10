import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { BackLink } from '../components/BackLink';
import {
  EVENT_TYPES, EVENT_WIZARD_STEPS, ENTRY_FEE_TIERS_INR, JUDGING_MODELS,
} from '../lib/platformConstants';

export function EventCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('writing_contest');
  const [entryFee, setEntryFee] = useState(0);
  const [judgingModel, setJudgingModel] = useState('weighted_rubric');
  const [prizePool, setPrizePool] = useState(10000);
  const [submitting, setSubmitting] = useState(false);

  const wizardStep = EVENT_WIZARD_STEPS[step];

  const handleNext = () => setStep((s) => Math.min(s + 1, EVENT_WIZARD_STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const { event } = await platformApi.createEvent({
        title,
        description,
        event_type: eventType,
        entry_fee_inr: entryFee,
        judging_model: judgingModel,
        prize_pool_inr: prizePool,
      });
      navigate(`/events/${event.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cms-page studio-page">
      <BackLink to="/events" label="Events" />
      <StudioPageHeader
        title="Create event"
        subtitle="7-step wizard — basic info, eligibility, fees, prizes, judging, timeline, publishing."
      />

      <nav className="platform-wizard-nav" aria-label="Event creation steps">
        {EVENT_WIZARD_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`platform-wizard-nav__step${i === step ? ' platform-wizard-nav__step--active' : ''}${i < step ? ' platform-wizard-nav__step--done' : ''}`}
            onClick={() => setStep(i)}
          >
            {s.order}. {s.label}
          </button>
        ))}
      </nav>

      <div className="cms-panel platform-wizard-panel">
        <h3 className="dashboard-panel__title">{wizardStep?.label}</h3>

        {step === 0 && (
          <div className="cms-form-stack">
            <div className="input-group">
              <label>Event title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="input-group">
              <label>Event type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <p className="studio-page-header__subtitle">Eligibility: Telugu language, author level New+, age rating per event rules. Configure in Phase 2 organizer dashboard.</p>
        )}

        {step === 2 && (
          <div className="input-group">
            <label>Entry fee (INR)</label>
            <select value={entryFee} onChange={(e) => setEntryFee(Number(e.target.value))}>
              {ENTRY_FEE_TIERS_INR.map((fee) => (
                <option key={fee} value={fee}>{fee === 0 ? 'Free' : `₹${fee}`}</option>
              ))}
            </select>
            <span className="input-hint">Paid contests require Verified Organizer level.</span>
          </div>
        )}

        {step === 3 && (
          <div className="input-group">
            <label>Prize pool (INR)</label>
            <input type="number" min={0} value={prizePool} onChange={(e) => setPrizePool(Number(e.target.value))} />
          </div>
        )}

        {step === 4 && (
          <div className="input-group">
            <label>Judging model</label>
            <select value={judgingModel} onChange={(e) => setJudgingModel(e.target.value)}>
              {JUDGING_MODELS.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
            </select>
          </div>
        )}

        {step === 5 && (
          <p className="studio-page-header__subtitle">Timeline: registration → submissions → judging → appeal window → winner confirmation. Set dates in organizer dashboard after publish.</p>
        )}

        {step === 6 && (
          <p className="studio-page-header__subtitle">Review and publish. Event enters draft until you open registration.</p>
        )}

        <div className="platform-wizard-actions">
          {step > 0 && <button type="button" className="btn btn-secondary" onClick={handleBack}>Back</button>}
          {step < EVENT_WIZARD_STEPS.length - 1 ? (
            <button type="button" className="katha-cta katha-cta--maroon" onClick={handleNext}>Continue</button>
          ) : (
            <button type="button" className="katha-cta katha-cta--maroon" onClick={handlePublish} disabled={submitting || !title.trim()}>
              {submitting ? 'Publishing…' : 'Publish event draft'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}