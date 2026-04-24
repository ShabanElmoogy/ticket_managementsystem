import React from 'react';
import { View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import { BottomNavItem } from '@/src/shared/components';
import { TABS } from './tabItems';

const AppBottomNav: React.FC = () => {
  const router   = useRouter();
  const pathname = usePathname();
  const c        = useThemeColors();
  const insets   = useSafeAreaInsets();
  const { t }    = useTranslation();

  return (
    <View style={{
      flexDirection:   'row',
      borderTopWidth:  1,
      borderTopColor:  c.border.primary,
      backgroundColor: c.surface.primary,
      paddingBottom:   insets.bottom + 4,
      paddingTop:      8,
    }}>
      {TABS.map((tab) => {
        const isActive =
          tab.match === '/(app)'
            ? pathname === '/' || pathname === '/(app)'
            : pathname.startsWith(tab.match);

        return (
          <BottomNavItem
            key={tab.route}
            icon={tab.icon}
            activeIcon={tab.activeIcon}
            label={t(tab.labelKey)}
            isActive={isActive}
            onPress={() => router.push(tab.route as any)}
          />
        );
      })}
    </View>
  );
};

export default AppBottomNav;
