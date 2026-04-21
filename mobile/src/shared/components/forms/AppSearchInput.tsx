import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useDirection } from '../../../providers/DirectionProvider';

interface Props {
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
  placeholder?: string;
  /** Extra margin/padding overrides */
  style?: object;
}

/**
 * Generic search input with clear button and dark mode support.
 * Reusable across any admin screen that needs a search field.
 */
const AppSearchInput: React.FC<Props> = ({
  value, onChange, isDark,
  placeholder = 'Search…',
  style,
}) => {
  const { isRtl } = useDirection();

  return (
  <View style={[{
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10, 
    borderWidth: 1.5,
    borderColor: value ? '#3b82f6' : (isDark ? '#334155' : '#e2e8f0'),
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  }, style]}>
    <Text style={{ fontSize: 15, marginEnd: 8, color: isDark ? '#475569' : '#94a3b8' }}>🔍</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
      autoCapitalize="none"
      autoCorrect={false}
      style={{
        flex: 1, fontSize: 13,
        color: isDark ? '#e2e8f0' : '#1e293b',
        paddingVertical: 0,
        textAlign: isRtl ? 'right' : 'left',
        writingDirection: isRtl ? 'rtl' : 'ltr',
      }}
    />
    {value.length > 0 && (
      <Pressable onPress={() => onChange('')} hitSlop={8}>
        <Text style={{ fontSize: 14, color: isDark ? '#475569' : '#94a3b8', marginStart: 6 }}>✕</Text>
      </Pressable>
    )}
  </View>
  );
};

export default AppSearchInput;
