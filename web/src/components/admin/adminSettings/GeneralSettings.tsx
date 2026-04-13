import React from 'react';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import VerticalTabPanel from '../../../shared/components/layout/VerticalTabPanel';
import DateFormatSettings from './DateFormatSettings';

const TABS = [
  { label: 'Date Format', icon: <CalendarIcon fontSize="small" />, content: <DateFormatSettings /> },
];

const GeneralSettings: React.FC = () => <VerticalTabPanel tabs={TABS} />;
export default GeneralSettings;
