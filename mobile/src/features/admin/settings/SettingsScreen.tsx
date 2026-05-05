import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeColors } from '@/src/constants/theme';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { TabBar, SubTabBar, type TabItem } from '@/src/shared/components/layout/TabBar';
import DateFormatPanel         from './DateFormatPanel';
import SchedulerSettingsPanel  from './SchedulerSettingsPanel';
import SlaSettingsPanel        from './SlaSettingsPanel';
import EpicAutoClosePanel      from './EpicAutoClosePanel';
import EmailIngestPanel        from './EmailIngestPanel';
import PaginationSettingsPanel from './PaginationSettingsPanel';

const GeneralSection: React.FC = () => {
  const { t } = useTranslation();
  const [sub, setSub] = useState('dateFormat');
  return (
    <>
      <SubTabBar
        tabs={[{ id: 'dateFormat', label: t('settings.tabs.dateFormat'), icon: 'calendar' }]}
        active={sub}
        onSelect={setSub}
      />
      <View style={{ flex: 1 }}>
        <DateFormatPanel />
      </View>
    </>
  );
};

const TicketsSection: React.FC = () => {
  const { t } = useTranslation();
  const [sub, setSub] = useState('scheduler');
  return (
    <View style={{ flex: 1 }}>
      <SubTabBar
        tabs={[
          { id: 'scheduler', label: t('settings.tabs.scheduler'), icon: 'time'  },
          { id: 'sla',       label: t('settings.tabs.sla'),       icon: 'timer' },
        ]}
        active={sub}
        onSelect={setSub}
      />
      <View style={{ flex: 1 }}>
        {sub === 'scheduler' ? <SchedulerSettingsPanel /> : <SlaSettingsPanel />}
      </View>
    </View>
  );
};

const SettingsScreen: React.FC = () => {
  const { user }     = useAuthStore();
  const c            = useThemeColors();
  const { t }        = useTranslation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const SUPER_ADMIN_TABS: TabItem[] = [
    { id: 'email', label: t('settings.tabs.email'), icon: 'mail' },
  ];

  const TENANT_ADMIN_TABS: TabItem[] = [
    { id: 'general',    label: t('settings.tabs.general'),    icon: 'settings'  },
    { id: 'tickets',    label: t('settings.tabs.tickets'),    icon: 'ticket'    },
    { id: 'epicClose',  label: t('settings.tabs.epicClose'),  icon: 'git-merge' },
    { id: 'pagination', label: t('settings.tabs.pagination'), icon: 'layers'    },
  ];

  const tabs = isSuperAdmin ? SUPER_ADMIN_TABS : TENANT_ADMIN_TABS;
  const [active, setActive] = useState(tabs[0].id);

  const renderContent = () => {
    switch (active) {
      case 'general':    return <GeneralSection />;
      case 'tickets':    return <TicketsSection />;
      case 'epicClose':  return <EpicAutoClosePanel />;
      case 'pagination': return <PaginationSettingsPanel />;
      case 'email':      return <EmailIngestPanel />;
      default:           return null;
    }
  };

  return (
    <FeatureErrorBoundary featureName="Settings">
      <View style={{ flex: 1, backgroundColor: c.surface.secondary }}>
        <TabBar tabs={tabs} active={active} onSelect={setActive} />
        <View style={{ flex: 1 }}>{renderContent()}</View>
      </View>
    </FeatureErrorBoundary>
  );
};

export default SettingsScreen;
