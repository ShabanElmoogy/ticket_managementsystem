import type { UserOptions } from "jspdf-autotable";
import type { Ticket } from "../../../services/api";
import { createReport, addSectionTitle, addTable, saveReport } from "./reportTemplate";
import { formatDate } from "../dateUtils";

export type CustomersTicketReportOptions = {
  title?: string;
  companyName?: string;
  filters?: Record<string, string | undefined>;
  orientation?: "portrait" | "landscape";
  filename?: string;
};

function safe<T>(v: T | undefined | null, fallback = "-"): string {
  if (v === undefined || v === null) return fallback;
  const s = String(v);
  return s.trim() === "" ? fallback : s;
}

export function generateCustomersTicketReport(
  tickets: Ticket[],
  options: CustomersTicketReportOptions = {}
): void {
  const {
    title = "Customers Ticket Report",
    companyName,
    filters = {},
    orientation = "landscape",
    filename,
  } = options;

  const ctx = createReport({
    title,
    companyName,
    filters,
    page: { orientation, unit: "pt", format: "A4" },
  });

  // Group tickets by customer
  const groups = new Map<string, Ticket[]>();
  for (const t of tickets) {
    const key = t.customer?.name || "Unassigned";
    const arr = groups.get(key) || [];
    arr.push(t);
    groups.set(key, arr);
  }

  // Sort groups by name
  const groupEntries = Array.from(groups.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  let currentY = ctx.margins.top + 20; // initial content start

  for (const [customerName, rows] of groupEntries) {
    currentY = addSectionTitle(ctx, `${customerName} (${rows.length})`, currentY);

    const body = rows
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .map((t) => [
        t.id.slice(0, 8),
        safe(t.title),
        t.status,
        t.priority,
        safe(t.application?.name),
        safe(t.assignedTo?.name, "Unassigned"),
        formatDate(t.createdAt),
        formatDate(t.dueDate),
      ]);

    const head = [[
      "ID",
      "Title",
      "Status",
      "Priority",
      "Application",
      "Assigned To",
      "Created",
      "Due",
    ]];

    const finalY = addTable(ctx, {
      head,
      body,
      startY: currentY + 6,
      styles: { fontSize: 9, cellPadding: 6 } as UserOptions["styles"],
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        halign: "left",
      } as UserOptions["headStyles"],
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 70 }, // ID
        1: { cellWidth: 220 }, // Title
        2: { cellWidth: 80, halign: "center" }, // Status
        3: { cellWidth: 70, halign: "center" }, // Priority
        4: { cellWidth: 140 }, // Application
        5: { cellWidth: 140 }, // Assigned To
        6: { cellWidth: 80, halign: "center" }, // Created
        7: { cellWidth: 80, halign: "center" }, // Due
      },
    });

    currentY = finalY + 24;
  }

  saveReport(ctx, filename || `Customers_Ticket_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default generateCustomersTicketReport;
