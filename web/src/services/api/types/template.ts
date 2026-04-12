export interface TicketTemplate {
  id: string;
  name: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number | null;
  tenantId?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
}
