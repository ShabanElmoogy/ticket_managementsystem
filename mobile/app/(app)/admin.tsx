import AdminPanel from '@/src/features/admin/AdminPanel';
import { AppErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';

export default function AdminRoute() {
  return (
    <AppErrorBoundary>
      <AdminPanel />
    </AppErrorBoundary>
  );
}
