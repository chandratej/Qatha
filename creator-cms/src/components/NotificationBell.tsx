import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';

export function NotificationBell() {
  const { data } = useApi(() => api.getMilestones().catch(() => ({ milestones: [] })));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unacknowledged = (data?.milestones ?? []).filter((m) => !m.acknowledged);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unacknowledged.length ? ` (${unacknowledged.length} new)` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unacknowledged.length > 0 && <span className="notification-bell__dot" aria-hidden />}
      </button>
      {open && (
        <div className="notification-bell__panel cms-panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell__title">Notifications</div>
          {unacknowledged.length === 0 ? (
            <p className="notification-bell__empty">
              No new alerts. Milestones and moderation updates will appear here.
            </p>
          ) : (
            unacknowledged.map((m) => (
              <div key={m.id} className="notification-bell__item">
                {m.milestone_type === 'FIRST_READER' ? 'Your first reader is here!' : 'New milestone unlocked'}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}