import type { Application } from './application';

export type MaintenanceType = 'MONTHLY_SUBSCRIPTION' | 'FREE_TRIAL' | 'PAY_AS_YOU_GO';
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PAY_AS_YOU_GO' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  company?: string;
  latitude: number | null;
  longitude: number | null;
  maintenanceType?: MaintenanceType | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  subscriptionStatus?: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  applications?: CustomerApplication[];
  _count?: { tickets: number };
}

export interface CustomerApplication {
  id: string;
  customerId: string;
  applicationId: string;
  assignedAt: string;
  customer?: Customer;
  application?: Application;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  applicationIds?: string[];
  latitude?: number | null;
  longitude?: number | null;
  maintenanceType?: MaintenanceType | null;
  subscriptionStartDate?: string | Date | null;
  subscriptionEndDate?: string | Date | null;
}
