import type { PeerReviewRequest } from '../../types/platform';
import { SQI_DIMENSIONS } from '../../lib/platformConstants';

interface Props {
  requests: PeerReviewRequest[];
}

export function AuthorReviewDashboard({ requests }: Props) {
  const active = requests.filter((r) => !['completed', 'cancelled'].includes(r.status));
  const avgSqi = active.length
    ? Math.round(
      active.filter((r) => r.sqi_before).reduce((s, r) => s + (r.sqi_before ?? 0), 0)
      / Math.max(1, active.filter((r) => r.sqi_before).length),
    )
    : null;

  return (
    <section className="cms-panel author-review-dashboard" aria-labelledby="author-review-dash-title">
      <h3 id="author-review-dash-title" className="dashboard-panel__title">Author review dashboard</h3>
      <div className="author-review-dashboard__metrics">
        <div className="author-review-dashboard__metric">
          <span className="author-review-dashboard__value">{active.length}</span>
          <span className="author-review-dashboard__label">Active requests</span>
        </div>
        {avgSqi != null && (
          <div className="author-review-dashboard__metric">
            <span className="author-review-dashboard__value">{avgSqi}</span>
            <span className="author-review-dashboard__label">Avg SQI (before review)</span>
          </div>
        )}
      </div>
      <p className="input-hint">
        SQI tracks {SQI_DIMENSIONS.slice(0, 5).join(', ').replace(/_/g, ' ')} and more.
        Structured comments support track changes, resolution workflow, and version history.
      </p>
    </section>
  );
}