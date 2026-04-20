import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, RefreshControl,
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

interface Props {
  reportType:   ReportType;
  summaryRows:  CustomerTicketsSummaryRow[];
  statusRows:   CustomerStatusRow[];
  activityRows: CustomerActivityRow[];
  tickets:      Ticket[];
  loading:      boolean;
  isDark:       boolean;
  onRefresh:    () => void;
}

const ReportCard: React.FC<Props> = ({
  reportType, summaryRows, statusRows, activityRows, tickets,
  loading, isDark, onRefresh,
}) => {
  const border = isDark ? '#334155' : '#e2e8f0';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const label  = REPORT_TYPES.find(r => r.id === reportType)?.label ?? '';

  // Each report type has its own pagination state
  const summaryPag  = usePagination(summaryRows);
  const statusPag   = usePagination(statusRows);
  const activityPag = usePagination(activityRows);
  const ticketsPag  = usePagination(tickets);

  const activePag =
    reportType === 'summary'            ? summaryPag
    : reportType === 'customers-status'   ? statusPag
    : reportType === 'customers-activity' ? activityPag
    : ticketsPag;

  const totalItems = activePag.totalItems;

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
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#3b82f620' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>{totalItems} rows</Text>
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
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {reportType === 'summary' && (
              <SummaryTable rows={summaryPag.paged} isDark={isDark} />
            )}
            {reportType === 'customers-status' && (
              <StatusTable rows={statusPag.paged} isDark={isDark} />
            )}
            {reportType === 'customers-activity' && (
              <ActivityTable rows={activityPag.paged} isDark={isDark} />
            )}
            {reportType === 'tickets' && (
              <TicketsTable rows={ticketsPag.paged} isDark={isDark} />
            )}

            {totalItems === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>📭</Text>
                <Text style={{ fontSize: 14, color: isDark ? '#475569' : '#94a3b8' }}>No data available</Text>
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
