import { useCallback, useEffect, useRef } from 'react';
import { Award, Share2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { shareViaWhatsApp, shareViaX } from '../../lib/socialShare';
import { trackCreatorEvent } from '../../lib/analyticsEvents';

interface Props {
  storyTitle?: string | null;
  awardLevel?: string | null;
  onClose: () => void;
}

function formatAwardLabel(awardLevel: string | null | undefined, locale: string): string {
  if (!awardLevel) {
    return locale === 'te' ? 'అవతరణ రచయిత' : 'Debut Author';
  }
  const labels: Record<string, { en: string; te: string }> = {
    grand_debut: { en: 'Grand Debut', te: 'మహా అవతరణ' },
    gold_debut: { en: 'Gold Debut', te: 'స్వర్ణ అవతరణ' },
    silver_debut: { en: 'Silver Debut', te: 'వెండి అవతరణ' },
    bronze_debut: { en: 'Bronze Debut', te: 'కాంస్య అవతరణ' },
    rising_voice: { en: 'Rising Voice', te: 'ఉదయిస్తున్న స్వరం' },
  };
  const entry = labels[awardLevel];
  if (!entry) return awardLevel;
  return locale === 'te' ? entry.te : entry.en;
}

function buildBadgeShareMessage(storyTitle: string | undefined, awardLabel: string, locale: string): string {
  const title = storyTitle?.trim() || (locale === 'te' ? 'నా మొదటి నవల' : 'My debut novel');
  if (locale === 'te') {
    return `${title} — ${awardLabel} బ్యాడ్జ్ సంపాదించాను!\n\nకథా అవతరణ కాలం — 50 అధ్యాయాల ప్రయాణం పూర్తి.`;
  }
  return `I earned the ${awardLabel} badge for "${title}"!\n\nKatha Debut Season — 50-chapter arc complete.`;
}

export function DebutGraduationModal({ storyTitle, awardLevel, onClose }: Props) {
  const { locale, t } = useLocale();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const awardLabel = formatAwardLabel(awardLevel, locale);
  const shareMessage = buildBadgeShareMessage(storyTitle ?? undefined, awardLabel, locale);
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://katha.in';

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtnRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleShare = useCallback((channel: 'whatsapp' | 'x' | 'copy') => {
    trackCreatorEvent('debut_badge_shared', { channel, award_level: awardLevel ?? 'debut_author' });
    if (channel === 'whatsapp') {
      shareViaWhatsApp(shareUrl, shareMessage);
      return;
    }
    if (channel === 'x') {
      shareViaX(shareUrl, shareMessage);
      return;
    }
    void navigator.clipboard.writeText(`${shareMessage}\n\n${shareUrl}`);
  }, [awardLevel, shareMessage, shareUrl]);

  return (
    <div className="milestone-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="milestone-modal debut-graduation-modal"
        role="dialog"
        aria-labelledby="debut-graduation-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="studio-empty__glyph debut-graduation-modal__glyph" aria-hidden>
          <Award size={36} />
        </div>
        <p className="debut-graduation-modal__eyebrow">{t('dashboard.debutGradEyebrow')}</p>
        <h2 id="debut-graduation-title" className="studio-empty__title">
          {t('dashboard.debutGradTitle')}
        </h2>
        <p className="milestone-modal__te" lang="te">{t('dashboard.debutGradTe')}</p>
        <p className="studio-empty__text">{t('dashboard.debutGradBody')}</p>
        {storyTitle && (
          <p className="debut-graduation-modal__story">
            <strong>{storyTitle}</strong>
            <span className="debut-graduation-modal__badge-label">{awardLabel}</span>
          </p>
        )}
        <div className="debut-graduation-modal__share">
          <p className="debut-graduation-modal__share-label">
            <Share2 size={16} aria-hidden />
            {t('dashboard.debutGradShare')}
          </p>
          <div className="debut-graduation-modal__share-actions">
            <button
              type="button"
              className="share-modal__social-btn share-modal__social-btn--wa"
              onClick={() => handleShare('whatsapp')}
            >
              WhatsApp
            </button>
            <button
              type="button"
              className="share-modal__social-btn share-modal__social-btn--x"
              onClick={() => handleShare('x')}
            >
              X
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleShare('copy')}
            >
              {t('dashboard.debutGradCopy')}
            </button>
          </div>
        </div>
        <button
          ref={closeBtnRef}
          type="button"
          className="dashboard-cta cms-auth-cta"
          onClick={onClose}
        >
          {t('dashboard.debutGradCta')}
        </button>
      </div>
    </div>
  );
}