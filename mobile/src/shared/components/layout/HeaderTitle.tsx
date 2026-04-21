import React from 'react';
import { View, Text } from 'react-native';

export interface HeaderTitleProps {
  title: string;
  subtitle?: string;
  /** Numeric or string badge shown next to the title */
  badge?: number | string;
  isDark?: boolean;
}

/**
 * Centered title block used inside screen headers.
 * Renders: title + optional badge chip + optional subtitle line.
 */
const HeaderTitle: React.FC<HeaderTitleProps> = ({
  title, subtitle, badge, isDark = false,
}) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text
        numberOfLines={1}
        style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}
      >
        {title}
      </Text>
      {badge !== undefined && (
        <View style={{
          backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
          borderWidth: 1,
          borderColor: isDark ? '#2563eb' : '#bfdbfe',
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#2563eb' }}>{badge}</Text>
        </View>
      )}
    </View>
    {subtitle && (
      <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#6b7280', marginTop: 2 }}>
        {subtitle}
      </Text>
    )}
  </View>
);

export default HeaderTitle;
