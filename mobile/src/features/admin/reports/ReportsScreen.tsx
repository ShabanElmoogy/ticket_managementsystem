import React from 'react';
import { View } from 'react-native';
import { useUiStore } from '../../../stores/uiStore';
import { useReports } from './hooks/useReports';
import ReportsHeader      from './components/ReportsHeader';
import ReportErrorBanner  from './components/ReportErrorBanner';
import ReportTypeSelector from './components/ReportTypeSelector';
import ReportCard         from './components/ReportCard';

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

  const view    = useUiStore((s) => s.getAdminView('Reports'));
  const setView = useUiStore((s) => s.setAdminView);

  const bg = isDark ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <ReportsHeader
          isDark={isDark}
          view={view}
          onViewChange={(v) => setView('Reports', v)}
          loading={loading}
          exporting={exporting}
          isEmpty={activeCount === 0}
          onExport={exportPdf}
          onRefresh={refresh}
        />

        {error && (
          <ReportErrorBanner
            message={
              (error as any)?.message === 'Network Error'
                ? 'Network error. Check your connection.'
                : 'Failed to load report data.'
            }
            onRetry={refresh}
            isDark={isDark}
          />
        )}

        <ReportTypeSelector value={reportType} onChange={setReportType} isDark={isDark} />
      </View>

      {/* Report card */}
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
          view={view}
        />
      </View>
    </View>
  );
};

export default ReportsScreen;
