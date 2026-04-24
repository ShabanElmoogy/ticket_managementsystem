import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useDirection } from '../../../providers/DirectionProvider';
import { useThemeColors, FontSize } from '../../../constants/theme';

interface Props {
  value:        string;
  onChange:     (v: string) => void;
  isDark?:      boolean;
  placeholder?: string;
  style?:       object;
}

const AppSearchInput: React.FC<Props> = ({
  value, onChange, placeholder = 'Search…', style,
}) => {
  const { isRtl } = useDirection();
  const c = useThemeColors();

  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 12, marginVertical: 10,
      paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 10, borderWidth: 1.5,
      borderColor:     value ? c.border.focus : c.border.primary,
      backgroundColor: c.surface.secondary,
    }, style]}>
      <Text style={{ fontSize: FontSize.lg, marginEnd: 8, color: c.text.muted }}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          flex: 1, fontSize: FontSize.base,
          color: c.text.primary,
          paddingVertical: 0,
          textAlign: isRtl ? 'right' : 'left',
          writingDirection: isRtl ? 'rtl' : 'ltr',
        }}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Text style={{ fontSize: FontSize.md, color: c.text.muted, marginStart: 6 }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

export default AppSearchInput;
