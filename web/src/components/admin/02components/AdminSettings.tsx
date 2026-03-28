import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import SchedulerSettings from './SchedulerSettings';
import SlaSettings from './SlaSettings';
import EmailIngestSettings from './EmailIngestSettings';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const TABS = [
  { label: 'Scheduler',    icon: <ScheduleIcon fontSize="small" /> },
  { label: 'SLA Timers',   icon: <TimerIcon fontSize="small" /> },
  { label: 'Email Ingest', icon: <EmailIcon fontSize="small" /> },
];

const AdminSettings: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        ⚙️ Settings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t, i) => (
            <Tab
              key={i}
              label={t.label}
              icon={t.icon}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <SchedulerSettings />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <SlaSettings />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <EmailIngestSettings />
      </TabPanel>
    </Box>
  );
};

export default AdminSettings;
