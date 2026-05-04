/**
 * visits.types.ts
 * Shared types, constants, and pure helpers for the CustomerVisits feature.
 */

import type { Customer, CustomerVisit } from '@/src/services/api/types/index';
import type { useThemeColors } from '@/src/constants/theme';

// ── Domain types ──────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'INACTIVE' | 'PAY_AS_YOU_GO';
export type VisitStatus        = 'PLANNED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ViewMode           = 'table' | 'grid' | 'compact';

// ── Config maps ───────────────────────────────────────────────────────────────

export const SUB_CFG: Record<SubscriptionStatus, { color: string; bg: string; label: string }> = {
  ACTIVE:        { color: '#16a34a', bg: '#f0fdf4', label: 'Active'        },
  TRIAL:         { color: '#7c3aed', bg: '#f5f3ff', label: 'Trial'         },
  EXPIRED:       { color: '#dc2626', bg: '#fef2f2', label: 'Expired'       },
  INACTIVE:      { color: '#6b7280', bg: '#f9fafb', label: 'Inactive'      },
  PAY_AS_YOU_GO: { color: '#0284c7', bg: '#f0f9ff', label: 'Pay As You Go' },
};

export const VISIT_CFG: Record<VisitStatus, { color: string; bg: string; label: string }> = {
  PLANNED:   { color: '#2563eb', bg: '#eff6ff', label: 'Planned'   },
  COMPLETED: { color: '#16a34a', bg: '#f0fdf4', label: 'Completed' },
  CANCELLED: { color: '#6b7280', bg: '#f9fafb', label: 'Cancelled' },
  NO_SHOW:   { color: '#d97706', bg: '#fffbeb', label: 'No Show'   },
};

export const STATUS_FILTERS: Array<{ value: VisitStatus | 'ALL'; label: string }> = [
  { value: 'ALL',       label: 'All'       },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PLANNED',   label: 'Planned'   },
  { value: 'NO_SHOW',   label: 'No Show'   },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function getSubStatus(customer: Customer): SubscriptionStatus {
  return (customer.subscriptionStatus as SubscriptionStatus | undefined) ?? 'INACTIVE';
}

export function getVisitCfg(status: string) {
  return VISIT_CFG[status as VisitStatus] ?? VISIT_CFG.COMPLETED;
}

// ── Shared prop interface for visit row components ────────────────────────────

export interface VisitRowProps {
  visit:    CustomerVisit;
  userId:   string;
  isAdmin:  boolean;
  onEdit:   (v: CustomerVisit) => void;
  onDelete: (id: string) => void;
  c:        ReturnType<typeof useThemeColors>;
}

// ── Visit stats shape ─────────────────────────────────────────────────────────

export interface VisitStats {
  total:     number;
  completed: number;
  planned:   number;
  noShow:    number;
}
