import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, Clock, Inbox, Lock, PenLine, Star, TrendingUp, Zap,
} from 'lucide-react';
import { platformApi } from '../../lib/platformApi';
import type { ReviewerAssignment, ReviewerDashboardStats } from '../../types/platform';
import { councilLevelLabel } from '../../business/literaryCouncil';
import type { CouncilCareerLevelId } from '../../../../packages/shared/literary-council';
import { useAuth } from '../../context/AuthContext';
import { formatRqi } from '../../lib/dashboardFormat';
import { useLocale } from '../../context/LocaleContext';

function dueLabel(dueAt?: string, te?: boolean): string | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const hours = Math.round((due.getTime() - now.getTime()) / 3600000);
  if (hours < 0) return te ? `${Math.abs(hours)}గం ఆలస్యం` : `${Math.abs(hours)}h overdue`;
  if (hours < 24) return te ? `${hours}గం మిగిలి ఉంది` : `${hours}h left`;
  const d = Math.round(hours / 24);
  return te ? `${d}రోజులు మిగిలి` : `${d}d left`;
}

interface Props {
  onAction: () => void;
}

/** Dashboard tab — matches katha_reviewer_pool_v2.html */
export function ReviewerDashboard({ onAction }: Props) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const te = locale === 'te';
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

  if (!stats) {
    return (
      <div className="rpv2-empty" aria-busy="true">
        {te ? 'లోడ్ అవుతోంది…' : 'Loading dashboard…'}
      </div>
    );
  }

  const isAvailable = stats.isAvailable !== false;
  const level = councilLevelLabel(stats.councilLevel as CouncilCareerLevelId);

  return (
    <section className="rpv2-dashboard" aria-labelledby="reviewer-dashboard-title">
      <div className="rpv2-dash-head">
        <p id="reviewer-dashboard-title" className="rpv2-dash-title" lang={te ? 'te' : undefined}>
          <b>{level}</b>
          {' · '}RQI {formatRqi(stats.rqi)}
        </p>
        <button
          type="button"
          className={`rpv2-avail${isAvailable ? '' : ' rpv2-avail--off'}`}
          onClick={() => { void toggleAvailability(); }}
          disabled={availBusy}
          aria-pressed={isAvailable}
        >
          <span className="rpv2-avail__dot" aria-hidden />
          {availBusy
            ? (te ? 'నవీకరిస్తోంది…' : 'Updating…')
            : isAvailable
              ? (te ? 'అందుబాటులో ఉన్నారు' : 'Available')
              : (te ? 'అందుబాటులో లేరు' : 'Unavailable')}
        </button>
      </div>

      <div className="rpv2-kpi-row">
        <Kpi icon={Star} value={String(stats.reviewsCompleted)} label={te ? 'పూర్తయినవి' : 'Completed'} />
        <Kpi icon={PenLine} value={String(stats.reviewsInProgress)} label={te ? 'జరుగుతున్నవి' : 'In progress'} />
        <Kpi icon={Inbox} value={String(stats.invitationsPending)} label={te ? 'ఆహ్వానాలు' : 'Invitations'} />
        <Kpi
          icon={Clock}
          value={stats.avgTurnaroundHours ? `${stats.avgTurnaroundHours}h` : '—'}
          label={te ? 'సగటు సమయం' : 'Avg time'}
        />
        <Kpi icon={TrendingUp} value={`${stats.acceptanceRate}%`} label={te ? 'అంగీకార రేటు' : 'Accept rate'} />
      </div>

      {stats.badges.length > 0 && (
        <div className="rpv2-badges">
          <div className="rpv2-section-head">
            <h3 lang={te ? 'te' : undefined}>{te ? 'బ్యాడ్జీలు' : 'Badges'}</h3>
          </div>
          <div className="rpv2-badge-row" role="list">
            {stats.badges.map((raw) => {
              const b = typeof raw === 'string'
                ? { id: raw, label: raw, earned: true, unlockHint: '', minReviews: 0 }
                : raw;
              return (
                <span
                  key={b.id}
                  role="listitem"
                  className={`rpv2-badge rpv2-badge--${b.earned ? 'earned' : 'locked'}`}
                  title={b.earned ? b.label : `${b.label} · ${b.unlockHint}`}
                >
                  {b.earned ? <Check size={12} aria-hidden /> : <Lock size={12} aria-hidden />}
                  {b.earned ? b.label : `${b.label} · ${b.unlockHint}`}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {stats.overdueCount > 0 && (
        <p className="rpv2-decision" role="status" style={{ marginBottom: '1rem' }}>
          <Zap size={14} aria-hidden />
          {stats.overdueCount} {te ? 'అసైన్‌మెంట్‌లు SLA దాటాయి' : `assignment${stats.overdueCount > 1 ? 's' : ''} past SLA`}
        </p>
      )}

      <div className="rpv2-section-head">
        <h3 lang={te ? 'te' : undefined}>{te ? 'ప్రాధాన్యత క్యూ' : 'Priority queue'}</h3>
      </div>
      {priority.length === 0 ? (
        <p className="rpv2-waiting-hint" lang={te ? 'te' : undefined}>
          {te ? 'ప్రాధాన్యత అసైన్‌మెంట్‌లు ఇక్కడ కనిపిస్తాయి.' : 'Matched manuscripts appear here when you have active invitations.'}
        </p>
      ) : (
        <ul className="rpv2-queue-list">
          {priority.map((a) => (
            <li key={a.id} className="rpv2-queue-card">
              <div>
                <p className="rpv2-queue-title">{a.manuscript_label}</p>
                <p className="rpv2-queue-meta">
                  <span className="rpv2-match-chip">
                    {a.matching_score}% {te ? 'సరిపోలిక' : 'match'}
                  </span>
                  {a.due_at && ` · ${dueLabel(a.due_at, te)}`}
                </p>
              </div>
              {['accepted', 'in_review'].includes(a.status) ? (
                <Link to={`/reviewers/assignments/${a.id}`} className="rpv2-queue-cta">
                  {te ? 'స్టూడియో తెరవండి' : 'Open studio'}
                </Link>
              ) : (
                <span className="rpv2-status rpv2-status--invite">{a.status.replace(/_/g, ' ')}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rpv2-kpi">
      <Icon size={15} aria-hidden />
      <p className="rpv2-kpi__val">{value}</p>
      <p className="rpv2-kpi__label">{label}</p>
    </div>
  );
}
