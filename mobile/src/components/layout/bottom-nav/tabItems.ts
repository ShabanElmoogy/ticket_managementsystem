import type Ionicons from '@expo/vector-icons/Ionicons';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface TabItem {
  labelKey:   string;
  icon:       IoniconName;
  activeIcon: IoniconName;
  /** Accent color when active — overrides theme default if provided */
  accentColor?: string;
  route:      string;
  match:      string;
}

export const TABS: TabItem[] = [
  {
    labelKey:    'nav.dashboard',
    icon:        'grid-outline',
    activeIcon:  'grid',
    accentColor: '#3b82f6',   // blue-500
    route:       '/',
    match:       '/',
  },
  {
    labelKey:    'nav.tickets',
    icon:        'ticket-outline',
    activeIcon:  'ticket',
    accentColor: '#8b5cf6',   // violet-500
    route:       '/tickets',
    match:       '/tickets',
  },
  {
    labelKey:    'nav.kanban',
    icon:        'albums-outline',
    activeIcon:  'albums',
    accentColor: '#f59e0b',   // amber-500
    route:       '/kanban',
    match:       '/kanban',
  },
  {
    labelKey:    'nav.profile',
    icon:        'person-outline',
    activeIcon:  'person',
    accentColor: '#14b8a6',   // teal-500
    route:       '/profile',
    match:       '/profile',
  },
];
