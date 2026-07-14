import { useMemo, useState } from 'react';
import { AlertCircle, Award, Calendar, Check, Send, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import { BackLink } from '../components/BackLink';
import {
  EVENT_TYPES, EVENT_WIZARD_STEPS, JUDGING_MODELS, EVENT_PRIZE_TIERS,
} from '../lib/platformConstants';
import { useLocale } from '../context/LocaleContext';
import type { StudioStringKey } from '../lib/studioLocale';
import { useAuth } from '../context/AuthContext';
import { canHostEvent, hostEligibilityMessage } from '../lib/hostEventEligibility';
import { ContestLegalPanel } from '../components/events/ContestLegalPanel';
import { LegalApprovalQueuePanel } from '../components/events/LegalApprovalQueuePanel';

const FREE_ENTRY_INR = 0;

const WIZARD_STEP_KEYS: Record<string, StudioStringKey> = {
  basic: 'events.wizardStepBasic',
  eligibility: 'events.wizardStepEligibility',
  registration: 'events.wizardStepRegistration',
  prizes: 'events.wizardStepPrizes',
  judging: 'events.wizardStepJudging',
  timeline: 'events.wizardStepTimeline',
  publishing: 'events.wizardStepPublishing',
};

export function EventCreate() {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const mayHost = canHostEvent(user);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('debut_season');
  const [judgingModel, setJudgingModel] = useState('weighted_rubric');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = EVENT_WIZARD_STEPS.length;
  const wizardStep = EVENT_WIZARD_STEPS[step];
  const canAdvance = step !== 0 || title.trim().length > 0;
  const progressPct = useMemo(
    () => ((step + 1) / totalSteps) * 100,
    [step, totalSteps],
  );

  const stepLabel = (id: string) => {
    const key = WIZARD_STEP_KEYS[id];
    return key ? t(key) : id;
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handlePublish = async () => {
    if (!title.trim()) {
      setError(t('events.titleRequired'));
      setStep(0);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { event } = await platformApi.createEvent({
        title: title.trim(),
        description: description.trim(),
        event_type: eventType,
        entry_fee_inr: FREE_ENTRY_INR,
        judging_model: judgingModel,
        prize_pool_inr: 0,
        open_registration: true,
        status: 'registration_open',
      });
      navigate(`/events/${event.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg === 'LEGAL_APPROVAL_REQUIRED' ? t('events.legalApprovalRequired') : (msg || 'Could not publish event'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!mayHost) {
    return (
      <div className="cms-page studio-page event-create-page event-create-page--premium">
        <BackLink to="/events" label={t('events.title')} />
        <div className="cms-panel events-host-blocked events-host-blocked--premium">
          <Sparkles size={24} aria-hidden className="events-host-blocked__icon" />
          <h2 className="dashboard-panel__title">{t('events.hostBlockedTitle')}</h2>
          <p className="studio-page-header__subtitle">{hostEligibilityMessage(locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-page studio-page event-create-page event-create-page--premium event-create-page--wave23 event-create-page--wave28 studio-page--calm26 wc-page-enter">
      <BackLink to="/events" label={t('events.title')} />
      <StudioPageHeader
        variant="hero"
        title={t('events.createTitle')}
        subtitle={t('events.createSubtitle')}
        eyebrow={t('events.wizardEyebrow')}
        eyebrowIcon={Award}
      />

      <div className="event-wizard event-wizard--streamlined">
        <div className="event-wizard__meta">
          <span className="event-wizard__step-count">
            {step + 1} / {totalSteps}
          </span>
        </div>
        <div
          className="event-wizard__progress"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={t('events.wizardStepsLabel')}
        >
          <div className="event-wizard__progress-bar wc-progress-delight" style={{ width: `${progressPct}%` }} />
        </div>

        {error && (
          <div className="cms-panel cms-panel--flat event-status-banner event-status-banner--error" role="alert">
            <p className="event-status-banner__text">
              <AlertCircle size={18} aria-hidden className="event-status-banner__icon" />
              <span>{error}</span>
            </p>
          </div>
        )}

        <div className="event-wizard__layout">
          <aside className="event-wizard__sidebar">
            <nav aria-label={t('events.wizardStepsLabel')}>
              <ol className="event-wizard__steps">
                {EVENT_WIZARD_STEPS.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`event-wizard__step-btn${i === step ? ' event-wizard__step-btn--active' : ''}${i < step ? ' event-wizard__step-btn--done' : ''}`}
                      onClick={() => setStep(i)}
                      aria-current={i === step ? 'step' : undefined}
                    >
                      <span className="event-wizard__step-index" aria-hidden>
                        {i < step ? <Check size={14} strokeWidth={3} /> : s.order}
                      </span>
                      <span className="event-wizard__step-label">{stepLabel(s.id)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="event-wizard__panel">
            <h3 className="event-wizard__panel-title">
              {stepLabel(wizardStep?.id ?? 'basic')}
            </h3>

            <div className={`event-wizard__body${step === 1 || step === 5 || step === 6 ? ' event-wizard__body--dense' : ''}`}>
              {step === 0 && (
                <div className="cms-form-stack">
                  <div className="input-group">
                    <label>{t('events.eventTitle')}</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('events.titlePlaceholder')}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>{t('events.description')}</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder={t('events.descriptionPlaceholder')}
                    />
                  </div>
                  <div className="input-group">
                    <label>{t('events.eventType')}</label>
                    <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                      {EVENT_TYPES.map((et) => (
                        <option key={et.id} value={et.id}>
                          {locale === 'te' && 'labelTelugu' in et && et.labelTelugu
                            ? et.labelTelugu
                            : et.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="event-wizard__info-card">
                  <span className="event-wizard__info-card__icon" aria-hidden><Users size={20} /></span>
                  <p className="studio-page-header__subtitle">{t('events.eligibilityDesc')}</p>
                </div>
              )}

              {step === 2 && (
                <>
                  <ContestLegalPanel />
                  <div className="event-create-free-entry event-create-free-entry--premium">
                    <p className="event-create-free-entry__badge">{t('events.freeEntry')}</p>
                    <p className="studio-page-header__subtitle">{t('events.registrationDesc')}</p>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                <ContestLegalPanel compact />
                <ul className="event-prize-tier-list event-prize-tier-list--premium event-prize-tier-list--compact">
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
                </>
              )}

              {step === 4 && (
                <div className="input-group">
                  <label>{t('events.judgingModel')}</label>
                  <select value={judgingModel} onChange={(e) => setJudgingModel(e.target.value)}>
                    {JUDGING_MODELS.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
                  </select>
                </div>
              )}

              {step === 5 && (
                <div className="event-wizard__info-card">
                  <span className="event-wizard__info-card__icon" aria-hidden><Calendar size={20} /></span>
                  <p className="studio-page-header__subtitle">{t('events.timelineDesc')}</p>
                </div>
              )}

              {step === 6 && (
                <>
                  <ContestLegalPanel compact />
                  <LegalApprovalQueuePanel />
                  <div className="event-wizard__info-card">
                    <span className="event-wizard__info-card__icon" aria-hidden><Send size={20} /></span>
                    <p className="studio-page-header__subtitle">{t('events.publishingDesc')}</p>
                  </div>
                </>
              )}
            </div>

            <div className="event-wizard__actions">
              {step > 0 ? (
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  {t('common.back')}
                </button>
              ) : (
                <span aria-hidden />
              )}
              <div className="event-wizard__actions-end">
                {step < totalSteps - 1 ? (
                  <button
                    type="button"
                    className="katha-cta katha-cta--maroon"
                    onClick={handleNext}
                    disabled={!canAdvance}
                  >
                    {t('common.next')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="katha-cta katha-cta--maroon"
                    onClick={() => { void handlePublish(); }}
                    disabled={submitting || !title.trim()}
                  >
                    {submitting ? t('events.openingRegistration') : t('events.publishOpen')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}