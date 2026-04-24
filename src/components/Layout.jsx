import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { useTheme } from '@/contexts/ThemeContext';
import { dashboardT } from '@/lib/dashboardI18n';
import '@/styles/dashboard.css';

const NAV_KEYS = [
  { to: '/dashboard', key: 'dashboard', icon: '⊞' },
  { to: '/courses', key: 'courses', icon: '▶' },
  { to: '/signals', key: 'signals', icon: '◉' },
  { to: '/documents', key: 'documents', icon: '📄' },
  { to: '/booking', key: 'booking', icon: '◷' },
  { to: '/profile', key: 'profile', icon: '◯' },
];

export default function Layout() {
  const { signOut, user, profile } = useAuth();
  const { lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const s = dashboardT[lang];
  const currentTier = profile?.tier || 'free';
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    navigate('/');
  };

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-logo">Nicotradesss</NavLink>
          {!collapsed && (
            <button
              className="sidebar-toggle"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
            >
              ‹
            </button>
          )}
          {collapsed && (
            <button
              className="sidebar-toggle"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
            >
              ›
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          {NAV_KEYS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? s[item.key] : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{s[item.key]}</span>
            </NavLink>
          ))}
          <a href="/" className="sidebar-link" title={collapsed ? 'Home' : undefined}>
            <span className="sidebar-icon">⌂</span>
            <span className="sidebar-label">{s.home || 'Home'}</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          {user?.email && (
            <div className="sidebar-user-email">{user.email}</div>
          )}
          <div className={`sidebar-user-tier tier-${currentTier}`}>
            {currentTier.toUpperCase()}
          </div>
          <br />
          <div className="sidebar-lang">
            {['NO','EN','ES'].map(l => (
              <button key={l} className={`lang-btn ${lang===l?'active':''}`} onClick={()=>setLang(l)}>{l}</button>
            ))}
            <button className="lang-btn" onClick={toggleTheme} title={theme === 'dark' ? s.lightMode : s.darkMode}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
          <button className="sidebar-signout" onClick={handleSignOut}>{s.signOut}</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {NAV_KEYS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{s[item.key]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
