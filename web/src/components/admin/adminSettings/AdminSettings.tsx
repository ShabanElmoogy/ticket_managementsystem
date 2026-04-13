import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { ErrorBoundary } from '../../../shared/components/feedback/ErrorBoundary';
import { useAuthStore } from '../../../stores/authStore';
import { isSuperAdmin } from '../../../types/roles';
import { SUPER_ADMIN_TABS, TENANT_ADMIN_TABS } from './utils/tabsConfig';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" sx={{ pt: 1 }}>
    {value === index && children}
  </Box>
);

const AdminSettings: React.FC = () => {
  const { user } = useAuthStore();
  const isSuper = isSuperAdmin(user?.role);
  const [tab, setTab] = useState(0);

  const tabs = isSuper ? SUPER_ADMIN_TABS : TENANT_ADMIN_TABS;

  return (
    <ErrorBoundary>
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>
          ⚙️ Settings
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            {tabs.map((t, i) => (
              <Tab key={i} label={t.label} icon={t.icon} iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} />
            ))}
          </Tabs>
        </Box>

        {tabs.map((t, i) => (
          <TabPanel key={i} value={tab} index={i}>
            {t.content}
          </TabPanel>
        ))}
      </Box>
    </ErrorBoundary>
  );
};

export default AdminSettings;
