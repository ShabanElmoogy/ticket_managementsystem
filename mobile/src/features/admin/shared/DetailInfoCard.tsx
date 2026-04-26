import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface InfoField {
  label:      string;
  value?:     string | number | null;
  icon?:      string;
  render?:    () => React.ReactNode;
  valueColor?: string;
}

interface Props {
  title?:  string;
  fields:  InfoField[];
}

const DetailInfoCard: React.FC<Props> = ({ title, fields }) => {
  const c = useThemeColors();

  const visibleFields = fields.filter(
    (f) => f.render || (f.value !== null && f.value !== undefined && f.value !== ''),
  );

  if (visibleFields.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: c.surface.primary, borderColor: c.border.primary, shadowColor: c.shadow }]}>
      {title && (
        <View style={[styles.titleRow, { borderBottomColor: c.border.primary }]}>
          <Text style={[styles.title, { color: c.text.muted }]}>{title}</Text>
        </View>
      )}

      {visibleFields.map((field, i) => (
        <View
          key={i}
          style={[
            styles.row,
            i < visibleFields.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border.secondary },
          ]}
        >
          <View style={styles.labelWrap}>
            {field.icon && <Text style={styles.icon}>{field.icon}</Text>}
            {!!field.label && <Text style={[styles.label, { color: c.text.muted }]}>{field.label}</Text>}
          </View>

          <View style={styles.valueWrap}>
            {field.render ? (
              field.render()
            ) : (
              <Text style={[styles.value, { color: field.valueColor ?? c.text.primary }]}>
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
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
