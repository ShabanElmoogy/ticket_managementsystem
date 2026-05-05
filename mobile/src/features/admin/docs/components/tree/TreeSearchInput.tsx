import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

interface Props {
  value: string;
  onChange: (q: string) => void;
}

/**
 * Search input shown at the top of the tree sidebar.
 * Controlled — parent owns the query state.
 */
const TreeSearchInput: React.FC<Props> = ({ value, onChange }) => {
  const c = useThemeColors();

  return (
    <View style={{
      paddingHorizontal: 10, paddingVertical: 6,
      borderBottomWidth: 1, borderBottomColor: c.border.primary,
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: c.surface.primary, borderRadius: 8,
        borderWidth: 1, borderColor: c.border.primary,
        paddingHorizontal: 8, paddingVertical: 5,
      }}>
        <Text style={{ fontSize: 13, color: c.text.muted }}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search docs…"
          placeholderTextColor={c.text.muted}
          style={{
            flex: 1, fontSize: 12,
            color: c.text.primary,
            paddingVertical: 0,
          }}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChange('')} hitSlop={6}>
            <Text style={{ fontSize: 12, color: c.text.muted }}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default TreeSearchInput;
