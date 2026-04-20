import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { REPORT_TYPES, type ReportType, DEFAULT_PERIOD } from '../types';
import type {
  CustomerTicketsSummaryRow, CustomerStatusRow,
  CustomerActivityRow, ActivityPeriod, SlaMetricsRow,
} from '../types';
import type { Ticket } from '../../../../services/api/types';
import SummaryTable  from './tables/SummaryTable';
import StatusTable   from './tables/StatusTable';
import ActivityTable from './tables/ActivityTable';
import TicketsTable  from './tables/TicketsTable';
import SlaTable      from './tables/SlaTable';
import Pagination    from './Pagination';
import { usePagination } from '../../../../shared/components/AppTable';
import { useSorting } from '../../../../shared/components/AppTable';
import ActivityPeriodSelector from './ActivityPeriodSelector';

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
}

// ── Search filter ─────────────────────────────────────────────────────────────

function filterByQuery<T>(rows: T[], q: string, getFields: (r: T) => string[]): T[] {
  if (!q.trim()) return rows;
  const lower = q.toLowerCase();
  return rows.filter((r) => getFields(r).some((v) => v.toLowerCase().includes(lower)));
}

const customerFields = (r: { customerName?: string }) => [r.customerName ?? ''];
const ticketFields   = (r: any) => [r.title ?? '', r.customer?.name ?? '', r.application?.name ?? ''];

// ── Search input ──────────────────────────────────────────────────────────────

const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
  placeholder: string;
}> = ({ value, onChange, isDark, placeholder }) => (
  <View style={{
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginVertical: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: value ? '#3b82f6' : (isDark ? '#334155' : '#e2e8f0'),
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  }}>
    <Text style={{ fontSize: 15, marginRight: 8, color: isDark ? '#475569' : '#94a3b8' }}>🔍</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
      autoCapitalize="none"
      autoCorrect={false}
      style={{ flex: 1, fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b', paddingVertical: 0 }}
    />
    {value.length > 0 && (
      <Pressable onPress={() => onChange('')} hitSlop={8}>
        <Text style={{ fontSize: 14, color: isDark ? '#475569' : '#94a3b8', marginLeft: 6 }}>✕</Text>
      </Pressable>
    )}
  </View>
);

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ isFiltered: boolean; search: string; isDark: boolean }> = ({ isFiltered, search, isDark }) => (
  <View style={{ padding: 40, alignItems: 'center' }}>
    <Text style={{ fontSize: 32, marginBottom: 10 }}>{isFiltered ? '🔍' : '📭'}</Text>
    <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#475569' : '#94a3b8', marginBottom: 4 }}>
      {isFiltered ? 'No results found' : 'No data available'}
    </Text>
    {search.trim().length > 0 && (
      <Text style={{ fontSize: 12, color: isDark ? '#334155' : '#cbd5e1', textAlign: 'center' }}>
        No rows match "{search}"
      </Text>
    )}
  </View>
);

// ── Sentinel for single-item FlatList ─────────────────────────────────────────

const TABLE_ITEM = [{ key: 'table' }];

// ── Main component ────────────────────────────────────────────────────────────

const ReportCard: React.FC<Props> = ({
  reportType, summaryRows, statusRows, activityRows, tickets, slaRows,
  loading, isDark, onRefresh, onFilteredData,
  activityPeriod = DEFAULT_PERIOD, onActivityPeriodChange,
}) => {
  const [search, setSearch] = useState('');

  const border = isDark ? '#334155' : '#e2e8f0';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const label  = REPORT_TYPES.find(r => r.id === reportType)?.label ?? '';

  // ── Filter rows ───────────────────────────────────────────────────────────
  const filteredSummary  = useMemo(() => filterByQuery(summaryRows,  search, customerFields), [summaryRows,  search]);
  const filteredStatus   = useMemo(() => filterByQuery(statusRows,   search, customerFields), [statusRows,   search]);
  const filteredActivity = useMemo(() => filterByQuery(activityRows, search, customerFields), [activityRows, search]);
  const filteredTickets  = useMemo(() => filterByQuery(tickets,      search, ticketFields),   [tickets,      search]);
  const filteredSla      = useMemo(() => filterByQuery(slaRows,      search, customerFields), [slaRows,      search]);

  // ── Notify parent of filtered data (for export) ───────────────────────────
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

  // ── Sort ──────────────────────────────────────────────────────────────────
  const summarySorting  = useSorting(filteredSummary);
  const statusSorting   = useSorting(filteredStatus);
  const activitySorting = useSorting(filteredActivity);
  const ticketsSorting  = useSorting(filteredTickets as any[]);
  const slaSorting      = useSorting(filteredSla);

  // ── Paginate ──────────────────────────────────────────────────────────────
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

  const totalItems = activePag.totalItems;
  const totalUnfiltered =
    reportType === 'summary'            ? summaryRows.length
    : reportType === 'customers-status'   ? statusRows.length
    : reportType === 'customers-activity' ? activityRows.length
    : reportType === 'sla'                ? slaRows.length
    : tickets.length;

  const isFiltered = search.trim().length > 0;

  const searchPlaceholder =
    reportType === 'tickets' ? 'Search by title or customer…' : 'Search by customer name…';

  // ── Table renderer ────────────────────────────────────────────────────────
  const renderTable = useCallback(() => {
    if (totalItems === 0) {
      return <EmptyState isFiltered={isFiltered} search={search} isDark={isDark} />;
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

  // ── FlatList header ───────────────────────────────────────────────────────
  const ListHeader = useMemo(() => (
    <View>
      <SearchInput value={search} onChange={setSearch} isDark={isDark} placeholder={searchPlaceholder} />
      {reportType === 'customers-activity' && onActivityPeriodChange && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
          <ActivityPeriodSelector value={activityPeriod} onChange={onActivityPeriodChange} isDark={isDark} />
        </View>
      )}
    </View>
  ), [isDark, search, searchPlaceholder, reportType, activityPeriod, onActivityPeriodChange]);

  return (
    <View style={{
      flex: 1, borderRadius: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: border,
      backgroundColor: cardBg,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 6, elevation: 2,
    }}>
      {/* ── Card header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: border,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      }}>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
          {label}
        </Text>
        <View style={{
          paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8,
          backgroundColor: isFiltered ? '#f59e0b22' : '#3b82f620',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: isFiltered ? '#f59e0b' : '#3b82f6' }}>
            {isFiltered ? `${totalItems} / ${totalUnfiltered}` : `${totalItems} rows`}
          </Text>
        </View>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8' }}>Loading report data…</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={TABLE_ITEM}
            keyExtractor={(item) => item.key}
            renderItem={renderTable}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={
              <Pagination
                page={activePag.page}
                totalPages={activePag.totalPages}
                totalItems={activePag.totalItems}
                pageSize={activePag.pageSize}
                hasNext={activePag.hasNext}
                hasPrev={activePag.hasPrev}
                onNext={activePag.next}
                onPrev={activePag.prev}
                isDark={isDark}
              />
            }
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
          />
        </View>
      )}
    </View>
  );
};

export default ReportCard;
