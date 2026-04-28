import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';

export interface CompactListRowProps {
  title:     string;
  subtitle?: string;
  left?:     React.ReactNode;
  right?:    React.ReactNode;
  onPress?:  () => void;
}

const CompactListRow: React.FC<CompactListRowProps> = ({
  title, subtitle, left, right, onPress,
}) => {
  const c = useThemeColors();

  const content = (
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

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        backgroundColor: pressed ? c.interactive.pressed : 'transparent',
      })}
    >
      {content}
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
