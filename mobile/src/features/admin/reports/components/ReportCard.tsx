import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { REPORT_TYPES, type ReportType } from '../types';
import type { CustomerTicketsSummaryRow, CustomerStatusRow, CustomerActivityRow } from '../types';
import type { Ticket } from '../../../../services/api/types';
import SummaryTable  from './tables/SummaryTable';
import StatusTable   from './tables/StatusTable';
import ActivityTable from './tables/ActivityTable';
import TicketsTable  from './tables/TicketsTable';
import Pagination    from './Pagination';
import { usePagination } from './usePagination';
import { useSorting } from './useSorting';

interface Props {
  reportType:   ReportType;
  summaryRows:  CustomerTicketsSummaryRow[];
  statusRows:   CustomerStatusRow[];
  activityRows: CustomerActivityRow[];
  tickets:      Ticket[];
  loading:      boolean;
  isDark:       boolean;
  onRefresh:    () => void;
  /** Called whenever the filtered dataset changes — used by parent for export */
  onFilteredData?: (data: {
    summaryRows:  CustomerTicketsSummaryRow[];
    statusRows:   CustomerStatusRow[];
    activityRows: CustomerActivityRow[];
    tickets:      Ticket[];
  }) => void;
}

// ── Search filter functions ───────────────────────────────────────────────────

function filterByQuery<T>(rows: T[], q: string, getFields: (r: T) => string[]): T[] {
  if (!q.trim()) return rows;
  const lower = q.toLowerCase();
  return rows.filter((r) => getFields(r).some((v) => v.toLowerCase().includes(lower)));
}

const customerFields = (r: { customerName?: string }) =>
  [r.customerName ?? ''];

const ticketFields = (r: any) =>
  [r.title ?? '', r.customer?.name ?? '', r.application?.name ?? ''];

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
      style={{
        flex: 1, fontSize: 13,
        color: isDark ? '#e2e8f0' : '#1e293b',
        paddingVertical: 0,
      }}
    />
    {value.length > 0 && (
      <Pressable onPress={() => onChange('')} hitSlop={8}>
        <Text style={{ fontSize: 14, color: isDark ? '#475569' : '#94a3b8', marginLeft: 6 }}>✕</Text>
      </Pressable>
    )}
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────

const ReportCard: React.FC<Props> = ({
  reportType, summaryRows, statusRows, activityRows, tickets,
  loading, isDark, onRefresh, onFilteredData,
}) => {
  const [search, setSearch] = useState('');

  const border = isDark ? '#334155' : '#e2e8f0';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const label  = REPORT_TYPES.find(r => r.id === reportType)?.label ?? '';

  // ── Filter rows by search query ───────────────────────────────────────────
  const filteredSummary  = useMemo(
    () => filterByQuery(summaryRows,  search, customerFields),
    [summaryRows,  search],
  );
  const filteredStatus   = useMemo(
    () => filterByQuery(statusRows,   search, customerFields),
    [statusRows,   search],
  );
  const filteredActivity = useMemo(
    () => filterByQuery(activityRows, search, customerFields),
    [activityRows, search],
  );
  const filteredTickets  = useMemo(
    () => filterByQuery(tickets,      search, ticketFields),
    [tickets, search],
  );

  // ── Notify parent of filtered data (for export) ─────────────────────────
  // Keep callback ref stable so useEffect doesn't re-run when parent re-renders
  const onFilteredDataRef = useRef(onFilteredData);
  useEffect(() => { onFilteredDataRef.current = onFilteredData; });

  // Use a stable string key — only call parent when actual filter results change
  const filteredKey = `${filteredSummary.length}|${filteredStatus.length}|${filteredActivity.length}|${filteredTickets.length}|${search}`;
  useEffect(() => {
    onFilteredDataRef.current?.({
      summaryRows:  filteredSummary  as CustomerTicketsSummaryRow[],
      statusRows:   filteredStatus   as CustomerStatusRow[],
      activityRows: filteredActivity as CustomerActivityRow[],
      tickets:      filteredTickets  as Ticket[],
    });
  }, [filteredKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sort filtered results (before pagination) ────────────────────────────
  const summarySorting  = useSorting(filteredSummary);
  const statusSorting   = useSorting(filteredStatus);
  const activitySorting = useSorting(filteredActivity);
  const ticketsSorting  = useSorting(filteredTickets as any[]);

  const activeSorting =
    reportType === 'summary'            ? summarySorting
    : reportType === 'customers-status'   ? statusSorting
    : reportType === 'customers-activity' ? activitySorting
    : ticketsSorting;

  // ── Paginate sorted+filtered results ─────────────────────────────────────
  const summaryPag  = usePagination(summarySorting.sorted);
  const statusPag   = usePagination(statusSorting.sorted);
  const activityPag = usePagination(activitySorting.sorted);
  const ticketsPag  = usePagination(ticketsSorting.sorted);

  const activePag =
    reportType === 'summary'            ? summaryPag
    : reportType === 'customers-status'   ? statusPag
    : reportType === 'customers-activity' ? activityPag
    : ticketsPag;

  const totalItems    = activePag.totalItems;
  const totalUnfiltered =
    reportType === 'summary'            ? summaryRows.length
    : reportType === 'customers-status'   ? statusRows.length
    : reportType === 'customers-activity' ? activityRows.length
    : tickets.length;

  const isFiltered = search.trim().length > 0;

  // Placeholder text per report type
  const searchPlaceholder =
    reportType === 'tickets'
      ? 'Search by title or customer…'
      : 'Search by customer name…';

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
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: border,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      }}>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
          {label}
        </Text>

        {/* Row count — shows filtered/total when searching */}
        <View style={{
          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
          backgroundColor: isFiltered ? '#f59e0b22' : '#3b82f620',
        }}>
          <Text style={{
            fontSize: 11, fontWeight: '700',
            color: isFiltered ? '#f59e0b' : '#3b82f6',
          }}>
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
          {/* ── Search input ── */}
          <SearchInput
            value={search}
            onChange={setSearch}
            isDark={isDark}
            placeholder={searchPlaceholder}
          />

          <ScrollView
            style={{ flex: 1 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {reportType === 'summary' && (
              <SummaryTable rows={summaryPag.paged} isDark={isDark}
                sort={summarySorting.sort} onSort={summarySorting.toggle} />
            )}
            {reportType === 'customers-status' && (
              <StatusTable rows={statusPag.paged} isDark={isDark}
                sort={statusSorting.sort} onSort={statusSorting.toggle} />
            )}
            {reportType === 'customers-activity' && (
              <ActivityTable rows={activityPag.paged} isDark={isDark}
                sort={activitySorting.sort} onSort={activitySorting.toggle} />
            )}
            {reportType === 'tickets' && (
              <TicketsTable rows={ticketsPag.paged as Ticket[]} isDark={isDark}
                sort={ticketsSorting.sort} onSort={ticketsSorting.toggle} />
            )}

            {totalItems === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>
                  {isFiltered ? '🔍' : '📭'}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#475569' : '#94a3b8', marginBottom: 4 }}>
                  {isFiltered ? 'No results found' : 'No data available'}
                </Text>
                {isFiltered && (
                  <Text style={{ fontSize: 12, color: isDark ? '#334155' : '#cbd5e1', textAlign: 'center' }}>
                    No rows match "{search}"
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* ── Pagination bar ── */}
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
        </View>
      )}
    </View>
  );
};

export default ReportCard;
