import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ActivityFeedItem } from '../../lib/buildActivityFeed';

export function ActivityFeedPanel({ items }: { items: ActivityFeedItem[] }) {
  const groups = items.reduce<Record<string, ActivityFeedItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">Recent Activity</h3>
        <Link to="/stories" className="panel-view-all">View all <ChevronRight size={14} aria-hidden /></Link>
      </div>
      {Object.entries(groups).map(([group, rows]) => (
        <div key={group}>
          <div className="activity-feed__group-label">{group}</div>
          {rows.map((item) => (
            <div key={item.id} className="activity-item">
              <div className={`activity-item__icon activity-item__icon--${item.icon}`}><item.Icon size={18} aria-hidden /></div>
              <div>
                <div className="activity-item__title">{item.title}</div>
                <div className="activity-item__desc">{item.description}</div>
                <div className="activity-item__time">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}