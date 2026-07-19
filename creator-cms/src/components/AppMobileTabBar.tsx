import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MoreHorizontal, X } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import {
  isNavItemActive,
  NAV_MORE,
  NAV_MORE_MOBILE_EXTRAS,
  NAV_PRIMARY,
} from '../config/navConfig';

/**
 * Mobile bottom tab bar + More bottom sheet — matches katha_navigation_v2.html.
 * Sheet is portaled and only mounted when open so it is always visible.
 */
export function AppMobileTabBar() {
  const { t, locale, toggleLocale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    closeSheet();
  }, [location.pathname, closeSheet]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    // Lock background scroll while sheet is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen, closeSheet]);

  const moreActive =
    sheetOpen
    || NAV_MORE.some((item) => isNavItemActive(location.pathname, item))
    || NAV_MORE_MOBILE_EXTRAS.some((item) => isNavItemActive(location.pathname, item));

  // Prototype More sheet: Publishing, Events, Community, Settings
  const sheetItems = [...NAV_MORE, ...NAV_MORE_MOBILE_EXTRAS];

  const sheet = sheetOpen
    ? createPortal(
        <>
          <div
            className="app-mobile-sheet__backdrop"
            onClick={closeSheet}
            aria-hidden
          />
          <div
            id="app-mobile-more-sheet"
            className="app-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.more')}
          >
            <div className="app-mobile-sheet__handle" aria-hidden />
            <div className="app-mobile-sheet__head">
              <span className="app-mobile-sheet__title">{t('nav.more')}</span>
              <button
                type="button"
                className="app-mobile-sheet__close"
                onClick={closeSheet}
                aria-label={t('common.close')}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <ul className="app-mobile-sheet__list" role="menu">
              {sheetItems.map((item) => {
                const active = isNavItemActive(location.pathname, item);
                return (
                  <li key={item.key} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`app-mobile-sheet__item${active ? ' app-mobile-sheet__item--active' : ''}`}
                      onClick={() => {
                        closeSheet();
                        navigate(item.route);
                      }}
                    >
                      <item.icon size={18} aria-hidden />
                      <span>{t(item.labelKey)}</span>
                      {item.statusKey && (
                        <span className="app-nav-status">{t(item.statusKey)}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="app-mobile-sheet__prefs">
              <button
                type="button"
                className="app-mobile-sheet__pref"
                onClick={() => toggleLocale()}
              >
                {locale === 'te' ? 'English' : 'తెలుగు'}
              </button>
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <nav className="app-mobile-tabbar" aria-label={t('nav.mobileNav')}>
        {NAV_PRIMARY.map((item) => {
          const active = isNavItemActive(location.pathname, item);
          return (
            <NavLink
              key={item.key}
              to={item.route}
              end={item.end}
              className={`app-mobile-tabbar__tab${active ? ' app-mobile-tabbar__tab--active' : ''}`}
            >
              <item.icon size={20} aria-hidden />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          className={`app-mobile-tabbar__tab${moreActive ? ' app-mobile-tabbar__tab--active' : ''}`}
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          aria-controls="app-mobile-more-sheet"
          aria-haspopup="dialog"
        >
          <MoreHorizontal size={20} aria-hidden />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
      {sheet}
    </>
  );
}
