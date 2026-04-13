import React from 'react';
import { Schedule as ScheduleIcon, Timer as TimerIcon } from '@mui/icons-material';
import VerticalTabPanel from '../../../shared/components/layout/VerticalTabPanel';
import SchedulerSettings from './SchedulerSettings';
import SlaSettings from './SlaSettings';

const TABS = [
  { label: 'Scheduler',  icon: <ScheduleIcon fontSize="small" />, content: <SchedulerSettings /> },
  { label: 'SLA Timers', icon: <TimerIcon fontSize="small" />,    content: <SlaSettings /> },
];

const TicketsSettings: React.FC = () => <VerticalTabPanel tabs={TABS} />;
export default TicketsSettings;
