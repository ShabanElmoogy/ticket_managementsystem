export interface TabItem {
  /** i18n key for the label */
  labelKey: string;
  icon: string;
  activeIcon: string;
  route: string;
  match: string;
}

export const TABS: TabItem[] = [
  { labelKey: 'nav.dashboard', icon: '📊', activeIcon: '📊', route: '/(app)',         match: '/(app)'         },
  { labelKey: 'nav.tickets',   icon: '🎫', activeIcon: '🎫', route: '/(app)/tickets', match: '/(app)/tickets' },
  { labelKey: 'nav.kanban',    icon: '🗂️', activeIcon: '🗂️', route: '/(app)/kanban',  match: '/(app)/kanban'  },
  { labelKey: 'nav.profile',   icon: '👤', activeIcon: '👤', route: '/(app)/profile', match: '/(app)/profile' },
];
