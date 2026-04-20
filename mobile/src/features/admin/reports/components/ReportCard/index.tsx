import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
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
import AppSearchInput         from '../../../../../shared/components/AppSearchInput';
import AppEmptyState          from '../../../../../shared/components/AppEmptyState';
import ReportGridCard         from './views/ReportGridCard';
import ReportCompactRow       from './views/ReportCompactRow';
import ReportCardHeader       from './ReportCardHeader';
import ReportTableView        from './views/ReportTableView';
import { useReportData }      from './useReportData';

// ── Props ─────────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

const ReportCard: React.FC<Props> = ({
  reportType, summaryRows, statusRows, activityRows, tickets, slaRows,
  loading, isDark, onRefresh, onFilteredData,
  activityPeriod = DEFAULT_PERIOD, onActivityPeriodChange,
  view = 'table',
}) => {
  const [search, setSearch] = useState('');

  const border = isDark ? '#334155' : '#e2e8f0';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const label  = REPORT_TYPES.find(r => r.id === reportType)?.label ?? '';
  const isFiltered = search.trim().length > 0;
  const searchPlaceholder = reportType === 'tickets'
    ? 'Search by title or customer…'
    : 'Search by customer name…';

  // ── Data (filter → sort → paginate) ──────────────────────────────────────
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
      return <AppEmptyState icon={isFiltered ? '🔍' : '📭'} message={isFiltered ? 'No results found' : 'No data available'} subtitle={search.trim().length > 0 ? `No rows match "${search}"` : undefined} />;
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

  // ── Shared list header ────────────────────────────────────────────────────
  const ListHeader = useMemo(() => (
    <View>
      <AppSearchInput value={search} onChange={setSearch} isDark={isDark} placeholder={searchPlaceholder} />
      {reportType === 'customers-activity' && onActivityPeriodChange && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
          <ActivityPeriodSelector value={activityPeriod} onChange={onActivityPeriodChange} isDark={isDark} />
        </View>
      )}
    </View>
  ), [isDark, search, searchPlaceholder, reportType, activityPeriod, onActivityPeriodChange]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{
      flex: 1, borderRadius: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: border,
      backgroundColor: cardBg,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 6, elevation: 2,
    }}>
      <ReportCardHeader
        label={label}
        totalItems={totalItems}
        totalUnfiltered={totalUnfiltered}
        isFiltered={isFiltered}
        isDark={isDark}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8' }}>Loading report data…</Text>
        </View>
      ) : view === 'table' ? (
        <ReportTableView
          renderTable={renderTable}
          ListHeader={ListHeader}
          activePag={activePag}
          loading={loading}
          onRefresh={onRefresh}
          isDark={isDark}
        />
      ) : view === 'grid' ? (
        <FlatList
          data={activeRows}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<AppEmptyState icon={isFiltered ? '🔍' : '📭'} message={isFiltered ? 'No results found' : 'No data available'} subtitle={search.trim().length > 0 ? `No rows match "${search}"` : undefined} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <ReportGridCard row={item} isDark={isDark} />}
        />
      ) : (
        <FlatList
          data={activeRows}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<AppEmptyState icon={isFiltered ? '🔍' : '📭'} message={isFiltered ? 'No results found' : 'No data available'} subtitle={search.trim().length > 0 ? `No rows match "${search}"` : undefined} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <ReportCompactRow row={item} isDark={isDark} />}
        />
      )}
    </View>
  );
};

export default ReportCard;
