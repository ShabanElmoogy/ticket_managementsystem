/**
 * AppSearchInput — search bar with clear button.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   AdminCrudScreen — search bar above the data table
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors() and useDirection() internally.
 * Do NOT use inside a <Modal> — screens only.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   <AppSearchInput
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Search customers…"
 *   />
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
// TextInput via require — avoids @types/react-native 0.72 named export conflict
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native');
const TextInput = RN.TextInput as any;
import { useDirection } from '@/src/providers/DirectionProvider';
import { useThemeColors, FontSize, Radius } from '@/src/constants/theme';

interface AppSearchInputProps {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  /** Container style override — use for margin/positioning */
  style?:       ViewStyle;
  /** @deprecated — theme resolved internally */
  isDark?:      boolean;
}

const AppSearchInput: React.FC<AppSearchInputProps> = ({
  value, onChange, placeholder = 'Search…', style,
}) => {
  const { isRtl } = useDirection();
  const c = useThemeColors();

  return (
    <View style={[
      styles.container,
      {
        borderColor:     value ? c.border.focus : c.border.primary,
        backgroundColor: c.surface.secondary,
      },
      style,
    ]}>
      {/* Search icon */}
      <Text style={[styles.icon, { color: c.text.muted }]}>🔍</Text>

      {/* Input */}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[
          styles.input,
          {
            color:            c.text.primary,
            textAlign:        isRtl ? 'right' : 'left',
            writingDirection: isRtl ? 'rtl' : 'ltr',
          },
        ]}
      />

      {/* Clear button */}
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={8}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <View style={[styles.clearIcon, { backgroundColor: c.text.muted + '30' }]}>
            <Text style={{ fontSize: 10, color: c.text.muted, fontWeight: '700' }}>✕</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderRadius:      Radius.xl,
    borderWidth:       1.5,
  },
  icon: {
    fontSize:  FontSize.lg,
    marginEnd: 8,
  },
  input: {
    flex:            1,
    fontSize:        FontSize.base,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  clearIcon: {
    width:          18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
    marginStart:    6,
  },
});

export default AppSearchInput;
