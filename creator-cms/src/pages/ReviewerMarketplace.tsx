import { useEffect, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { StudioPageHeader } from '../components/studio/StudioPageHeader';
import {
  REVIEWER_ROLES, REVIEW_DECISIONS, REVIEWER_REPUTATION_TIERS, REVIEW_PACKAGE, BETA_READER_MODES,
} from '../lib/platformConstants';
import type { PeerReviewRequest } from '../types/platform';

export function ReviewerMarketplace() {
  const [requests, setRequests] = useState<PeerReviewRequest[]>([]);
  const [payoutEach, setPayoutEach] = useState(0);

  useEffect(() => {
    platformApi.getPeerReviews().then((r) => setRequests(r.requests));
    platformApi.getReviewerMarketplace().then((r) => setPayoutEach(r.payoutEach));
  }, []);

  return (
    <div className="cms-page studio-page">
      <StudioPageHeader
        eyebrow="సమీక్షకుల మార్కెట్ · Reviewer marketplace"
        eyebrowIcon={BookOpenCheck}
        title="Peer review marketplace"
        subtitle="Anonymous matching — three reviewers, majority decision, equal payouts. Authors optionally purchase premium review packages."
      />

      <div className="platform-detail-grid">
        <section className="cms-panel">
          <h3 className="dashboard-panel__title">Review package</h3>
          <dl className="platform-dl">
            <dt>Author fee</dt><dd>₹{REVIEW_PACKAGE.minFeeInr}–₹{REVIEW_PACKAGE.maxFeeInr}</dd>
            <dt>Reviewers</dt><dd>{REVIEW_PACKAGE.reviewerCount} (anonymous)</dd>
            <dt>Platform commission</dt><dd>{REVIEW_PACKAGE.platformCommissionPct}%</dd>
            <dt>Each reviewer earns</dt><dd>₹{payoutEach}</dd>
          </dl>
          <button type="button" className="katha-cta katha-cta--maroon cms-mt-6">Request premium review</button>
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

        <section className="cms-panel">
          <h3 className="dashboard-panel__title">Your review requests</h3>
          {requests.length === 0 ? (
            <p className="input-hint">No active requests.</p>
          ) : (
            <ul className="platform-review-list">
              {requests.map((r) => (
                <li key={r.id}>
                  <strong>{r.story_title}</strong>
                  <span>₹{r.package_fee_inr} · {r.reviews_received}/3 reviews · {r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}