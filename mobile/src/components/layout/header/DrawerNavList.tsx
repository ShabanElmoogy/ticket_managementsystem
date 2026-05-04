import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NavItemConfig as NavItemType } from '@/src/components/layout/header/navItems';
import NavItem from '@/src/shared/components/navigation/NavItem';

interface Props {
  items: NavItemType[];
  isRtl: boolean;
  onNav: (route: string) => void;
}

const DrawerNavList: React.FC<Props> = ({ items, isRtl, onNav }) => {
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' } as any}>
      {items.map((item) => (
        <View key={item.labelKey}>
          <NavItem
            icon={item.icon}
            label={t(item.labelKey)}
            color={item.color}
            dividerBefore={item.dividerBefore}
            onPress={() => onNav(item.route)}
          />
        </View>
      ))}
    </ScrollView>
  );
};

export default DrawerNavList;