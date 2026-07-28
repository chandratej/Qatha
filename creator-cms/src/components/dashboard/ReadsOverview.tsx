import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart, Legend } from 'recharts';
import { formatCompact, pctChange } from '../../lib/dashboardFormat';

interface Props {
  readsHistory: Array<{ label: string; reads: number; retention: number }>;
  totalReads: number;
  analyticsHref?: string;
}

export function ReadsOverview({ readsHistory, totalReads, analyticsHref }: Props) {
  const growth = readsHistory.length >= 2
    ? pctChange(readsHistory[readsHistory.length - 1].reads, readsHistory[readsHistory.length - 2].reads)
    : null;

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__head">
        <h3 className="dashboard-panel__title">Reads &amp; Retention</h3>
      </div>
      <div className="reads-overview__hero">
        <span className="reads-overview__total">{formatCompact(totalReads)}</span>
        <span className="reads-overview__label">Total reads</span>
        {growth != null && <span className="reads-overview__growth">+{growth}% MoM</span>}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={readsHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="reads" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="ret" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 12 }} />
          <Legend />
          <Area yAxisId="reads" type="monotone" dataKey="reads" name="Reads" stroke="var(--gold-dark, var(--dash-gold))" fill="var(--dash-gold-soft)" fillOpacity={0.3} />
          <Line yAxisId="ret" type="monotone" dataKey="retention" name="Retention %" stroke="var(--accent-sage)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      {analyticsHref && (
        <Link to={analyticsHref} className="panel-view-all">Go to Analytics <ChevronRight size={14} aria-hidden /></Link>
      )}
    </div>
  );
}