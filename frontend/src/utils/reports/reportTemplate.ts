import jsPDF from "jspdf";
import autoTable, { type UserOptions, type HookData } from "jspdf-autotable";

// Margins for the PDF content area (in points since we use unit: 'pt')
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageOptions {
  orientation?: "portrait" | "landscape";
  format?: jsPDFOptions["format"]; // e.g., 'A4'
  unit?: jsPDFOptions["unit"]; // e.g., 'pt'
}

export interface HeaderFooterOptions {
  title?: string;
  companyName?: string;
  showGeneratedAt?: boolean;
  filters?: Record<string, string | undefined>;
  enableHeader?: boolean;
  enableFooter?: boolean;
}

export interface ReportTemplateOptions extends HeaderFooterOptions {
  page?: PageOptions;
  margins?: Margins;
  filename?: string;
  tableStyles?: {
    styles?: UserOptions["styles"];
    headStyles?: UserOptions["headStyles"];
    alternateRowStyles?: UserOptions["alternateRowStyles"];
    columnStyles?: UserOptions["columnStyles"];
  };
}

export interface ReportContext {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margins: Margins;
  options: Required<HeaderFooterOptions> & { filename?: string };
  headerFooterHook: (data: HookData) => void;
}

// jsPDF constructor options type (local minimal extract to avoid importing types package)
interface jsPDFOptions {
  orientation?: "portrait" | "landscape";
  unit?: "pt" | "px" | "in" | "mm" | "cm" | "ex" | "em" | "pc";
  format?: string | number[];
}

function defaultMargins(): Margins {
  return { top: 80, right: 40, bottom: 50, left: 40 };
}

function buildHeaderFooterHook(
  ctx: ReportContext
): (data: HookData) => void {
  const { doc, pageWidth, pageHeight, margins, options } = ctx;
  const totalPagesExp = "{total_pages_count_string}";

  return (data: HookData) => {
    const headerY = margins.top - 40;
    const headerLeft = margins.left;

    if (options.enableHeader) {
      const headerTitle = options.companyName
        ? `${options.companyName} — ${options.title ?? ""}`.trim()
        : options.title ?? "";

      if (headerTitle) {
        doc.setFontSize(12);
        doc.setTextColor(60);
        doc.setFont("helvetica", "bold");
        doc.text(headerTitle, headerLeft, headerY);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      if (options.showGeneratedAt) {
        const generatedAt = new Date().toLocaleString();
        doc.text(`Generated: ${generatedAt}`.trim(), headerLeft, headerY + 16);
      }

      const filterEntries = Object.entries(options.filters || {}).filter(([, v]) => v);
      if (filterEntries.length) {
        const filterText = filterEntries.map(([k, v]) => `${k}: ${v}`).join("; ");
        const maxWidth = pageWidth - margins.left - margins.right;
        doc.text(`Filters: ${filterText}`.substring(0, 220), headerLeft, headerY + 32, {
          maxWidth,
        });
      }
    }

    if (options.enableFooter) {
      const str = `Page ${data.pageNumber} of ${totalPagesExp}`;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(str, pageWidth - margins.right, pageHeight - 20, { align: "right" });
    }
  };
}

export function createReport(options: ReportTemplateOptions = {}): ReportContext {
  const page: jsPDFOptions = {
    orientation: options.page?.orientation ?? "landscape",
    unit: options.page?.unit ?? "pt",
    format: options.page?.format ?? "A4",
  };

  const doc = new jsPDF(page);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margins = options.margins ?? defaultMargins();

  const headerFooterOptions: Required<HeaderFooterOptions> & { filename?: string } = {
    title: options.title ?? "",
    companyName: options.companyName ?? "",
    showGeneratedAt: options.showGeneratedAt ?? true,
    filters: options.filters ?? {},
    enableHeader: options.enableHeader ?? true,
    enableFooter: options.enableFooter ?? true,
    filename: options.filename,
  };

  const ctx: ReportContext = {
    doc,
    pageWidth,
    pageHeight,
    margins,
    options: headerFooterOptions,
    headerFooterHook: () => {}, // placeholder set next line
  };

  ctx.headerFooterHook = buildHeaderFooterHook(ctx);
  return ctx;
}

export function addSectionTitle(ctx: ReportContext, label: string, startY?: number): number {
  const { doc, pageHeight, margins } = ctx;
  let y = startY ?? margins.top + 20;

  if (y > pageHeight - margins.bottom - 60) {
    doc.addPage();
    y = margins.top;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40);
  doc.text(label, margins.left, y);
  return y + 10;
}

export function addTable(
  ctx: ReportContext,
  table: Omit<UserOptions, "margin" | "didDrawPage"> & { startY?: number | false }
): number {
  const { doc, margins } = ctx;

  autoTable(doc, {
    ...table,
    margin: margins,
    didDrawPage: ctx.headerFooterHook,
  } as UserOptions);

  // Retrieve finalY from lastAutoTable
  const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  const startYVal = typeof table.startY === "number" ? table.startY : ctx.margins.top;
  return typeof finalY === "number" ? finalY : startYVal;
}

export function ensureTotalPages(ctx: ReportContext): void {
  const docWithTotal = ctx.doc as jsPDF & { putTotalPages?: (value: string) => void };
  try {
    if (typeof docWithTotal.putTotalPages === "function") {
      docWithTotal.putTotalPages("{total_pages_count_string}");
    }
  } catch {
    // ignore if plugin not present
  }
}

export function defaultFileName(title?: string): string {
  const base = (title && title.trim().length > 0 ? title : "Report").replace(/\s+/g, "_");
  return `${base}_${new Date().toISOString().slice(0, 10)}.pdf`;
}

export function saveReport(ctx: ReportContext, filename?: string): void {
  ensureTotalPages(ctx);
  const name = filename || ctx.options.filename || defaultFileName(ctx.options.title);
  ctx.doc.save(name);
}

// Convenience: one-shot table report
export function createTableReport(
  table: Omit<UserOptions, "margin" | "didDrawPage"> & { startY?: number },
  options: ReportTemplateOptions = {}
): void {
  const ctx = createReport(options);
  addTable(ctx, table);
  saveReport(ctx, options.filename);
}
