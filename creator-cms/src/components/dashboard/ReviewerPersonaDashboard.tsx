import { useNavigate } from 'react-router-dom';
import { Inbox, PenLine, Users } from 'lucide-react';
import { ReviewerDashboard } from '../reviewers/ReviewerDashboard';
import { PERSONA_LABELS } from '../../../../packages/shared/creator-persona';

interface Props {
  displayName: string;
}

export function ReviewerPersonaDashboard({ displayName }: Props) {
  const navigate = useNavigate();
  const personaLabel = PERSONA_LABELS.reviewer;

  return (
    <div className="reviewer-persona-dashboard">
      <header className="reviewer-persona-dashboard__hero">
        <p className="reviewer-persona-dashboard__eyebrow" lang="te">{personaLabel.labelTelugu}</p>
        <h2 className="reviewer-persona-dashboard__title">
          {displayName}, your {personaLabel.label} studio
        </h2>
        <p className="input-hint">
          Your assignments, council standing, and review queue — everything you need to serve authors well.
        </p>
        <div className="reviewer-persona-dashboard__actions">
          <button type="button" className="katha-cta katha-cta--maroon" onClick={() => navigate('/reviewers')}>
            <Inbox size={16} aria-hidden /> Open Reviewer Pool
          </button>
          <button type="button" className="katha-cta katha-cta--soft" onClick={() => navigate('/stories')}>
            <PenLine size={16} aria-hidden /> My stories
          </button>
        </div>
      </header>

      <ReviewerDashboard onAction={() => { /* stats refresh */ }} />

      <div className="reviewer-persona-dashboard__tip cms-panel">
        <Users size={16} aria-hidden />
        <p className="input-hint">
          Authors still trust you with their manuscripts. Keep turnaround within the 7-day SLA to grow your RQI.
        </p>
      </div>
    </div>
  );
}