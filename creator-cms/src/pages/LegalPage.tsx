import { Link } from 'react-router-dom';
import { BrandMark } from '../components/studio/BrandMark';
import { STORY_TRUST_LEVELS, BASE_CREATOR_SHARE_PCT } from '../../../packages/shared/story-trust';
import {
  CREATOR_AGREEMENT_VERSION,
  DPDP_PRIVACY_VERSION,
  CREATOR_AGREEMENT_SUMMARY,
} from '../../../packages/shared/creatorAgreement';

/** Public legal + radical transparency page (SPI formula + royalty ladder). */
export function LegalPage() {
  return (
    <div className="cms-auth-page" style={{ minHeight: '100vh', padding: '32px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <BrandMark size="md" ornate label="Katha" />
        </Link>
        <h1 style={{ marginTop: 24 }}>Legal & transparency</h1>
        <p style={{ opacity: 0.8 }}>
          Katha is building the best Telugu serialized-fiction platform — with contracts and
          economics you can actually read.
        </p>

        <section id="grievance" style={{ marginTop: 32 }}>
          <h2>Grievance officer</h2>
          <p>
            <strong>Email:</strong>{' '}
            <a href="mailto:grievance@katha.in">grievance@katha.in</a>
          </p>
          <p>
            Acknowledgment target: 72 hours. Content, account, and payout complaints welcome.
            Designated officer: founding team (named contact published at launch).
          </p>
        </section>

        <section id="privacy" style={{ marginTop: 32 }}>
          <h2>Privacy (DPDP) — {DPDP_PRIVACY_VERSION}</h2>
          <p>
            We collect account, device, reading engagement, and (for creators) payout data only to
            run Katha, process subscriptions via Razorpay, and compute Story Trust / royalties.
            Full policy: see <code>PRD/Legal/PRIVACY_POLICY_v1.md</code> in the product repo and
            in-product consent at signup.
          </p>
        </section>

        <section id="creator-agreement" style={{ marginTop: 32 }}>
          <h2>Creator Agreement — {CREATOR_AGREEMENT_VERSION}</h2>
          <p>{CREATOR_AGREEMENT_SUMMARY}</p>
          <ul>
            <li>You keep IP ownership of your work.</li>
            <li>Katha receives a limited license to host and monetize on the platform.</li>
            <li>No coins, ads, or follower gates for monetization.</li>
            <li>Counsel sign-off required before non-network creator cohorts (Foundations Playbook).</li>
          </ul>
        </section>

        <section id="royalty" style={{ marginTop: 32 }}>
          <h2>Creator share ladder (DEC-006)</h2>
          <p>
            Base share at Performing: <strong>{BASE_CREATOR_SHARE_PCT}%</strong>. Escalates with
            Story Trust — up to 60% at Apex. Snapshot at payment time on the earnings ledger.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr>
                <th align="left">Tier</th>
                <th align="left">Creator share</th>
                <th align="left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {STORY_TRUST_LEVELS.map((level) => (
                <tr key={level.id}>
                  <td>
                    {level.glyph} {level.label}
                  </td>
                  <td>
                    {level.monetizationEligible ? `${level.revenueSharePct}%` : '— (pre-monetization)'}
                  </td>
                  <td>{level.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="spi" style={{ marginTop: 32 }}>
          <h2>Story Trust / SPI formula (DEC-021)</h2>
          <p>
            SPI is a 0–100 score from live chapter analytics — not a vanity badge. Weights:
          </p>
          <ul>
            <li>Reader retention — 35%</li>
            <li>Completion rate — 25%</li>
            <li>Reader satisfaction (completion/scroll proxy until surveys) — 15%</li>
            <li>Reader growth — 10%</li>
            <li>Publishing consistency — 10%</li>
            <li>Policy quality — 5%</li>
          </ul>
          <p>
            Trust level maps from SPI score (and stability window). Monetization eligibility starts
            at <strong>Performing</strong>. Creators can recompute SPI from Analytics in Creator
            Studio.
          </p>
        </section>

        <section id="rbi" style={{ marginTop: 32 }}>
          <h2>Payments stance</h2>
          <p>
            Reader payments settle through Razorpay (licensed PA/PG). Katha does not operate a coin
            wallet. See internal determination{' '}
            <code>PRD/Legal/RBI_PAYOUT_DETERMINATION_v1.md</code> — counsel confirmation required
            before first real creator payout.
          </p>
        </section>

        <p style={{ marginTop: 40 }}>
          <Link to="/login">← Back to Creator Studio</Link>
        </p>
      </div>
    </div>
  );
}
