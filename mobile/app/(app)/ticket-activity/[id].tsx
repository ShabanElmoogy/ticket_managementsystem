import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TicketActivityScreen from '@/src/features/tickets/components/TicketActivityScreen';
import { AppErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';

export default function TicketActivityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id) return null;

  return (
    <AppErrorBoundary>
      <TicketActivityScreen 
        ticketId={id} 
        onBack={() => router.back()} 
      />
    </AppErrorBoundary>
  );
}
