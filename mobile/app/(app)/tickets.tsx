import TicketsScreen from '@/src/features/tickets/TicketsScreen';
import { AppErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';

export default function TicketsRoute() {
  return (
    <AppErrorBoundary>
      <TicketsScreen />
    </AppErrorBoundary>
  );
}
