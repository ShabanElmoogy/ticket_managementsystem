import React, { useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { REPORT_TYPES, type ReportType, DEFAULT_PERIOD } from '@/src/features/admin/reports/types';
import type {
  CustomerTicketsSummaryRow, CustomerStatusRow,
  CustomerActivityRow, ActivityPeriod, SlaMetricsRow,
} from '@/src/features/admin/reports/types';
import ActivityPeriodSelector from './ActivityPeriodSelector';
import SlaTable      from './tables/SlaTable';
import StatusTable   from './tables/StatusTable';
import SummaryTable  from './tables/SummaryTable';
import TicketsTable  from './tables/TicketsTable';
import ActivityTable from './tables/ActivityTable';
import ReportCompactRow from './views/ReportCompactRow';
import ReportGridCard   from './views/ReportGridCard';
import { useReportData } from './useReportData';
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

interface TaggedRow { id: string; _reportType: ReportType; [key: string]: any; }

const ReportCard: React.FC<Props> = ({
  reportType, summaryRows, statusRows, activityRows, tickets, slaRows,
  loading, onRefresh, onFilteredData,
  activityPeriod = DEFAULT_PERIOD, onActivityPeriodChange,
  view = 'table',
}) => {
  const [search, setSearch] = useState('');

  const label             = REPORT_TYPES.find(r => r.id === reportType)?.label ?? '';
  const isFiltered        = search.trim().length > 0;
  const searchPlaceholder = reportType === 'tickets'
    ? 'Search by title or customer…'
    : 'Search by customer name…';

  const {
    activePag, totalUnfiltered, activeRows,
    summaryPag, statusPag, activityPag, ticketsPag, slaPag,
    summarySorting, statusSorting, activitySorting, ticketsSorting, slaSorting,
  } = useReportData({
    reportType, summaryRows, statusRows, activityRows, tickets, slaRows,
    search, onFilteredData,
  });

  const totalItems = activePag.total;

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
        return <SummaryTable rows={summaryPag.rows}
          sort={summarySorting.sort} onSort={summarySorting.toggle} />;
      case 'customers-status':
        return <StatusTable rows={statusPag.rows}
          sort={statusSorting.sort} onSort={statusSorting.toggle} />;
      case 'customers-activity':
        return <ActivityTable rows={activityPag.rows}
          sort={activitySorting.sort} onSort={activitySorting.toggle}
          period={activityPeriod} />;
      case 'tickets':
        return <TicketsTable rows={ticketsPag.rows as Ticket[]}
          sort={ticketsSorting.sort} onSort={ticketsSorting.toggle} />;
      case 'sla':
        return <SlaTable rows={slaPag.rows as SlaMetricsRow[]}
          sort={slaSorting.sort} onSort={slaSorting.toggle} />;
    }
  }, [
    reportType, totalItems, isFiltered, search, activityPeriod,
    summaryPag.rows, statusPag.rows, activityPag.rows, ticketsPag.rows, slaPag.rows,
    summarySorting, statusSorting, activitySorting, ticketsSorting, slaSorting,
  ]);

  const headerExtras = useMemo(() =>
    reportType === 'customers-activity' && onActivityPeriodChange ? (
      <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
        <ActivityPeriodSelector value={activityPeriod} onChange={onActivityPeriodChange} />
      </View>
    ) : null,
    [reportType, activityPeriod, onActivityPeriodChange],
  );

  return (
    <DataCard<TaggedRow>
      title={label}
      totalCount={totalUnfiltered}
      rows={activeRows as TaggedRow[]}
      loading={loading}
      search={search}
      view={view}
      renderTable={renderTable}
      pagination={paginationForCard}
      renderGridItem={(item) => <ReportGridCard row={item} />}
      renderCompactItem={(item) => <ReportCompactRow row={item} />}
      headerExtras={headerExtras}
      onRefresh={onRefresh}
    />
  );
};

export default ReportCard;
