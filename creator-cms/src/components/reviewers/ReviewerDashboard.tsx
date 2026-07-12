import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, Clock, FileEdit, Inbox, PenLine, Star, TrendingUp, Zap,
} from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ReviewerAssignment, ReviewerDashboardStats } from '../../types/platform';
import { councilLevelLabel } from '../../business/literaryCouncil';
import type { CouncilCareerLevelId } from '../../../../packages/shared/literary-council';
import { useAuth } from '../../context/AuthContext';

function dueLabel(dueAt?: string): string | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const hours = Math.round((due.getTime() - now.getTime()) / 3600000);
  if (hours < 0) return `${Math.abs(hours)}h overdue`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.round(hours / 24)}d left`;
}

interface Props {
  onAction: () => void;
}

export function ReviewerDashboard({ onAction }: Props) {
  const { user } = useAuth();
  const [slot, setSlot] = useState('slot-1');
  const [stats, setStats] = useState<ReviewerDashboardStats | null>(null);
  const [priority, setPriority] = useState<ReviewerAssignment[]>([]);
  const [availBusy, setAvailBusy] = useState(false);

  useEffect(() => {
    platformApi.getLinkedReviewerSlot(user?.id).then((r) => setSlot(r.slot));
  }, [user?.id]);

  const loadDashboard = () => {
    platformApi.getReviewerDashboardStats(slot).then((r) => setStats(r.stats));
    platformApi.getReviewerAssignments(slot).then((r) => {
      const active = r.assignments
        .filter((a) => ['invited', 'accepted', 'in_review'].includes(a.status))
        .sort((a, b) => {
          const aOver = a.due_at && new Date(a.due_at) < new Date() ? 0 : 1;
          const bOver = b.due_at && new Date(b.due_at) < new Date() ? 0 : 1;
          if (aOver !== bOver) return aOver - bOver;
          return (b.matching_score ?? 0) - (a.matching_score ?? 0);
        });
      setPriority(active.slice(0, 4));
    });
  };

  useEffect(() => {
    loadDashboard();
  }, [slot, onAction]);

  const toggleAvailability = async () => {
    if (!stats) return;
    setAvailBusy(true);
    try {
      const next = !(stats.isAvailable !== false);
      await platformApi.setReviewerAvailability(next);
      setStats((prev) => (prev ? { ...prev, isAvailable: next } : prev));
      onAction();
    } finally {
      setAvailBusy(false);
    }
  };

  if (!stats) return null;

  const isAvailable = stats.isAvailable !== false;

  return (
    <section className="reviewer-dashboard" aria-labelledby="reviewer-dashboard-title">
      <header className="reviewer-dashboard__head">
        <div>
          <h3 id="reviewer-dashboard-title" className="reviewer-dashboard__title">Reviewer dashboard</h3>
          <p className="reviewer-dashboard__subtitle">
            {councilLevelLabel(stats.councilLevel as CouncilCareerLevelId)}
            {' · '}RQI {stats.rqi}
            {' · '}{stats.reputationTier} tier
          </p>
        </div>
        <button
          type="button"
          className={`reviewer-dashboard__availability${isAvailable ? '' : ' reviewer-dashboard__availability--off'}`}
          onClick={() => { void toggleAvailability(); }}
          disabled={availBusy}
          aria-pressed={isAvailable}
          title={isAvailable ? 'You will receive new invitations' : 'Paused — no new invitations'}
        >
          <span className="reviewer-dashboard__avail-dot" aria-hidden />
          {availBusy ? 'Updating…' : isAvailable ? 'Available' : 'Unavailable'}
        </button>
      </header>

      <div className="reviewer-dashboard__kpis">
        <Kpi icon={Star} label="Completed" value={String(stats.reviewsCompleted)} />
        <Kpi icon={PenLine} label="In progress" value={String(stats.reviewsInProgress)} />
        <Kpi icon={Inbox} label="Invitations" value={String(stats.invitationsPending)} />
        <Kpi icon={Clock} label="Avg turnaround" value={stats.avgTurnaroundHours ? `${stats.avgTurnaroundHours}h` : '—'} />
        <Kpi icon={TrendingUp} label="Accept rate" value={`${stats.acceptanceRate}%`} />
        <Kpi icon={FileEdit} label="Drafts" value={String(stats.draftCount)} />
      </div>

      {stats.badges.length > 0 && (
        <div className="reviewer-dashboard__badges">
          <Award size={14} aria-hidden />
          {stats.badges.map((b) => (
            <span key={b} className="studio-chip">{b}</span>
          ))}
        </div>
      )}

      {stats.overdueCount > 0 && (
        <p className="reviewer-dashboard__alert" role="status">
          <Zap size={14} aria-hidden />
          {stats.overdueCount} assignment{stats.overdueCount > 1 ? 's' : ''} past SLA — prioritize these first.
        </p>
      )}

      {priority.length > 0 && (
        <div className="reviewer-dashboard__queue">
          <h4 className="reviewer-dashboard__section">Priority queue</h4>
          <ul className="reviewer-dashboard__queue-list">
            {priority.map((a) => (
              <li key={a.id} className="reviewer-dashboard__queue-item">
                <div>
                  <strong>{a.manuscript_label}</strong>
                  <span className="reviewer-dashboard__queue-meta">
                    {a.matching_score}% match
                    {a.due_at && ` · ${dueLabel(a.due_at)}`}
                  </span>
                </div>
                {['accepted', 'in_review'].includes(a.status) ? (
                  <Link to={`/reviewers/assignments/${a.id}`} className="katha-cta katha-cta--maroon katha-cta--compact">
                    Open studio
                  </Link>
                ) : (
                  <span className={`review-status review-status--${a.status}`}>{a.status.replace(/_/g, ' ')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="reviewer-dashboard__kpi">
      <Icon size={15} aria-hidden />
      <span className="reviewer-dashboard__kpi-value">{value}</span>
      <span className="reviewer-dashboard__kpi-label">{label}</span>
    </div>
  );
}