/**
 * Application-specific PDF export.
 *
 * Produces a rich report with:
 *  - Summary stats row (total apps, total tickets, total customers)
 *  - Version badge column
 *  - Ticket + customer count badges
 *  - Description column (truncated)
 */
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildPdfPage } from '@/src/shared/utils/pdfTemplate';
import { esc, fmtDate } from '@/src/shared/utils/htmlUtils';
import type { Application } from '@/src/services/api/types';
import type { TFunction } from 'i18next';

// ── Summary stats ─────────────────────────────────────────────────────────────

function buildSummary(apps: Application[], t: TFunction): string {
  const total         = apps.length;
  const totalTickets  = apps.reduce((sum, a) => sum + (a._count?.tickets  ?? 0), 0);
  const totalCustomers = apps.reduce((sum, a) => sum + (a._count?.customers ?? 0), 0);
  const withVersion   = apps.filter((a) => !!a.version).length;

  return `
    <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:100px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#1d4ed8">${total}</div>
        <div style="font-size:11px;color:#3b82f6;margin-top:2px">${esc(t('applications.pdf.totalApplications'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#b45309">${totalTickets}</div>
        <div style="font-size:11px;color:#d97706;margin-top:2px">${esc(t('applications.pdf.totalTickets'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#16a34a">${totalCustomers}</div>
        <div style="font-size:11px;color:#22c55e;margin-top:2px">${esc(t('applications.pdf.totalCustomers'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#7c3aed">${withVersion}</div>
        <div style="font-size:11px;color:#8b5cf6;margin-top:2px">${esc(t('applications.pdf.withVersion'))}</div>
      </div>
    </div>
  `;
}

// ── Count badge HTML ──────────────────────────────────────────────────────────

function countBadge(count: number, bg: string, color: string, border: string): string {
  return `<span class="badge" style="background:${bg};color:${color};border:1px solid ${border}">${count}</span>`;
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportApplicationPdf(
  apps: Application[],
  t: TFunction,
): Promise<void> {
  const summary = buildSummary(apps, t);

  const head = `<tr>
    <th style="text-align:left">${esc(t('applications.columns.name'))}</th>
    <th>${esc(t('applications.columns.version'))}</th>
    <th style="text-align:left">${esc(t('common.description'))}</th>
    <th>${esc(t('applications.columns.tickets'))}</th>
    <th>${esc(t('applications.columns.customers'))}</th>
    <th>${esc(t('applications.columns.created'))}</th>
  </tr>`;

  const body = apps.map((a) => {
    const tickets   = a._count?.tickets   ?? 0;
    const customers = a._count?.customers ?? 0;
    // Truncate description to 60 chars for table readability
    const desc = a.description
      ? (a.description.length > 60 ? a.description.slice(0, 60) + '…' : a.description)
      : '—';

    const versionCell = a.version
      ? `<span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:4px;padding:2px 6px;font-family:monospace;font-size:11px">${esc(a.version)}</span>`
      : '<span style="color:#9ca3af">—</span>';

    return `<tr>
      <td style="text-align:left;font-weight:600">${esc(a.name)}</td>
      <td>${versionCell}</td>
      <td style="text-align:left;color:#475569;font-size:11px">${esc(desc)}</td>
      <td>${countBadge(tickets,   '#dbeafe', '#1d4ed8', '#bfdbfe')}</td>
      <td>${countBadge(customers, '#d1fae5', '#065f46', '#a7f3d0')}</td>
      <td style="color:#6b7280;font-size:11px">${esc(fmtDate(a.createdAt))}</td>
    </tr>`;
  }).join('');

  const tableHtml = `${summary}<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  const html = buildPdfPage(`${t('applications.title')} (${apps.length})`, tableHtml);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${t('applications.title')}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
