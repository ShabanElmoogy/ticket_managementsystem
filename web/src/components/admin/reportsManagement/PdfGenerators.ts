import type { Ticket } from "../../../services/api";
import { createTableReport } from "../../../utils/reports/reportTemplate";
import { generateCustomerTicketsSummaryReport, generateTicketsListReport } from "../../../utils/reports/summaryReports";
import type { CustomerTicketsSummaryRow, CustomerStatusRow, CustomerActivityRow, ReportType } from "./types";

export function generatePdf(
  reportType: ReportType,
  data: {
    summaryRows?: CustomerTicketsSummaryRow[];
    statusRows?: CustomerStatusRow[];
    activityRows?: CustomerActivityRow[];
    tickets?: Ticket[];
  },
  companyName: string
): void {
  if (reportType === "summary" && data.summaryRows) {
    const printable = data.summaryRows.map((r) => ({
      customerName: r.customerName,
      total: r.total,
      open: r.open,
      inProgress: r.inProgress,
      resolved: r.resolved,
      closed: r.closed,
      lastTicketAt: r.lastTicketAt,
    }));
    generateCustomerTicketsSummaryReport(printable, { companyName });
    return;
  }

  if (reportType === "tickets" && data.tickets) {
    generateTicketsListReport(data.tickets, { companyName });
    return;
  }

  if (reportType === "customers-status" && data.statusRows) {
    const head = [[
      "Customer",
      "Open",
      "In Progress",
      "Resolved",
      "Closed",
      "Total",
      "Open %",
      "Resolved %",
    ]];
    const body = data.statusRows.map((r) => [
      r.customerName,
      r.open,
      r.inProgress,
      r.resolved,
      r.closed,
      r.total,
      `${r.openPct.toFixed(1)}%`,
      `${r.resolvedPct.toFixed(1)}%`,
    ]);

    createTableReport(
      {
        head,
        body,
        styles: { fontSize: 9, cellPadding: 6, halign: "center" },
        headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: "center" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 220 },
          1: { cellWidth: 70 },
          2: { cellWidth: 90 },
          3: { cellWidth: 80 },
          4: { cellWidth: 70 },
          5: { cellWidth: 70 },
          6: { cellWidth: 80 },
          7: { cellWidth: 100 },
        },
      },
      { title: "Customer Status Breakdown", companyName, page: { orientation: "landscape" } }
    );
    return;
  }

  if (reportType === "customers-activity" && data.activityRows) {
    const head = [[
      "Customer",
      "Created (7d)",
      "Closed (7d)",
      "Created (30d)",
      "Closed (30d)",
    ]];
    const body = data.activityRows.map((r) => [
      r.customerName,
      r.created7,
      r.closed7,
      r.created30,
      r.closed30,
    ]);

    createTableReport(
      {
        head,
        body,
        styles: { fontSize: 9, cellPadding: 6, halign: "center" },
        headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: "center" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 240 },
          1: { cellWidth: 120 },
          2: { cellWidth: 120 },
          3: { cellWidth: 140 },
          4: { cellWidth: 140 },
        },
      },
      { title: "Customer Activity (7/30 days)", companyName, page: { orientation: "landscape" } }
    );
  }
}
