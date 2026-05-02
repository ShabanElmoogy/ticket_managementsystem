/**
 * CompactListRow — single-line list item with optional left slot, right slot, and press handler.
 *
 * Used in compact view of admin tables and report rows.
 *
 * @example
 * <CompactListRow
 *   title="John Doe"
 *   subtitle="john@example.com"
 *   left={<InitialAvatar name="John Doe" />}
 *   right={<AppBadge label="ACTIVE" variant="status" />}
 *   onPress={() => navigate(id)}
 * />
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';

export interface CompactListRowProps {
  title:              string;
  subtitle?:          string;
  left?:              React.ReactNode;
  right?:             React.ReactNode;
  onPress?:           () => void;
  accessibilityLabel?: string;
}

const CompactListRow: React.FC<CompactListRowProps> = ({
  title, subtitle, left, right, onPress, accessibilityLabel,
}) => {
  const c = useThemeColors();

  const inner = (
    <View style={[styles.row, { borderBottomColor: c.border.primary }]}>
      {!!left  && <View style={styles.leftSlot}>{left}</View>}
      <View style={styles.body}>
        <Text style={[styles.title, { color: c.text.primary }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: c.text.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {!!right && <View style={styles.rightSlot}>{right}</View>}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }: { pressed: boolean }) => ({
        backgroundColor: pressed ? c.interactive.pressed : 'transparent',
      })}
    >
      {inner}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  leftSlot:  { marginEnd: 10 },
  rightSlot: { marginStart: 8 },
  body:      { flex: 1 },
  title:     { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  subtitle:  { fontSize: FontSize.xs, marginTop: 1 },
});

export default CompactListRow;
