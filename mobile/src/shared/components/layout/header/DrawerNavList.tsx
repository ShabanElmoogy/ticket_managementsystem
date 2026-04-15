import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { NavItem } from './navItems';

interface Props {
  items: NavItem[];
  isRtl: boolean;
  onNav: (route: string) => void;
}

const DrawerNavList: React.FC<Props> = ({ items, isRtl, onNav }) => (
  <ScrollView style={{ flex: 1 }}>
    {items.map((item) => (
      <React.Fragment key={item.label}>
        {item.dividerBefore && (
          <View style={{ marginHorizontal: 16, marginVertical: 4, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        )}
        {/* Always row — icon left, text fills remaining space.
            In RTL: text is right-aligned so it reads naturally from the right. */}
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
          onPress={() => onNav(item.route)}
        >
          <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</Text>
          <Text style={{
            fontSize: 14, fontWeight: '500', flex: 1,
            color: item.color ?? '#fff',
            textAlign: isRtl ? 'right' : 'left',
          }}>
            {item.label}
          </Text>
        </Pressable>
      </React.Fragment>
    ))}
  </ScrollView>
);

export default DrawerNavList;
