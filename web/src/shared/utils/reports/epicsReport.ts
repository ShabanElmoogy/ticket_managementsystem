import type { UserOptions } from 'jspdf-autotable';
import type { Epic } from '../../../services/api/types';
import { createReport, addSectionTitle, addTable, saveReport } from './reportTemplate';
import { formatDate } from '../dateUtils';

export type EpicsReportOptions = {
  title?: string;
  companyName?: string;
  filters?: Record<string, string | undefined>;
  orientation?: 'portrait' | 'landscape';
  filename?: string;
};

function fmt(value?: string | null): string {
  if (!value) return '—';
  return formatDate(value);
}

function safe(v: unknown, fallback = '—'): string {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  return s === '' ? fallback : s;
}

function progressLabel(epic: Epic): string {
  if (!epic.stepsTotal) return '—';
  const pct = Math.round((epic.stepsDone / epic.stepsTotal) * 100);
  return `${epic.stepsDone}/${epic.stepsTotal} (${pct}%)`;
}

function featureBreakdown(epic: Epic): string {
  const counts = epic.featureStatusCounts ?? {};
  const parts = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${s.replace('_', ' ')}: ${n}`);
  return parts.length ? parts.join(', ') : '—';
}

export function generateEpicsReport(epics: Epic[], options: EpicsReportOptions = {}): void {
  const {
    title = 'Epics Report',
    companyName,
    filters = {},
    orientation = 'landscape',
    filename,
  } = options;

  const ctx = createReport({
    title,
    companyName,
    filters,
    page: { orientation, unit: 'pt', format: 'A4' },
  });

  // ── Summary section ──────────────────────────────────────────────────────
  let y = ctx.margins.top + 20;
  y = addSectionTitle(ctx, 'Summary', y);

  const byStatus = { DRAFT: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 } as Record<string, number>;
  let totalFeatures = 0;
  let totalSteps = 0;
  let doneSteps = 0;
  for (const e of epics) {
    byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    totalFeatures += e.featureCount;
    totalSteps += e.stepsTotal;
    doneSteps += e.stepsDone;
  }
  const overallPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  y = addTable(ctx, {
    startY: y + 6,
    head: [],
    body: [
      ['Total Epics', String(epics.length), 'Total Features', String(totalFeatures)],
      ['Active',      String(byStatus.ACTIVE ?? 0),    'Completed', String(byStatus.COMPLETED ?? 0)],
      ['Draft',       String(byStatus.DRAFT ?? 0),     'Cancelled', String(byStatus.CANCELLED ?? 0)],
      ['Overall Progress', `${overallPct}%`, 'Steps Done', `${doneSteps} / ${totalSteps}`],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4 } as UserOptions['styles'],
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120, textColor: [80, 80, 80] as [number, number, number] },
      1: { cellWidth: 80 },
      2: { fontStyle: 'bold', cellWidth: 120, textColor: [80, 80, 80] as [number, number, number] },
      3: { cellWidth: 80 },
    },
  });

  // ── Epics by status group ────────────────────────────────────────────────
  const STATUS_ORDER: Epic['status'][] = ['ACTIVE', 'DRAFT', 'COMPLETED', 'CANCELLED'];

  for (const status of STATUS_ORDER) {
    const group = epics.filter(e => e.status === status);
    if (group.length === 0) continue;

    y = addSectionTitle(ctx, `${status} (${group.length})`, y + 20);

    const body = group.map(e => [
      safe(e.title),
      safe(e.priority),
      safe(e.ownerName),
      safe(e.applicationName),
      safe(e.customerName),
      fmt(e.targetDate),
      e.estimatedDays ? `${e.estimatedDays}d` : '—',
      progressLabel(e),
      String(e.featureCount),
      featureBreakdown(e),
      fmt(e.updatedAt),
    ]);

    y = addTable(ctx, {
      startY: y + 6,
      head: [['Title', 'Priority', 'Owner', 'Application', 'Customer', 'Target', 'Est.', 'Progress', 'Features', 'Feature Breakdown', 'Updated']],
      body,
      styles: { fontSize: 8, cellPadding: 5 } as UserOptions['styles'],
      headStyles: {
        fillColor: [25, 118, 210] as [number, number, number],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      } as UserOptions['headStyles'],
      alternateRowStyles: { fillColor: [245, 248, 255] as [number, number, number] },
      columnStyles: {
        0: { cellWidth: 160 },  // Title
        1: { cellWidth: 60,  halign: 'center' },
        2: { cellWidth: 80 },
        3: { cellWidth: 80 },
        4: { cellWidth: 80 },
        5: { cellWidth: 60,  halign: 'center' },
        6: { cellWidth: 35,  halign: 'center' },
        7: { cellWidth: 80,  halign: 'center' },
        8: { cellWidth: 45,  halign: 'center' },
        9: { cellWidth: 'auto' },
        10: { cellWidth: 60, halign: 'center' },
      },
    });
  }

  saveReport(ctx, filename ?? `Epics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
