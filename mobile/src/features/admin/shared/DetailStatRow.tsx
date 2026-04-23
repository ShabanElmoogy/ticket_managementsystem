import React from 'react';
import { View, Text } from 'react-native';

export interface StatItem {
  value:   number;
  label:   string;
  color:   string;   // text color
  bgColor: string;   // background color
}

interface Props {
  stats: StatItem[];
}

/**
 * DetailStatRow — horizontal row of stat cards.
 * Each card shows a large number + label with a colored background.
 *
 * Usage:
 *   <DetailStatRow
 *     stats={[
 *       { value: 12, label: 'Tickets',   color: '#1d4ed8', bgColor: '#eff6ff' },
 *       { value: 3,  label: 'Customers', color: '#065f46', bgColor: '#f0fdf4' },
 *     ]}
 *   />
 */
const DetailStatRow: React.FC<Props> = ({ stats }) => (
  <View style={{ flexDirection: 'row', gap: 10 }}>
    {stats.map((s, i) => (
      <View
        key={i}
        style={{
          flex: 1, padding: 16, borderRadius: 12,
          backgroundColor: s.bgColor,
          borderWidth: 1, borderColor: s.color + '44',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: s.color }}>
          {s.value}
        </Text>
        <Text style={{ fontSize: 12, color: s.color, marginTop: 4 }}>
          {s.label}
        </Text>
      </View>
    ))}
  </View>
);

export default DetailStatRow;
