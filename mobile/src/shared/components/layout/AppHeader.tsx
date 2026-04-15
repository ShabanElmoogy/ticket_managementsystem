/**
 * AppHeader — top-level barrel.
 * All header-related components live in ./header/
 * Bottom nav lives in ./bottom-nav/
 */

export { DrawerProvider, useDrawer }    from './header/DrawerContext';
export { default as AppDrawerOverlay }  from './header/AppDrawerOverlay';
export { default as AppHeaderBar }      from './header/AppHeaderBar';
export { default as DrawerUserCard }    from './header/DrawerUserCard';
export { default as DrawerNavList }     from './header/DrawerNavList';
export { NAV_ITEMS, getInitials, getRoleColor } from './header/navItems';
export type { NavItem }                 from './header/navItems';

// Default export = the header bar
export { default } from './header/AppHeaderBar';
