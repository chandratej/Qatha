import { Link } from 'react-router-dom';
import { Calendar, PenLine, Trophy } from 'lucide-react';

interface Props {
  layout?: 'stack' | 'bar';
}

export function QuickActionsPanel({ layout = 'stack' }: Props) {
  if (layout === 'bar') {
    return (
      <nav className="quick-actions-bar" aria-label="Quick actions">
        <Link to="/stories/new" className="quick-actions-bar__primary">
          <PenLine size={17} aria-hidden />
          New story
        </Link>
        <div className="quick-actions-bar__actions">
          <Link to="/schedule" className="quick-actions-bar__action">
            <Calendar size={16} aria-hidden />
            Schedule
          </Link>
          <Link to="/events" className="quick-actions-bar__action">
            <Trophy size={16} aria-hidden />
            Events
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <div className="dashboard-panel dashboard-panel--compact quick-actions-panel">
      <div className="quick-actions-panel__head">
        <h3 className="dashboard-panel__title">Quick actions</h3>
      </div>
      <Link to="/stories/new" className="quick-action-btn quick-action-btn--hero">
        <span className="quick-action-btn__icon" aria-hidden><PenLine size={20} /></span>
        <span className="quick-action-btn__copy">
          <span className="quick-action-btn__title">New story</span>
          <span className="quick-action-btn__hint">Start a fresh manuscript</span>
        </span>
      </Link>
      <div className="quick-actions quick-actions--grid">
        <Link to="/schedule" className="quick-action-btn quick-action-btn--tile">
          <Calendar size={17} aria-hidden />
          <span>Schedule</span>
        </Link>
        <Link to="/events" className="quick-action-btn quick-action-btn--tile">
          <Trophy size={17} aria-hidden />
          <span>Contests</span>
        </Link>
      </div>
    </div>
  );
}