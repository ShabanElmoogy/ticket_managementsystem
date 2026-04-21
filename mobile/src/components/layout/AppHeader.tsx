/**
 * AppHeader — top-level barrel.
 * All header-related components live in ./header/
 * Bottom nav lives in ./bottom-nav/
 */

export { DrawerProvider, useDrawer }    from '@/src/components/layout/header/DrawerContext';
export { default as AppDrawerOverlay }  from '@/src/components/layout/header/AppDrawerOverlay';
export { default as AppHeaderBar }      from '@/src/components/layout/header/AppHeaderBar';
export { default as DrawerUserCard }    from '@/src/components/layout/header/DrawerUserCard';
export { default as DrawerNavList }     from '@/src/components/layout/header/DrawerNavList';
export { NAV_ITEMS, getInitials, getRoleColor } from '@/src/components/layout/header/navItems';
export type { NavItem }                 from '@/src/components/layout/header/navItems';

// Default export = the header bar
export { default } from '@/src/components/layout/header/AppHeaderBar';
