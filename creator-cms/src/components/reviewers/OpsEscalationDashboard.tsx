import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, Download, Mail } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';

export interface SlaOpsDashboard {
  generated_at: string;
  active_assignments: number;
  breach_count: number;
  breach_pct: number;
  review_overdue: number;
  review_due_soon: number;
  accept_overdue: number;
  accept_due_soon: number;
  email_delivery: {
    queued: number;
    sending: number;
    sent: number;
    mock_sent: number;
    failed: number;
    retry_pending: number;
    total: number;
  };
  analytics_summary?: {
    total_events: number;
    event_counts: Record<string, number>;
  };
  escalations: Array<{
    assignment_id: string;
    manuscript_label: string;
    reviewer_slot: string;
    kind: 'review_due' | 'accept_due';
    severity: 'overdue' | 'due_soon';
    due_at: string;
    status: string;
  }>;
}

interface Props {
  onAction?: () => void;
}

function kindLabel(kind: string) {
  return kind === 'accept_due' ? 'Accept SLA' : 'Review SLA';
}

export function OpsEscalationDashboard({ onAction }: Props) {
  const [dashboard, setDashboard] = useState<SlaOpsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const reload = useCallback(() => {
    platformApi.getSlaOpsDashboard()
      .then((r) => {
        setDashboard(r.dashboard);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load SLA dashboard'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const downloadWarehouse = useCallback(async () => {
    setExporting(true);
    try {
      const { warehouse } = await platformApi.getAnalyticsWarehouseExport({ days: 90, limit: 2000 });
      const blob = new Blob([JSON.stringify(warehouse, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `review-analytics-warehouse-${warehouse.generated_at.slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export analytics warehouse');
    } finally {
      setExporting(false);
    }
  }, []);

  if (error) {
    return (
      <section className="cms-panel ops-escalation-dashboard" aria-labelledby="ops-sla-title">
        <p className="input-hint" role="alert">{error}</p>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="cms-panel ops-escalation-dashboard" aria-labelledby="ops-sla-title">
        <p className="input-hint" role="status">Loading SLA metrics…</p>
      </section>
    );
  }

  const { email_delivery: email } = dashboard;

  return (
    <section className="cms-panel ops-escalation-dashboard" aria-labelledby="ops-sla-title">
      <div className="reviewer-inbox__head">
        <Activity size={18} aria-hidden />
        <div>
          <h3 id="ops-sla-title" className="dashboard-panel__title">Operations · SLA escalations</h3>
          <p className="input-hint">
            Reviewer pool breach rate and email delivery queue — updated {new Date(dashboard.generated_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="ops-escalation-dashboard__stats">
        <span><strong>{dashboard.breach_pct}%</strong> breach rate</span>
        <span><strong>{dashboard.review_overdue + dashboard.accept_overdue}</strong> overdue</span>
        <span><strong>{dashboard.review_due_soon + dashboard.accept_due_soon}</strong> due soon</span>
        <span><strong>{dashboard.active_assignments}</strong> active</span>
      </div>

      <div className="ops-escalation-dashboard__email">
        <Mail size={14} aria-hidden />
        <span>
          Email FSM: {email.queued} queued · {email.sending} sending · {email.sent + email.mock_sent} delivered
          · {email.failed} failed · {email.retry_pending} retry pending
        </span>
      </div>

      {dashboard.analytics_summary && (
        <p className="input-hint">
          Analytics (30d): {dashboard.analytics_summary.total_events} events
          {dashboard.analytics_summary.event_counts.author_satisfaction_submitted != null && (
            <> · {dashboard.analytics_summary.event_counts.author_satisfaction_submitted} satisfaction ratings</>
          )}
        </p>
      )}

      {dashboard.escalations.length === 0 ? (
        <p className="input-hint">No SLA escalations right now — council is on schedule.</p>
      ) : (
        <ul className="council-admin-queue__list">
          {dashboard.escalations.map((e) => (
            <li
              key={`${e.assignment_id}-${e.kind}`}
              className={`council-admin-queue__item council-admin-queue__item--${e.severity}`}
            >
              <div className="council-admin-queue__item-head">
                <strong>{e.manuscript_label || 'Manuscript'}</strong>
                <span className={`review-status review-status--${e.severity}`}>{e.severity.replace(/_/g, ' ')}</span>
              </div>
              <p className="input-hint">
                {kindLabel(e.kind)} · {e.reviewer_slot} · due {new Date(e.due_at).toLocaleString()}
              </p>
              {e.severity === 'overdue' && (
                <p className="council-admin-queue__warn">
                  <AlertTriangle size={14} aria-hidden /> Escalation active — in-app + email worker notified.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="ops-escalation-dashboard__actions">
        <button type="button" className="katha-cta katha-cta--soft katha-cta--compact" onClick={() => { reload(); onAction?.(); }}>
          Refresh metrics
        </button>
        <button
          type="button"
          className="katha-cta katha-cta--soft katha-cta--compact"
          onClick={() => { void downloadWarehouse(); }}
          disabled={exporting}
          aria-busy={exporting}
        >
          <Download size={14} aria-hidden />
          {exporting ? 'Exporting…' : 'Export warehouse (90d)'}
        </button>
      </div>
    </section>
  );
}