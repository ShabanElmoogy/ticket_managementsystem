import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { REPORT_TYPES } from '@/src/features/admin/reports/types';
import { esc, fmtDate } from '@/src/shared/utils/htmlUtils';
import { buildPdfPage } from '@/src/shared/utils/pdfTemplate';
import type { Ticket } from '@/src/services/api/types';
import type {
  CustomerTicketsSummaryRow,
  CustomerStatusRow,
  CustomerActivityRow,
  SlaMetricsRow,
  ReportType,
} from '@/src/features/admin/reports/types';

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
  const head = `<tr><th>Title</th><th>Status</th><th>Priority</th><th>Customer</th><th>Application</th><th>Assigned To</th><th>Created</th></tr>`;
  const body = rows.map(t => `<tr>
    <td style="text-align:left">${esc(t.title)}</td>
    <td><span class="badge ${t.status.toLowerCase().replace('_', '_')}">${esc(t.status)}</span></td>
    <td><span class="badge ${t.priority.toLowerCase()}">${esc(t.priority)}</span></td>
    <td>${esc(t.customer?.name)}</td>
    <td>${esc(t.application?.name ?? '—')}</td>
    <td>${esc(t.assignedTo?.name ?? 'Unassigned')}</td>
    <td>${fmtDate(t.createdAt)}</td>
  </tr>`).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function slaHtml(rows: SlaMetricsRow[]): string {
  const head = `<tr><th>Customer</th><th>Total</th><th>With SLA</th><th>Overdue</th><th>Resolved</th><th>On Time</th><th>On Time %</th><th>Avg Resolution (hrs)</th></tr>`;
  const body = rows.map(r => {
    const onTimePct = r.resolved > 0 ? ((r.onTimeCount / r.resolved) * 100).toFixed(1) : '—';
    const overdueClass = r.overdue > 0 ? 'overdue' : 'resolved';
    return `<tr>
      <td style="text-align:left">${esc(r.customerName)}</td>
      <td class="total">${r.total}</td>
      <td><span class="badge open">${r.withDeadline}</span></td>
      <td><span class="badge ${overdueClass}">${r.overdue}</span></td>
      <td><span class="badge resolved">${r.resolved}</span></td>
      <td><span class="badge ontime">${r.onTimeCount}</span></td>
      <td class="pct-res">${onTimePct}${onTimePct !== '—' ? '%' : ''}</td>
      <td>${r.avgResolutionHours !== null ? `${r.avgResolutionHours}h` : '—'}</td>
    </tr>`;
  }).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

// ── Public export function ────────────────────────────────────────────────────

export interface ExportData {
  summaryRows:  CustomerTicketsSummaryRow[];
  statusRows:   CustomerStatusRow[];
  activityRows: CustomerActivityRow[];
  tickets:      Ticket[];
  slaRows:      SlaMetricsRow[];
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
    case 'sla':                tableHtml = slaHtml(data.slaRows);           break;
  }

  const html = buildPdfPage(label, tableHtml);
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
