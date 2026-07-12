import { useCallback, useEffect, useState } from 'react';
import { Bot, Shield } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';

export interface AdvisoryGovernanceDashboard {
  generated_at: string;
  advisory_ai_live: boolean;
  summary: {
    total: number;
    pending: number;
    accepted: number;
    ignored: number;
    accept_rate_pct: number;
    by_provider: Record<string, number>;
    by_category: Record<string, number>;
  };
  recent: Array<{
    id: string;
    status: string;
    provider: string;
    category: string;
    confidence: number;
    created_at: string;
    resolved_at: string | null;
  }>;
}

export function AdvisoryGovernancePanel() {
  const [dashboard, setDashboard] = useState<AdvisoryGovernanceDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    platformApi.getAdvisoryGovernanceDashboard()
      .then((r) => {
        setDashboard(r.dashboard);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load advisory governance'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (error) {
    return (
      <section className="cms-panel advisory-governance-panel" aria-labelledby="advisory-gov-title">
        <p className="input-hint" role="alert">{error}</p>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="cms-panel advisory-governance-panel" aria-labelledby="advisory-gov-title">
        <p className="input-hint" role="status">Loading advisory governance…</p>
      </section>
    );
  }

  const { summary } = dashboard;

  return (
    <section className="cms-panel advisory-governance-panel" aria-labelledby="advisory-gov-title">
      <div className="reviewer-inbox__head">
        <Bot size={18} aria-hidden />
        <div>
          <h3 id="advisory-gov-title" className="dashboard-panel__title">AI Council · Advisory governance</h3>
          <p className="input-hint">
            Human-in-the-loop audit — suggestions never auto-apply (LRC-07-D5).
            {dashboard.advisory_ai_live ? ' Live xAI enabled.' : ' Heuristic mode.'}
          </p>
        </div>
        <Shield size={16} aria-hidden className="ops-escalation-dashboard__badge" />
      </div>

      <div className="ops-escalation-dashboard__kpis">
        <div className="ops-escalation-dashboard__kpi">
          <span className="ops-escalation-dashboard__kpi-value">{summary.total}</span>
          <span className="ops-escalation-dashboard__kpi-label">Total suggestions</span>
        </div>
        <div className="ops-escalation-dashboard__kpi">
          <span className="ops-escalation-dashboard__kpi-value">{summary.accept_rate_pct}%</span>
          <span className="ops-escalation-dashboard__kpi-label">Accept rate</span>
        </div>
        <div className="ops-escalation-dashboard__kpi">
          <span className="ops-escalation-dashboard__kpi-value">{summary.pending}</span>
          <span className="ops-escalation-dashboard__kpi-label">Pending</span>
        </div>
        <div className="ops-escalation-dashboard__kpi">
          <span className="ops-escalation-dashboard__kpi-value">{summary.ignored}</span>
          <span className="ops-escalation-dashboard__kpi-label">Dismissed</span>
        </div>
      </div>

      {dashboard.recent.length > 0 && (
        <ul className="ops-escalation-dashboard__list">
          {dashboard.recent.map((row) => (
            <li key={row.id} className="ops-escalation-dashboard__row">
              <span className={`ops-escalation-dashboard__severity ops-escalation-dashboard__severity--${row.status === 'accepted' ? 'due_soon' : 'overdue'}`}>
                {row.status}
              </span>
              <span>{row.category} · {row.provider} · {Math.round(row.confidence * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}