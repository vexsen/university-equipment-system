import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PendingCountProvider, usePendingCount } from '../context/PendingCountContext';
import { UserBorrowProvider, useUserBorrow } from '../context/UserBorrowContext';
import api from '../services/api';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  equipment: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="1"/></svg>,
  approval: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  fines: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  balance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  brand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M12 7v10M8 12h8"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

function AdminSidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';
  const { pendingCount, overdueCount } = usePendingCount();

  const navItems = [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/admin/equipment', icon: 'equipment', label: 'Equipment' },
    { to: '/admin/approvals', icon: 'approval', label: 'Approvals' },
    { to: '/admin/users', icon: 'users', label: 'Users' },
    { to: '/admin/fines', icon: 'fines', label: 'Fines' },
  ];

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">{icons.brand}</div>
          <div className="sidebar-brand-text">
            <h1>Equipment System</h1>
            <span>University Portal</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Management</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {icons[item.icon]}
              {item.label}
              {item.to === '/admin/approvals' && (pendingCount + overdueCount) > 0 && (
                <span style={{
                  marginLeft: 'auto', minWidth: 20, height: 20,
                  background: '#ef4444', color: 'white',
                  borderRadius: '50%', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {(pendingCount + overdueCount) > 99 ? '99+' : (pendingCount + overdueCount)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initial}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function UserTopNav({ pendingCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="topnav">
      <div className="topnav-brand">
        <div className="topnav-brand-dot" />
        University Equipment System
      </div>
      <nav className="topnav-links">
        <NavLink to="/user/search" className={({ isActive }) => isActive ? 'active' : ''}>Browse Equipment</NavLink>
        <NavLink to="/user/borrow-history" className={({ isActive }) => isActive ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          My Borrows
          {pendingCount > 0 && (
            <span style={{
              minWidth: 18, height: 18, background: '#ef4444', color: 'white',
              borderRadius: '50%', fontSize: 10, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
            }}>
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </NavLink>
        <NavLink to="/user/status" className={({ isActive }) => isActive ? 'active' : ''}>Current Status</NavLink>
        <NavLink to="/user/fines" className={({ isActive }) => isActive ? 'active' : ''}>Fines</NavLink>
      </nav>
      <div className="topnav-right">
        <span className="topnav-user">Welcome, <strong>{user?.name}</strong></span>
        <div className="topnav-avatar">{initial}</div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Sign Out</button>
      </div>
    </header>
  );
}

function MobileBottomNav({ pendingCount }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/user/search" className={({ isActive }) => isActive ? 'active' : ''}>
        {icons.search}
        <span>Browse</span>
      </NavLink>
      <NavLink to="/user/borrow-history" className={({ isActive }) => isActive ? 'active' : ''}>
        {icons.history}
        {pendingCount > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: '50%', transform: 'translateX(10px)',
            minWidth: 16, height: 16, background: '#ef4444', color: 'white',
            borderRadius: '50%', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
        )}
        <span>Borrows</span>
      </NavLink>
      <NavLink to="/user/status" className={({ isActive }) => isActive ? 'active' : ''}>
        {icons.status}
        <span>Status</span>
      </NavLink>
      <NavLink to="/user/fines" className={({ isActive }) => isActive ? 'active' : ''}>
        {icons.balance}
        <span>Fines</span>
      </NavLink>
    </nav>
  );
}

export function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PendingCountProvider>
      <div className="app-layout">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          {icons.menu}
        </button>
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <div className="admin-mobile-topbar">
            <span>Equipment System</span>
          </div>
          <div className="page-content">{children}</div>
        </main>
      </div>
    </PendingCountProvider>
  );
}

function UserLayoutInner({ children }) {
  const { userPendingCount } = useUserBorrow();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <UserTopNav pendingCount={userPendingCount} />
      <main style={{ flex: 1 }}>
        <div className="page-content">{children}</div>
      </main>
      <MobileBottomNav pendingCount={userPendingCount} />
    </div>
  );
}

export function UserLayout({ children }) {
  return (
    <UserBorrowProvider>
      <UserLayoutInner>{children}</UserLayoutInner>
    </UserBorrowProvider>
  );
}
