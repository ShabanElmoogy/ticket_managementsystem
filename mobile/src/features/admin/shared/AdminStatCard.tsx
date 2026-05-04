import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import type { IoniconName } from '@/src/components/layout/header/navItems';

export interface AdminStatCardProps {
  title:     string;
  value:     number;
  icon:      IoniconName;
  color:     string;
  cardWidth: number;
}

const AdminStatCard: React.FC<AdminStatCardProps> = ({ title, value, icon, color, cardWidth }) => {
  const c = useThemeColors();

  return (
    <View style={{
      width:           cardWidth,
      borderRadius:    Radius.lg,
      padding:         14,
      backgroundColor: c.surface.primary,
      shadowColor:     c.shadow,
      shadowOffset:    { width: 0, height: 2 },
      shadowOpacity:   0.07,
      shadowRadius:    6,
      elevation:       3,
    }}>
      {/* Icon badge + dot */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{
          width:           40,
          height:          40,
          borderRadius:    Radius.lg,
          backgroundColor: color + '20',
          alignItems:      'center',
          justifyContent:  'center',
        }}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      </View>

      {/* Value */}
      <Text style={{
        fontSize:   FontSize['4xl'],
        fontWeight: FontWeight.extrabold,
        lineHeight: 32,
        color:      c.text.primary,
      }}>
        {value.toLocaleString()}
      </Text>

      {/* Title */}
      <Text style={{
        fontSize:   FontSize.xs,
        fontWeight: FontWeight.medium,
        marginTop:  4,
        color:      c.text.secondary,
      }} numberOfLines={1}>
        {title}
      </Text>

      {/* Progress bar */}
      <View style={{ height: 3, borderRadius: 2, marginTop: 10, backgroundColor: color + '25' }}>
        <View style={{ height: '100%', borderRadius: 2, backgroundColor: color, width: '60%' }} />
      </View>
    </View>
  );
};

export default AdminStatCard;
