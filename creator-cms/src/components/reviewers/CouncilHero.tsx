import { BookOpenCheck, PenLine, Send, Shield } from 'lucide-react';

type CouncilView = 'author' | 'reviewer' | 'admin';

interface Props {
  inboxCount: number;
  activeRequests: number;
  feedbackReadyCount?: number;
  activeView: CouncilView;
  isAdmin: boolean;
  onAuthorView: () => void;
  onReviewerView: () => void;
  onAdminView: () => void;
}

export function CouncilHero({
  inboxCount,
  activeRequests,
  feedbackReadyCount = 0,
  activeView,
  isAdmin,
  onAuthorView,
  onReviewerView,
  onAdminView,
}: Props) {
  return (
    <section className="council-sanctuary" aria-labelledby="council-hero-title">
      <p className="council-sanctuary__eyebrow">సాహిత్య మండలి</p>
      <h1 id="council-hero-title" className="council-sanctuary__title">
        Read deeply. Reflect kindly. Elevate stories.
      </h1>
      <p className="council-sanctuary__subtitle">
        A sanctuary for literary review — warm parchment, comfortable typography,
        and respectful double-blind craft feedback.
      </p>

      <nav className="council-sanctuary__nav" aria-label="Literary Council">
        <button
          type="button"
          className={`council-sanctuary__nav-btn${activeView === 'reviewer' ? ' council-sanctuary__nav-btn--active' : ''}`}
          onClick={onReviewerView}
        >
          <PenLine size={18} aria-hidden />
          <span className="council-sanctuary__nav-label">Review</span>
          <span className="council-sanctuary__nav-hint">
            {inboxCount > 0 ? `${inboxCount} waiting` : 'Your inbox'}
          </span>
          {inboxCount > 0 && <span className="council-sanctuary__badge">{inboxCount}</span>}
        </button>
        <button
          type="button"
          className={`council-sanctuary__nav-btn${activeView === 'author' ? ' council-sanctuary__nav-btn--active' : ''}`}
          onClick={onAuthorView}
        >
          <Send size={18} aria-hidden />
          <span className="council-sanctuary__nav-label">Request</span>
          <span className="council-sanctuary__nav-hint">
            {feedbackReadyCount > 0
              ? `${feedbackReadyCount} to read`
              : activeRequests > 0
                ? `${activeRequests} active`
                : 'Free community'}
          </span>
          {feedbackReadyCount > 0 && <span className="council-sanctuary__badge">{feedbackReadyCount}</span>}
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`council-sanctuary__nav-btn${activeView === 'admin' ? ' council-sanctuary__nav-btn--active' : ''}`}
            onClick={onAdminView}
          >
            <Shield size={18} aria-hidden />
            <span className="council-sanctuary__nav-label">Admin</span>
          </button>
        )}
      </nav>

      <p className="council-sanctuary__assurance">
        <BookOpenCheck size={14} aria-hidden />
        Professional literary review · not document editing
      </p>
    </section>
  );
}