import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi }   from '../tickets/api/tickets';
import { customersApi } from '../customers/api/customers';
import { useUiStore }   from '../../../stores/uiStore';
import {
  buildSummaryRows,
  buildCustomerStatusRows,
  buildCustomerActivityRows,
} from './rowBuilders';
import { type ReportType } from './types';
import ReportTypeSelector from './components/ReportTypeSelector';
import ReportCard         from './components/ReportCard';
import { exportReportPdf } from './utils/exportReportPdf';
import { networkEvents } from '../../../services/api/networkEvents';

// ── Inline error banner ───────────────────────────────────────────────────────

const ErrorBanner: React.FC<{
  message: string;
  onRetry: () => void;
  isDark: boolean;
}> = ({ message, onRetry, isDark }) => (
  <View style={{
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    borderColor: isDark ? '#7f1d1d' : '#fecaca',
    backgroundColor: isDark ? '#3b1515' : '#fef2f2',
  }}>
    <Text style={{ fontSize: 16, marginRight: 8 }}>⚠️</Text>
    <Text style={{ flex: 1, fontSize: 12, color: isDark ? '#fca5a5' : '#b91c1c', lineHeight: 17 }}>
      {message}
    </Text>
    <Pressable
      onPress={onRetry}
      style={({ pressed }) => ({
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, marginLeft: 8,
        backgroundColor: pressed ? '#dc2626' : '#ef4444',
      })}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Retry</Text>
    </Pressable>
  </View>
);

const ReportsScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';
  const [reportType, setReportType] = useState<ReportType>('summary');

  const {
    data: tickets = [], isLoading: tLoading,
    error: tError, refetch: refetchT,
  } = useQuery({ queryKey: ['reports-tickets'],   queryFn: () => ticketsApi.getTickets({}),   staleTime: 5 * 60_000 });

  const {
    data: customers = [], isLoading: cLoading,
    error: cError, refetch: refetchC,
  } = useQuery({ queryKey: ['reports-customers'], queryFn: () => customersApi.getCustomers(), staleTime: 5 * 60_000 });

  const loading = tLoading || cLoading;
  const error   = tError ?? cError;

  const summaryRows  = useMemo(() => buildSummaryRows(tickets, customers),         [tickets, customers]);
  const statusRows   = useMemo(() => buildCustomerStatusRows(tickets, customers),   [tickets, customers]);
  const activityRows = useMemo(() => buildCustomerActivityRows(tickets, customers), [tickets, customers]);

  const handleRefresh = () => { void refetchT(); void refetchC(); };

  const [exporting, setExporting] = useState(false);
  const [filteredData, setFilteredData] = useState({
    summaryRows, statusRows, activityRows, tickets,
  });

  const handleExport = async () => {
    if (exporting || loading) return;

    // Guard: don't export empty data
    const activeCount =
      reportType === 'summary'            ? filteredData.summaryRows.length
      : reportType === 'customers-status'   ? filteredData.statusRows.length
      : reportType === 'customers-activity' ? filteredData.activityRows.length
      : filteredData.tickets.length;

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

  const bg = isDark ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Page header ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a', flex: 1 }}>
            📊 Reports
          </Text>

          {/* Export PDF + Refresh — same height, same style */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

            {/* Export PDF */}
            {(() => {
              const activeCount =
                reportType === 'summary'            ? filteredData.summaryRows.length
                : reportType === 'customers-status'   ? filteredData.statusRows.length
                : reportType === 'customers-activity' ? filteredData.activityRows.length
                : filteredData.tickets.length;
              const isEmpty = activeCount === 0;
              const isDisabled = exporting || loading || isEmpty;

              return (
                <Pressable
                  onPress={handleExport}
                  disabled={isDisabled}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    height: 48, paddingHorizontal: 16, borderRadius: 12,
                    backgroundColor: exporting ? '#b91c1c' : pressed ? '#dc2626' : '#ef4444',
                    opacity: isDisabled ? 0.4 : 1,
                    shadowColor: '#ef4444',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDisabled ? 0 : 0.35,
                    shadowRadius: 5,
                    elevation: isDisabled ? 0 : 3,
                  })}
                >
                  <Text style={{ fontSize: 16, lineHeight: 20 }}>
                    {exporting ? '⏳' : isEmpty ? '🚫' : '📄'}
                  </Text>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 17 }}>
                      {exporting ? 'Exporting…' : 'Export PDF'}
                    </Text>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 14 }}>
                      {exporting ? 'Please wait' : isEmpty ? 'No data' : 'Current report'}
                    </Text>
                  </View>
                </Pressable>
              );
            })()}

            {/* Separator */}
            <View style={{ width: 1, height: 32, backgroundColor: isDark ? '#334155' : '#d1d5db' }} />

            {/* Refresh */}
            <Pressable
              onPress={handleRefresh}
              disabled={loading}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 8,
                height: 48, paddingHorizontal: 16, borderRadius: 12,
                backgroundColor: pressed
                  ? (isDark ? '#475569' : '#d1d5db')
                  : (isDark ? '#334155' : '#e5e7eb'),
                opacity: loading ? 0.5 : 1,
              })}
            >
              <Text style={{ fontSize: 16, lineHeight: 20 }}>
                {loading ? '⏳' : '🔄'}
              </Text>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#e2e8f0' : '#374151', lineHeight: 17 }}>
                  Refresh
                </Text>
                <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', lineHeight: 14 }}>
                  {loading ? 'Loading…' : 'Reload data'}
                </Text>
              </View>
            </Pressable>

          </View>
        </View>

        {/* Error banner — shows if either query failed */}
        {error && (
          <ErrorBanner
            message={
              (error as any)?.message === 'Network Error'
                ? 'Network error. Check your connection.'
                : 'Failed to load report data.'
            }
            onRetry={handleRefresh}
            isDark={isDark}
          />
        )}

        {/* Report type chips */}
        <ReportTypeSelector value={reportType} onChange={setReportType} isDark={isDark} />
      </View>

      {/* ── Report table card ── */}
      <View style={{ flex: 1, marginHorizontal: 16, marginBottom: 16 }}>
        <ReportCard
          reportType={reportType}
          summaryRows={summaryRows}
          statusRows={statusRows}
          activityRows={activityRows}
          tickets={tickets}
          loading={loading}
          isDark={isDark}
          onRefresh={handleRefresh}
          onFilteredData={setFilteredData}
        />
      </View>
    </View>
  );
};

export default ReportsScreen;
