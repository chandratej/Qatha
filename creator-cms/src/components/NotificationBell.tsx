import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';

export function NotificationBell() {
  const { data } = useApi(() => api.getMilestones().catch(() => ({ milestones: [] })));
  const [open, setOpen] = useState(false);

  const unacknowledged = (data?.milestones ?? []).filter((m) => !m.acknowledged);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unacknowledged.length ? ` (${unacknowledged.length} new)` : ''}`}
        style={{ padding: '6px 10px' }}
      >
        <Bell size={18} />
        {unacknowledged.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--dash-gold)',
            }}
          />
        )}
      </button>
      {open && (
        <div
          className="cms-panel"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 8,
            minWidth: 280,
            zIndex: 50,
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.875rem' }}>Notifications</div>
          {unacknowledged.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
              No new alerts. Milestones and moderation updates will appear here.
            </p>
          ) : (
            unacknowledged.map((m) => (
              <div key={m.id} style={{ fontSize: '0.8125rem', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                {m.milestone_type === 'FIRST_READER' ? 'Your first reader is here!' : 'New milestone unlocked'}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}