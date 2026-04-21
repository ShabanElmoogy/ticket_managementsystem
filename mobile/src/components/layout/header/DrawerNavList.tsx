import React from 'react';
import { ScrollView } from 'react-native';
import type { NavItem as NavItemType } from './navItems';
import { NavItem } from '../../../shared/components';

interface Props {
  items: NavItemType[];
  isRtl: boolean;
  onNav: (route: string) => void;
}

const DrawerNavList: React.FC<Props> = ({ items, isRtl, onNav }) => (
  <ScrollView style={{ flex: 1 }}>
    {items.map((item) => (
      <NavItem
        key={item.label}
        icon={item.icon}
        label={item.label}
        color={item.color}
        isRtl={isRtl}
        dividerBefore={item.dividerBefore}
        onPress={() => onNav(item.route)}
      />
    ))}
  </ScrollView>
);

export default DrawerNavList;