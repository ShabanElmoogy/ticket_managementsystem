import React from 'react';
import { View, Text, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import type { InfoSection } from '../types';

interface Props {
  section: InfoSection;
}

const SectionCard: React.FC<Props> = ({ section }) => {
  const { t } = useTranslation();
  const c = useThemeColors();
  const isRTL = I18nManager.isRTL;

  const fmt = (v: string | number | boolean | null | undefined): string => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? `✅ ${t('deviceInfo.values.yes')}` : `❌ ${t('deviceInfo.values.no')}`;
    return String(v) || '—';
  };

  return (
    <View style={{
      backgroundColor: c.surface.primary, 
      borderRadius: 14,
      borderWidth: 1, 
      borderColor: c.border.primary,
      marginBottom: 14, 
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center', 
        gap: 10,
        paddingHorizontal: 16, 
        paddingVertical: 12,
        backgroundColor: section.color + '22', // 13% opacity background
        borderBottomWidth: 1, 
        borderBottomColor: c.border.primary,
      }}>
        <Text style={{ fontSize: 20 }}>{section.emoji}</Text>
        <Text style={{
          fontSize: 13, 
          fontWeight: '800', 
          color: section.color,
          textTransform: 'uppercase', 
          letterSpacing: 0.5,
        }}>
          {section.title}
        </Text>
      </View>

      {/* Rows */}
      {section.rows.map((row, i) => (
        <View
          key={row.label}
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            paddingHorizontal: 16, 
            paddingVertical: 11,
            backgroundColor: i % 2 === 0 ? 'transparent' : c.surface.secondary,
            borderBottomWidth: i < section.rows.length - 1 ? 1 : 0,
            borderBottomColor: c.border.primary,
          }}
        >
          <Text style={{
            flex: 1, 
            fontSize: 12, 
            color: c.text.secondary, 
            fontWeight: '600',
            textAlign: isRTL ? 'right' : 'left',
          }}>
            {row.label}
          </Text>
          <Text style={{
            fontSize: 12, 
            color: c.text.primary, 
            fontWeight: '500',
            textAlign: isRTL ? 'left' : 'right',
            maxWidth: '58%', 
            flexShrink: 1,
          }}>
            {fmt(row.value)}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default SectionCard;
