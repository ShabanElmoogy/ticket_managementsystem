import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

export interface HeaderTitleProps {
  title: string;
  subtitle?: string;
  /** Numeric or string badge shown next to the title */
  badge?: number | string;
  /** @deprecated — component reads theme internally via useThemeColors() */
  isDark?: boolean;
}

/**
 * Centered title block used inside screen headers.
 * Renders: title + optional badge chip + optional subtitle line.
 */
const HeaderTitle: React.FC<HeaderTitleProps> = ({
  title, subtitle, badge,
}) => {
  const c = useThemeColors();

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 18, fontWeight: '700', color: c.text.primary }}
        >
          {title}
        </Text>
        {badge !== undefined && (
          <View style={{
            backgroundColor: c.interactive.primary + '22',
            borderWidth: 1,
            borderColor: c.interactive.primary + '44',
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.interactive.primary }}>{badge}</Text>
          </View>
        )}
      </View>
      {subtitle && (
        <Text style={{ fontSize: 12, color: c.text.secondary, marginTop: 2 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default HeaderTitle;
