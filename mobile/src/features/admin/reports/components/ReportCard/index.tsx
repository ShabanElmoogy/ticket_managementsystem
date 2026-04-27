import React, { useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { REPORT_TYPES, type ReportType, DEFAULT_PERIOD } from '@/src/features/admin/reports/types';
import type {
  CustomerTicketsSummaryRow, CustomerStatusRow,
  CustomerActivityRow, ActivityPeriod, SlaMetricsRow,
} from '@/src/features/admin/reports/types';
import ActivityPeriodSelector from '@/src/features/admin/reports/components/ReportCard/ActivityPeriodSelector';
import SlaTable from '@/src/features/admin/reports/components/ReportCard/tables/SlaTable';
import StatusTable from '@/src/features/admin/reports/components/ReportCard/tables/StatusTable';
import SummaryTable from '@/src/features/admin/reports/components/ReportCard/tables/SummaryTable';
import TicketsTable from '@/src/features/admin/reports/components/ReportCard/tables/TicketsTable';
import ActivityTable from '@/src/features/admin/reports/components/ReportCard/tables/ActivityTable';
import ReportCompactRow from '@/src/features/admin/reports/components/ReportCard/views/ReportCompactRow';
import ReportGridCard from '@/src/features/admin/reports/components/ReportCard/views/ReportGridCard';
import { useReportData } from '@/src/features/admin/reports/components/ReportCard/useReportData';
import { AppEmptyState, DataCard } from '@/src/shared/components';
import type { Ticket } from '@/src/services/api/types';
import type { AdminView } from '@/src/stores/uiStore';

interface Props {
  reportType:   ReportType;
  summaryRows:  CustomerTicketsSummaryRow[];
  statusRows:   CustomerStatusRow[];
  activityRows: CustomerActivityRow[];
  tickets:      Ticket[];
  slaRows:      SlaMetricsRow[];
  loading:      boolean;
  isDark:       boolean;
  onRefresh:    () => void;
  onFilteredData?: (data: {
    summaryRows:  CustomerTicketsSummaryRow[];
    statusRows:   CustomerStatusRow[];
    activityRows: CustomerActivityRow[];
    tickets:      Ticket[];
    slaRows:      SlaMetricsRow[];
  }) => void;
  activityPeriod?: ActivityPeriod;
  onActivityPeriodChange?: (p: ActivityPeriod) => void;
  view?: AdminView;
}

// ── Tagged row type for grid/compact views ────────────────────────────────────
interface TaggedRow { id: string; _reportType: ReportType; [key: string]: any; }

const ReportCard: React.FC<Props> = ({
  reportType, summaryRows, statusRows, activityRows, tickets, slaRows,
  loading, isDark, onRefresh, onFilteredData,
  activityPeriod = DEFAULT_PERIOD, onActivityPeriodChange,
  view = 'table',
}) => {
  const [search, setSearch] = useState('');

  const label           = REPORT_TYPES.find(r => r.id === reportType)?.label ?? '';
  const isFiltered      = search.trim().length > 0;
  const searchPlaceholder = reportType === 'tickets'
    ? 'Search by title or customer…'
    : 'Search by customer name…';

  // ── Filter → sort → paginate ──────────────────────────────────────────────
  const {
    activePag, totalUnfiltered, activeRows,
    summaryPag, statusPag, activityPag, ticketsPag, slaPag,
    summarySorting, statusSorting, activitySorting, ticketsSorting, slaSorting,
  } = useReportData({
    reportType, summaryRows, statusRows, activityRows, tickets, slaRows,
    search, onFilteredData,
  });

  const totalItems = activePag.total;

  // Map PaginationResult → PaginationState shape expected by DataCard
  const paginationForCard = {
    page:       activePag.page,
    totalPages: activePag.totalPages,
    totalItems: activePag.total,
    pageSize:   activePag.pageSize,
    hasNext:    activePag.hasNext,
    hasPrev:    activePag.hasPrev,
    next:       activePag.next,
    prev:       activePag.prev,
  };

  // ── Table renderer ────────────────────────────────────────────────────────
  const renderTable = useCallback(() => {
    if (totalItems === 0) {
      return <AppEmptyState
        icon={isFiltered ? '🔍' : '📭'}
        message={isFiltered ? 'No results found' : 'No data available'}
        subtitle={isFiltered ? `No rows match "${search}"` : undefined}
      />;
    }
    switch (reportType) {
      case 'summary':
        return <SummaryTable rows={summaryPag.rows} isDark={isDark}
          sort={summarySorting.sort} onSort={summarySorting.toggle} />;
      case 'customers-status':
        return <StatusTable rows={statusPag.rows} isDark={isDark}
          sort={statusSorting.sort} onSort={statusSorting.toggle} />;
      case 'customers-activity':
        return <ActivityTable rows={activityPag.rows} isDark={isDark}
          sort={activitySorting.sort} onSort={activitySorting.toggle}
          period={activityPeriod} />;
      case 'tickets':
        return <TicketsTable rows={ticketsPag.rows as Ticket[]} isDark={isDark}
          sort={ticketsSorting.sort} onSort={ticketsSorting.toggle} />;
      case 'sla':
        return <SlaTable rows={slaPag.rows as SlaMetricsRow[]} isDark={isDark}
          sort={slaSorting.sort} onSort={slaSorting.toggle} />;
    }
  }, [
    reportType, totalItems, isFiltered, search, isDark, activityPeriod,
    summaryPag.rows, statusPag.rows, activityPag.rows, ticketsPag.rows, slaPag.rows,
    summarySorting, statusSorting, activitySorting, ticketsSorting, slaSorting,
  ]);

  // ── Header extras (activity period selector) ──────────────────────────────
  const headerExtras = useMemo(() =>
    reportType === 'customers-activity' && onActivityPeriodChange ? (
      <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
        <ActivityPeriodSelector value={activityPeriod} onChange={onActivityPeriodChange} isDark={isDark} />
      </View>
    ) : null,
    [reportType, activityPeriod, onActivityPeriodChange, isDark],
  );

  return (
    <DataCard<TaggedRow>
      title={label}
      isDark={isDark}
      totalCount={totalUnfiltered}
      rows={activeRows as TaggedRow[]}
      loading={loading}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder}
      view={view}
      renderTable={renderTable}
      pagination={paginationForCard}
      renderGridItem={(item) => <ReportGridCard row={item} isDark={isDark} />}
      renderCompactItem={(item) => <ReportCompactRow row={item} isDark={isDark} />}
      headerExtras={headerExtras}
      onRefresh={onRefresh}
    />
  );
};

export default ReportCard;
