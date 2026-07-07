import { Link } from 'react-router-dom';
import { Bot, Calendar, FileUp, PenLine } from 'lucide-react';

export function QuickActionsPanel() {
  return (
    <div className="dashboard-panel dashboard-panel--compact">
      <h3 className="dashboard-panel__title">Quick Actions</h3>
      <div className="quick-actions quick-actions--grid">
        <Link to="/stories/new" className="quick-action-btn quick-action-btn--primary"><PenLine size={18} aria-hidden /> New Story</Link>
        <Link to="/stories" className="quick-action-btn"><Calendar size={18} aria-hidden /> Schedule Chapter</Link>
        <Link to="/stories/new" className="quick-action-btn"><FileUp size={18} aria-hidden /> Import Manuscript</Link>
        <button type="button" className="quick-action-btn quick-action-btn--soon" disabled><Bot size={18} aria-hidden /> AI Assistant <span className="quick-action-btn__badge">Soon</span></button>
      </div>
    </div>
  );
}