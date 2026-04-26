import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface AddButtonProps {
  onPress:  () => void;
  label?:   string;
  loading?: boolean;
}

/**
 * Green "Add" button — used in admin screen headers.
 */
const AddButton: React.FC<AddButtonProps> = ({
  onPress, label = 'Add', loading = false,
}) => {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        alignItems: 'center', justifyContent: 'center',
        height: 44, paddingHorizontal: 12, borderRadius: Radius.lg,
        backgroundColor: pressed ? c.interactive.successPressed : c.interactive.success,
        opacity:       loading ? 0.5 : 1,
        shadowColor:   c.shadow,
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: loading ? 0 : 0.35,
        shadowRadius:  5,
        elevation:     loading ? 0 : 3,
      })}
    >
      <View style={{ flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: FontSize.xl, lineHeight: 18 }}>➕</Text>
        <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: c.text.primary }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

export default AddButton;
