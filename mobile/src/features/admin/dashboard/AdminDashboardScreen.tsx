import React from 'react';
import { View, ScrollView, RefreshControl, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/src/shared/components';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useThemeColors } from '@/src/constants/theme';
import AdminStatCard    from '../shared/AdminStatCard';
import AdminOverviewCard from '../shared/AdminOverviewCard';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import type { AdminDashboardStats } from './utils/computeStats';

// ── Stat card config ──────────────────────────────────────────────────────────

interface StatCardConfig {
  titleKey: string;
  getValue: (s: AdminDashboardStats) => number;
  icon:     string;
  color:    string;
}

const STAT_CARDS: StatCardConfig[] = [
  { titleKey: 'adminDashboard.totalCustomers',     getValue: (s) => s.totalCustomers,     icon: '👥', color: '#3b82f6' },
  { titleKey: 'adminDashboard.activeCustomers',    getValue: (s) => s.activeCustomers,    icon: '✅', color: '#10b981' },
  { titleKey: 'adminDashboard.totalApplications',  getValue: (s) => s.totalApplications,  icon: '📱', color: '#8b5cf6' },
  { titleKey: 'adminDashboard.activeApplications', getValue: (s) => s.activeApplications, icon: '🟢', color: '#10b981' },
  { titleKey: 'adminDashboard.totalTickets',       getValue: (s) => s.totalTickets,       icon: '🎫', color: '#f59e0b' },
  { titleKey: 'adminDashboard.openTickets',        getValue: (s) => s.openTickets,        icon: '🔓', color: '#ef4444' },
  { titleKey: 'adminDashboard.inProgress',         getValue: (s) => s.inProgressTickets,  icon: '⚡', color: '#a855f7' },
  { titleKey: 'adminDashboard.resolved',           getValue: (s) => s.resolvedTickets,    icon: '🏁', color: '#10b981' },
];

// ── Screen ────────────────────────────────────────────────────────────────────

const AdminDashboardScreen: React.FC = () => {
  const { t }              = useTranslation();
  const { stats, loading } = useAdminDashboard();
  const c                  = useThemeColors();
  const { width }          = useWindowDimensions();

  // Responsive grid: 2 cols on phone (<600), 4 cols on tablet (≥600)
  const COLS      = width >= 600 ? 4 : 2;
  const GAP       = 12;
  const PADDING   = 16;
  const cardWidth = (width - PADDING * 2 - GAP * (COLS - 1)) / COLS;

  return (
    <FeatureErrorBoundary featureName="AdminDashboard">
      <ScrollView
        style={{ flex: 1, backgroundColor: c.surface.secondary }}
        contentContainerStyle={{ padding: PADDING, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} tintColor="#3b82f6" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stat cards grid ── */}
        <SectionHeader title={t('adminDashboard.statistics')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 24, marginTop: 12 }}>
          {STAT_CARDS.map((config) => (
            <AdminStatCard
              key={config.titleKey}
              title={t(config.titleKey)}
              value={config.getValue(stats)}
              icon={config.icon}
              color={config.color}
              cardWidth={cardWidth}
            />
          ))}
        </View>

        {/* ── Overview cards ── */}
        <SectionHeader title={t('adminDashboard.overview')} />
        <View style={{ marginTop: 12 }}>
          <AdminOverviewCard
            title={t('customers.title')}
            icon="👥"
            total={stats.totalCustomers}
            active={stats.activeCustomers}
            activeLabel={t('common.active')}
          />
          <AdminOverviewCard
            title={t('applications.title')}
            icon="📱"
            total={stats.totalApplications}
            active={stats.activeApplications}
            activeLabel={t('common.active')}
          />
          <AdminOverviewCard
            title={t('tickets.title')}
            icon="🎫"
            total={stats.totalTickets}
            active={stats.openTickets}
            activeLabel={t('adminDashboard.open')}
            metricLabel={t('adminDashboard.resolutionRate')}
          />
        </View>
      </ScrollView>
    </FeatureErrorBoundary>
  );
};

export default AdminDashboardScreen;
