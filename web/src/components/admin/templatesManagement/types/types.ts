import type React from 'react';

export interface TicketTemplatePayload {
  name: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number | null;
}

export interface TemplateItem {
  id: string;
  name: string;
  description?: string | null;
  meta?: React.ReactNode;
  detail?: React.ReactNode;
}
