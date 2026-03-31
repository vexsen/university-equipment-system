import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminLayout, UserLayout } from './components/Layout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import SearchEquipment from './pages/user/SearchEquipment';
import BorrowRequest from './pages/user/BorrowRequest';
import MyBorrows from './pages/user/MyBorrows';
import CurrentStatus from './pages/user/CurrentStatus';
import FineBalance from './pages/user/FineBalance';

import AdminDashboard from './pages/admin/Dashboard';
import EquipmentManagement from './pages/admin/EquipmentManagement';
import BorrowApprovals from './pages/admin/BorrowApprovals';
import UserManagement from './pages/admin/UserManagement';
import FineManagement from './pages/admin/FineManagement';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/search'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<RootRedirect />} />

      {/* User routes */}
      <Route path="/user/search" element={
        <ProtectedRoute role="user">
          <UserLayout><SearchEquipment /></UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/user/borrow/:equipmentId" element={
        <ProtectedRoute role="user">
          <UserLayout><BorrowRequest /></UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/user/borrow-history" element={
        <ProtectedRoute role="user">
          <UserLayout><MyBorrows /></UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/user/status" element={
        <ProtectedRoute role="user">
          <UserLayout><CurrentStatus /></UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/user/fines" element={
        <ProtectedRoute role="user">
          <UserLayout><FineBalance /></UserLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin">
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/equipment" element={
        <ProtectedRoute role="admin">
          <AdminLayout><EquipmentManagement /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/approvals" element={
        <ProtectedRoute role="admin">
          <AdminLayout><BorrowApprovals /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute role="admin">
          <AdminLayout><UserManagement /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/fines" element={
        <ProtectedRoute role="admin">
          <AdminLayout><FineManagement /></AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
