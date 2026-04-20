export interface CustomerTicketsSummaryRow {
  id: string;
  customerName: string;
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  lastTicketAt?: string | null;
}

export interface CustomerStatusRow {
  id: string;
  customerName: string;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
  openPct: number;
  resolvedPct: number;
}

export interface CustomerActivityRow {
  id: string;
  customerName: string;
  created7: number;   // "period A" created
  closed7: number;    // "period A" closed
  created30: number;  // "period B" created
  closed30: number;   // "period B" closed
}

export interface SlaMetricsRow {
  id: string;
  customerName: string;
  total: number;
  withDeadline: number;
  overdue: number;
  resolved: number;
  onTimeCount: number;
  avgResolutionHours: number | null;
}

export const REPORT_TYPES = [
  { id: 'summary',             label: 'Tickets Summary'   },
  { id: 'customers-status',    label: 'Customer Status'   },
  { id: 'customers-activity',  label: 'Customer Activity' },
  { id: 'tickets',             label: 'Tickets List'      },
  { id: 'sla',                 label: 'SLA Metrics'       },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]['id'];

// ── Activity period options ───────────────────────────────────────────────────

export interface ActivityPeriod {
  labelA: string;  // column header for period A
  labelB: string;  // column header for period B
  daysA:  number;
  daysB:  number;
}

export const ACTIVITY_PERIODS: ActivityPeriod[] = [
  { labelA: '7d',  labelB: '30d',  daysA: 7,   daysB: 30  },
  { labelA: '14d', labelB: '60d',  daysA: 14,  daysB: 60  },
  { labelA: '30d', labelB: '90d',  daysA: 30,  daysB: 90  },
  { labelA: '60d', labelB: '180d', daysA: 60,  daysB: 180 },
];

export const DEFAULT_PERIOD = ACTIVITY_PERIODS[0];
