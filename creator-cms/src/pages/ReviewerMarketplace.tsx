import { useCallback, useEffect, useState } from 'react';
import { platformApi } from '../lib/platformApi';
import type { PeerReviewRequest } from '../types/platform';
import { AuthorFeedbackInbox } from '../components/reviewers/AuthorFeedbackInbox';
import { ReviewRequestPanel } from '../components/reviewers/ReviewRequestPanel';
import type { AuthorReviewFeedbackBundle } from '../lib/platformStore';
import { ReviewerAssignmentsInbox } from '../components/reviewers/ReviewerAssignmentsInbox';
import { CouncilAdminQueue } from '../components/reviewers/CouncilAdminQueue';
import { ReviewDevSandboxPanel } from '../components/reviewers/ReviewDevSandboxPanel';
import { CouncilHero } from '../components/reviewers/CouncilHero';
import { LiteraryCouncilPhilosophy } from '../components/reviewers/LiteraryCouncilPhilosophy';
import { useAuth } from '../context/AuthContext';
import { devSeedApplied, isReviewDevSandbox } from '../lib/reviewDevSandbox';
import { trackCreatorEvent } from '../lib/analyticsEvents';

type CouncilView = 'author' | 'reviewer' | 'admin';

export function ReviewerMarketplace() {
  const { user } = useAuth();
  const authorId = user?.id || 'anonymous-creator';
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const [view, setView] = useState<CouncilView>('reviewer');
  const [requests, setRequests] = useState<PeerReviewRequest[]>([]);
  const [feedbackBundles, setFeedbackBundles] = useState<AuthorReviewFeedbackBundle[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const reload = useCallback(() => {
    platformApi.getPeerReviews(authorId).then((r) => setRequests(r.requests));
    platformApi.getAuthorReviewFeedback(authorId).then((r) => setFeedbackBundles(r.bundles));
    platformApi.getLinkedReviewerSlot(user?.id).then((r) =>
      platformApi.getReviewerAssignments(r.slot).then((a) => {
        const invited = a.assignments.filter((x) => x.status === 'invited').length;
        setInboxCount(invited);
      }),
    );
  }, [authorId, user?.id]);

  useEffect(() => {
    trackCreatorEvent('literary_council_view');
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
    <div className="literary-council-sanctuary">
      <CouncilHero
        inboxCount={inboxCount}
        activeRequests={activeRequests.length}
        feedbackReadyCount={feedbackReadyCount}
        activeView={view}
        isAdmin={isAdmin}
        onAuthorView={() => setView('author')}
        onReviewerView={() => setView('reviewer')}
        onAdminView={() => setView('admin')}
      />

      <div className="literary-council-sanctuary__content">
        {view === 'author' && (
          <div className="council-author-flow">
            <AuthorFeedbackInbox bundles={feedbackBundles} />
            <ReviewRequestPanel onRequested={reload} />
            <button
              type="button"
              className="council-learn-more"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
            >
              {showDetails ? 'Hide' : 'Learn about'} the Literary Council
            </button>
            {showDetails && <LiteraryCouncilPhilosophy />}
          </div>
        )}

        {view === 'reviewer' && (
          <ReviewerAssignmentsInbox onAction={reload} />
        )}

        {view === 'admin' && isAdmin && (
          <CouncilAdminQueue onAction={reload} />
        )}
      </div>

      <ReviewDevSandboxPanel authorId={authorId} onSeeded={reload} />
    </div>
  );
}