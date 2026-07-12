import { Shield } from 'lucide-react';

/**
 * Legal & Trust Council — Foundations §1.4 grievance officer contact.
 * Publish before public launch; interim founder contact.
 */
const GRIEVANCE_EMAIL = 'grievance@katha.in';
const GRIEVANCE_SLA_ACK_HOURS = 24;

export function GrievanceOfficerPanel() {
  return (
    <section className="cms-panel grievance-officer-panel" aria-labelledby="grievance-title">
      <div className="reviewer-inbox__head">
        <Shield size={18} aria-hidden />
        <div>
          <h3 id="grievance-title" className="dashboard-panel__title">Legal & Trust · Grievance officer</h3>
          <p className="input-hint">
            IT Rules aligned intake — appeals, conduct reports, review disputes (Foundations §1.4).
          </p>
        </div>
      </div>

      <dl className="grievance-officer-panel__facts">
        <div>
          <dt>Contact</dt>
          <dd>
            <a href={`mailto:${GRIEVANCE_EMAIL}`}>{GRIEVANCE_EMAIL}</a>
          </dd>
        </div>
        <div>
          <dt>Acknowledgement SLA</dt>
          <dd>{GRIEVANCE_SLA_ACK_HOURS} hours</dd>
        </div>
        <div>
          <dt>In-app intake</dt>
          <dd>Appeals queue · Moderation cases API</dd>
        </div>
      </dl>

      <p className="input-hint">
        Independent review target: 7 business days. Final decision: 15 business days.
        See PRD/Legal/Reviewer_Pool/REVIEW_DISPUTE_GRIEVANCE_PROCESS.md.
      </p>
    </section>
  );
}