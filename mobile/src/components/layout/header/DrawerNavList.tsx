import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NavItemConfig } from '@/src/components/layout/header/navItems';
import type { ThemeColors } from '@/src/constants/tokens';
import NavItem from '@/src/shared/components/navigation/NavItem';

interface Props {
  items:          NavItemConfig[];
  isRtl:          boolean;
  onNav:          (route: string) => void;
  resolvedColors: ThemeColors;
}

const DrawerNavList: React.FC<Props> = ({ items, isRtl, onNav, resolvedColors: c }) => {
  const { t } = useTranslation();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
      // direction applied via parent View in AppDrawerOverlay
    >
      {items.map((item) => (
        <View key={item.labelKey}>
          <NavItem
            icon={item.icon}
            iconBg={item.iconBg}
            iconColor={item.iconColor}
            label={t(item.labelKey)}
            color={item.color ?? c.text.primary}
            dividerColor={c.border.primary}
            dividerBefore={item.dividerBefore}
            onPress={() => onNav(item.route)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default DrawerNavList;
