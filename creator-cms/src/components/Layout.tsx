import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  IndianRupee,
  Users,
  Wallet,
  Megaphone,
  User,
  Settings,
  LogOut,
  Shield,
  Menu,
  Leaf,
  Crown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';


const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, activeOn: (p: string) => p === '/' },
  { to: '/stories', label: 'Stories', icon: BookOpen, activeOn: (p: string) => p === '/stories' || (p.startsWith('/stories/') && !p.startsWith('/stories/new') && !p.includes('/chapters/')) },
  { to: '/stories', label: 'Analytics', icon: BarChart3, activeOn: (p: string) => p.startsWith('/analytics') },
  { to: '/', label: 'Earnings', icon: IndianRupee, activeOn: () => false },
  { to: '/', label: 'Subscribers', icon: Users, activeOn: () => false },
  { to: '/', label: 'Payouts', icon: Wallet, activeOn: () => false },
  { to: '/stories/new', label: 'Promotions', icon: Megaphone, activeOn: (p: string) => p === '/stories/new' },
  { to: '/onboarding', label: 'Profile', icon: User, activeOn: (p: string) => p === '/onboarding' },
  { to: '/onboarding', label: 'Settings', icon: Settings, activeOn: () => false },
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

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const displayName = user?.display_name || 'Creator';

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle navigation menu"
      >
        <Menu size={20} />
      </button>

      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside className={`premium-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="premium-sidebar__brand">
          <div className="premium-sidebar__brand-icon">
            <Leaf size={20} />
          </div>
          <span className="premium-sidebar__brand-name">Katha</span>
          {isMockMode && (
            <span className="badge badge-gold" style={{ marginLeft: 4, fontSize: '0.625rem' }}>MOCK</span>
          )}
        </div>

        <nav className="premium-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = item.activeOn(location.pathname);

            return (
              <NavLink
                key={`${item.label}-${item.to}`}
                to={item.to}
                end={item.to === '/'}
                className={() => `premium-nav__item${isActive ? ' active' : ''}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <NavLink
              to="/moderation"
              className={({ isActive }) => `premium-nav__item${isActive ? ' active' : ''}`}
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
            Pro Plan
          </div>
          <div className="premium-sidebar__pro-desc">You&apos;re on yearly plan</div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.8125rem', padding: '8px 12px' }}
            onClick={() => navigate('/onboarding')}
          >
            Manage plan
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
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 4 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="premium-main">
        <Outlet />
      </main>
    </div>
  );
}