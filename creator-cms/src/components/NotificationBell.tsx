import { useState, useEffect, useRef, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { platformApi } from '../lib/platformApi';
import { useAuth } from '../context/AuthContext';
import {
  filterNotifications,
  normalizePlatformNotification,
  relativeTime,
  type NotificationFilter,
} from '../lib/notificationFeed';

type BellFilter = 'all' | 'milestones' | NotificationFilter;

export function NotificationBell() {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous-creator';
  const { data: milestonesData, mutate: mutateMilestones } = useApi(
    () => api.getMilestones().catch(() => ({ milestones: [] })),
  );
  const { data: platformData, mutate: mutatePlatform } = useApi(
    () => platformApi.getNotifications(userId).then((r) => r.notifications.map(normalizePlatformNotification)),
    [userId],
  );
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<BellFilter>('all');
  const rootRef = useRef<HTMLDivElement>(null);

  const milestoneItems = useMemo(
    () => (milestonesData?.milestones ?? [])
      .filter((m) => !m.acknowledged)
      .map((m) => ({
        id: m.id,
        group: 'Milestones',
        label: m.milestone_type === 'FIRST_READER' ? 'Your first reader is here!' : 'New milestone unlocked',
        href: '/',
        type: 'milestones' as const,
        unread: true,
      })),
    [milestonesData],
  );

  const platformItems = useMemo(
    () => (platformData ?? [])
      .filter((n) => !n.read_at)
      .map((n) => ({
        id: n.id,
        group: n.domain === 'reviews' ? 'Reviews' : n.domain === 'moderation' ? 'Moderation' : 'Updates',
        label: n.title,
        hint: n.body ? n.body.slice(0, 80) : relativeTime(n.created_at),
        href: n.action_url || '/notifications',
        type: n.domain as string,
        unread: true,
      })),
    [platformData],
  );

  const allItems = useMemo(() => [...platformItems, ...milestoneItems], [platformItems, milestoneItems]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allItems;
    if (filter === 'milestones') return milestoneItems;
    const domainItems = filterNotifications(platformData ?? [], filter).filter((n) => !n.read_at);
    return domainItems.map((n) => ({
      id: n.id,
      group: filter === 'reviews' ? 'Reviews' : filter === 'publishing' ? 'Publishing' : 'Revenue',
      label: n.title,
      hint: n.body ? n.body.slice(0, 80) : relativeTime(n.created_at),
      href: n.action_url || '/notifications',
      type: n.domain,
      unread: true,
    }));
  }, [allItems, filter, milestoneItems, platformData]);

  const unreadTotal = allItems.length;

  useEffect(() => {
    const interval = setInterval(() => {
      mutateMilestones();
      mutatePlatform();
    }, 60_000);
    return () => clearInterval(interval);
  }, [mutateMilestones, mutatePlatform]);

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
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notifications${unreadTotal ? ` (${unreadTotal} new)` : ''}`}
      >
        <Bell size={18} />
        {unreadTotal > 0 && <span className="notification-bell__dot" aria-hidden />}
      </button>
      {open && (
        <div className="notification-bell__panel cms-panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell__title-row">
            <div className="notification-bell__title">Notifications</div>
            <Link to="/notifications" className="notification-bell__view-all" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <div className="notification-bell__filters">
            {(['all', 'reviews', 'publishing', 'milestones'] as BellFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`notification-bell__filter${filter === f ? ' notification-bell__filter--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'milestones' ? 'Milestones' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                  <Link
                    key={item.id}
                    to={item.href}
                    className="notification-bell__item"
                    onClick={() => {
                      setOpen(false);
                      if (item.type !== 'milestones') {
                        void platformApi.markNotificationRead(item.id).then(() => mutatePlatform());
                      }
                    }}
                  >
                    <span className="notification-bell__item-label">{item.label}</span>
                    {'hint' in item && item.hint && (
                      <span className="notification-bell__item-hint">{item.hint}</span>
                    )}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}