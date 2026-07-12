import { Link } from 'react-router-dom';
import { MessageSquareQuote } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';

export function PendingReaderFeedbackWidget() {
  const { data } = useApi(() => api.getPendingReaderFeedback().catch(() => ({ feedback: [], count: 0 })));

  const pending = data?.feedback ?? [];
  const count = data?.count ?? pending.length;
  if (count === 0) return null;

  return (
    <section className="cms-panel dashboard-feedback-widget" aria-labelledby="dash-feedback-title">
      <div className="dashboard-notifications-widget__head">
        <MessageSquareQuote size={16} aria-hidden />
        <h3 id="dash-feedback-title" className="dashboard-panel__title">Reader feedback queue</h3>
        <span className="dashboard-notifications-widget__badge">{count}</span>
      </div>
      <ul className="dashboard-notifications-widget__list">
        {pending.slice(0, 3).map((item) => (
          <li key={item.id} className="dashboard-feedback-widget__row">
            <span>
              {item.chapter_number ? `Ch. ${item.chapter_number}` : 'Story'}
              {' · '}
              {item.body.length > 60 ? `${item.body.slice(0, 60)}…` : item.body}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/publishing" className="dashboard-notifications-widget__all">Review in Publishing Center</Link>
    </section>
  );
}