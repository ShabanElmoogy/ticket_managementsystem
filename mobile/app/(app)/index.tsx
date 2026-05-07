import DashboardScreen from '@/src/features/dashboard/DashboardScreen';
import { AppErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';

export default function DashboardRoute() {
  return (
    <AppErrorBoundary>
      <DashboardScreen />
    </AppErrorBoundary>
  );
}
