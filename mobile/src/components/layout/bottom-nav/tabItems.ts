export interface TabItem {
  /** i18n key for the label */
  labelKey: string;
  icon: string;
  activeIcon: string;
  route: string;
  match: string;
}

export const TABS: TabItem[] = [
  { labelKey: 'nav.dashboard', icon: '📊', activeIcon: '📊', route: '/',         match: '/'         },
  { labelKey: 'nav.tickets',   icon: '🎫', activeIcon: '🎫', route: '/tickets',  match: '/tickets'  },
  { labelKey: 'nav.kanban',    icon: '🗂️', activeIcon: '🗂️', route: '/kanban',   match: '/kanban'   },
  { labelKey: 'nav.profile',   icon: '👤', activeIcon: '👤', route: '/profile',  match: '/profile'  },
];
