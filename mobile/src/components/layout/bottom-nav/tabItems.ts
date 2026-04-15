export interface TabItem {
  label: string;
  icon: string;
  activeIcon: string;
  route: string;
  match: string;
}

export const TABS: TabItem[] = [
  { label: 'Dashboard', icon: '📊', activeIcon: '📊', route: '/(app)',         match: '/(app)'         },
  { label: 'Tickets',   icon: '🎫', activeIcon: '🎫', route: '/(app)/tickets', match: '/(app)/tickets' },
  { label: 'Kanban',    icon: '🗂️', activeIcon: '🗂️', route: '/(app)/kanban',  match: '/(app)/kanban'  },
  { label: 'Profile',   icon: '👤', activeIcon: '👤', route: '/(app)/profile', match: '/(app)/profile' },
];
