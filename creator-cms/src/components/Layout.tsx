import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Leaf,
  Crown,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { BackendStatusBanner } from './BackendStatusBanner';
import { DeviceConflictNotice } from './DeviceConflictNotice';
import { NotificationBell } from './NotificationBell';

const PRIMARY_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stories', label: 'Stories', icon: BookOpen },
  { to: '/onboarding', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function userInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Layout() {
  const { user, logout, isMockMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((v) => !v), []);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isSidebarOpen, closeSidebar]);

  const displayName = user?.display_name || 'Creator';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`mobile-menu-btn${isSidebarOpen ? ' mobile-menu-btn--open' : ''}`}
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isSidebarOpen}
        aria-controls="creator-sidebar"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        id="creator-sidebar"
        className={`premium-sidebar${isSidebarOpen ? ' open' : ''}`}
      >
        <div className="premium-sidebar__brand">
          <div className="premium-sidebar__brand-icon">
            <Leaf size={20} />
          </div>
          <span className="premium-sidebar__brand-name">Katha</span>
          {isMockMode && (
            <span className="badge badge-gold premium-sidebar__mock-badge">MOCK</span>
          )}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="premium-nav" aria-label="Main navigation">
          <div className="premium-nav__section-label">Workspace</div>
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `premium-nav__item${isActive ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          {isModerator && (
            <NavLink
              to="/moderation"
              className={({ isActive }) => `premium-nav__item${isActive ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <Shield size={18} />
              Moderation
            </NavLink>
          )}
        </nav>

        <ThemeToggle />

        <div className="premium-sidebar__pro">
          <div className="premium-sidebar__pro-title">
            <Crown size={16} color="var(--dash-gold)" />
            Creator plan
          </div>
          <div className="premium-sidebar__pro-desc">60% revenue share on every subscription</div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.8125rem', padding: '8px 12px' }}
            onClick={() => { navigate('/onboarding'); closeSidebar(); }}
          >
            View onboarding
          </button>
        </div>

        <div className="premium-sidebar__user">
          <div className="premium-sidebar__avatar">{userInitials(displayName)}</div>
          <div className="premium-sidebar__user-info">
            <div className="premium-sidebar__user-name">{displayName}</div>
            <div className="premium-sidebar__user-role">Creator</div>
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/login'); }}
            aria-label="Sign out"
            className="premium-sidebar__logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="premium-main">
        <DeviceConflictNotice />
        <BackendStatusBanner />
        <header className="cms-topbar">
          <div className="cms-topbar__actions">
            <NotificationBell />
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}