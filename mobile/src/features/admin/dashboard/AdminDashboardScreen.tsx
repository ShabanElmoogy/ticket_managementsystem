import React from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { useUiStore } from '../../../stores/uiStore';
import type { AdminDashboardStats } from './utils/computeStats';

// ── Stat card config (mirrors web STAT_CARDS_CONFIG) ─────────────────────────

interface StatCardConfig {
  title: string;
  getValue: (s: AdminDashboardStats) => number;
  icon: string;
  color: string;
}

const STAT_CARDS: StatCardConfig[] = [
  { title: 'Total Customers',     getValue: (s) => s.totalCustomers,     icon: '👥', color: '#3b82f6' },
  { title: 'Active Customers',    getValue: (s) => s.activeCustomers,    icon: '✅', color: '#10b981' },
  { title: 'Total Applications',  getValue: (s) => s.totalApplications,  icon: '📱', color: '#8b5cf6' },
  { title: 'Active Applications', getValue: (s) => s.activeApplications, icon: '🟢', color: '#10b981' },
  { title: 'Total Tickets',       getValue: (s) => s.totalTickets,       icon: '🎫', color: '#f59e0b' },
  { title: 'Open Tickets',        getValue: (s) => s.openTickets,        icon: '🔓', color: '#ef4444' },
  { title: 'In Progress',         getValue: (s) => s.inProgressTickets,  icon: '⚡', color: '#a855f7' },
  { title: 'Resolved',            getValue: (s) => s.resolvedTickets,    icon: '🏁', color: '#10b981' },
];

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  config: StatCardConfig;
  value: number;
  isDark: boolean;
  cardWidth: number;
}> = ({ config, value, isDark, cardWidth }) => (
  <View
    style={{
      width: cardWidth,
      borderRadius: 12,
      padding: 14,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    }}
  >
    {/* Icon + color dot */}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <View style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: `${config.color}18`,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{config.icon}</Text>
      </View>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: config.color }} />
    </View>

    {/* Value */}
    <Text style={{
      fontSize: 28, fontWeight: '800',
      color: isDark ? '#f1f5f9' : '#0f172a',
      lineHeight: 32,
    }}>
      {value.toLocaleString()}
    </Text>

    {/* Title */}
    <Text style={{
      fontSize: 11, marginTop: 4,
      color: isDark ? '#94a3b8' : '#64748b',
      fontWeight: '500',
    }} numberOfLines={1}>
      {config.title}
    </Text>

    {/* Bottom accent bar */}
    <View style={{
      height: 3, borderRadius: 2, marginTop: 10,
      backgroundColor: `${config.color}33`,
    }}>
      <View style={{ height: '100%', borderRadius: 2, backgroundColor: config.color, width: '60%' }} />
    </View>
  </View>
);

// ── Overview card ─────────────────────────────────────────────────────────────

const OverviewCard: React.FC<{
  title: string;
  icon: string;
  total: number;
  active: number;
  activeLabel?: string;
  metricLabel?: string;
  isDark: boolean;
}> = ({ title, icon, total, active, activeLabel = 'Active', metricLabel = 'Active Rate', isDark }) => {
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <View style={{
      borderRadius: 12, padding: 16, marginBottom: 12,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {title}
          </Text>
        </View>
        <View style={{
          backgroundColor: '#3b82f618', borderRadius: 20,
          paddingHorizontal: 10, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>
            {rate}% {metricLabel}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {total.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>Total</Text>
        </View>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#10b981' }}>
            {active.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>{activeLabel}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#3b82f6' }}>
            {rate}%
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>Rate</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{
        height: 6, borderRadius: 3,
        backgroundColor: isDark ? '#334155' : '#f1f5f9',
      }}>
        <View style={{
          height: '100%', borderRadius: 3,
          backgroundColor: '#10b981',
          width: `${rate}%`,
        }} />
      </View>
    </View>
  );
};

// ── Section label ─────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; isDark: boolean }> = ({ label, isDark }) => (
  <Text style={{
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase',
    color: isDark ? '#64748b' : '#94a3b8',
    marginBottom: 12, marginTop: 4,
  }}>
    {label}
  </Text>
);

// ── Main screen ───────────────────────────────────────────────────────────────

const AdminDashboardScreen: React.FC = () => {
  const { stats, loading } = useAdminDashboard();
  const { colorMode }      = useUiStore();
  const isDark             = colorMode === 'dark';
  const { width }          = useWindowDimensions();

  // Responsive grid: 2 cols on phone (<600), 4 cols on tablet (≥600)
  const COLS    = width >= 600 ? 4 : 2;
  const GAP     = 12;
  const PADDING = 16;
  const cardWidth = (width - PADDING * 2 - GAP * (COLS - 1)) / COLS;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
      contentContainerStyle={{ padding: PADDING, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} tintColor="#3b82f6" />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Stat cards grid ── */}
      <SectionLabel label="Statistics" isDark={isDark} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginBottom: 24 }}>
        {STAT_CARDS.map((config) => (
          <StatCard
            key={config.title}
            config={config}
            value={config.getValue(stats)}
            isDark={isDark}
            cardWidth={cardWidth}
          />
        ))}
      </View>

      {/* ── Overview cards ── */}
      <SectionLabel label="Overview" isDark={isDark} />
      <OverviewCard
        title="Customers"    icon="👥"
        total={stats.totalCustomers}    active={stats.activeCustomers}
        activeLabel="Active"
        isDark={isDark}
      />
      <OverviewCard
        title="Applications" icon="📱"
        total={stats.totalApplications} active={stats.activeApplications}
        activeLabel="Active"
        isDark={isDark}
      />
      <OverviewCard
        title="Tickets"      icon="🎫"
        total={stats.totalTickets}      active={stats.openTickets}
        activeLabel="Open"
        metricLabel="Resolution Rate"
        isDark={isDark}
      />
    </ScrollView>
  );
};

export default AdminDashboardScreen;
