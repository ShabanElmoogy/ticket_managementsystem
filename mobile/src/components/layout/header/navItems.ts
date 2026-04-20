export interface NavItem {
  label: string;
  icon: string;
  route: string;
  color?: string;
  roles?: string[];
  dividerBefore?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',        icon: '📊', route: '/(app)'             },
  { label: 'Tickets',          icon: '🎫', route: '/(app)/tickets'     },
  { label: 'Kanban Board',     icon: '🗂️', route: '/(app)/kanban'      },
  { label: 'Epics',            icon: '🌳', route: '/(app)/epics'       },
  { label: 'Feature Requests', icon: '💡', route: '/(app)/features'    },
  { label: 'Documents',        icon: '📄', route: '/(app)/documents',   roles: ['TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER'] },
  { label: 'Programming',      icon: '💻', route: '/(app)/programming', roles: ['PROGRAMMER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Admin Panel',      icon: '⚙️', route: '/(app)/admin',      roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },  { label: 'Profile',          icon: '👤', route: '/(app)/profile',    dividerBefore: true },
  { label: 'Device Info',      icon: '📱', route: '/(app)/device-info', dividerBefore: true },
  { label: 'Logout',           icon: '🚪', route: '__logout__',        color: '#ef4444', dividerBefore: true },
];

export const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const getRoleColor = (role?: string) => {
  if (role === 'TENANT_ADMIN' || role === 'SUPER_ADMIN') return '#ef4444';
  if (role === 'PROGRAMMER') return '#8b5cf6';
  return '#10b981';
};
