import ProgrammingScreen from '@/src/features/programming/ProgrammingScreen';
import { AppErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';

export default function ProgrammingRoute() {
  return (
    <AppErrorBoundary>
      <ProgrammingScreen />
    </AppErrorBoundary>
  );
}
