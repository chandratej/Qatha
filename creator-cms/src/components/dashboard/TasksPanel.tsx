import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import type { DashboardTask } from '../../lib/dashboardTasks';

export function TasksPanel({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <div className="dashboard-panel dashboard-panel--compact">
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">Today&apos;s Tasks</h3>
        <span className="tasks-panel__count">{tasks.length}</span>
      </div>
      <ul className="tasks-panel__list">
        {tasks.map((t) => (
          <li key={t.id} className="tasks-panel__item">
            {t.done ? <CheckCircle2 size={18} className="tasks-panel__icon tasks-panel__icon--done" /> : <Circle size={18} className="tasks-panel__icon" />}
            {t.href ? <Link to={t.href} className="tasks-panel__label">{t.label}</Link> : <span className="tasks-panel__label">{t.label}</span>}
          </li>
        ))}
      </ul>
      <Link to="/stories" className="panel-view-all">View all tasks <ChevronRight size={14} aria-hidden /></Link>
    </div>
  );
}