import React from 'react';
import { View, Text } from 'react-native';

export interface AdminOverviewCardProps {
  title:        string;
  icon:         string;
  total:        number;
  active:       number;
  activeLabel?: string;
  metricLabel?: string;
  isDark:       boolean;
}

/**
 * AdminOverviewCard — summary card with total, active count, rate badge, and progress bar.
 * Used in the admin dashboard overview section.
 */
const AdminOverviewCard: React.FC<AdminOverviewCardProps> = ({
  title, icon, total, active,
  activeLabel = 'Active',
  metricLabel = 'Active Rate',
  isDark,
}) => {
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  const cardBg  = isDark ? '#1e293b' : '#ffffff';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#64748b' : '#94a3b8';
  const trackBg = isDark ? '#334155' : '#f1f5f9';

  return (
    <View style={{
      borderRadius:    12,
      padding:         16,
      marginBottom:    12,
      backgroundColor: cardBg,
      shadowColor:     '#000',
      shadowOffset:    { width: 0, height: 1 },
      shadowOpacity:   0.06,
      shadowRadius:    4,
      elevation:       2,
    }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textPri }}>{title}</Text>
        </View>
        <View style={{
          backgroundColor: '#3b82f618', borderRadius: 20,
          paddingHorizontal: 10, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>
            {rate}% {metricLabel}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: textPri }}>
            {total.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 11, color: textSec, marginTop: 2 }}>Total</Text>
        </View>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#10b981' }}>
            {active.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 11, color: textSec, marginTop: 2 }}>{activeLabel}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#3b82f6' }}>
            {rate}%
          </Text>
          <Text style={{ fontSize: 11, color: textSec, marginTop: 2 }}>Rate</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 6, borderRadius: 3, backgroundColor: trackBg }}>
        <View style={{ height: '100%', borderRadius: 3, backgroundColor: '#10b981', width: `${rate}%` }} />
      </View>
    </View>
  );
};

export default AdminOverviewCard;
