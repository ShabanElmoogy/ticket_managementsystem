import type { SvgIconComponent } from '@mui/icons-material';
import {
  People as PeopleIcon,
  Apps as AppsIcon,
  ConfirmationNumber as TicketIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import type { DashboardStats } from '../types/types';

export interface StatCardConfig {
  title: string;
  getValue: (s: DashboardStats) => number;
  Icon: SvgIconComponent;
  /** MUI palette path — resolved in the component via theme */
  paletteKey: 'primary.main' | 'secondary.main' | 'success.main' | 'warning.main' | 'warning.light' | 'error.main';
}

export const STAT_CARDS_CONFIG: StatCardConfig[] = [
  { title: 'Total Customers',     getValue: (s) => s.totalCustomers,     Icon: PeopleIcon,     paletteKey: 'primary.main'    },
  { title: 'Active Customers',    getValue: (s) => s.activeCustomers,    Icon: PeopleIcon,     paletteKey: 'success.main'    },
  { title: 'Total Applications',  getValue: (s) => s.totalApplications,  Icon: AppsIcon,       paletteKey: 'secondary.main'  },
  { title: 'Active Applications', getValue: (s) => s.activeApplications, Icon: AppsIcon,       paletteKey: 'success.main'    },
  { title: 'Total Tickets',       getValue: (s) => s.totalTickets,       Icon: TicketIcon,     paletteKey: 'warning.main'    },
  { title: 'Open Tickets',        getValue: (s) => s.openTickets,        Icon: TicketIcon,     paletteKey: 'error.main'      },
  { title: 'In Progress',         getValue: (s) => s.inProgressTickets,  Icon: TrendingUpIcon, paletteKey: 'warning.light'   },
  { title: 'Resolved',            getValue: (s) => s.resolvedTickets,    Icon: TicketIcon,     paletteKey: 'success.main'    },
];
