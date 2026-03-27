import React from 'react';
import {
  Box, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Typography,
} from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTenantSuspended, useTenantStatus } from '../stores';
import { isSuperAdmin, isProgrammerRole, isTenantAdmin } from '../types/roles';
import LoginForm from './auth/LoginForm';
import DashboardPage from '../pages/DashboardPage';
import SuperAdminDashboardPage from '../pages/SuperAdminDashboardPage';
import ProfilePage from '../pages/ProfilePage';
import KanbanPage from '../pages/KanbanPage';
import DocumentsPage from '../pages/DocumentsPage';
import AdminPage from '../pages/AdminPage';
import ProgrammingPage from '../pages/ProgrammingPage';
import TicketDetailPage from '../pages/TicketDetailPage';

// Per-status dialog content — only for statuses that restrict access
const STATUS_CONTENT: Record<string, { icon: string; title: string; body: string; btnColor: 'error' | 'warning' }> = {
  SUSPENDED: {
    icon: '🚫',
    title: 'Account Suspended',
    body: 'Your tenant account has been suspended by the administrator. You are in read-only mode — you can view existing data but cannot create, edit, or delete anything.',
    btnColor: 'error',
  },
  PAST_DUE: {
    icon: '⚠️',
    title: 'Payment Past Due',
    body: 'Your subscription payment is past due. You are in read-only mode until the outstanding balance is settled. Please update your billing information.',
    btnColor: 'warning',
  },
  EXPIRED: {
    icon: '⏰',
    title: 'Subscription Expired',
    body: 'Your subscription has expired. You are in read-only mode — you can view existing data but cannot create, edit, or delete anything.',
    btnColor: 'warning',
  },
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppRouter: React.FC = () => {
  const { isLoading, user } = useAuthStore();
  const suspended = useTenantSuspended();
  const tenantStatus = useTenantStatus();
  const isSuper = isSuperAdmin(user?.role);

  const [dialogDismissed, setDialogDismissed] = React.useState(false);

  // Reset every time a different user logs in so the dialog always shows on fresh login
  const prevUserIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (user?.id && user.id !== prevUserIdRef.current) {
      setDialogDismissed(false);
      prevUserIdRef.current = user.id;
    }
  }, [user?.id]);

  const content = tenantStatus ? STATUS_CONTENT[tenantStatus] : null;
  const showDialog = suspended && !isSuper && !!content && !dialogDismissed;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      {/* Notification dialog — shown once per session on login */}
      {content && (
        <Dialog open={showDialog} maxWidth="xs" fullWidth disableEscapeKeyDown>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {content.icon} {content.title}
          </DialogTitle>
          <DialogContent>
            <Typography>{content.body}</Typography>
            <Typography sx={{ mt: 1.5 }} variant="body2" color="text.secondary">
              Please contact your system administrator to resolve this.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              color={content.btnColor}
              onClick={() => setDialogDismissed(true)}
            >
              Understood, continue in read-only
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Routes>
        <Route path="/login" element={<PublicRoute><LoginForm /></PublicRoute>} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {isSuper ? <SuperAdminDashboardPage /> : <DashboardPage />}
            </ProtectedRoute>
          }
        />

        <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/kanban"    element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        <Route path="/admin"     element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />

        <Route
          path="/programming"
          element={
            <ProtectedRoute>
              {(isProgrammerRole(user?.role) || isTenantAdmin(user?.role) || isSuper)
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
