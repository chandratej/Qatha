import { Award } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export interface FoundingAuthorStatus {
  enrolled: boolean;
  enrolled_at?: string | null;
  acceleration_ends_at?: string | null;
  scope?: string | null;
}

/**
 * Permanent recognition + optional time-boxed acceleration (non-monetary prestige moat).
 */
export function FoundingAuthorBadge({ status }: { status: FoundingAuthorStatus | null | undefined }) {
  const { locale } = useLocale();
  const te = locale === 'te';
  if (!status?.enrolled) return null;

  const ends = status.acceleration_ends_at
    ? new Date(status.acceleration_ends_at)
    : null;
  const accelActive = ends != null && ends.getTime() > Date.now();

  return (
    <div className="moat-founding-badge" role="status">
      <Award size={18} aria-hidden />
      <div>
        <strong>{te ? 'స్థాపక రచయిత' : 'Founding Author'}</strong>
        <p>
          {te
            ? 'శాశ్వత గుర్తింపు — ఇతర ప్లాట్‌ఫామ్‌లో తిరిగి సంపాదించలేరు.'
            : 'Permanent recognition — cannot be re-earned by switching platforms.'}
        </p>
        {accelActive && ends && (
          <p className="moat-founding-badge__accel">
            {te ? 'త్వరణం' : 'Acceleration'} · {te ? 'ముగుస్తుంది' : 'ends'}{' '}
            {ends.toLocaleDateString(te ? 'te-IN' : 'en-IN')}
          </p>
        )}
      </div>
    </div>
  );
}
