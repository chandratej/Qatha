import { useCallback, useEffect, useState } from 'react';
import { BookOpenCheck, Clock, Shield, Users } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import {
  REVIEWER_ROLES, REVIEW_DECISIONS, REVIEWER_REPUTATION_TIERS, REVIEW_PACKAGE, BETA_READER_MODES,
} from '../lib/platformConstants';
import type { PeerReviewRequest } from '../types/platform';
import { ReviewRequestPanel } from '../components/reviewers/ReviewRequestPanel';
import { useAuth } from '../context/AuthContext';
import { trackCreatorEvent } from '../lib/analyticsEvents';

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

  const [requests, setRequests] = useState<PeerReviewRequest[]>([]);
  const [payoutEach, setPayoutEach] = useState(0);
  const [poolAvailable, setPoolAvailable] = useState(0);
  const [poolTotal, setPoolTotal] = useState(0);

  const reload = useCallback(() => {
    platformApi.getPeerReviews(authorId).then((r) => setRequests(r.requests));
    platformApi.getReviewerMarketplace().then((r) => {
      setPayoutEach(r.payoutEach);
      setPoolAvailable(r.poolSummary.available);
      setPoolTotal(r.poolSummary.total);
    });
  }, [authorId]);

  useEffect(() => {
    trackCreatorEvent('reviewer_marketplace_view');
    reload();
  }, [reload]);

  const activeRequests = requests.filter((r) => !['completed', 'cancelled'].includes(r.status));

  return (
    <div className="cms-page studio-page reviewer-marketplace-page">
      <StudioPageHeader
        eyebrow="సమీక్షకుల మార్కెట్ · Reviewer marketplace"
        eyebrowIcon={BookOpenCheck}
        title="Peer review marketplace"
        subtitle="Anonymous matching — three reviewers, majority decision, equal payouts. Purchase premium packages or queue volunteer beta reads before publication."
      />

      <div className="studio-metrics" role="list" aria-label="Reviewer pool metrics">
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Users size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{poolAvailable}</span>
            <span className="studio-metric__label">Available now</span>
          </span>
        </div>
        <div className="studio-metric" role="listitem">
          <span className="studio-metric__icon"><Shield size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">{poolTotal}</span>
            <span className="studio-metric__label">Pool capacity</span>
          </span>
        </div>
        <div className="studio-metric studio-metric--earnings" role="listitem">
          <span className="studio-metric__icon"><BookOpenCheck size={18} aria-hidden /></span>
          <span>
            <span className="studio-metric__value">₹{payoutEach}</span>
            <span className="studio-metric__label">Per reviewer @ ₹{REVIEW_PACKAGE.minFeeInr}</span>
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

        <div className="platform-detail-grid reviewer-marketplace-grid">
          <section className="cms-panel">
            <h3 className="dashboard-panel__title">Review package</h3>
            <dl className="platform-dl">
              <dt>Author fee</dt><dd>₹{REVIEW_PACKAGE.minFeeInr}–₹{REVIEW_PACKAGE.maxFeeInr}</dd>
              <dt>Reviewers</dt><dd>{REVIEW_PACKAGE.reviewerCount} (anonymous)</dd>
              <dt>Platform commission</dt><dd>{REVIEW_PACKAGE.platformCommissionPct}%</dd>
              <dt>Each reviewer earns</dt><dd>₹{payoutEach}</dd>
              <dt>Decision rule</dt><dd>Majority of 3</dd>
            </dl>
          </section>

          <section className="cms-panel">
            <h3 className="dashboard-panel__title">Your review requests</h3>
            {requests.length === 0 ? (
              <p className="input-hint">No requests yet — choose a manuscript above to get anonymous peer feedback.</p>
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
                      {r.mode === 'volunteer' ? 'Volunteer' : `₹${r.package_fee_inr}`}
                      {' · '}
                      {r.reviews_received}/{REVIEW_PACKAGE.reviewerCount} reviews in
                      {' · '}
                      {r.reviewers_matched} matched
                      {r.created_at ? ` · ${formatDate(r.created_at)}` : ''}
                    </p>
                    {r.preferred_roles.length > 0 && (
                      <div className="review-role-chips review-role-chips--readonly">
                        {r.preferred_roles.map((roleId) => {
                          const label = REVIEWER_ROLES.find((x) => x.id === roleId)?.label ?? roleId;
                          return <span key={roleId} className="studio-chip">{label}</span>;
                        })}
                      </div>
                    )}
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
            <h3 className="dashboard-panel__title">Reviewer specializations</h3>
            <ul className="platform-chip-list">
              {REVIEWER_ROLES.map((r) => <li key={r.id} className="studio-chip">{r.label}</li>)}
            </ul>
          </section>

          <section className="cms-panel">
            <h3 className="dashboard-panel__title">Decisions (majority wins)</h3>
            <ul className="platform-chip-list">
              {REVIEW_DECISIONS.map((d) => <li key={d.id} className="studio-chip studio-chip--streak">{d.label}</li>)}
            </ul>
          </section>

          <section className="cms-panel">
            <h3 className="dashboard-panel__title">Reputation tiers</h3>
            <ul className="platform-rubric">
              {REVIEWER_REPUTATION_TIERS.map((t) => (
                <li key={t.id}><span>{t.label}</span><span>≥{t.minScore}</span></li>
              ))}
            </ul>
          </section>

          <section className="cms-panel">
            <h3 className="dashboard-panel__title">Beta reader marketplace</h3>
            <p className="studio-page-header__subtitle">Volunteer or paid beta readers before publication.</p>
            <div className="platform-chip-list">
              {BETA_READER_MODES.map((m: string) => <span key={m} className="studio-chip">{m}</span>)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}