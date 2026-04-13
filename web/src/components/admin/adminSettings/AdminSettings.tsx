import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import {
  Email as EmailIcon,
  AccountTree as EpicsIcon,
  Settings as GeneralIcon,
  ConfirmationNumber as TicketsIcon,
} from '@mui/icons-material';
import { ErrorBoundary } from '../../../shared/components/feedback/ErrorBoundary';
import EmailIngestSettings from './EmailIngestSettings';
import EpicAutoCloseSettings from './EpicAutoCloseSettings';
import GeneralSettings from './GeneralSettings';
import TicketsSettings from './TicketsSettings';
import { useAuthStore } from '../../../stores/authStore';
import { isSuperAdmin } from '../../../types/roles';

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

  const tabs = isSuper
    ? [
        { label: 'Email Ingest', icon: <EmailIcon fontSize="small" />, content: <EmailIngestSettings /> },
      ]
    : [
        { label: 'General',         icon: <GeneralIcon fontSize="small" />,  content: <GeneralSettings /> },
        { label: 'Tickets',         icon: <TicketsIcon fontSize="small" />,  content: <TicketsSettings /> },
        { label: 'Epic Auto-Close', icon: <EpicsIcon fontSize="small" />,    content: <EpicAutoCloseSettings /> },
      ];

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
