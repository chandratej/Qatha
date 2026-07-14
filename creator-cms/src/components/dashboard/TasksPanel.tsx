import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';
import type { DashboardTask } from '../../lib/dashboardTasks';
import { useLocale } from '../../context/LocaleContext';
import { StudioGlyph } from '../studio/StudioGlyph';

export function TasksPanel({ tasks }: { tasks: DashboardTask[] }) {
  const { t } = useLocale();

  return (
    <div className="dashboard-panel dashboard-panel--compact dashboard-widget--glyph">
      <div className="dashboard-panel__head tasks-panel__head">
        <div className="tasks-panel__head-inner">
          <StudioGlyph id="sparkles" variant="soft" size={18} className="tasks-panel__glyph" />
          <h3 className="dashboard-panel__title">{t('dashboard.tasksTitle')}</h3>
        </div>
        <span className="tasks-panel__count">{tasks.length}</span>
      </div>
      <ul className="tasks-panel__list">
        {tasks.map((task) => (
          <li key={task.id} className="tasks-panel__item">
            {task.done
              ? <CheckCircle2 size={18} className="tasks-panel__icon tasks-panel__icon--done" />
              : <Circle size={18} className="tasks-panel__icon" />}
            {task.href
              ? <Link to={task.href} className="tasks-panel__label">{task.label}</Link>
              : <span className="tasks-panel__label">{task.label}</span>}
          </li>
        ))}
      </ul>
      <Link to="/stories" className="panel-view-all">
        {t('dashboard.tasksViewAll')} <ChevronRight size={14} aria-hidden />
      </Link>
    </div>
  );
}