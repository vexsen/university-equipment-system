import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner" />
      <p>กำลังโหลด...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role && !(role === 'user' && ['student','staff'].includes(user.role))) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/search'} replace />;
  }
  return children;
}
