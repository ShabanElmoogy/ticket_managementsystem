/**
 * Ticket-specific PDF export.
 *
 * Produces a report with:
 *  - Summary stats row (total, open, in-progress, resolved, closed)
 *  - Status and priority colored badges
 *  - Due date with overdue highlighting
 *  - Assigned-to name, customer, application
 *  - Estimated hours
 */
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildPdfPage } from '@/src/shared/utils/pdfTemplate';
import { esc, fmtDate } from '@/src/shared/utils/htmlUtils';
import type { Ticket } from '@/src/services/api/types';
import type { TFunction } from 'i18next';

// ── Status badge styles ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  OPEN:              { bg: '#fef3c7', color: '#b45309' },
  IN_PROGRESS:       { bg: '#ede9fe', color: '#6d28d9' },
  PROGRAMMING:       { bg: '#e0e7ff', color: '#4338ca' },
  UNDER_DEVELOPMENT: { bg: '#dbeafe', color: '#1d4ed8' },
  CODE_REVIEW:       { bg: '#f0fdf4', color: '#15803d' },
  TESTING:           { bg: '#fef9c3', color: '#a16207' },
  RESOLVED:          { bg: '#d1fae5', color: '#065f46' },
  CLOSED:            { bg: '#f1f5f9', color: '#475569' },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN:              'Open',
  IN_PROGRESS:       'In Progress',
  PROGRAMMING:       'Programming',
  UNDER_DEVELOPMENT: 'Under Dev',
  CODE_REVIEW:       'Code Review',
  TESTING:           'Testing',
  RESOLVED:          'Resolved',
  CLOSED:            'Closed',
};

// ── Priority badge styles ─────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  LOW:    { bg: '#d1fae5', color: '#065f46' },
  MEDIUM: { bg: '#fef3c7', color: '#b45309' },
  HIGH:   { bg: '#fee2e2', color: '#b91c1c' },
  URGENT: { bg: '#fecaca', color: '#991b1b' },
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
  URGENT: 'Urgent',
};

// ── Badge helpers ─────────────────────────────────────────────────────────────

function statusBadge(status: string): string {
  const s     = STATUS_STYLES[status] ?? STATUS_STYLES.OPEN;
  const label = STATUS_LABELS[status] ?? status;
  return `<span class="badge" style="background:${s.bg};color:${s.color};border:1px solid ${s.color}44">${esc(label)}</span>`;
}

function priorityBadge(priority: string): string {
  const s     = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM;
  const label = PRIORITY_LABELS[priority] ?? priority;
  return `<span class="badge" style="background:${s.bg};color:${s.color};border:1px solid ${s.color}44">${esc(label)}</span>`;
}

function dueDateCell(iso: string | null | undefined, status: string): string {
  if (!iso) return '<span style="color:#9ca3af">—</span>';
  const due      = new Date(iso);
  const now      = new Date();
  const isOverdue = due < now && status !== 'RESOLVED' && status !== 'CLOSED';
  const color    = isOverdue ? '#dc2626' : '#374151';
  const weight   = isOverdue ? '700' : '500';
  const suffix   = isOverdue ? ' ⚠' : '';
  return `<span style="color:${color};font-weight:${weight}">${esc(fmtDate(iso))}${suffix}</span>`;
}

// ── Summary stats ─────────────────────────────────────────────────────────────

function buildSummary(tickets: Ticket[], t: TFunction): string {
  const total      = tickets.length;
  const open       = tickets.filter((tk) => tk.status === 'OPEN').length;
  const inProgress = tickets.filter((tk) => tk.status === 'IN_PROGRESS').length;
  const resolved   = tickets.filter((tk) => tk.status === 'RESOLVED').length;
  const closed     = tickets.filter((tk) => tk.status === 'CLOSED').length;
  const now        = new Date();
  const overdue    = tickets.filter((tk) => {
    if (!tk.dueDate) return false;
    return new Date(tk.dueDate) < now && tk.status !== 'RESOLVED' && tk.status !== 'CLOSED';
  }).length;

  const card = (value: number, label: string, bg: string, border: string, textColor: string) =>
    `<div style="flex:1;min-width:90px;background:${bg};border:1px solid ${border};border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:22px;font-weight:800;color:${textColor}">${value}</div>
      <div style="font-size:10px;color:${textColor};margin-top:2px;opacity:0.8">${esc(label)}</div>
    </div>`;

  return `
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      ${card(total,      t('tickets.pdf.total'),      '#eff6ff', '#bfdbfe', '#1d4ed8')}
      ${card(open,       t('tickets.pdf.open'),       '#fef3c7', '#fde68a', '#b45309')}
      ${card(inProgress, t('tickets.pdf.inProgress'), '#ede9fe', '#ddd6fe', '#6d28d9')}
      ${card(resolved,   t('tickets.pdf.resolved'),   '#d1fae5', '#a7f3d0', '#065f46')}
      ${card(closed,     t('tickets.pdf.closed'),     '#f1f5f9', '#e2e8f0', '#475569')}
      ${card(overdue,    t('tickets.pdf.overdue'),    '#fef2f2', '#fecaca', '#dc2626')}
    </div>
  `;
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportTicketPdf(
  tickets: Ticket[],
  t: TFunction,
): Promise<void> {
  const summary = buildSummary(tickets, t);

  const head = `<tr>
    <th style="text-align:left">${esc(t('tickets.columns.title'))}</th>
    <th>${esc(t('tickets.columns.status'))}</th>
    <th>${esc(t('tickets.columns.priority'))}</th>
    <th style="text-align:left">${esc(t('tickets.columns.assignedTo'))}</th>
    <th style="text-align:left">${esc(t('tickets.columns.customer'))}</th>
    <th>${esc(t('tickets.columns.dueDate'))}</th>
    <th>${esc(t('tickets.columns.estimatedHours'))}</th>
    <th>${esc(t('tickets.columns.created'))}</th>
  </tr>`;

  const body = tickets.map((tk) => {
    const assignedTo = tk.assignedTo?.name ?? '—';
    const customer   = tk.customer?.name   ?? '—';
    const hours      = tk.estimatedHours != null ? String(tk.estimatedHours) : '—';

    return `<tr>
      <td style="text-align:left;font-weight:600;max-width:200px">${esc(tk.title)}</td>
      <td>${statusBadge(tk.status)}</td>
      <td>${priorityBadge(tk.priority)}</td>
      <td style="text-align:left;color:#374151">${esc(assignedTo)}</td>
      <td style="text-align:left;color:#374151">${esc(customer)}</td>
      <td>${dueDateCell(tk.dueDate, tk.status)}</td>
      <td style="color:#374151">${esc(hours)}</td>
      <td style="color:#64748b;font-size:11px">${esc(fmtDate(tk.createdAt))}</td>
    </tr>`;
  }).join('');

  const tableHtml = `${summary}<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  const html = buildPdfPage(`${t('tickets.title')} (${tickets.length})`, tableHtml);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${t('tickets.title')}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
