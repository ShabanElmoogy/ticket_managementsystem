import React from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NavItemConfig as NavItemType } from '@/src/components/layout/header/navItems';
import { NavItem } from '@/src/shared/components';

interface Props {
  items: NavItemType[];
  isRtl: boolean;
  onNav: (route: string) => void;
}

const DrawerNavList: React.FC<Props> = ({ items, isRtl, onNav }) => {
  const { t } = useTranslation();

  return (
    <ScrollView style={{ flex: 1 }}>
      {items.map((item) => (
        <NavItem
          key={item.labelKey}
          icon={item.icon}
          label={t(item.labelKey)}
          color={item.color}
          isRtl={isRtl}
          dividerBefore={item.dividerBefore}
          onPress={() => onNav(item.route)}
        />
      ))}
    </ScrollView>
  );
};

export default DrawerNavList;