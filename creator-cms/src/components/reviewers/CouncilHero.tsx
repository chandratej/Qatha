import { BookOpenCheck, BookOpen, PenLine, Send, Shield, Users } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

type PoolView = 'author' | 'reviewer' | 'pool' | 'admin';

interface Props {
  inboxCount: number;
  activeRequests: number;
  feedbackReadyCount?: number;
  activeView: PoolView;
  isAdmin: boolean;
  onAuthorView: () => void;
  onReviewerView: () => void;
  onPoolView: () => void;
  onAdminView: () => void;
}

/**
 * Prototype-matched hero + underline tabs
 * (katha_reviewer_pool_v2.html — eyebrow, serif title, subtitle, assurance, tabs).
 */
export function CouncilHero({
  inboxCount,
  feedbackReadyCount = 0,
  activeView,
  isAdmin,
  onAuthorView,
  onReviewerView,
  onPoolView,
  onAdminView,
}: Props) {
  const { t, locale } = useLocale();

  return (
    <header className="rpv2-hero" aria-labelledby="council-hero-title">
      <p className="rpv2-hero__eyebrow">
        <BookOpen size={14} aria-hidden />
        {t('reviewers.heroEyebrow')}
      </p>
      <h1 id="council-hero-title" className="rpv2-hero__title" lang={locale === 'te' ? 'te' : undefined}>
        {t('reviewers.heroTagline')}
      </h1>
      <p className="rpv2-hero__subtitle" lang={locale === 'te' ? 'te' : undefined}>
        {t('reviewers.heroSubtitle')}
      </p>
      <p className="rpv2-hero__assurance" lang={locale === 'te' ? 'te' : undefined}>
        <BookOpenCheck size={14} aria-hidden />
        {t('reviewers.heroAssurance')}
      </p>

      <nav className="rpv2-tabs" aria-label={t('reviewers.heroEyebrow')} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'reviewer'}
          className={`rpv2-tab${activeView === 'reviewer' ? ' rpv2-tab--active' : ''}`}
          onClick={onReviewerView}
        >
          <PenLine size={15} aria-hidden />
          {t('reviewers.navReview')}
          {inboxCount > 0 && <span className="rpv2-tab__badge">{inboxCount}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'author'}
          className={`rpv2-tab${activeView === 'author' ? ' rpv2-tab--active' : ''}`}
          onClick={onAuthorView}
        >
          <Send size={15} aria-hidden />
          {t('reviewers.navRequest')}
          {feedbackReadyCount > 0 && <span className="rpv2-tab__badge">{feedbackReadyCount}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'pool'}
          className={`rpv2-tab${activeView === 'pool' ? ' rpv2-tab--active' : ''}`}
          onClick={onPoolView}
        >
          <Users size={15} aria-hidden />
          {t('reviewers.navPool')}
        </button>
        {isAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'admin'}
            className={`rpv2-tab${activeView === 'admin' ? ' rpv2-tab--active' : ''}`}
            onClick={onAdminView}
          >
            <Shield size={15} aria-hidden />
            {t('reviewers.navAdmin')}
          </button>
        )}
      </nav>
    </header>
  );
}
