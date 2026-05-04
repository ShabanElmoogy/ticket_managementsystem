import React from 'react';
import { Text, Pressable, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { Radius, FontSize, FontWeight } from '@/src/constants/theme';

export interface ToggleButtonProps {
  icon?:    string;
  label:    string;
  /**
   * Background color — defaults to semi-transparent white.
   * Designed for dark backgrounds. Pass an explicit color on light backgrounds.
   */
  backgroundColor?: string;
  textColor?:       string;  loading?:         boolean;
  disabled?:        boolean;
  onPress?:         () => void;
  /**
   * Container style override.
   * Note: base style includes `flex: 1` so the button fills its parent row.
   * Override with `style={{ flex: undefined, width: ... }}` if needed.
   */
  style?:           ViewStyle;
}

/**
 * ToggleButton — a flexible pill button used in rows of equal-width options.
 * Supports loading spinner and disabled state.
 *
 * Dumb component — no theme hooks. Pass colors explicitly.
 * Safe to use inside a <Modal>.
 */
const ToggleButton: React.FC<ToggleButtonProps> = ({
  icon, label,
  backgroundColor = 'rgba(255,255,255,0.14)',  // was 0.1 — more visible on dark bg
  textColor       = '#e2e8f0',                 // slate200 — softer than pure white
  loading         = false,
  disabled        = false,
  onPress,
  style,
}) => (
  <Pressable
    style={[
      styles.container,
      { backgroundColor },
      (disabled || loading) && styles.disabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: disabled || loading, busy: loading }}
  >
    {loading ? (
      <ActivityIndicator size="small" color={textColor} />
    ) : (
      <>
        {icon && (
          <Text style={styles.icon} accessibilityElementsHidden>
            {icon}
          </Text>
        )}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             4,
    borderRadius:    Radius.md,
    paddingVertical: 9,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.18)',
  },
  disabled: {
    opacity: 0.45,
  },
  icon: {
    fontSize: FontSize.md,
  },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});

export default ToggleButton;
