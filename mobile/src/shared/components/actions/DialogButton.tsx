import React from 'react';
import { Pressable, Text, StyleSheet, View, type ViewStyle, type TextStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Radius, FontSize, FontWeight } from '@/src/constants/tokens';

export interface DialogButtonProps {
  label:        string;
  onPress:      () => void;
  style?:       ViewStyle;
  labelStyle?:  TextStyle;
  disabled?:    boolean;
  /** MaterialIcons icon name */
  icon?:        keyof typeof MaterialIcons.glyphMap;
  /** Icon color — defaults to same as labelStyle color or white */
  iconColor?:   string;
}

const DialogButton: React.FC<DialogButtonProps> = ({
  label, onPress, style, labelStyle, disabled = false, icon, iconColor,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    style={[styles.base, style, disabled && styles.disabled]}
  >
    <View style={styles.row}>
      {!!icon && (
        <MaterialIcons
          name={icon}
          size={20}
          color={iconColor ?? (labelStyle as any)?.color ?? '#ffffff'}
        />
      )}
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    width:           '100%',
    borderRadius:    Radius.xl,
    paddingVertical: 14,
    alignItems:      'center',
    justifyContent:  'center',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  label: {
    fontSize:      FontSize.lg,
    fontWeight:    FontWeight.bold,
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default DialogButton;
