import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUiStore } from '../../../stores/uiStore';
import { useReports } from './hooks/useReports';
import ReportTypeSelector from './components/ReportTypeSelector';
import ReportCard         from './components/ReportCard';

// ── Error banner ──────────────────────────────────────────────────────────────

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

// ── Main screen ───────────────────────────────────────────────────────────────

const ReportsScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const {
    reportType, setReportType,
    activityPeriod, setActivityPeriod,
    tickets, summaryRows, statusRows, activityRows, slaRows,
    loading, error, exporting, activeCount,
    refresh, exportPdf, setFilteredData,
  } = useReports();

  const bg       = isDark ? '#0f172a' : '#f8fafc';
  const isEmpty  = activeCount === 0;
  const isExportDisabled = exporting || loading || isEmpty;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Page header ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>

          {/* Title */}
          <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a', flex: 1 }}>
            📊 Reports
          </Text>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

            {/* Export PDF */}
            <Pressable
              onPress={exportPdf}
              disabled={isExportDisabled}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 8,
                height: 48, paddingHorizontal: 16, borderRadius: 12,
                backgroundColor: exporting ? '#b91c1c' : pressed ? '#dc2626' : '#ef4444',
                opacity: isExportDisabled ? 0.4 : 1,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isExportDisabled ? 0 : 0.35,
                shadowRadius: 5,
                elevation: isExportDisabled ? 0 : 3,
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

            {/* Separator */}
            <View style={{ width: 1, height: 32, backgroundColor: isDark ? '#334155' : '#d1d5db' }} />

            {/* Refresh */}
            <Pressable
              onPress={refresh}
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

        {/* Error banner */}
        {error && (
          <ErrorBanner
            message={
              (error as any)?.message === 'Network Error'
                ? 'Network error. Check your connection.'
                : 'Failed to load report data.'
            }
            onRetry={refresh}
            isDark={isDark}
          />
        )}

        {/* Report type selector */}
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
          slaRows={slaRows}
          loading={loading}
          isDark={isDark}
          onRefresh={refresh}
          onFilteredData={setFilteredData}
          activityPeriod={activityPeriod}
          onActivityPeriodChange={setActivityPeriod}
        />
      </View>
    </View>
  );
};

export default ReportsScreen;
