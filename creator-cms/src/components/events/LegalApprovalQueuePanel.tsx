import { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { platformApi } from '../../lib/platformApi';

export function LegalApprovalQueuePanel() {
  const { t } = useLocale();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    platformApi.getLegalApprovalQueue()
      .then((r) => setPendingCount(r.pendingCount))
      .catch(() => setPendingCount(0));
  }, []);

  if (pendingCount === 0) {
    return (
      <p className="legal-queue-panel legal-queue-panel--ok input-hint" role="status">
        <Scale size={14} aria-hidden />
        {t('events.legalQueueClear')}
      </p>
    );
  }

  return (
    <div className="legal-queue-panel legal-queue-panel--pending" role="status">
      <Scale size={16} aria-hidden />
      <div>
        <p className="legal-queue-panel__title">{t('events.legalQueuePending')}</p>
        <p className="legal-queue-panel__hint input-hint">
          {t('events.legalQueueCount').replace('{count}', String(pendingCount))}
        </p>
      </div>
    </div>
  );
}