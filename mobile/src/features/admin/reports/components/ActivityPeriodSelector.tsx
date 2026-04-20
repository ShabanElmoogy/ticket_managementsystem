import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ACTIVITY_PERIODS, type ActivityPeriod } from '../types';

interface Props {
  value: ActivityPeriod;
  onChange: (p: ActivityPeriod) => void;
  isDark: boolean;
}

const ActivityPeriodSelector: React.FC<Props> = ({ value, onChange, isDark }) => (
  <View style={{ marginTop: 8 }}>
    <Text style={{
      fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: 0.5, color: isDark ? '#475569' : '#94a3b8',
      marginBottom: 6,
    }}>
      Activity Period
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 6 }}
    >
      {ACTIVITY_PERIODS.map((p) => {
        const active = value.daysA === p.daysA && value.daysB === p.daysB;
        return (
          <Pressable
            key={`${p.daysA}-${p.daysB}`}
            onPress={() => onChange(p)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
              backgroundColor: active ? '#8b5cf6' : (isDark ? '#1e293b' : '#fff'),
              borderWidth: 1.5,
              borderColor: active ? '#8b5cf6' : (isDark ? '#334155' : '#e2e8f0'),
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: '600',
              color: active ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
            }}>
              {p.labelA} / {p.labelB}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);

export default ActivityPeriodSelector;
