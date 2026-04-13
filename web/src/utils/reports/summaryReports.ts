import type { UserOptions } from "jspdf-autotable";
import type { Ticket } from "../../services/api";
import {
  createReport,
  addTable,
  saveReport,
  defaultFileName,
  type ReportTemplateOptions,
} from "./reportTemplate";
import { formatDate, formatDateTime } from "../dateUtils";

export type ReportCommonOptions = {
  title?: string;
  companyName?: string;
  filters?: Record<string, string | undefined>;
  orientation?: "portrait" | "landscape";
  filename?: string;
};

export interface CustomerTicketsSummaryRow {
  customerName: string;
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  lastTicketAt?: string | null;
}

export function generateCustomerTicketsSummaryReport(
  rows: CustomerTicketsSummaryRow[],
  options: ReportCommonOptions = {}
): void {
  const {
    title = "Customers Tickets Summary",
    companyName,
    filters = {},
    orientation = "landscape",
    filename,
  } = options;

  const ctx = createReport({
    title,
    companyName,
    filters,
    page: { orientation },
    filename,
  } as ReportTemplateOptions);

  addTable(ctx, {
    head: [[
      "Customer",
      "Total",
      "Open",
      "In Progress",
      "Resolved",
      "Closed",
      "Last Ticket",
    ]],
    body: rows.map((r) => [
      r.customerName,
      r.total,
      r.open,
      r.inProgress,
      r.resolved,
      r.closed,
      r.lastTicketAt ? formatDateTime(r.lastTicketAt) : "-",
    ]),
    styles: { fontSize: 9, cellPadding: 6, halign: "center" } as UserOptions["styles"],
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      halign: "center",
    } as UserOptions["headStyles"],
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 240, halign: "center" },
      1: { cellWidth: 70, halign: "center" },
      2: { cellWidth: 70, halign: "center" },
      3: { cellWidth: 90, halign: "center" },
      4: { cellWidth: 80, halign: "center" },
      5: { cellWidth: 70 , halign: "center"},
      6: { cellWidth: 150 , halign: "center"},
    },
  } as Omit<UserOptions, "margin" | "didDrawPage">);

  saveReport(ctx, filename || defaultFileName(title));
}

export function generateTicketsListReport(
  tickets: Ticket[],
  options: ReportCommonOptions = {}
): void {
  const {
    title = "Tickets List",
    companyName,
    filters = {},
    orientation = "landscape",
    filename,
  } = options;

  const ctx = createReport({
    title,
    companyName,
    filters,
    page: { orientation },
    filename,
  } as ReportTemplateOptions);

  const head = [[
    "ID",
    "Title",
    "Status",
    "Priority",
    "Customer",
    "Application",
    "Assigned To",
    "Created",
    "Due",
  ]];

  const body = tickets
    .slice()
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .map((t) => [
      t.id.slice(0, 8),
      t.title || "-",
      t.status,
      t.priority,
      t.customer?.name || "-",
      t.application?.name || "-",
      t.assignedTo?.name || "Unassigned",
      formatDate(t.createdAt),
      formatDate(t.dueDate),
    ]);

  addTable(ctx, {
    head,
    body,
    styles: { fontSize: 9, cellPadding: 6, halign: "center" } as UserOptions["styles"],
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      halign: "center",
    } as UserOptions["headStyles"],
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 220 },
      2: { cellWidth: 80 },
      3: { cellWidth: 70 },
      4: { cellWidth: 140 },
      5: { cellWidth: 140 },
      6: { cellWidth: 140 },
      7: { cellWidth: 80 },
      8: { cellWidth: 80 },
    },
  } as Omit<UserOptions, "margin" | "didDrawPage">);

  saveReport(ctx, filename || defaultFileName(title));
}
