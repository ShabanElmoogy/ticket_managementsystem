import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Ticket } from '../../../../services/api/types';
import type {
  CustomerTicketsSummaryRow,
  CustomerStatusRow,
  CustomerActivityRow,
  ReportType,
} from '../types';
import { REPORT_TYPES } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string | number | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

// ── Shared HTML chrome ────────────────────────────────────────────────────────

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
  h1   { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th {
    background: #3b82f6; color: #fff; font-weight: 700;
    text-align: center; padding: 9px 10px;
    text-transform: uppercase; letter-spacing: 0.4px; font-size: 11px;
  }
  td { padding: 8px 10px; text-align: center; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-weight: 700; font-size: 11px;
  }
  .open        { background: #fef3c7; color: #b45309; }
  .in_progress { background: #ede9fe; color: #6d28d9; }
  .resolved    { background: #d1fae5; color: #065f46; }
  .closed      { background: #f1f5f9; color: #475569; }
  .low         { background: #d1fae5; color: #065f46; }
  .medium      { background: #fef3c7; color: #b45309; }
  .high        { background: #fee2e2; color: #b91c1c; }
  .urgent      { background: #fecaca; color: #991b1b; }
  .pct-open    { color: #b45309; font-weight: 700; }
  .pct-res     { color: #065f46; font-weight: 700; }
  .total       { font-weight: 800; font-size: 14px; }
  footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
`;

function page(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>${CSS}</style></head><body>
  <h1>📊 ${esc(title)}</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  ${body}
  <footer>TicketFlow Reports</footer>
  </body></html>`;
}

// ── Per-report HTML builders ──────────────────────────────────────────────────

function summaryHtml(rows: CustomerTicketsSummaryRow[]): string {
  const head = `<tr><th>Customer</th><th>Total</th><th>Open</th><th>In Progress</th><th>Resolved</th><th>Closed</th><th>Last Ticket</th></tr>`;
  const body = rows.map(r => `<tr>
    <td style="text-align:left">${esc(r.customerName)}</td>
    <td class="total">${r.total}</td>
    <td><span class="badge open">${r.open}</span></td>
    <td><span class="badge in_progress">${r.inProgress}</span></td>
    <td><span class="badge resolved">${r.resolved}</span></td>
    <td><span class="badge closed">${r.closed}</span></td>
    <td>${fmtDate(r.lastTicketAt)}</td>
  </tr>`).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function statusHtml(rows: CustomerStatusRow[]): string {
  const head = `<tr><th>Customer</th><th>Total</th><th>Open</th><th>In Progress</th><th>Resolved</th><th>Closed</th><th>Open %</th><th>Resolved %</th></tr>`;
  const body = rows.map(r => `<tr>
    <td style="text-align:left">${esc(r.customerName)}</td>
    <td class="total">${r.total}</td>
    <td><span class="badge open">${r.open}</span></td>
    <td><span class="badge in_progress">${r.inProgress}</span></td>
    <td><span class="badge resolved">${r.resolved}</span></td>
    <td><span class="badge closed">${r.closed}</span></td>
    <td class="pct-open">${r.openPct.toFixed(1)}%</td>
    <td class="pct-res">${r.resolvedPct.toFixed(1)}%</td>
  </tr>`).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function activityHtml(rows: CustomerActivityRow[]): string {
  const head = `<tr><th>Customer</th><th>Created 7d</th><th>Closed 7d</th><th>Created 30d</th><th>Closed 30d</th></tr>`;
  const body = rows.map(r => `<tr>
    <td style="text-align:left">${esc(r.customerName)}</td>
    <td><span class="badge open">${r.created7}</span></td>
    <td><span class="badge resolved">${r.closed7}</span></td>
    <td><span class="badge open">${r.created30}</span></td>
    <td><span class="badge resolved">${r.closed30}</span></td>
  </tr>`).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function ticketsHtml(rows: Ticket[]): string {
  const head = `<tr><th>Title</th><th>Status</th><th>Priority</th><th>Customer</th><th>Assigned To</th><th>Created</th></tr>`;
  const body = rows.map(t => `<tr>
    <td style="text-align:left">${esc(t.title)}</td>
    <td><span class="badge ${t.status.toLowerCase().replace('_', '_')}">${esc(t.status)}</span></td>
    <td><span class="badge ${t.priority.toLowerCase()}">${esc(t.priority)}</span></td>
    <td>${esc(t.customer?.name)}</td>
    <td>${esc(t.assignedTo?.name ?? 'Unassigned')}</td>
    <td>${fmtDate(t.createdAt)}</td>
  </tr>`).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

// ── Public export function ────────────────────────────────────────────────────

export interface ExportData {
  summaryRows:  CustomerTicketsSummaryRow[];
  statusRows:   CustomerStatusRow[];
  activityRows: CustomerActivityRow[];
  tickets:      Ticket[];
}

export async function exportReportPdf(
  reportType: ReportType,
  data: ExportData,
): Promise<void> {
  const label = REPORT_TYPES.find(r => r.id === reportType)?.label ?? 'Report';

  let tableHtml = '';
  switch (reportType) {
    case 'summary':            tableHtml = summaryHtml(data.summaryRows);   break;
    case 'customers-status':   tableHtml = statusHtml(data.statusRows);     break;
    case 'customers-activity': tableHtml = activityHtml(data.activityRows); break;
    case 'tickets':            tableHtml = ticketsHtml(data.tickets);       break;
  }

  const html = page(label, tableHtml);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${label}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
