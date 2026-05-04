import { Palette } from '@/src/constants/tokens';

export interface NavItemConfig {
  labelKey: string;  // i18n key instead of hardcoded label
  icon: string;
  route: string;
  color?: string;
  roles?: string[];
  dividerBefore?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { labelKey: 'nav.dashboard',        icon: '📊', route: '/'                },
  { labelKey: 'nav.tickets',          icon: '🎫', route: '/tickets'         },
  { labelKey: 'nav.kanbanBoard',      icon: '🗂️', route: '/kanban'          },
  { labelKey: 'nav.epics',            icon: '🌳', route: '/epics'           },
  { labelKey: 'nav.featureRequests',  icon: '💡', route: '/features'        },
  { labelKey: 'nav.documents',        icon: '📄', route: '/documents',       roles: ['TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER'] },
  { labelKey: 'nav.programming',      icon: '💻', route: '/programming',     roles: ['PROGRAMMER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
  { labelKey: 'nav.adminPanel',       icon: '⚙️', route: '/admin',           roles: ['TENANT_ADMIN', 'SUPER_ADMIN'] },
  { labelKey: 'nav.profile',          icon: '👤', route: '/profile',         dividerBefore: true },
  { labelKey: 'nav.deviceInfo',       icon: '📱', route: '/device-info',     dividerBefore: true },
  { labelKey: 'nav.logout',           icon: '🚪', route: '__logout__',       color: Palette.red600, dividerBefore: true },
];

export const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

/**
 * Returns a role-appropriate avatar background color.
 * Uses Palette constants — no hardcoded hex strings.
 */
export const getRoleColor = (role?: string): string => {
  if (role === 'SUPER_ADMIN')  return Palette.red600;
  if (role === 'TENANT_ADMIN') return Palette.amber600;
  if (role === 'PROGRAMMER')   return Palette.violet600;
  return Palette.green600;  // EMPLOYEE default
};
