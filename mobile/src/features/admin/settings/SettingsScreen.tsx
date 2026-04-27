/**
 * SettingsScreen — matches web AdminSettings tab structure exactly:
 *
 * SUPER_ADMIN sees:
 *   [Email Ingest]
 *
 * TENANT_ADMIN sees:
 *   [General]  → sub-tabs: Date Format
 *   [Tickets]  → sub-tabs: Scheduler | SLA Timers
 *   [Epic Auto-Close]
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeColors } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import DateFormatPanel        from '@/src/features/admin/settings/DateFormatPanel';
import SchedulerSettingsPanel from '@/src/features/admin/settings/SchedulerSettingsPanel';
import SlaSettingsPanel       from '@/src/features/admin/settings/SlaSettingsPanel';
import EpicAutoClosePanel     from '@/src/features/admin/settings/EpicAutoClosePanel';
import EmailIngestPanel       from '@/src/features/admin/settings/EmailIngestPanel';
import PaginationSettingsPanel from '@/src/features/admin/settings/PaginationSettingsPanel';

// ── Sub-tab bar ───────────────────────────────────────────────────────────────

const SubTabBar: React.FC<{
  tabs: { id: string; label: string }[];
  active: string;
  onSelect: (id: string) => void;
}> = ({ tabs, active, onSelect }) => {
  const c = useThemeColors();
  return (
    <View style={{
      flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.surface.tertiary,
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelect(tab.id)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
              backgroundColor: isActive ? '#3b82f618' : 'transparent',
              borderWidth: 1,
              borderColor: isActive ? '#3b82f6' : c.border.primary,
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: '600',
              color: isActive ? '#3b82f6' : c.text.secondary,
            }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ── General section (Date Format sub-tab) ─────────────────────────────────────

const GeneralSection: React.FC = () => {
  const [sub, setSub] = useState('dateFormat');
  return (
    <>
      <SubTabBar
        tabs={[{ id: 'dateFormat', label: '📅 Date Format' }]}
        active={sub} onSelect={setSub}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <DateFormatPanel />
      </ScrollView>
    </>
  );
};

// ── Tickets section (Scheduler + SLA sub-tabs) ────────────────────────────────

const TicketsSection: React.FC = () => {
  const [sub, setSub] = useState('scheduler');
  return (
    <>
      <SubTabBar
        tabs={[
          { id: 'scheduler', label: '⏰ Scheduler' },
          { id: 'sla',       label: '⏱️ SLA Timers' },
        ]}
        active={sub} onSelect={setSub}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {sub === 'scheduler' ? <SchedulerSettingsPanel /> : <SlaSettingsPanel />}
      </ScrollView>
    </>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

interface MainTab { id: string; label: string; icon: string; roles?: string[] }

const SUPER_ADMIN_TABS: MainTab[] = [
  { id: 'email', label: 'Email Ingest', icon: '📧' },
];

const TENANT_ADMIN_TABS: MainTab[] = [
  { id: 'general',    label: 'General',         icon: '⚙️' },
  { id: 'tickets',    label: 'Tickets',          icon: '🎫' },
  { id: 'epicClose',  label: 'Epic Auto-Close',  icon: '🌳' },
  { id: 'pagination', label: 'Pagination',       icon: '📄' },
];

const SettingsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const c = useThemeColors();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const tabs = isSuperAdmin ? SUPER_ADMIN_TABS : TENANT_ADMIN_TABS;
  const [active, setActive] = useState(tabs[0].id);

  const renderContent = () => {
    switch (active) {
      case 'general':   return <GeneralSection />;
      case 'tickets':   return <TicketsSection />;
      case 'epicClose': return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <EpicAutoClosePanel />
        </ScrollView>
      );
      case 'pagination': return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <PaginationSettingsPanel />
        </ScrollView>
      );
      case 'email': return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <EmailIngestPanel />
        </ScrollView>
      );
      default: return null;
    }
  };

  return (
    <FeatureErrorBoundary featureName="Settings">
      <View style={{ flex: 1, backgroundColor: c.surface.secondary }}>
        {/* Main tab bar */}
        <View style={{
          borderBottomWidth: 1,
          borderBottomColor: c.border.primary,
          backgroundColor: c.surface.primary,
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}>
            {tabs.map((tab) => {
              const isActive = active === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActive(tab.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: isActive ? '#3b82f6' : c.surface.tertiary,
                    borderWidth: 1,
                    borderColor: isActive ? '#3b82f6' : c.border.primary,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
                  <Text style={{
                    fontSize: 12, fontWeight: '600',
                    color: isActive ? '#fff' : c.text.secondary,
                  }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Content — flex:1 so sub-tabs + scrollview fill remaining space */}
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      </View>
    </FeatureErrorBoundary>
  );
};

export default SettingsScreen;
