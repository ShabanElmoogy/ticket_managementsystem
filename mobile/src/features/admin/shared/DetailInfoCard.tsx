import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIsDark } from '@/src/constants/theme';

export interface InfoField {
  label:   string;
  value?:  string | number | null;
  /** Emoji icon shown before the label */
  icon?:   string;
  /** Custom render — overrides value display */
  render?: () => React.ReactNode;
  /** Accent color for the value text */
  valueColor?: string;
}

interface Props {
  title?:  string;
  fields:  InfoField[];
}

/**
 * DetailInfoCard — enhanced label/value rows inside a card.
 *
 * - Optional emoji icon per row
 * - Empty fields hidden automatically
 * - `render` prop for custom content (badges, chips, etc.)
 * - `valueColor` for colored values (e.g. expired dates in red)
 */
const DetailInfoCard: React.FC<Props> = ({ title, fields }) => {
  const isDark     = useIsDark();
  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const border     = isDark ? '#334155' : '#e2e8f0';
  const rowBorder  = isDark ? '#1e293b22' : '#f8fafc';
  const textVal    = isDark ? '#cbd5e1' : '#374151';
  const labelColor = isDark ? '#64748b' : '#94a3b8';

  const visibleFields = fields.filter(
    (f) => f.render || (f.value !== null && f.value !== undefined && f.value !== ''),
  );

  if (visibleFields.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {title && (
        <View style={[styles.titleRow, { borderBottomColor: border }]}>
          <Text style={[styles.title, { color: labelColor }]}>{title}</Text>
        </View>
      )}

      {visibleFields.map((field, i) => (
        <View
          key={i}
          style={[
            styles.row,
            i < visibleFields.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
          ]}
        >
          {/* Icon + label */}
          <View style={styles.labelWrap}>
            {field.icon && (
              <Text style={styles.icon}>{field.icon}</Text>
            )}
            {!!field.label && (
              <Text style={[styles.label, { color: labelColor }]}>{field.label}</Text>
            )}
          </View>

          {/* Value */}
          <View style={styles.valueWrap}>
            {field.render ? (
              field.render()
            ) : (
              <Text style={[styles.value, { color: field.valueColor ?? textVal }]}>
                {String(field.value)}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 110,
    flexShrink: 0,
  },
  icon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  valueWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default DetailInfoCard;
