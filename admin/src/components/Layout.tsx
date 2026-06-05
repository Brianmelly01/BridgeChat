import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/users', icon: '👥', label: 'Users' },
  { path: '/reports', icon: '🚨', label: 'Reports' },
  { path: '/communities', icon: '🌐', label: 'Communities' },
];

export default function Layout() {
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6C63FF, #FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⬡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>BridgeChat</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div className="nav-item" style={{ marginBottom: 4 }}>
            <span className="nav-icon">👤</span>
            <span style={{ fontSize: 13 }}>{admin?.displayName || 'Admin'}</span>
          </div>
          <div className="nav-item" onClick={handleLogout} style={{ color: 'var(--error)' }}>
            <span className="nav-icon">🚪</span>
            Sign Out
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ fontSize: 20, fontWeight: 700 }}>Admin Dashboard</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--success)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Live</span>
          </div>
        </header>
        <main className="page fade-in"><Outlet /></main>
      </div>
    </div>
  );
}
