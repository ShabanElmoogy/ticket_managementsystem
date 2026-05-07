import ActivityFeedScreen from '@/src/features/dashboard/ActivityFeedScreen';
import { AppErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';

export default function ActivityFeedRoute() {
  return (
    <AppErrorBoundary>
      <ActivityFeedScreen />
    </AppErrorBoundary>
  );
}
