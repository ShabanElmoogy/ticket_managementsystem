export interface CustomerTicketsSummaryRow {
  id: string; // customer id or 'unassigned'
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
  openPct: number; // 0-100
  resolvedPct: number; // 0-100
}

export interface CustomerActivityRow {
  id: string;
  customerName: string;
  created7: number;
  closed7: number;
  created30: number;
  closed30: number;
}

export const reportTypes = [
  { id: "summary", label: "Customers Tickets Summary" },
  { id: "customers-status", label: "Customer Status Breakdown" },
  { id: "customers-activity", label: "Customer Activity (7/30 days)" },
  { id: "tickets", label: "Tickets List" },
] as const;

export type ReportType = (typeof reportTypes)[number]["id"];
