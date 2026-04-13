import React from 'react';
import {
  Email as EmailIcon,
  AccountTree as EpicsIcon,
  Settings as GeneralIcon,
  ConfirmationNumber as TicketsIcon,
} from '@mui/icons-material';
import EmailIngestSettings from '../EmailIngestSettings';
import EpicAutoCloseSettings from '../EpicAutoCloseSettings';
import GeneralSettings from '../GeneralSettings';
import TicketsSettings from '../TicketsSettings';

export interface TabConfig {
  label: string;
  icon: React.ReactElement;
  content: React.ReactElement;
}

export const SUPER_ADMIN_TABS: TabConfig[] = [
  { label: 'Email Ingest', icon: <EmailIcon fontSize="small" />, content: <EmailIngestSettings /> },
];

export const TENANT_ADMIN_TABS: TabConfig[] = [
  { label: 'General',         icon: <GeneralIcon fontSize="small" />,  content: <GeneralSettings /> },
  { label: 'Tickets',         icon: <TicketsIcon fontSize="small" />,  content: <TicketsSettings /> },
  { label: 'Epic Auto-Close', icon: <EpicsIcon fontSize="small" />,    content: <EpicAutoCloseSettings /> },
];
