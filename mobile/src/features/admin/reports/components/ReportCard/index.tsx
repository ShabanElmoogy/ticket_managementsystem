import React, { useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { REPORT_TYPES, type ReportType, DEFAULT_PERIOD } from '../../types';
import type {
  CustomerTicketsSummaryRow, CustomerStatusRow,
  CustomerActivityRow, ActivityPeriod, SlaMetricsRow,
} from '../../types';
import type { Ticket } from '../../../../../services/api/types';
import type { AdminView } from '../../../../../stores/uiStore';
import SummaryTable           from './tables/SummaryTable';
import StatusTable            from './tables/StatusTable';
import ActivityTable          from './tables/ActivityTable';
import TicketsTable           from './tables/TicketsTable';
import SlaTable               from './tables/SlaTable';
import ActivityPeriodSelector from './ActivityPeriodSelector';
import AppEmptyState          from '../../../../../shared/components/AppEmptyState';
import ReportGridCard         from './views/ReportGridCard';
import ReportCompactRow       from './views/ReportCompactRow';
import DataCard               from '../../../../../shared/components/DataCard';
import { useReportData }      from './useReportData';

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

  const totalItems = activePag.totalItems;

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
        return <SummaryTable rows={summaryPag.paged} isDark={isDark}
          sort={summarySorting.sort} onSort={summarySorting.toggle} />;
      case 'customers-status':
        return <StatusTable rows={statusPag.paged} isDark={isDark}
          sort={statusSorting.sort} onSort={statusSorting.toggle} />;
      case 'customers-activity':
        return <ActivityTable rows={activityPag.paged} isDark={isDark}
          sort={activitySorting.sort} onSort={activitySorting.toggle}
          period={activityPeriod} />;
      case 'tickets':
        return <TicketsTable rows={ticketsPag.paged as Ticket[]} isDark={isDark}
          sort={ticketsSorting.sort} onSort={ticketsSorting.toggle} />;
      case 'sla':
        return <SlaTable rows={slaPag.paged as SlaMetricsRow[]} isDark={isDark}
          sort={slaSorting.sort} onSort={slaSorting.toggle} />;
    }
  }, [
    reportType, totalItems, isFiltered, search, isDark, activityPeriod,
    summaryPag.paged, statusPag.paged, activityPag.paged, ticketsPag.paged, slaPag.paged,
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
      pagination={activePag}
      renderGridItem={(item) => <ReportGridCard row={item} isDark={isDark} />}
      renderCompactItem={(item) => <ReportCompactRow row={item} isDark={isDark} />}
      headerExtras={headerExtras}
      onRefresh={onRefresh}
    />
  );
};

export default ReportCard;
