import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Epic } from '../../../services/api/types';
import type { EpicFeature } from '../detail/types';

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under Review',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  SHIPPED: 'Shipped',
  DECLINED: 'Declined',
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export function exportEpicPdf(epic: Epic, features: EpicFeature[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(25, 118, 210); // primary blue
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Epic Report', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${new Date().toLocaleString()}`, pageW - margin, 14, { align: 'right' });

  y = 30;
  doc.setTextColor(0, 0, 0);

  // ── Epic title ────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(epic.title, margin, y);
  y += 8;

  // ── Status / priority pills (text badges) ─────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Status: ${epic.status}   Priority: ${epic.priority}`, margin, y);
  y += 7;

  // ── Description ───────────────────────────────────────────────────────────
  if (epic.description) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(epic.description, pageW - margin * 2) as string[];
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  }

  // ── Meta grid ─────────────────────────────────────────────────────────────
  const meta: [string, string][] = [
    ['Owner',       epic.ownerName       ?? '—'],
    ['Application', epic.applicationName ?? '—'],
    ['Customer',    epic.customerName    ?? '—'],
    ['Target Date', fmt(epic.targetDate)],
    ['Created',     fmt(epic.createdAt)],
    ['Updated',     fmt(epic.updatedAt)],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: meta,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [80, 80, 80] },
      1: { textColor: [30, 30, 30] },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Progress summary ──────────────────────────────────────────────────────
  const progress = epic.stepsTotal ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
  const shipped  = features.filter((f) => f.status === 'SHIPPED').length;
  const active   = features.filter((f) => f.status !== 'DECLINED').length;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Progress', margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Features', 'Shipped', 'Steps Done', 'Steps Total', 'Completion']],
    body: [[
      String(epic.featureCount),
      `${shipped} / ${active} active`,
      String(epic.stepsDone),
      String(epic.stepsTotal),
      `${progress}%`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: [25, 118, 210], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Tags ──────────────────────────────────────────────────────────────────
  if ((epic.tags ?? []).length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Tags: ', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(epic.tags!.join(', '), margin + 12, y);
    y += 7;
  }

  // ── Blockers ──────────────────────────────────────────────────────────────
  const blockers = (epic.blockedBy ?? []).filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  if (blockers.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(194, 40, 40);
    doc.text(`⚠ Blocked by: ${blockers.map((b) => b.title).join(', ')}`, margin, y);
    y += 7;
  }

  // ── Features table ────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Features (${features.length})`, margin, y);
  y += 4;

  if (features.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('No features linked to this epic.', margin, y + 5);
  } else {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Title', 'Status', 'Votes', 'Created']],
      body: features.map((f, i) => [
        String(i + 1),
        f.title,
        STATUS_LABELS[f.status] ?? f.status,
        String((f as any).voteCount ?? 0),
        fmt(f.createdAt),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 26 },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        // Colour-code status column
        if (data.column.index === 2 && data.section === 'body') {
          const statusColors: Record<string, [number, number, number]> = {
            'Shipped':      [46, 125, 50],
            'In Progress':  [25, 118, 210],
            'Planned':      [2, 136, 209],
            'Under Review': [117, 117, 117],
            'Declined':     [198, 40, 40],
          };
          const c = statusColors[data.cell.text[0]];
          if (c) data.cell.styles.textColor = c;
        }
      },
    });
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${i} of ${pageCount}  ·  ${epic.title}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  const safeName = epic.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`epic_${safeName}.pdf`);
}
