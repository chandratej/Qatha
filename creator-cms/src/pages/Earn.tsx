import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpenCheck, IndianRupee } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { isFeatureEnabled } from '../config/feature_flags';

/**
 * Earn hub — merges Reviewer Pool (reviews) and Monetization (payouts)
 * into one nav destination with sub-tabs (nav redesign v2).
 * Marketplace/reviews tab hidden when FEATURE_FLAGS.marketplace is off (P1-21/22).
 */
export function Earn() {
  const { t } = useLocale();
  const location = useLocation();
  const showReviews = isFeatureEnabled('marketplace');
  const onReviews =
    showReviews
    && (location.pathname.startsWith('/earn/reviews')
      || location.pathname === '/reviewers'
      || location.pathname.startsWith('/reviewers/'));
  const onPayouts =
    location.pathname.startsWith('/earn/payouts')
    || location.pathname === '/monetization'
    || !showReviews;

  return (
    <div className="earn-hub wc-page-enter">
      {showReviews ? (
        <div className="earn-hub__tabs" role="tablist" aria-label={t('nav.earn')}>
          <NavLink
            to="/earn/reviews"
            role="tab"
            aria-selected={onReviews}
            className={({ isActive }) =>
              `earn-hub__tab${isActive || onReviews ? ' earn-hub__tab--active' : ''}`
            }
          >
            <BookOpenCheck size={16} aria-hidden />
            <span>{t('earn.tabReviews')}</span>
          </NavLink>
          <NavLink
            to="/earn/payouts"
            role="tab"
            aria-selected={onPayouts}
            className={({ isActive }) =>
              `earn-hub__tab${isActive || onPayouts ? ' earn-hub__tab--active' : ''}`
            }
          >
            <IndianRupee size={16} aria-hidden />
            <span>{t('earn.tabPayouts')}</span>
          </NavLink>
        </div>
      ) : null}
      <div className="earn-hub__body" role="tabpanel">
        <Outlet />
      </div>
    </div>
  );
}
