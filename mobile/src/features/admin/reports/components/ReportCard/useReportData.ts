import { useMemo, useEffect, useRef } from 'react';
import type {
  CustomerTicketsSummaryRow, CustomerStatusRow,
  CustomerActivityRow, SlaMetricsRow,
} from '../../types';
import type { Ticket } from '../../../../../services/api/types';
import type { ReportType } from '../../types';
import { filterByQuery, customerFields, ticketFields } from './reportFilters';
import { usePagination, useSorting } from '../../../../../shared/components';

interface Input {
  reportType:   ReportType;
  summaryRows:  CustomerTicketsSummaryRow[];
  statusRows:   CustomerStatusRow[];
  activityRows: CustomerActivityRow[];
  tickets:      Ticket[];
  slaRows:      SlaMetricsRow[];
  search:       string;
  onFilteredData?: (data: {
    summaryRows:  CustomerTicketsSummaryRow[];
    statusRows:   CustomerStatusRow[];
    activityRows: CustomerActivityRow[];
    tickets:      Ticket[];
    slaRows:      SlaMetricsRow[];
  }) => void;
}

/**
 * Encapsulates all filter → sort → paginate logic for the ReportCard.
 * Returns the active pagination state, sorted rows for grid/compact,
 * and derived display values.
 */
export function useReportData({
  reportType, summaryRows, statusRows, activityRows, tickets, slaRows,
  search, onFilteredData,
}: Input) {
  // ── Filter ──────────────────────────────────────────────────────────────
  const filteredSummary  = useMemo(() => filterByQuery(summaryRows,  search, customerFields), [summaryRows,  search]);
  const filteredStatus   = useMemo(() => filterByQuery(statusRows,   search, customerFields), [statusRows,   search]);
  const filteredActivity = useMemo(() => filterByQuery(activityRows, search, customerFields), [activityRows, search]);
  const filteredTickets  = useMemo(() => filterByQuery(tickets,      search, ticketFields),   [tickets,      search]);
  const filteredSla      = useMemo(() => filterByQuery(slaRows,      search, customerFields), [slaRows,      search]);

  // ── Notify parent of filtered data (for PDF export) ─────────────────────
  const onFilteredDataRef = useRef(onFilteredData);
  useEffect(() => { onFilteredDataRef.current = onFilteredData; });

  const filteredKey = `${filteredSummary.length}|${filteredStatus.length}|${filteredActivity.length}|${filteredTickets.length}|${filteredSla.length}|${search}`;
  useEffect(() => {
    onFilteredDataRef.current?.({
      summaryRows:  filteredSummary  as CustomerTicketsSummaryRow[],
      statusRows:   filteredStatus   as CustomerStatusRow[],
      activityRows: filteredActivity as CustomerActivityRow[],
      tickets:      filteredTickets  as Ticket[],
      slaRows:      filteredSla      as SlaMetricsRow[],
    });
  }, [filteredKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sort ─────────────────────────────────────────────────────────────────
  const summarySorting  = useSorting(filteredSummary);
  const statusSorting   = useSorting(filteredStatus);
  const activitySorting = useSorting(filteredActivity);
  const ticketsSorting  = useSorting(filteredTickets as any[]);
  const slaSorting      = useSorting(filteredSla);

  // ── Paginate ─────────────────────────────────────────────────────────────
  const summaryPag  = usePagination(summarySorting.sorted);
  const statusPag   = usePagination(statusSorting.sorted);
  const activityPag = usePagination(activitySorting.sorted);
  const ticketsPag  = usePagination(ticketsSorting.sorted);
  const slaPag      = usePagination(slaSorting.sorted);

  const activePag =
    reportType === 'summary'            ? summaryPag
    : reportType === 'customers-status'   ? statusPag
    : reportType === 'customers-activity' ? activityPag
    : reportType === 'sla'                ? slaPag
    : ticketsPag;

  const totalUnfiltered =
    reportType === 'summary'            ? summaryRows.length
    : reportType === 'customers-status'   ? statusRows.length
    : reportType === 'customers-activity' ? activityRows.length
    : reportType === 'sla'                ? slaRows.length
    : tickets.length;

  // ── Active rows tagged with reportType (for grid/compact views) ──────────
  const activeRows = useMemo(() => {
    const raw =
      reportType === 'summary'            ? summarySorting.sorted
      : reportType === 'customers-status'   ? statusSorting.sorted
      : reportType === 'customers-activity' ? activitySorting.sorted
      : reportType === 'sla'                ? slaSorting.sorted
      : ticketsSorting.sorted;
    return raw.map((r: any) => ({ ...r, _reportType: reportType }));
  }, [reportType, summarySorting.sorted, statusSorting.sorted, activitySorting.sorted, slaSorting.sorted, ticketsSorting.sorted]);

  return {
    // pagination
    activePag,
    totalUnfiltered,
    // paged rows (for table view)
    summaryPag, statusPag, activityPag, ticketsPag, slaPag,
    // sorting (for table view)
    summarySorting, statusSorting, activitySorting, ticketsSorting, slaSorting,
    // all sorted rows tagged with type (for grid/compact)
    activeRows,
  };
}
