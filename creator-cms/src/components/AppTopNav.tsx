import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  BookOpenCheck,
  Calendar,
  ChevronDown,
  IndianRupee,
  LayoutDashboard,
  Trophy,
  LogOut,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useCommandPaletteControl } from './dashboard/CommandPalette';
import { getWritingStreak, ensureDemoStreak } from '../lib/writingStreak';
import { getCreatorBadge } from '../lib/creatorBadge';
import { BRAND } from '../lib/constants';
import { modKeyLabel } from '../lib/device';
import { BrandMark } from './studio/BrandMark';
import { DiyaIcon } from './studio/DiyaIcon';
import { isStudioLabsEnabled } from '../lib/featureFlags';

/** Core craft + Events + Literary Council. Labs: Tags & Platform map only. */
const CORE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true as const, lab: false },
  { to: '/stories', label: 'Stories', icon: BookOpen, lab: false },
  { to: '/events', label: 'Events', icon: Trophy, lab: false },
  { to: '/schedule', label: 'Schedule', icon: Calendar, lab: false },
  { to: '/community', label: 'Community', icon: Users, lab: false },
  { to: '/reviewers', label: 'Reviewer Pool', icon: BookOpenCheck, lab: false },
  { to: '/monetization', label: 'Earn', icon: IndianRupee, lab: false },
] as const;

function userInitials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function AppTopNav() {
  const { user, logout, isMockMode } = useAuth();
  const navigate = useNavigate();
  const { setOpen: openPalette } = useCommandPaletteControl();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.display_name || 'Creator';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';

  const streak = useMemo(() => {
    const s = getWritingStreak();
    return s.lastWriteDate ? s : ensureDemoStreak(1200);
  }, []);

  const badge = useMemo(() => getCreatorBadge(1200), []);
  const labsOn = isStudioLabsEnabled();
  const primaryNav = useMemo(
    () => CORE_NAV.filter((item) => !item.lab || labsOn),
    [labsOn],
  );

  const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) closeUserMenu();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeUserMenu(); };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen, closeUserMenu]);

  const handleLogout = () => {
    closeUserMenu();
    logout();
    navigate('/login');
  };

  return (
    <header className="app-topnav">
      <div className="app-topnav__primary">
        <NavLink to="/" className="app-topnav__brand" aria-label={`${BRAND.nameTelugu} ${BRAND.productName} home`}>
          <div className="app-topnav__brand-icon"><BrandMark size="sm" /></div>
          <div className="app-topnav__brand-text">
            <span className="app-topnav__brand-name">{BRAND.nameTelugu}</span>
            <span className="app-topnav__brand-sub">{BRAND.productName}</span>
          </div>
          {isMockMode && <span className="badge badge-gold app-topnav__mock-badge">MOCK</span>}
        </NavLink>

        <nav className="app-topnav__nav" aria-label="Main navigation">
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) => `app-topnav__link${isActive ? ' app-topnav__link--active' : ''}`}
            >
              <item.icon size={16} aria-hidden />
              <span className="app-topnav__link-label">{item.label}</span>
            </NavLink>
          ))}
          {isModerator && (
            <NavLink
              to="/moderation"
              className={({ isActive }) => `app-topnav__link app-topnav__link--admin${isActive ? ' app-topnav__link--active' : ''}`}
            >
              <Shield size={16} aria-hidden />
              <span className="app-topnav__link-label">Moderation</span>
            </NavLink>
          )}
        </nav>

        <div className="app-topnav__actions">
          <button
            type="button"
            className="app-topnav__search"
            onClick={() => openPalette(true)}
            aria-label="Open command palette"
          >
            <Search size={16} aria-hidden />
            <span className="app-topnav__search-label">Search…</span>
            <kbd>{modKeyLabel()}+K</kbd>
          </button>
          <NotificationBell />
          <ThemeToggle compact />
          <div className="app-topnav__user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="app-topnav__user-trigger"
              onClick={() => setUserMenuOpen((v) => !v)}
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
                  <span className="app-topnav__dropdown-role">{badge.label}</span>
                </div>
                <NavLink to="/profile" className="app-topnav__dropdown-item" role="menuitem" onClick={closeUserMenu}>
                  <User size={16} aria-hidden /> Profile
                </NavLink>
                <NavLink to="/settings" className="app-topnav__dropdown-item" role="menuitem" onClick={closeUserMenu}>
                  <Settings size={16} aria-hidden /> Settings
                </NavLink>
                <button type="button" className="app-topnav__dropdown-item app-topnav__dropdown-item--danger" role="menuitem" onClick={handleLogout}>
                  <LogOut size={16} aria-hidden /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="app-topnav__stats" aria-label="Creator stats">
        <span className="app-topnav__stat app-topnav__stat--pride" title={BRAND.prideLine}>
          {BRAND.mark} · Telugu craft
        </span>
        <span className="app-topnav__stat app-topnav__stat--diya" title="Writing streak — lamp lit">
          <DiyaIcon size={13} aria-hidden />
          {streak.currentStreak} day lamp lit
        </span>
        <span className="app-topnav__stat" title={badge.description}>
          <Award size={13} aria-hidden /> {badge.label}
        </span>
        <span className="app-topnav__stat" title="Base author share — scales with Story Trust up to 60%">
          {BRAND.creatorSharePct}%+ Story Trust
        </span>
      </div>
    </header>
  );
}