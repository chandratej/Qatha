import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { platformApi } from '../../lib/platformApi';

interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  from_state: string | null;
  to_state: string;
  event_name: string;
  actor_id: string | null;
  created_at: string;
}

export function AuditLogPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    platformApi.getAuditLog()
      .then((r) => {
        setEntries(r.entries as unknown as AuditEntry[]);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load audit log'));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <section className="cms-panel audit-log-panel" aria-labelledby="audit-log-title">
      <div className="reviewer-inbox__head">
        <ScrollText size={18} aria-hidden />
        <div>
          <h3 id="audit-log-title" className="dashboard-panel__title">Security · State transition audit</h3>
          <p className="input-hint">Read-only immutable log — LRC-12-D7</p>
        </div>
      </div>

      {error && <p className="input-hint" role="alert">{error}</p>}

      {entries.length === 0 && !error && (
        <p className="input-hint" role="status">No transition events recorded yet.</p>
      )}

      {entries.length > 0 && (
        <ul className="council-admin-queue__list">
          {entries.slice(0, 15).map((e) => (
            <li key={e.id} className="council-admin-queue__item">
              <div className="council-admin-queue__item-head">
                <strong>{e.event_name}</strong>
                <span className="input-hint">{new Date(e.created_at).toLocaleString()}</span>
              </div>
              <p className="input-hint">
                {e.entity_type} · {e.from_state ?? '—'} → {e.to_state}
                {e.actor_id ? ` · actor ${String(e.actor_id).slice(0, 8)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="katha-cta katha-cta--soft katha-cta--compact" onClick={reload}>
        Refresh audit log
      </button>
    </section>
  );
}