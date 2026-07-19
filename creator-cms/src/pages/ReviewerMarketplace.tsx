import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../lib/platformApi';
import type { PeerReviewRequest } from '../types/platform';
import { AuthorFeedbackInbox } from '../components/reviewers/AuthorFeedbackInbox';
import { ReviewRequestPanel } from '../components/reviewers/ReviewRequestPanel';
import type { AuthorReviewFeedbackBundle } from '../lib/platformStore';
import { ReviewerDashboard } from '../components/reviewers/ReviewerDashboard';
import { ReviewerFeedbackInbox } from '../components/reviewers/ReviewerFeedbackInbox';
import { ReviewerAssignmentsInbox } from '../components/reviewers/ReviewerAssignmentsInbox';
import type { ReviewerFeedbackBundle } from '../types/platform';
import { ReviewerPoolBrowse } from '../components/reviewers/ReviewerPoolBrowse';
import { ReviewerOnboardingPanel } from '../components/reviewers/ReviewerOnboardingPanel';
import { AppealsModerationQueue } from '../components/reviewers/AppealsModerationQueue';
import { OpsEscalationDashboard } from '../components/reviewers/OpsEscalationDashboard';
import { AdvisoryGovernancePanel } from '../components/reviewers/AdvisoryGovernancePanel';
import { AuditLogPanel } from '../components/reviewers/AuditLogPanel';
import { GrievanceOfficerPanel } from '../components/reviewers/GrievanceOfficerPanel';
import { CouncilAdminQueue } from '../components/reviewers/CouncilAdminQueue';
import { ReviewerModerationQueue } from '../components/reviewers/ReviewerModerationQueue';
import { ReviewDevSandboxPanel } from '../components/reviewers/ReviewDevSandboxPanel';
import { CouncilHero } from '../components/reviewers/CouncilHero';
import { LiteraryCouncilPhilosophy } from '../components/reviewers/LiteraryCouncilPhilosophy';
import { useAuth } from '../context/AuthContext';
import { devSeedApplied, isReviewDevSandbox } from '../lib/reviewDevSandbox';
import { trackCreatorEvent } from '../lib/analyticsEvents';
import { useLocale } from '../context/LocaleContext';
import '../styles/reviewer-pool-v2.css';

type PoolView = 'author' | 'reviewer' | 'pool' | 'admin';

/**
 * Reviewer Pool shell — layout matches katha_reviewer_pool_v2 /
 * katha_review_feedback_v2 / katha_reviewer_pool_join_v2 prototypes.
 */
export function ReviewerMarketplace() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const te = locale === 'te';
  const authorId = user?.id || 'anonymous-creator';
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const [view, setView] = useState<PoolView>('reviewer');
  const [requests, setRequests] = useState<PeerReviewRequest[]>([]);
  const [feedbackBundles, setFeedbackBundles] = useState<AuthorReviewFeedbackBundle[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [reviewerFeedbackBundles, setReviewerFeedbackBundles] = useState<ReviewerFeedbackBundle[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const reload = useCallback(() => {
    platformApi.getPeerReviews(authorId).then((r) => setRequests(r.requests));
    platformApi.getAuthorReviewFeedback(authorId).then((r) => setFeedbackBundles(r.bundles));
    platformApi.getLinkedReviewerSlot(user?.id).then((r) => {
      platformApi.getReviewerAssignments(r.slot).then((a) => {
        const invited = a.assignments.filter((x) => x.status === 'invited').length;
        setInboxCount(invited);
      });
      platformApi.getReviewerFeedback(r.slot).then((fb) => setReviewerFeedbackBundles(fb.bundles));
    });
  }, [authorId, user?.id]);

  useEffect(() => {
    trackCreatorEvent('reviewer_pool_view');
    reload();
  }, [reload]);

  useEffect(() => {
    if (!isReviewDevSandbox() || devSeedApplied()) return;
    const t = window.setTimeout(() => {
      platformApi.seedReviewDevScenario(authorId).then(() => reload()).catch(() => { /* manual */ });
    }, 300);
    return () => window.clearTimeout(t);
  }, [authorId, reload]);

  const activeRequests = requests.filter((r) => !['completed', 'cancelled'].includes(r.status));
  const feedbackReadyCount = feedbackBundles.filter(
    (b) => (b.request.structured_comments?.length ?? 0) > 0
      || b.submissions.some((s) => s.review_summary?.overall_review)
      || b.request.reviews_received > 0,
  ).length;

  return (
    <div className="literary-council-sanctuary literary-council-sanctuary--rpv2 wc-page-enter">
      <div className={`rpv2${view === 'pool' ? ' rpv2--wide' : ''}`}>
        <CouncilHero
          inboxCount={inboxCount}
          activeRequests={activeRequests.length}
          feedbackReadyCount={feedbackReadyCount}
          activeView={view}
          isAdmin={isAdmin}
          onAuthorView={() => setView('author')}
          onReviewerView={() => setView('reviewer')}
          onPoolView={() => setView('pool')}
          onAdminView={() => setView('admin')}
        />

        {view === 'author' && (
          <div className="rpv2-author-flow">
            <AuthorFeedbackInbox bundles={feedbackBundles} onResolve={reload} />
            <ReviewRequestPanel onRequested={reload} />
            <button
              type="button"
              className="rpv2-inbox-action"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              style={{ marginTop: '1rem' }}
            >
              {showDetails
                ? (te ? 'దాచు' : 'Hide')
                : (te ? 'రివ్యూయర్ పూల్ గురించి తెలుసుకోండి' : 'Learn about the Reviewer Pool')}
            </button>
            {showDetails && <LiteraryCouncilPhilosophy />}
          </div>
        )}

        {view === 'reviewer' && (
          <div className="rpv2-reviewer-flow">
            <ReviewerDashboard onAction={reload} />
            <ReviewerAssignmentsInbox onAction={reload} />
            {reviewerFeedbackBundles.length > 0 && (
              <ReviewerFeedbackInbox bundles={reviewerFeedbackBundles} onReply={reload} />
            )}
          </div>
        )}

        {view === 'pool' && (
          <div className="rpv2-pool-flow">
            <ReviewerOnboardingPanel />
            <ReviewerPoolBrowse />
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="council-admin-stack">
            <OpsEscalationDashboard onAction={reload} />
            <AdvisoryGovernancePanel />
            <AuditLogPanel />
            <GrievanceOfficerPanel />
            <ReviewerModerationQueue onAction={reload} />
            <AppealsModerationQueue onAction={reload} />
            <CouncilAdminQueue onAction={reload} />
          </div>
        )}

        <ReviewDevSandboxPanel authorId={authorId} onSeeded={reload} />
      </div>
    </div>
  );
}
