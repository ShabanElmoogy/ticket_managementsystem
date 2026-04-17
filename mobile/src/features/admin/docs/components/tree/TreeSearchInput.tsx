import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

interface Props {
  value: string;
  onChange: (q: string) => void;
  isDark: boolean;
}

/**
 * Search input shown at the top of the tree sidebar.
 * Controlled — parent owns the query state.
 */
const TreeSearchInput: React.FC<Props> = ({ value, onChange, isDark }) => {
  const borderC     = isDark ? '#1e293b' : '#e2e8f0';
  const inputBg     = isDark ? '#1e293b' : '#fff';
  const inputBorder = isDark ? '#334155' : '#e2e8f0';
  const muted       = isDark ? '#64748b' : '#94a3b8';

  return (
    <View style={{
      paddingHorizontal: 10, paddingVertical: 6,
      borderBottomWidth: 1, borderBottomColor: borderC,
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: inputBg, borderRadius: 8,
        borderWidth: 1, borderColor: inputBorder,
        paddingHorizontal: 8, paddingVertical: 5,
      }}>
        <Text style={{ fontSize: 13, color: muted }}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search docs…"
          placeholderTextColor={muted}
          style={{
            flex: 1, fontSize: 12,
            color: isDark ? '#e2e8f0' : '#1e293b',
            paddingVertical: 0,
          }}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChange('')} hitSlop={6}>
            <Text style={{ fontSize: 12, color: muted }}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default TreeSearchInput;
