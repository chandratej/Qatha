import { useCallback, useEffect, useState } from 'react';
import { BookOpenCheck, Clock, Shield, Users } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import {
  PROFESSIONAL_REVIEW_ROLES,
  GENRE_SPECIALIZATIONS,
  REVIEW_DECISIONS,
  REVIEW_PACKAGE,
  RQI_WEIGHTS,
  LITERARY_COUNCIL_PHILOSOPHY,
} from '../lib/platformConstants';
import type { PeerReviewRequest } from '../types/platform';
import { ReviewRequestPanel } from '../components/reviewers/ReviewRequestPanel';
import { LiteraryCouncilPhilosophy } from '../components/reviewers/LiteraryCouncilPhilosophy';
import { AuthorReviewDashboard } from '../components/reviewers/AuthorReviewDashboard';
import { ReviewerAssignmentsInbox } from '../components/reviewers/ReviewerAssignmentsInbox';
import { CouncilAdminQueue } from '../components/reviewers/CouncilAdminQueue';
import { useAuth } from '../context/AuthContext';
import { trackCreatorEvent } from '../lib/analyticsEvents';

type CouncilView = 'author' | 'reviewer' | 'admin';

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function ReviewerMarketplace() {
  const { user } = useAuth();
  const authorId = user?.id || 'anonymous-creator';
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const [view, setView] = useState<CouncilView>('author');
  const [requests, setRequests] = useState<PeerReviewRequest[]>([]);
  const [payoutEach, setPayoutEach] = useState(0);
  const [poolAvailable, setPoolAvailable] = useState(0);
  const [avgRqi, setAvgRqi] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);

  const reload = useCallback(() => {
    platformApi.getPeerReviews(authorId).then((r) => setRequests(r.requests));
    platformApi.getReviewerMarketplace().then((r) => {
      setPayoutEach(r.payoutEach);
      setPoolAvailable(r.poolSummary.available);
      setAvgRqi(r.poolSummary.avgRqi ?? 0);
    });
    platformApi.getLinkedReviewerSlot(user?.id).then((r) =>
      platformApi.getReviewerAssignments(r.slot).then((a) => {
        setInboxCount(a.assignments.filter((x) => x.status === 'invited').length);
      }),
    );
  }, [authorId, user?.id]);

  useEffect(() => {
    trackCreatorEvent('literary_council_view');
    reload();
  }, [reload]);

  const activeRequests = requests.filter((r) => !['completed', 'cancelled'].includes(r.status));

  return (
    <div className="cms-page studio-page reviewer-marketplace-page literary-council-page">
      <StudioPageHeader
        eyebrow="సాహిత్య మండలి · Katha Literary Council"
        eyebrowIcon={BookOpenCheck}
        title="Professional Review Ecosystem"
        subtitle={LITERARY_COUNCIL_PHILOSOPHY.subline}
      />

      <nav className="council-view-tabs" aria-label="Literary Council views">
        <button
          type="button"
          className={`council-view-tabs__tab${view === 'author' ? ' council-view-tabs__tab--active' : ''}`}
          onClick={() => setView('author')}
        >
          Author · my requests
        </button>
        <button
          type="button"
          className={`council-view-tabs__tab${view === 'reviewer' ? ' council-view-tabs__tab--active' : ''}`}
          onClick={() => setView('reviewer')}
        >
          Reviewer inbox
          {inboxCount > 0 && <span className="council-view-tabs__badge">{inboxCount}</span>}
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`council-view-tabs__tab${view === 'admin' ? ' council-view-tabs__tab--active' : ''}`}
            onClick={() => setView('admin')}
          >
            Admin audit queue
          </button>
        )}
      </nav>

      {view === 'author' && (
        <>
          <LiteraryCouncilPhilosophy />

          <div className="studio-metrics" role="list" aria-label="Literary Council metrics">
            <div className="studio-metric" role="listitem">
              <span className="studio-metric__icon"><Users size={18} aria-hidden /></span>
              <span>
                <span className="studio-metric__value">{poolAvailable}</span>
                <span className="studio-metric__label">Reviewers available</span>
              </span>
            </div>
            <div className="studio-metric" role="listitem">
              <span className="studio-metric__icon"><Shield size={18} aria-hidden /></span>
              <span>
                <span className="studio-metric__value">{avgRqi}</span>
                <span className="studio-metric__label">Pool avg RQI</span>
              </span>
            </div>
            <div className="studio-metric studio-metric--earnings" role="listitem">
              <span className="studio-metric__icon"><BookOpenCheck size={18} aria-hidden /></span>
              <span>
                <span className="studio-metric__value">₹{payoutEach}</span>
                <span className="studio-metric__label">Reviewer earn @ ₹{REVIEW_PACKAGE.minFeeInr}</span>
              </span>
            </div>
            <div className="studio-metric" role="listitem">
              <span className="studio-metric__icon"><Clock size={18} aria-hidden /></span>
              <span>
                <span className="studio-metric__value">{activeRequests.length}</span>
                <span className="studio-metric__label">Your active requests</span>
              </span>
            </div>
          </div>

          <div className="reviewer-marketplace-layout">
            <ReviewRequestPanel onRequested={reload} />
            <AuthorReviewDashboard requests={requests} />

            <div className="platform-detail-grid reviewer-marketplace-grid">
              <section className="cms-panel">
                <h3 className="dashboard-panel__title">Your review requests (sent)</h3>
                {requests.length === 0 ? (
                  <p className="input-hint">No requests yet — community reviews are free; professional reviews require Story Trust.</p>
                ) : (
                  <ul className="platform-review-list review-request-list">
                    {requests.map((r) => (
                      <li key={r.id} className="review-request-item">
                        <div className="review-request-item__head">
                          <strong>{r.story_title}</strong>
                          <span className={`review-status review-status--${r.status}`}>
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <p className="input-hint review-request-item__meta">
                          {PROFESSIONAL_REVIEW_ROLES.find((x) => x.id === r.professional_role)?.label ?? r.professional_role}
                          {' · '}
                          {GENRE_SPECIALIZATIONS.find((g) => g.id === r.story_genre)?.label ?? r.story_genre}
                          {' · '}
                          {r.mode === 'volunteer' ? 'Community' : `₹${r.package_fee_inr} escrow`}
                          {r.matching_avg_score ? ` · match ${r.matching_avg_score}%` : ''}
                          {r.created_at ? ` · ${formatDate(r.created_at)}` : ''}
                        </p>
                        <div className="review-progress-bar" aria-hidden>
                          <span
                            className="review-progress-bar__fill"
                            style={{ width: `${Math.round((r.reviews_received / REVIEW_PACKAGE.reviewerCount) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="cms-panel">
                <h3 className="dashboard-panel__title">Professional roles</h3>
                <ul className="platform-review-list">
                  {PROFESSIONAL_REVIEW_ROLES.map((r) => (
                    <li key={r.id}>
                      <strong>{r.label}</strong>
                      <span className="input-hint">{r.dimensions.join(' · ').replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="cms-panel">
                <h3 className="dashboard-panel__title">Review Quality Index (RQI)</h3>
                <ul className="platform-rubric">
                  <li><span>Accepted suggestions</span><span>{RQI_WEIGHTS.acceptedSuggestionsPct}%</span></li>
                  <li><span>Story improvement</span><span>{RQI_WEIGHTS.storyImprovementScorePct}%</span></li>
                  <li><span>Reader retention</span><span>{RQI_WEIGHTS.readerRetentionImprovementPct}%</span></li>
                </ul>
              </section>

              <section className="cms-panel">
                <h3 className="dashboard-panel__title">Consensus decisions</h3>
                <ul className="platform-chip-list">
                  {REVIEW_DECISIONS.map((d) => <li key={d.id} className="studio-chip studio-chip--streak">{d.label}</li>)}
                </ul>
              </section>
            </div>
          </div>
        </>
      )}

      {view === 'reviewer' && (
        <ReviewerAssignmentsInbox onAction={reload} />
      )}

      {view === 'admin' && isAdmin && (
        <CouncilAdminQueue onAction={reload} />
      )}
    </div>
  );
}