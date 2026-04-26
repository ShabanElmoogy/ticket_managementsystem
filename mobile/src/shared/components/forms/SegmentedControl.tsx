import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options:      SegmentedOption[];
  value:        string;
  onChange:     (value: string) => void;
  loading?:     boolean;
  activeColor?: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options, value, onChange, loading = false, activeColor,
}) => {
  const c          = useThemeColors();
  const activeBg   = activeColor ?? c.interactive.primary;
  const activeText = c.text.inverse;

  return (
    <View style={[styles.track, { backgroundColor: c.surface.tertiary }]}>
      {options.map((opt) => {
        const isActive    = opt.value === value;
        const showSpinner = loading && !isActive;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={loading || isActive}
            style={[styles.option, { backgroundColor: isActive ? activeBg : 'transparent' }]}
          >
            {showSpinner ? (
              <ActivityIndicator size="small" color={c.text.secondary} />
            ) : (
              <Text style={[styles.label, {
                color:      isActive ? activeText : c.text.secondary,
                fontWeight: isActive ? FontWeight.bold : FontWeight.medium,
              }]}>
                {opt.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track:  { flexDirection: 'row', borderRadius: Radius.md, padding: 2, gap: 2 },
  option: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.sm, minWidth: 50, alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: FontSize.base },
});

export default SegmentedControl;
