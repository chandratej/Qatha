import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Sparkline } from './Sparkline';

interface KpiCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: number | null;
  trendLabel?: string;
  sub?: string;
  tooltip?: string;
  sparkline?: number[];
  tone?: 'gold' | 'purple' | 'green';
  onClick?: () => void;
}

export function KpiCard({ icon: Icon, value, label, trend, trendLabel = 'vs last period', sub, tooltip, sparkline, tone = 'gold', onClick }: KpiCardProps) {
  const up = trend == null || trend >= 0;
  const body = (
    <>
      <div className={`kpi-card__glow kpi-card__glow--${tone}`} />
      <div className="kpi-card__top">
        <div className={`kpi-card__icon kpi-card__icon--${tone}`}><Icon size={20} aria-hidden /></div>
        {sparkline && <Sparkline data={sparkline} />}
      </div>
      <div className="kpi-card__value">{value}</div>
      <div className="kpi-card__label">{label}</div>
      {trend != null && (
        <div className={`kpi-card__trend${up ? '' : ' kpi-card__trend--down'}`}>
          {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {up ? '+' : ''}{trend}% {trendLabel}
        </div>
      )}
      {sub && <div className="kpi-card__sub">{sub}</div>}
    </>
  );
  if (onClick) {
    return <button type="button" className="kpi-card kpi-card--clickable" title={tooltip} onClick={onClick}>{body}</button>;
  }
  return <div className="kpi-card" title={tooltip}>{body}</div>;
}