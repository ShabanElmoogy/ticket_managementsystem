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
        <Pressable
          style={{
            flexDirection: isRtl ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: isRtl ? 'flex-end' : 'flex-start',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
          }}
          onPress={() => onNav(item.route)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 18, width: 24, textAlign: 'right' }}>{item.icon}</Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: item.color ?? '#fff',
            }}>
              {item.label}
            </Text>
          </View>

        </Pressable>
      </React.Fragment>
    ))}
  </ScrollView>
);

export default DrawerNavList;
