import React from 'react';
import { View, Text } from 'react-native';

export interface AdminStatCardProps {
  title:     string;
  value:     number;
  icon:      string;
  color:     string;
  isDark:    boolean;
  cardWidth: number;
}

/**
 * AdminStatCard — compact metric tile used in the admin dashboard grid.
 *
 * Shows: icon badge, color dot, large value, title label, and a tinted accent bar.
 * Responsive width is passed from the parent grid calculation.
 */
const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title, value, icon, color, isDark, cardWidth,
}) => (
  <View style={{
    width:           cardWidth,
    borderRadius:    12,
    padding:         14,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
    elevation:       3,
  }}>
    {/* Icon badge + color dot */}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <View style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: color + '18',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>

    {/* Value */}
    <Text style={{
      fontSize: 28, fontWeight: '800', lineHeight: 32,
      color: isDark ? '#f1f5f9' : '#0f172a',
    }}>
      {value.toLocaleString()}
    </Text>

    {/* Title */}
    <Text style={{
      fontSize: 11, fontWeight: '500', marginTop: 4,
      color: isDark ? '#94a3b8' : '#64748b',
    }} numberOfLines={1}>
      {title}
    </Text>

    {/* Accent bar */}
    <View style={{
      height: 3, borderRadius: 2, marginTop: 10,
      backgroundColor: color + '33',
    }}>
      <View style={{ height: '100%', borderRadius: 2, backgroundColor: color, width: '60%' }} />
    </View>
  </View>
);

export default AdminStatCard;
