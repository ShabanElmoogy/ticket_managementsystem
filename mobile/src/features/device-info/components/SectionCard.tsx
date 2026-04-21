import React from 'react';
import { View, Text } from 'react-native';
import type { InfoSection } from '../types';
import { fmt } from '../utils';

interface Props {
  section: InfoSection;
  isDark: boolean;
}

const SectionCard: React.FC<Props> = ({ section, isDark }) => {
  const bg     = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const labelC = isDark ? '#94a3b8' : '#64748b';
  const valueC = isDark ? '#e2e8f0' : '#1e293b';
  const rowBg  = isDark ? '#273549' : '#f8fafc';

  return (
    <View style={{
      backgroundColor: bg, borderRadius: 14,
      borderWidth: 1, borderColor: border,
      marginBottom: 14, overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: section.color + (isDark ? '22' : '12'),
        borderBottomWidth: 1, borderBottomColor: border,
      }}>
        <Text style={{ fontSize: 20 }}>{section.emoji}</Text>
        <Text style={{
          fontSize: 13, fontWeight: '800', color: section.color,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {section.title}
        </Text>
      </View>

      {/* Rows */}
      {section.rows.map((row, i) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 11,
            backgroundColor: i % 2 === 0 ? 'transparent' : rowBg,
            borderBottomWidth: i < section.rows.length - 1 ? 1 : 0,
            borderBottomColor: border,
          }}
        >
          <Text style={{ flex: 1, fontSize: 12, color: labelC, fontWeight: '600' }}>
            {row.label}
          </Text>
          <Text style={{
            fontSize: 12, color: valueC, fontWeight: '500',
            textAlign: 'right', maxWidth: '58%', flexShrink: 1,
          }}>
            {fmt(row.value)}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default SectionCard;
