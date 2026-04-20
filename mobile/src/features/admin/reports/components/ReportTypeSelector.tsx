import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { REPORT_TYPES, type ReportType } from '../types';

interface Props {
  value: ReportType;
  onChange: (t: ReportType) => void;
  isDark: boolean;
}

const ReportTypeSelector: React.FC<Props> = ({ value, onChange, isDark }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ gap: 6, flexDirection: 'row' }}
  >
    {REPORT_TYPES.map((rt) => {
      const active = value === rt.id;
      return (
        <Pressable
          key={rt.id}
          onPress={() => onChange(rt.id)}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
            backgroundColor: active ? '#3b82f6' : (isDark ? '#1e293b' : '#fff'),
            borderWidth: 1.5,
            borderColor: active ? '#3b82f6' : (isDark ? '#334155' : '#e2e8f0'),
          }}
        >
          <Text style={{
            fontSize: 12, fontWeight: '600',
            color: active ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
          }}>
            {rt.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

export default ReportTypeSelector;
