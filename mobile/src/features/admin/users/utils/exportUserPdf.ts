/**
 * User-specific PDF export.
 *
 * Produces a rich report with:
 *  - Summary stats row (total, by role)
 *  - Role badge column
 *  - Ticket count badge
 */
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildPdfPage } from '@/src/shared/utils/pdfTemplate';
import { esc, fmtDate } from '@/src/shared/utils/htmlUtils';
import { Palette } from '@/src/constants/tokens';
import type { User } from '@/src/services/api/types';
import type { TFunction } from 'i18next';

// ── Role badge styles ─────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  SUPER_ADMIN:  { bg: '#fef2f2', color: Palette.red600,    label: 'Super Admin'  },
  TENANT_ADMIN: { bg: '#fffbeb', color: Palette.amber600,  label: 'Admin'        },
  EMPLOYEE:     { bg: '#f0fdf4', color: Palette.green600,  label: 'Employee'     },
  PROGRAMMER:   { bg: '#f5f3ff', color: Palette.violet600, label: 'Programmer'   },
};

function roleBadge(role: string): string {
  const s = ROLE_STYLES[role] ?? { bg: '#f9fafb', color: Palette.gray500, label: role };
  return `<span class="badge" style="background:${s.bg};color:${s.color};border:1px solid ${s.color}44">${esc(s.label)}</span>`;
}

// ── Summary stats ─────────────────────────────────────────────────────────────

function buildSummary(users: User[], t: TFunction): string {
  const total       = users.length;
  const admins      = users.filter((u) => u.role === 'TENANT_ADMIN' || u.role === 'SUPER_ADMIN').length;
  const employees   = users.filter((u) => u.role === 'EMPLOYEE').length;
  const programmers = users.filter((u) => u.role === 'PROGRAMMER').length;

  return `
    <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:100px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:${Palette.blue700}">${total}</div>
        <div style="font-size:11px;color:${Palette.blue500};margin-top:2px">${esc(t('users.pdf.totalUsers'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:${Palette.amber600}">${admins}</div>
        <div style="font-size:11px;color:${Palette.amber500};margin-top:2px">${esc(t('users.pdf.admins'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:${Palette.green600}">${employees}</div>
        <div style="font-size:11px;color:${Palette.green500};margin-top:2px">${esc(t('users.pdf.employees'))}</div>
      </div>
      <div style="flex:1;min-width:100px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:${Palette.violet600}">${programmers}</div>
        <div style="font-size:11px;color:${Palette.violet500};margin-top:2px">${esc(t('users.pdf.programmers'))}</div>
      </div>
    </div>
  `;
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportUserPdf(users: User[], t: TFunction): Promise<void> {
  const summary = buildSummary(users, t);

  const head = `<tr>
    <th style="text-align:left">${esc(t('users.columns.name'))}</th>
    <th style="text-align:left">${esc(t('users.columns.email'))}</th>
    <th>${esc(t('users.columns.role'))}</th>
    <th>${esc(t('users.columns.phone'))}</th>
    <th>${esc(t('users.columns.tickets'))}</th>
    <th>${esc(t('users.columns.created'))}</th>
  </tr>`;

  const body = users.map((u) => {
    const tickets = u._count?.assignedTickets ?? 0;
    return `<tr>
      <td style="text-align:left;font-weight:600">${esc(u.name)}</td>
      <td style="text-align:left;color:${Palette.slate600}">${esc(u.email)}</td>
      <td>${roleBadge(u.role)}</td>
      <td style="color:${Palette.gray500}">${esc(u.phone || '—')}</td>
      <td>
        <span class="badge" style="background:#dbeafe;color:${Palette.blue700};border:1px solid #bfdbfe">${tickets}</span>
      </td>
      <td style="color:${Palette.gray500};font-size:11px">${esc(fmtDate(u.createdAt))}</td>
    </tr>`;
  }).join('');

  const tableHtml = `${summary}<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  const html = buildPdfPage(`${t('users.title')} (${users.length})`, tableHtml);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${t('users.title')}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
