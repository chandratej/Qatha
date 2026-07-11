import { BookOpenCheck, PenLine, Send, Shield, Users } from 'lucide-react';
import { REVIEWER_POOL_BRAND } from '../../lib/reviewerPoolConstants';

type PoolView = 'author' | 'reviewer' | 'pool' | 'admin';

interface Props {
  inboxCount: number;
  activeRequests: number;
  feedbackReadyCount?: number;
  activeView: PoolView;
  isAdmin: boolean;
  onAuthorView: () => void;
  onReviewerView: () => void;
  onPoolView: () => void;
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
  onPoolView,
  onAdminView,
}: Props) {
  const brand = REVIEWER_POOL_BRAND;

  return (
    <section className="council-sanctuary" aria-labelledby="council-hero-title">
      <p className="council-sanctuary__eyebrow">{brand.teluguEyebrow}</p>
      <h1 id="council-hero-title" className="council-sanctuary__title">
        {brand.tagline}
      </h1>
      <p className="council-sanctuary__subtitle">{brand.subtitle}</p>

      <nav className="council-sanctuary__nav" aria-label="Reviewer Pool">
        <button
          type="button"
          className={`council-sanctuary__nav-btn${activeView === 'reviewer' ? ' council-sanctuary__nav-btn--active' : ''}`}
          onClick={onReviewerView}
        >
          <PenLine size={18} aria-hidden />
          <span className="council-sanctuary__nav-label">Review</span>
          <span className="council-sanctuary__nav-hint">
            {inboxCount > 0 ? `${inboxCount} waiting` : 'Dashboard'}
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
                : 'Get feedback'}
          </span>
          {feedbackReadyCount > 0 && <span className="council-sanctuary__badge">{feedbackReadyCount}</span>}
        </button>
        <button
          type="button"
          className={`council-sanctuary__nav-btn${activeView === 'pool' ? ' council-sanctuary__nav-btn--active' : ''}`}
          onClick={onPoolView}
        >
          <Users size={18} aria-hidden />
          <span className="council-sanctuary__nav-label">Pool</span>
          <span className="council-sanctuary__nav-hint">Browse & join</span>
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
        {brand.assurance}
      </p>
    </section>
  );
}