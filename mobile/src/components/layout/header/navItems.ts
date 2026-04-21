export interface NavItem {
  labelKey: string;  // i18n key instead of hardcoded label
  icon: string;
  route: string;
  color?: string;
  roles?: string[];
  dividerBefore?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard',        icon: '📊', route: '/(app)'             },
  { labelKey: 'nav.tickets',          icon: '🎫', route: '/(app)/tickets'     },
  { labelKey: 'nav.kanbanBoard',      icon: '🗂️', route: '/(app)/kanban'      },
  { labelKey: 'nav.epics',            icon: '🌳', route: '/(app)/epics'       },
  { labelKey: 'nav.featureRequests',  icon: '💡', route: '/(app)/features'    },
  { labelKey: 'nav.documents',        icon: '📄', route: '/(app)/documents',   roles: ['TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER'] },
  { labelKey: 'nav.programming',      icon: '💻', route: '/(app)/programming', roles: ['PROGRAMMER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
  { labelKey: 'nav.adminPanel',       icon: '⚙️', route: '/(app)/admin',      roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
  { labelKey: 'nav.profile',          icon: '👤', route: '/(app)/profile',    dividerBefore: true },
  { labelKey: 'nav.deviceInfo',       icon: '📱', route: '/(app)/device-info', dividerBefore: true },
  { labelKey: 'nav.logout',           icon: '🚪', route: '__logout__',        color: '#ef4444', dividerBefore: true },
];

export const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const getRoleColor = (role?: string) => {
  if (role === 'TENANT_ADMIN' || role === 'SUPER_ADMIN') return '#ef4444';
  if (role === 'PROGRAMMER') return '#8b5cf6';
  return '#10b981';
};
