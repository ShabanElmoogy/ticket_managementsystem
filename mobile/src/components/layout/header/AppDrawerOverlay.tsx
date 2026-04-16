import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';
import { useDirection } from '../../../providers/DirectionProvider';
import { useDrawer } from './DrawerContext';
import DrawerUserCard from './DrawerUserCard';
import DrawerNavList from './DrawerNavList';
import { NAV_ITEMS } from './navItems';

const AppDrawerOverlay: React.FC = () => {
  const { open, setOpen, headerHeight, bottomNavHeight } = useDrawer();
  const { user, logout }                                  = useAuthStore();
  const { colorMode, toggleColorMode, setDirection }      = useUiStore();
  const { isRtl }                                         = useDirection();
  // Fallback: also read directly from store in case context isn't propagating
  const storeDirection                                    = useUiStore((s) => s.direction);
  const effectiveIsRtl                                    = isRtl || storeDirection === 'rtl';
  const router                                            = useRouter();

  if (!open || !user) return null;

  const isDark   = colorMode === 'dark';
  const drawerBg = isDark ? '#1e293b' : '#6366f1';

  if (__DEV__) console.log('🗂️ Drawer isRtl:', isRtl, 'direction:', colorMode);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user.role ?? '')
  );

  const handleNav = (route: string) => {
    setOpen(false);
    if (route === '__logout__') { logout(); return; }
    router.push(route as any);
  };

  return (
    <View style={{
      position: 'absolute',
      top: headerHeight,
      bottom: bottomNavHeight,
      left: 0, right: 0,
      zIndex: 999,
      pointerEvents: 'box-none',
    } as any}>
      {/* Backdrop */}
      <Pressable
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        onPress={() => setOpen(false)}
      />

      {/* Panel — slides from right (RTL) or left (LTR) */}
      <View style={{
        position: 'absolute', top: 0, bottom: 0, width: 288,
        backgroundColor: drawerBg,
        ...(effectiveIsRtl ? { right: 0 } : { left: 0 }),
      }}>
        <DrawerUserCard
          name={user.name}
          role={user.role}
          isDark={isDark}
          isRtl={effectiveIsRtl}
          onToggleTheme={toggleColorMode}
          onToggleDir={() => setDirection(effectiveIsRtl ? 'ltr' : 'rtl')}
        />
        <DrawerNavList items={visibleItems} isRtl={effectiveIsRtl} onNav={handleNav} />
      </View>
    </View>
  );
};

export default AppDrawerOverlay;
