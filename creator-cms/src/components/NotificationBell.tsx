import { useState, useEffect, useRef, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';

type Filter = 'all' | 'milestones';

export function NotificationBell() {
  const { data, mutate } = useApi(() => api.getMilestones().catch(() => ({ milestones: [] })));
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const rootRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => (data?.milestones ?? [])
    .filter((m) => !m.acknowledged)
    .map((m) => ({
      id: m.id,
      group: 'Milestones',
      label: m.milestone_type === 'FIRST_READER' ? 'Your first reader is here!' : 'New milestone unlocked',
      href: '/',
      type: 'milestones' as const,
    })), [data]);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  useEffect(() => {
    const interval = setInterval(() => { mutate(); }, 60_000);
    return () => clearInterval(interval);
  }, [mutate]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="notification-bell" ref={rootRef}>
      <button type="button" className="notification-bell__trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Notifications${items.length ? ` (${items.length} new)` : ''}`}>
        <Bell size={18} />
        {items.length > 0 && <span className="notification-bell__dot" aria-hidden />}
      </button>
      {open && (
        <div className="notification-bell__panel cms-panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell__title">Notifications</div>
          <div className="notification-bell__filters">
            {(['all', 'milestones'] as Filter[]).map((f) => (
              <button key={f} type="button" className={`notification-bell__filter${filter === f ? ' notification-bell__filter--active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : 'Milestones'}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="notification-bell__empty">No new alerts. Milestones and updates will appear here.</p>
          ) : (
            Object.entries(groups).map(([group, rows]) => (
              <div key={group}>
                <div className="notification-bell__group-label">{group}</div>
                {rows.map((item) => (
                  <Link key={item.id} to={item.href} className="notification-bell__item" onClick={() => setOpen(false)}>{item.label}</Link>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}