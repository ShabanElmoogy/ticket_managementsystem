import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  label: string;
  value: number;
  color: string;
}

/**
 * Colored stat pill — value on top, label below.
 * Used in grid cards, dashboards, summary panels, etc.
 */
const StatBadge: React.FC<Props> = ({ label, value, color }) => (
  <View style={{
    alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, backgroundColor: color + '18',
    borderWidth: 1, borderColor: color + '33', minWidth: 44,
  }}>
    <Text style={{ fontSize: 14, fontWeight: '800', color }}>{value}</Text>
    <Text style={{ fontSize: 9, color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 }}>
      {label}
    </Text>
  </View>
);

export default StatBadge;
