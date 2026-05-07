import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TicketDetailScreen from '@/src/features/tickets/components/TicketDetailScreen';
import { AppErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';

export default function TicketDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id) return null;

  return (
    <AppErrorBoundary>
      <TicketDetailScreen 
        ticketId={id} 
        onBack={() => router.back()} 
      />
    </AppErrorBoundary>
  );
}
