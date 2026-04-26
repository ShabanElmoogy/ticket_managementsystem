import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/src/features/admin/customers/api/customers';
import { ticketsApi } from '@/src/features/admin/tickets/api/tickets';
import {
  buildSummaryRows,
  buildCustomerStatusRows,
  buildCustomerActivityRows,
  buildSlaMetricsRows,
} from '@/src/features/admin/reports/utils/rowBuilders';
import { exportReportPdf } from '@/src/features/admin/reports/utils/exportReportPdf';
import { DEFAULT_PERIOD } from '@/src/features/admin/reports/types';
import type { ReportType, ActivityPeriod, SlaMetricsRow } from '@/src/features/admin/reports/types';
import { networkEvents } from '@/src/services/api/networkEvents';
import type {
  CustomerTicketsSummaryRow,
  CustomerStatusRow,
  CustomerActivityRow,
} from '@/src/features/admin/reports/types';
import type { Ticket } from '@/src/services/api/types';

export interface FilteredData {
  summaryRows:  CustomerTicketsSummaryRow[];
  statusRows:   CustomerStatusRow[];
  activityRows: CustomerActivityRow[];
  tickets:      Ticket[];
  slaRows:      SlaMetricsRow[];
}

export function useReports() {
  // ── Report type ────────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState<ReportType>('summary');

  // ── Activity period ────────────────────────────────────────────────────────
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>(DEFAULT_PERIOD);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: tickets = [],
    isLoading: tLoading,
    error: tError,
    refetch: refetchT,
  } = useQuery({
    queryKey: ['reports-tickets'],
    queryFn:  () => ticketsApi.getTickets({}),
    staleTime: 5 * 60_000,
  });

  const {
    data: customers = [],
    isLoading: cLoading,
    error: cError,
    refetch: refetchC,
  } = useQuery({
    queryKey: ['reports-customers'],
    queryFn:  () => customersApi.getCustomers(),
    staleTime: 5 * 60_000,
  });

  const loading = tLoading || cLoading;
  const error   = tError ?? cError;

  // ── Row builders ───────────────────────────────────────────────────────────
  const summaryRows  = useMemo(() => buildSummaryRows(tickets.filter(Boolean), customers),         [tickets, customers]);
  const statusRows   = useMemo(() => buildCustomerStatusRows(tickets.filter(Boolean), customers),   [tickets, customers]);
  const activityRows = useMemo(
    () => buildCustomerActivityRows(tickets.filter(Boolean), customers, activityPeriod.daysA, activityPeriod.daysB),
    [tickets, customers, activityPeriod],
  );
  const slaRows = useMemo(() => buildSlaMetricsRows(tickets.filter(Boolean), customers), [tickets, customers]);

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refresh = () => { void refetchT(); void refetchC(); };

  // ── Filtered data (updated by ReportCard via onFilteredData callback) ──────
  const [filteredData, setFilteredData] = useState<FilteredData>({
    summaryRows, statusRows, activityRows, tickets, slaRows,
  });

  // ── Active row count for the current report type ───────────────────────────
  const activeCount =
    reportType === 'summary'            ? filteredData.summaryRows.length
    : reportType === 'customers-status'   ? filteredData.statusRows.length
    : reportType === 'customers-activity' ? filteredData.activityRows.length
    : reportType === 'sla'                ? filteredData.slaRows.length
    : filteredData.tickets.length;

  // ── PDF export ─────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    if (exporting || loading) return;

    if (activeCount === 0) {
      networkEvents.emit('No data to export. Try a different report or clear the search filter.');
      return;
    }

    setExporting(true);
    try {
      await exportReportPdf(reportType, filteredData);
    } catch (e) {
      if (__DEV__) console.error('Report PDF export failed:', e);
      networkEvents.emit('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return {
    // State
    reportType,
    setReportType,
    activityPeriod,
    setActivityPeriod,
    // Data
    tickets,
    summaryRows,
    statusRows,
    activityRows,
    slaRows,
    // Status
    loading,
    error,
    exporting,
    activeCount,
    // Actions
    refresh,
    exportPdf,
    setFilteredData,
  };
}
