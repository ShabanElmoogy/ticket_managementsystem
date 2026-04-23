/**
 * Customer-specific PDF export.
 *
 * Produces a rich report with:
 *  - Colored status badges
 *  - Subscription type + date columns
 *  - 3-state end-date color (green / amber / red)
 *  - Ticket count
 *  - Summary stats row at the top
 */
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildPdfPage } from '@/src/shared/utils/pdfTemplate';
import { esc, fmtDate } from '@/src/shared/utils/htmlUtils';
import { getCustomerStatus } from '../components/customerColumns';
import type { Customer } from '@/src/services/api/types';
import type { TFunction } from 'i18next';

// ── Status badge HTML ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  ACTIVE:        { bg: '#f0fdf4', color: '#16a34a' },
  TRIAL:         { bg: '#f5f3ff', color: '#7c3aed' },
  EXPIRED:       { bg: '#fef2f2', color: '#dc2626' },
  INACTIVE:      { bg: '#f9fafb', color: '#6b7280' },
  PAY_AS_YOU_GO: { bg: '#f0f9ff', color: '#0284c7' },
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:        'Active',
  TRIAL:         'Trial',
  EXPIRED:       'Expired',
  INACTIVE:      'Inactive',
  PAY_AS_YOU_GO: 'Pay As You Go',
};

const MAINTENANCE_LABELS: Record<string, string> = {
  MONTHLY_SUBSCRIPTION: 'Monthly',
  FREE_TRIAL:           'Trial',
  PAY_AS_YOU_GO:        'Pay/Go',
};

function statusBadge(status: string): string {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE;
  const label = STATUS_LABELS[status] ?? status;
  return `<span class="badge" style="background:${s.bg};color:${s.color};border:1px solid ${s.color}44">${esc(label)}</span>`;
}

function endDateCell(iso: string | null | undefined): string {
  if (!iso) return '<span style="color:#9ca3af">—</span>';
  const end      = new Date(iso);
  const now      = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const color    = daysLeft < 0 ? '#dc2626' : daysLeft <= 30 ? '#d97706' : '#16a34a';
  const weight   = daysLeft <= 30 ? '700' : '500';
  return `<span style="color:${color};font-weight:${weight}">${esc(fmtDate(iso))}</span>`;
}

// ── Summary stats ─────────────────────────────────────────────────────────────

function buildSummary(customers: Customer[], t: TFunction): string {
  const total   = customers.length;
  const active  = customers.filter((c) => {
    const s = (c.subscriptionStatus as string | undefined) ?? getCustomerStatus(c);
    return s === 'ACTIVE' || s === 'TRIAL';
  }).length;
  const expired = customers.filter((c) => {
    const s = (c.subscriptionStatus as string | undefined) ?? getCustomerStatus(c);
    return s === 'EXPIRED';
  }).length;
  const rate    = total > 0 ? Math.round((active / total) * 100) : 0;

  return `
    <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:100px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#1d4ed8">${total}</div>
        <div style="font-size:11px;color:#3b82f6;margin-top:2px">${esc(t('customers.pdf.totalCustomers'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#16a34a">${active}</div>
        <div style="font-size:11px;color:#22c55e;margin-top:2px">${esc(t('customers.pdf.activeCustomers'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#dc2626">${expired}</div>
        <div style="font-size:11px;color:#ef4444;margin-top:2px">${esc(t('customers.pdf.expiredCustomers'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#7c3aed">${rate}%</div>
        <div style="font-size:11px;color:#8b5cf6;margin-top:2px">${esc(t('customers.pdf.activeRate'))}</div>
      </div>
    </div>
  `;
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportCustomerPdf(
  customers: Customer[],
  t: TFunction,
): Promise<void> {
  const summary = buildSummary(customers, t);

  const head = `<tr>
    <th style="text-align:left">${esc(t('customers.columns.name'))}</th>
    <th style="text-align:left">${esc(t('customers.columns.email'))}</th>
    <th>${esc(t('customers.detail.company'))}</th>
    <th>${esc(t('customers.columns.status'))}</th>
    <th>${esc(t('customers.detail.maintenanceType'))}</th>
    <th>${esc(t('customers.detail.subscriptionEnd'))}</th>
    <th>${esc(t('customers.columns.tickets'))}</th>
  </tr>`;

  const body = customers.map((c) => {
    const status = (c.subscriptionStatus as string | undefined) ?? getCustomerStatus(c);
    const maintenanceLabel = c.maintenanceType
      ? (MAINTENANCE_LABELS[c.maintenanceType] ?? c.maintenanceType)
      : '—';
    const tickets = c._count?.tickets ?? 0;

    return `<tr>
      <td style="text-align:left;font-weight:600">${esc(c.name)}</td>
      <td style="text-align:left;color:#475569">${esc(c.email)}</td>
      <td>${esc(c.company || '—')}</td>
      <td>${statusBadge(status)}</td>
      <td style="color:#374151;font-weight:500">${esc(maintenanceLabel)}</td>
      <td>${endDateCell(c.subscriptionEndDate)}</td>
      <td>
        <span class="badge" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe">
          ${tickets}
        </span>
      </td>
    </tr>`;
  }).join('');

  const tableHtml = `${summary}<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  const html = buildPdfPage(`${t('customers.title')} (${customers.length})`, tableHtml);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${t('customers.title')}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
