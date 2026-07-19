import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';

export function ReviewerPoolSummaryWidget() {
  const [summary, setSummary] = useState<{ total: number; available: number; canFulfill: boolean } | null>(null);

  useEffect(() => {
    platformApi.getReviewerPoolSummary()
      .then((s) => setSummary(s))
      .catch(() => setSummary({ total: 0, available: 0, canFulfill: false }));
  }, []);

  return (
    <section className="cms-panel dashboard-reviewer-pool-widget" aria-labelledby="dash-pool-title">
      <div className="dashboard-reviewer-pool-widget__head">
        <BookOpenCheck size={16} aria-hidden />
        <h3 id="dash-pool-title" className="dashboard-panel__title">Reviewer Pool</h3>
      </div>
      {summary ? (
        <p className="input-hint">
          {summary.available} of {summary.total} reviewers available
          {summary.canFulfill ? ' · ready to match' : ' · matching may be delayed'}
        </p>
      ) : (
        <p className="input-hint">Loading pool status…</p>
      )}
      <Link to="/earn/reviews" className="katha-cta katha-cta--soft katha-cta--compact">
        Open Reviewer Pool
      </Link>
    </section>
  );
}