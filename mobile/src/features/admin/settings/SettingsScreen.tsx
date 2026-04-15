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
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import DateFormatPanel      from './DateFormatPanel';
import SchedulerSettingsPanel from './SchedulerSettingsPanel';
import SlaSettingsPanel     from './SlaSettingsPanel';
import EpicAutoClosePanel   from './EpicAutoClosePanel';
import EmailIngestPanel     from './EmailIngestPanel';

// ── Sub-tab bar ───────────────────────────────────────────────────────────────

const SubTabBar: React.FC<{
  tabs: { id: string; label: string }[];
  active: string;
  onSelect: (id: string) => void;
  isDark: boolean;
}> = ({ tabs, active, onSelect, isDark }) => (
  <View style={{
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
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
            borderColor: isActive ? '#3b82f6' : isDark ? '#334155' : '#e2e8f0',
          }}
        >
          <Text style={{
            fontSize: 12, fontWeight: '600',
            color: isActive ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b',
          }}>
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

// ── General section (Date Format sub-tab) ─────────────────────────────────────

const GeneralSection: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [sub, setSub] = useState('dateFormat');
  return (
    <>
      <SubTabBar
        tabs={[{ id: 'dateFormat', label: '📅 Date Format' }]}
        active={sub} onSelect={setSub} isDark={isDark}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <DateFormatPanel />
      </ScrollView>
    </>
  );
};

// ── Tickets section (Scheduler + SLA sub-tabs) ────────────────────────────────

const TicketsSection: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [sub, setSub] = useState('scheduler');
  return (
    <>
      <SubTabBar
        tabs={[
          { id: 'scheduler', label: '⏰ Scheduler' },
          { id: 'sla',       label: '⏱️ SLA Timers' },
        ]}
        active={sub} onSelect={setSub} isDark={isDark}
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
  { id: 'general',   label: 'General',         icon: '⚙️' },
  { id: 'tickets',   label: 'Tickets',          icon: '🎫' },
  { id: 'epicClose', label: 'Epic Auto-Close',  icon: '🌳' },
];

const SettingsScreen: React.FC = () => {
  const { user }      = useAuthStore();
  const { colorMode } = useUiStore();
  const isDark        = colorMode === 'dark';
  const isSuperAdmin  = user?.role === 'SUPER_ADMIN';

  const tabs = isSuperAdmin ? SUPER_ADMIN_TABS : TENANT_ADMIN_TABS;
  const [active, setActive] = useState(tabs[0].id);

  const renderContent = () => {
    switch (active) {
      case 'general':   return <GeneralSection isDark={isDark} />;
      case 'tickets':   return <TicketsSection isDark={isDark} />;
      case 'epicClose': return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <EpicAutoClosePanel />
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
    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      {/* Main tab bar */}
      <View style={{
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
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
                  backgroundColor: isActive ? '#3b82f6' : isDark ? '#334155' : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: isActive ? '#3b82f6' : isDark ? '#475569' : '#e2e8f0',
                }}
              >
                <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: isActive ? '#fff' : isDark ? '#cbd5e1' : '#475569',
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
  );
};

export default SettingsScreen;
