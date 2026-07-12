import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { CouncilAuditEntry } from '../../types/platform';

function statusLabel(s: string) {
  return s.replace(/_/g, ' ');
}

interface Props {
  onAction: () => void;
}

export function CouncilAdminQueue({ onAction }: Props) {
  const [entries, setEntries] = useState<CouncilAuditEntry[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    platformApi.getCouncilAuditQueue().then((r) => setEntries(r.entries));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleClear = async (requestId: string) => {
    setBusyId(requestId);
    try {
      await platformApi.clearCouncilAudit(requestId);
      reload();
      onAction();
    } finally {
      setBusyId(null);
    }
  };

  const flagged = entries.filter((e) => e.audit_status === 'flagged' || e.fraud_risk_score > 20);
  const pending = entries.filter((e) => e.audit_status === 'pending');
  const appealed = entries.filter((e) => e.audit_status === 'appealed');

  return (
    <section className="cms-panel council-admin-queue" aria-labelledby="council-admin-title">
      <div className="reviewer-inbox__head">
        <ShieldCheck size={18} aria-hidden />
        <div>
          <h3 id="council-admin-title" className="dashboard-panel__title">Council admin · audit queue</h3>
          <p className="input-hint">Marketplace oversight, fraud detection, escrow release validation.</p>
        </div>
      </div>

      <div className="council-admin-queue__stats">
        <span><strong>{entries.length}</strong> total requests</span>
        <span><strong>{pending.length}</strong> pending audit</span>
        <span><strong>{flagged.length}</strong> elevated risk</span>
        <span><strong>{appealed.length}</strong> under appeal</span>
      </div>

      {entries.length === 0 ? (
        <p className="input-hint">No review requests in the marketplace yet.</p>
      ) : (
        <ul className="council-admin-queue__list">
          {entries.map((e) => (
            <li key={e.request_id} className={`council-admin-queue__item council-admin-queue__item--${e.audit_status}`}>
              <div className="council-admin-queue__item-head">
                <strong>{e.story_title}</strong>
                <span className={`review-status review-status--${e.status}`}>{statusLabel(e.status)}</span>
              </div>
              <p className="input-hint">
                Audit: {e.audit_status}
                {' · '}risk {e.fraud_risk_score}
                {' · '}{e.reviews_received}/{e.reviewers_matched} reviews
                {e.escrow_inr > 0 ? ` · ₹${e.escrow_inr} ${e.escrow_status}` : ''}
                {e.double_blind ? ' · double blind' : ''}
              </p>
              {e.flags.length > 0 && (
                <div className="review-role-chips review-role-chips--readonly">
                  {e.flags.map((f) => (
                    <span key={f} className="studio-chip">{f.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              )}
              {e.fraud_risk_score > 15 && (
                <p className="council-admin-queue__warn">
                  <AlertTriangle size={14} aria-hidden /> Anti-fraud: duplicate/copy-paste checks recommended before escrow release.
                </p>
              )}
              {e.audit_status === 'appealed' && (
                <p className="council-admin-queue__warn">
                  <AlertTriangle size={14} aria-hidden /> Appeal open — resolve in the appeals queue before escrow release.
                </p>
              )}
              {e.audit_status === 'pending' && (
                <button
                  type="button"
                  className="katha-cta katha-cta--soft"
                  disabled={busyId === e.request_id}
                  onClick={() => { void handleClear(e.request_id); }}
                >
                  {busyId === e.request_id ? 'Clearing…' : 'Clear audit & release escrow'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}