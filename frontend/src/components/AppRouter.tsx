import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import LoginForm from './auth/LoginForm';
import DashboardPage from '../pages/DashboardPage';
import SuperAdminDashboardPage from '../pages/SuperAdminDashboardPage';
import ProfilePage from '../pages/ProfilePage';
import KanbanPage from '../pages/KanbanPage';
import DocumentsPage from '../pages/DocumentsPage';
import AdminPage from '../pages/AdminPage';
import ProgrammingPage from '../pages/ProgrammingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ children, requiredRole }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppRouter: React.FC = () => {
  const { isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === 'SUPER_ADMIN' ? <SuperAdminDashboardPage /> : <DashboardPage />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <KanbanPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/programming"
          element={
            <ProtectedRoute>
              {(user?.role === 'PROGRAMMER' || user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN')
                ? <ProgrammingPage />
                : <Navigate to="/dashboard" replace />}
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
