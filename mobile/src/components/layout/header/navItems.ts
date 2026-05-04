import type Ionicons from '@expo/vector-icons/Ionicons';
import { Palette } from '@/src/constants/tokens';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface NavItemConfig {
  labelKey:       string;
  icon:           IoniconName;
  /** Icon badge background color */
  iconBg:         string;
  /** Icon color (on top of iconBg) */
  iconColor:      string;
  route:          string;
  /** Override label color (e.g. red for logout) */
  color?:         string;
  roles?:         string[];
  dividerBefore?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    labelKey:  'nav.dashboard',
    icon:      'grid',
    iconBg:    '#3b82f6',   // blue-500
    iconColor: '#ffffff',
    route:     '/',
  },
  {
    labelKey:  'nav.tickets',
    icon:      'ticket',
    iconBg:    '#8b5cf6',   // violet-500
    iconColor: '#ffffff',
    route:     '/tickets',
  },
  {
    labelKey:  'nav.kanbanBoard',
    icon:      'albums',
    iconBg:    '#f59e0b',   // amber-500
    iconColor: '#ffffff',
    route:     '/kanban',
  },
  {
    labelKey:  'nav.epics',
    icon:      'git-branch',
    iconBg:    '#10b981',   // emerald-500
    iconColor: '#ffffff',
    route:     '/epics',
  },
  {
    labelKey:  'nav.featureRequests',
    icon:      'bulb',
    iconBg:    '#eab308',   // yellow-500
    iconColor: '#ffffff',
    route:     '/features',
  },
  {
    labelKey:  'nav.documents',
    icon:      'document-text',
    iconBg:    '#06b6d4',   // cyan-500
    iconColor: '#ffffff',
    route:     '/documents',
    roles:     ['TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER'],
  },
  {
    labelKey:  'nav.programming',
    icon:      'code-slash',
    iconBg:    '#6366f1',   // indigo-500
    iconColor: '#ffffff',
    route:     '/programming',
    roles:     ['PROGRAMMER', 'TENANT_ADMIN', 'SUPER_ADMIN'],
  },
  {
    labelKey:  'nav.adminPanel',
    icon:      'settings',
    iconBg:    '#64748b',   // slate-500
    iconColor: '#ffffff',
    route:     '/admin',
    roles:     ['TENANT_ADMIN', 'SUPER_ADMIN'],
  },
  {
    labelKey:      'nav.profile',
    icon:          'person-circle',
    iconBg:        '#14b8a6',   // teal-500
    iconColor:     '#ffffff',
    route:         '/profile',
    dividerBefore: true,
  },
  {
    labelKey:      'nav.deviceInfo',
    icon:          'phone-portrait',
    iconBg:        '#94a3b8',   // slate-400
    iconColor:     '#ffffff',
    route:         '/device-info',
    dividerBefore: true,
  },
  {
    labelKey:      'nav.logout',
    icon:          'log-out',
    iconBg:        '#ef4444',   // red-500
    iconColor:     '#ffffff',
    route:         '__logout__',
    color:         Palette.red500,
    dividerBefore: true,
  },
];

export const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const getRoleColor = (role?: string): string => {
  if (role === 'SUPER_ADMIN')  return Palette.red600;
  if (role === 'TENANT_ADMIN') return Palette.amber600;
  if (role === 'PROGRAMMER')   return Palette.violet600;
  return Palette.green600;
};
