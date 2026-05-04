import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useUiStore } from '@/src/stores/uiStore';
import { useThemeColors } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useDrawer } from '@/src/components/layout/header/DrawerContext';
import DrawerUserCard from '@/src/components/layout/header/DrawerUserCard';
import DrawerNavList from '@/src/components/layout/header/DrawerNavList';
import { NAV_ITEMS } from '@/src/components/layout/header/navItems';

const AppDrawerOverlay: React.FC<{ safeAreaTop?: number }> = ({ safeAreaTop = 0 }) => {
  const { open, setOpen, headerHeight, bottomNavHeight }  = useDrawer();
  const { user, logout }                                  = useAuthStore();
  const { toggleColorMode }                               = useUiStore();
  const { isRtl }                                         = useDirection();
  const storeDirection                                    = useUiStore((s) => s.direction);
  const effectiveIsRtl                                    = isRtl || storeDirection === 'rtl';
  const router                                            = useRouter();
  const c                                                 = useThemeColors();

  if (!open || !user || headerHeight === 0) return null;

  if (__DEV__) console.log('🗂️ Drawer isRtl:', isRtl, 'direction:', storeDirection);

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
      top: safeAreaTop + headerHeight,
      bottom: bottomNavHeight,
      left: 0, right: 0,
      zIndex: 999,
      pointerEvents: 'box-none',
    } as any}>
      {/* Backdrop */}
      <Pressable
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
        onPress={() => setOpen(false)}
      />

      {/* Panel — uses theme surface tokens so it adapts to light/dark and palette */}
      <View style={{
        position: 'absolute', top: 0, bottom: 0, width: 288,
        backgroundColor: c.surface.primary,
        borderEndWidth: effectiveIsRtl ? 0 : 1,
        borderStartWidth: effectiveIsRtl ? 1 : 0,
        borderColor: c.border.primary,
        // Explicitly set direction — this panel is absolutely positioned outside
        // the DirectionProvider tree, so direction must be set manually.
        direction: effectiveIsRtl ? 'rtl' : 'ltr',
        ...(effectiveIsRtl ? { right: 0 } : { left: 0 }),
      } as any}>
        <DrawerUserCard
          name={user.name}
          role={user.role}
          isRtl={effectiveIsRtl}
          onToggleTheme={toggleColorMode}
          resolvedColors={c}
        />
        <DrawerNavList items={visibleItems} isRtl={effectiveIsRtl} onNav={handleNav} resolvedColors={c} />
      </View>
    </View>
  );
};

export default AppDrawerOverlay;
