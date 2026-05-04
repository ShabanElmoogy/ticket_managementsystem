import React from 'react';
import { View, ScrollView, RefreshControl, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/src/shared/components';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useThemeColors } from '@/src/constants/theme';
import { Palette } from '@/src/constants/tokens';
import AdminStatCard    from '../shared/AdminStatCard';
import AdminOverviewCard from '../shared/AdminOverviewCard';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import type { AdminDashboardStats } from './utils/computeStats';
import type { IoniconName } from '@/src/components/layout/header/navItems';

// ── Stat card config ──────────────────────────────────────────────────────────

interface StatCardConfig {
  titleKey: string;
  getValue: (s: AdminDashboardStats) => number;
  icon:     IoniconName;
  color:    string;
}

// Colors use Palette constants — traceable, no raw hex
const STAT_CARDS: StatCardConfig[] = [
  { titleKey: 'adminDashboard.totalCustomers',     getValue: (s) => s.totalCustomers,     icon: 'people',              color: Palette.blue500    },
  { titleKey: 'adminDashboard.activeCustomers',    getValue: (s) => s.activeCustomers,    icon: 'checkmark-circle',    color: Palette.emerald500 },
  { titleKey: 'adminDashboard.totalApplications',  getValue: (s) => s.totalApplications,  icon: 'phone-portrait',      color: Palette.violet500  },
  { titleKey: 'adminDashboard.activeApplications', getValue: (s) => s.activeApplications, icon: 'radio-button-on',     color: Palette.teal500    },
  { titleKey: 'adminDashboard.totalTickets',       getValue: (s) => s.totalTickets,       icon: 'ticket',              color: Palette.amber500   },
  { titleKey: 'adminDashboard.openTickets',        getValue: (s) => s.openTickets,        icon: 'lock-open',           color: Palette.red500     },
  { titleKey: 'adminDashboard.inProgress',         getValue: (s) => s.inProgressTickets,  icon: 'flash',               color: Palette.purple500  },
  { titleKey: 'adminDashboard.resolved',           getValue: (s) => s.resolvedTickets,    icon: 'checkmark-done',      color: Palette.emerald600 },
];

// ── Overview card config ──────────────────────────────────────────────────────

interface OverviewConfig {
  titleKey:    string;
  icon:        IoniconName;
  iconColor:   string;
  getTotal:    (s: AdminDashboardStats) => number;
  getActive:   (s: AdminDashboardStats) => number;
  activeLabelKey: string;
  metricLabelKey?: string;
}

const OVERVIEW_CARDS: OverviewConfig[] = [
  {
    titleKey:       'customers.title',
    icon:           'people',
    iconColor:      Palette.blue500,
    getTotal:       (s) => s.totalCustomers,
    getActive:      (s) => s.activeCustomers,
    activeLabelKey: 'common.active',
  },
  {
    titleKey:       'applications.title',
    icon:           'phone-portrait',
    iconColor:      Palette.violet500,
    getTotal:       (s) => s.totalApplications,
    getActive:      (s) => s.activeApplications,
    activeLabelKey: 'common.active',
  },
  {
    titleKey:        'tickets.title',
    icon:            'ticket',
    iconColor:       Palette.amber500,
    getTotal:        (s) => s.totalTickets,
    getActive:       (s) => s.openTickets,
    activeLabelKey:  'adminDashboard.open',
    metricLabelKey:  'adminDashboard.resolutionRate',
  },
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
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {}}
            tintColor={c.tint}
            colors={[c.tint]}
          />
        }
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
          {OVERVIEW_CARDS.map((ov) => (
            <AdminOverviewCard
              key={ov.titleKey}
              title={t(ov.titleKey)}
              icon={ov.icon}
              iconColor={ov.iconColor}
              total={ov.getTotal(stats)}
              active={ov.getActive(stats)}
              activeLabel={t(ov.activeLabelKey)}
              metricLabel={ov.metricLabelKey ? t(ov.metricLabelKey) : undefined}
            />
          ))}
        </View>
      </ScrollView>
    </FeatureErrorBoundary>
  );
};

export default AdminDashboardScreen;
