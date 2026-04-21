import React from 'react';
import { Pressable, Text, View } from 'react-native';

export interface AddButtonProps {
  onPress: () => void;
  label?: string;
  loading?: boolean;
  isDark?: boolean;
}

/**
 * Green "Add" button — used in admin screen headers.
 * Matches the visual style of ExportPdfButton and RefreshButton.
 */
const AddButton: React.FC<AddButtonProps> = ({
  onPress, label = 'Add', loading = false, isDark = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={loading}
    style={({ pressed }) => ({
      alignItems: 'center', justifyContent: 'center', gap: 2,
      height: 44, paddingHorizontal: 12, borderRadius: 10,
      backgroundColor: pressed ? '#15803d' : '#16a34a',
      opacity: loading ? 0.5 : 1,
      shadowColor: '#16a34a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: loading ? 0 : 0.35,
      shadowRadius: 5,
      elevation: loading ? 0 : 3,
    })}
  >
    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 16, lineHeight: 18 }}>➕</Text>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{label}</Text>
    </View>
  </Pressable>
);

export default AddButton;
