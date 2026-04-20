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
  created7: number;
  closed7: number;
  created30: number;
  closed30: number;
}

export const REPORT_TYPES = [
  { id: 'summary',             label: 'Tickets Summary'       },
  { id: 'customers-status',    label: 'Customer Status'       },
  { id: 'customers-activity',  label: 'Customer Activity'     },
  { id: 'tickets',             label: 'Tickets List'          },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]['id'];
