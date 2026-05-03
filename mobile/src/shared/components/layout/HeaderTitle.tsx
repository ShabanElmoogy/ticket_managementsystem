import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

export interface HeaderTitleProps {
  subtitle?: string;
  /** Numeric or string badge shown next to the title */
  badge?:    number | string;
}

/**
 * Centered title block used inside screen headers.
 * Renders: title + optional badge chip + optional subtitle line.
 */
const HeaderTitle: React.FC<HeaderTitleProps> = ({  subtitle, badge }) => {
  const c = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {badge !== undefined && (
          <View style={[
            styles.badge,
            {
              backgroundColor: c.interactive.primary + '22',
              borderColor:     c.interactive.primary + '44',
            },
          ]}>
            <Text style={[styles.badgeText, { color: c.interactive.primary }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, { color: c.text.secondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex:       1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  title: {
    fontSize:   18,
    fontWeight: '700',
  },
  badge: {
    borderWidth:       1,
    borderRadius:      999,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize:  12,
    marginTop: 2,
  },
});

export default HeaderTitle;
