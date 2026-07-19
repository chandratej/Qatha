import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Languages,
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useCommandPaletteControl } from './dashboard/CommandPalette';
import { getCreatorBadge } from '../lib/creatorBadge';
import { BRAND } from '../lib/constants';
import { modKeyLabel } from '../lib/device';
import { BrandMark } from './studio/BrandMark';
import {
  isNavItemActive,
  NAV_MORE,
  NAV_PRIMARY,
} from '../config/navConfig';
import type { StudioStringKey } from '../lib/studioLocale';

function userInitials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Condensed desktop top nav (v2) — matches katha_navigation_v2.html:
 * Primary: Dashboard · Stories · Earn
 * More dropdown: Publishing · Events · Community (early-stage tag)
 * Stats ribbon removed.
 *
 * More menu is portaled to document.body so parent overflow never clips it.
 */
export function AppTopNav() {
  const { user, logout, isMockMode } = useAuth();
  const { locale, toggleLocale, t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpen: openPalette } = useCommandPaletteControl();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePos, setMorePos] = useState<{ top: number; left: number } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.display_name || 'Creator';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';
  const badge = useMemo(() => getCreatorBadge(0), []);

  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);
  const closeMore = useCallback(() => {
    setMoreOpen(false);
    setMorePos(null);
  }, []);

  const updateMorePosition = useCallback(() => {
    const el = moreTriggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - menuWidth - 8,
    );
    setMorePos({ top: rect.bottom + 8, left });
  }, []);

  const toggleMore = useCallback((e: { preventDefault(): void; stopPropagation(): void }) => {
    e.preventDefault();
    e.stopPropagation();
    setMoreOpen((open) => {
      if (open) {
        setMorePos(null);
        return false;
      }
      // Position immediately so the portal has coords on first paint
      const el = moreTriggerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const menuWidth = 220;
        setMorePos({
          top: rect.bottom + 8,
          left: Math.min(Math.max(8, rect.left), window.innerWidth - menuWidth - 8),
        });
      } else {
        setMorePos({ top: 64, left: 120 });
      }
      return true;
    });
  }, []);

  useEffect(() => {
    closeMore();
  }, [location.pathname, closeMore]);

  useLayoutEffect(() => {
    if (!moreOpen) return;
    updateMorePosition();
    const onResize = () => updateMorePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [moreOpen, updateMorePosition]);

  useEffect(() => {
    if (!userMenuOpen && !moreOpen) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        closeUserMenu();
      }
      if (moreOpen) {
        const inTrigger = moreTriggerRef.current?.contains(target);
        const inMenu = moreMenuRef.current?.contains(target);
        if (!inTrigger && !inMenu) closeMore();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeUserMenu();
        closeMore();
      }
    };
    // Use click (not mousedown) so the trigger click that opens isn't raced closed
    document.addEventListener('click', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen, moreOpen, closeUserMenu, closeMore]);

  const handleLogout = () => {
    closeUserMenu();
    logout();
    navigate('/login');
  };

  const label = (key: StudioStringKey) => t(key);
  const productName = locale === 'te' ? BRAND.productNameTelugu : BRAND.productName;
  const moreSectionActive = NAV_MORE.some((item) => isNavItemActive(location.pathname, item));

  const moreMenu = moreOpen && morePos && createPortal(
    <div
      id="app-topnav-more-menu"
      ref={moreMenuRef}
      className="app-topnav__more-menu--portal"
      role="menu"
      aria-label={label('nav.more')}
      style={{ top: morePos.top, left: morePos.left }}
    >
      {NAV_MORE.map((item) => {
        const active = isNavItemActive(location.pathname, item);
        return (
          <NavLink
            key={item.key}
            to={item.route}
            role="menuitem"
            className={`app-topnav__more-item${active ? ' app-topnav__more-item--active' : ''}`}
            onClick={closeMore}
          >
            <item.icon size={16} aria-hidden />
            <span>{label(item.labelKey)}</span>
            {item.statusKey && (
              <span className="app-nav-status">{label(item.statusKey)}</span>
            )}
          </NavLink>
        );
      })}
    </div>,
    document.body,
  );

  return (
    <header className="app-topnav app-topnav--premium app-topnav--v2">
      <div className="app-topnav__primary">
        <NavLink to="/" className="app-topnav__brand" aria-label={`${BRAND.nameTelugu} ${productName} home`}>
          <div className="app-topnav__brand-icon"><BrandMark size="sm" /></div>
          <div className="app-topnav__brand-text">
            <span className="app-topnav__brand-name">{BRAND.nameTelugu}</span>
            <span className="app-topnav__brand-sub">{productName}</span>
          </div>
          {isMockMode && <span className="badge badge-gold app-topnav__mock-badge">MOCK</span>}
        </NavLink>

        <nav className="app-topnav__nav app-topnav__nav--desktop" aria-label={label('nav.mainNav')}>
          {NAV_PRIMARY.map((item) => {
            const active = isNavItemActive(location.pathname, item);
            return (
              <NavLink
                key={item.key}
                to={item.route}
                end={item.end}
                className={`app-topnav__link${active ? ' app-topnav__link--active' : ''}`}
              >
                <item.icon size={16} aria-hidden />
                <span className="app-topnav__link-label">{label(item.labelKey)}</span>
              </NavLink>
            );
          })}

          <div className="app-topnav__more">
            <button
              ref={moreTriggerRef}
              type="button"
              className={`app-topnav__link app-topnav__more-trigger${moreOpen || moreSectionActive ? ' app-topnav__link--active' : ''}`}
              onClick={toggleMore}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              aria-controls="app-topnav-more-menu"
            >
              <MoreHorizontal size={16} aria-hidden />
              <span className="app-topnav__link-label">{label('nav.more')}</span>
              <ChevronDown
                size={14}
                className={`app-topnav__chevron${moreOpen ? ' app-topnav__chevron--open' : ''}`}
                aria-hidden
              />
            </button>
          </div>

          {isModerator && (
            <NavLink
              to="/moderation"
              className={({ isActive }) => `app-topnav__link app-topnav__link--admin${isActive ? ' app-topnav__link--active' : ''}`}
            >
              <Shield size={16} aria-hidden />
              <span className="app-topnav__link-label">{label('nav.moderation')}</span>
            </NavLink>
          )}
        </nav>

        <div className="app-topnav__actions">
          <button
            type="button"
            className="app-topnav__search"
            onClick={() => openPalette(true)}
            aria-label={label('nav.openCommandPalette')}
          >
            <Search size={16} aria-hidden />
            <span className="app-topnav__search-label">{label('nav.search')}</span>
            <kbd>{modKeyLabel()}+K</kbd>
          </button>
          <NotificationBell />
          <button
            type="button"
            className="locale-toggle locale-toggle--compact app-topnav__locale-desktop"
            onClick={toggleLocale}
            aria-label={label('nav.languageToggleAria')}
            title={label('nav.languageToggleAria')}
          >
            <Languages size={15} aria-hidden />
            <span className="locale-toggle__label">{label('nav.languageToggle')}</span>
          </button>
          <ThemeToggle compact />
          <div className="app-topnav__user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="app-topnav__user-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen((v) => !v);
              }}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
            >
              <span className="app-topnav__avatar">{userInitials(displayName)}</span>
              <span className="app-topnav__user-name">{displayName}</span>
              <ChevronDown size={14} className={`app-topnav__chevron${userMenuOpen ? ' app-topnav__chevron--open' : ''}`} aria-hidden />
            </button>
            {userMenuOpen && (
              <div className="app-topnav__dropdown" role="menu">
                <div className="app-topnav__dropdown-head">
                  <span className="app-topnav__dropdown-name">{displayName}</span>
                  {badge.label && (
                    <span className="app-topnav__dropdown-role">{badge.label}</span>
                  )}
                </div>
                <NavLink to="/profile" className="app-topnav__dropdown-item" role="menuitem" onClick={closeUserMenu}>
                  <User size={16} aria-hidden /> {label('nav.profile')}
                </NavLink>
                <NavLink to="/settings" className="app-topnav__dropdown-item" role="menuitem" onClick={closeUserMenu}>
                  <Settings size={16} aria-hidden /> {label('nav.settings')}
                </NavLink>
                <button type="button" className="app-topnav__dropdown-item app-topnav__dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                  <LogOut size={16} aria-hidden /> {label('nav.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {moreMenu}
    </header>
  );
}
