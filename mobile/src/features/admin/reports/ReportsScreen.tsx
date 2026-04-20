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

const ReportsScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';
  const [reportType, setReportType] = useState<ReportType>('summary');

  const { data: tickets = [],   isLoading: tLoading, refetch: refetchT } =
    useQuery({ queryKey: ['reports-tickets'],   queryFn: () => ticketsApi.getTickets({}),    staleTime: 5 * 60_000 });
  const { data: customers = [], isLoading: cLoading, refetch: refetchC } =
    useQuery({ queryKey: ['reports-customers'], queryFn: () => customersApi.getCustomers(),  staleTime: 5 * 60_000 });

  const loading = tLoading || cLoading;

  const summaryRows  = useMemo(() => buildSummaryRows(tickets, customers),         [tickets, customers]);
  const statusRows   = useMemo(() => buildCustomerStatusRows(tickets, customers),   [tickets, customers]);
  const activityRows = useMemo(() => buildCustomerActivityRows(tickets, customers), [tickets, customers]);

  const handleRefresh = () => { void refetchT(); void refetchC(); };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting || loading) return;
    setExporting(true);
    try {
      await exportReportPdf(reportType, { summaryRows, statusRows, activityRows, tickets });
    } catch (e) {
      if (__DEV__) console.error('Report PDF export failed:', e);
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
            <Pressable
              onPress={handleExport}
              disabled={exporting || loading}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 8,
                height: 48, paddingHorizontal: 16, borderRadius: 12,
                backgroundColor: exporting ? '#b91c1c' : pressed ? '#dc2626' : '#ef4444',
                opacity: loading ? 0.5 : 1,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: exporting || loading ? 0 : 0.35,
                shadowRadius: 5,
                elevation: exporting || loading ? 0 : 3,
              })}
            >
              <Text style={{ fontSize: 16, lineHeight: 20 }}>
                {exporting ? '⏳' : '📄'}
              </Text>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 17 }}>
                  {exporting ? 'Exporting…' : 'Export PDF'}
                </Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 14 }}>
                  {exporting ? 'Please wait' : 'Current report'}
                </Text>
              </View>
            </Pressable>

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
        />
      </View>
    </View>
  );
};

export default ReportsScreen;
