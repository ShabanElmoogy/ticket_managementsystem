// Compatibility barrel — keeps all existing imports working
// Real implementation lives in ./bottom-nav/
export { default } from './bottom-nav';
export { default as AppBottomNav } from './bottom-nav';
export { TABS } from './bottom-nav';
export type { TabItem } from './bottom-nav';

// BottomNavItem moved to shared/components
export { BottomNavItem } from '../../shared/components';
