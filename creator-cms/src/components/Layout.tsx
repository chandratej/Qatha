import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenLine, Moon, Sun, LogOut, Shield, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout, isMockMode } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  // Sidebar starts collapsed by default to maximize screen space for writing/productive work.
  // Hamburger menu style: click to show, click again (or use close) to collapse.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside 
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
      >
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>కథ</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Creator Studio</span>
            {isMockMode && (
              <span style={{ marginLeft: 8, fontSize: '0.625rem', padding: '1px 5px', background: 'var(--gold)', color: '#222', borderRadius: 3, fontWeight: 600 }}>MOCK</span>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            title="Collapse menu"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/stories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          My Stories
        </NavLink>
        <NavLink to="/stories/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PenLine size={20} />
          Write
        </NavLink>
        <NavLink to="/moderation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Shield size={20} />
          Moderation
        </NavLink>

        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          {user && (
            <div style={{ padding: '8px 16px 16px', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
              {user.display_name || user.phone}
            </div>
          )}
          <button className="nav-item btn-ghost" onClick={() => setDark(!dark)} style={{ width: '100%' }}>
            {dark ? <Sun size={20} /> : <Moon size={20} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            className="nav-item btn-ghost"
            style={{ width: '100%' }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={20} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Minimal hamburger button - always present, tiny (maximizes productive screen space).
          Click to toggle sidebar (overlay drawer). Click again or backdrop/× to collapse. */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 400,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '6px 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)' // synced with design tokens
        }}
        title={isSidebarOpen ? "Collapse sidebar" : "Open sidebar menu"}
        aria-label="Toggle navigation menu"
      >
        <Menu size={18} />
      </button>

      {/* Backdrop - click anywhere outside sidebar to collapse it */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.15)', // subtle consistent overlay
            zIndex: 145
          }}
        />
      )}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}