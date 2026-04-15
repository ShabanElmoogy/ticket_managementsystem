import React from 'react';
import { View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../../../stores/uiStore';
import BottomNavItem from './BottomNavItem';
import { TABS } from './tabItems';

const AppBottomNav: React.FC = () => {
  const router        = useRouter();
  const pathname      = usePathname();
  const { colorMode } = useUiStore();
  const insets        = useSafeAreaInsets();
  const isDark        = colorMode === 'dark';

  return (
    <View
      className={`flex-row border-t ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
      style={{ paddingBottom: insets.bottom + 4, paddingTop: 8 }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.match === '/(app)'
            ? pathname === '/' || pathname === '/(app)'
            : pathname.startsWith(tab.match);

        return (
          <BottomNavItem
            key={tab.route}
            tab={tab}
            isActive={isActive}
            isDark={isDark}
            onPress={() => router.push(tab.route as any)}
          />
        );
      })}
    </View>
  );
};

export default AppBottomNav;
