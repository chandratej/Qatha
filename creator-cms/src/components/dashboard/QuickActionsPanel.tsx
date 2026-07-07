import { Link } from 'react-router-dom';
import { Bot, Calendar, FileUp, PenLine, Sparkles } from 'lucide-react';

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
          <Link to="/stories" className="quick-actions-bar__action">
            <Calendar size={16} aria-hidden />
            Schedule
          </Link>
          <Link to="/stories/new" className="quick-actions-bar__action">
            <FileUp size={16} aria-hidden />
            Import
          </Link>
          <button type="button" className="quick-actions-bar__action quick-actions-bar__action--soon" disabled>
            <Bot size={16} aria-hidden />
            AI assist
            <span className="quick-actions-bar__badge">Soon</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <div className="dashboard-panel dashboard-panel--compact quick-actions-panel">
      <div className="quick-actions-panel__head">
        <h3 className="dashboard-panel__title">Quick actions</h3>
        <Sparkles size={16} className="quick-actions-panel__spark" aria-hidden />
      </div>
      <Link to="/stories/new" className="quick-action-btn quick-action-btn--hero">
        <span className="quick-action-btn__icon" aria-hidden><PenLine size={20} /></span>
        <span className="quick-action-btn__copy">
          <span className="quick-action-btn__title">New story</span>
          <span className="quick-action-btn__hint">Start a fresh manuscript</span>
        </span>
      </Link>
      <div className="quick-actions quick-actions--grid">
        <Link to="/stories" className="quick-action-btn quick-action-btn--tile">
          <Calendar size={17} aria-hidden />
          <span>Schedule</span>
        </Link>
        <Link to="/stories/new" className="quick-action-btn quick-action-btn--tile">
          <FileUp size={17} aria-hidden />
          <span>Import</span>
        </Link>
        <button type="button" className="quick-action-btn quick-action-btn--tile quick-action-btn--soon" disabled>
          <Bot size={17} aria-hidden />
          <span>AI assist</span>
          <span className="quick-action-btn__badge">Soon</span>
        </button>
      </div>
    </div>
  );
}