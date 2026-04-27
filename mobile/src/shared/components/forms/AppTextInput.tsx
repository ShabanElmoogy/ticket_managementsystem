import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  type TextInputProps, type StyleProp, type ViewStyle,
} from 'react-native';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useThemeColors, useIsDark, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export type AppTextInputFieldType = 'text' | 'search' | 'password' | 'number' | 'email';

export interface AppTextInputProps extends Omit<TextInputProps, 'style'> {
  label?:           string;
  hint?:            string;
  error?:           string;
  required?:        boolean;
  fieldType?:       AppTextInputFieldType;
  showClearButton?: boolean;
  onClear?:         () => void;
  containerStyle?:  StyleProp<ViewStyle>;
  maxLength?:       number;
  min?:             number;
  max?:             number;
  step?:            number;
  inputRef?:        React.RefObject<TextInput | null>;
  nextRef?:         React.RefObject<TextInput | null>;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
  label, hint, error, required = false,
  fieldType = 'text',
  showClearButton, onClear, containerStyle,
  value, onChangeText, maxLength,
  min, max, step = 1,
  inputRef, nextRef,
  ...rest
}) => {
  const [focused,      setFocused]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isRtl } = useDirection();
  const c      = useThemeColors();
  const isDark = useIsDark();

  const isPassword = fieldType === 'password';
  const isSearch   = fieldType === 'search';
  const isNumber   = fieldType === 'number';
  const hasValue   = String(value ?? '').length > 0;
  const charCount  = String(value ?? '').length;
  const showClear  = (showClearButton ?? isSearch) && hasValue;
  const showBadge  = maxLength !== undefined && !isNumber;

  // Badge color based on fill %
  const pct = maxLength ? charCount / maxLength : 0;
  const badgeColor = pct >= 0.9 ? c.intent.error
                   : pct >= 0.75 ? c.intent.warning
                   : focused ? c.intent.success
                   : c.text.muted;

  const keyboardType: TextInputProps['keyboardType'] =
    isNumber ? 'numeric' :
    fieldType === 'email' ? 'email-address' : 'default';

  // Border: error → red, focused → blue, default → subtle
  const borderColor = error   ? c.intent.error
                    : focused ? c.interactive.primary
                    : c.border.primary;

  const borderWidth = focused || error ? 2 : 1;

  // Input background: slightly different from page bg for depth
  const inputBg = isDark
    ? (focused ? '#1a2a3e' : '#162030')
    : (focused ? '#f8faff' : c.surface.primary);

  const textAlign = isNumber ? 'center' : isRtl ? 'right' : 'left';

  const handleStep = (dir: 1 | -1) => {
    const current = parseFloat(String(value ?? '0')) || 0;
    let next = current + dir * step;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChangeText?.(String(next));
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label row */}
      {label && (
        <View style={styles.labelRow}>
          <Text style={[
            styles.label,
            {
              color:     error ? c.intent.error : c.text.secondary,
              textAlign: isRtl ? 'right' : 'left',
            },
          ]}>
            {label}
            {required && <Text style={{ color: c.intent.error }}> *</Text>}
          </Text>
          {showBadge && (
            <Text style={[styles.charCount, { color: badgeColor }]}>
              {charCount}/{maxLength}
            </Text>
          )}
        </View>
      )}

      {/* Input wrapper */}
      <View style={[
        styles.inputWrapper,
        {
          borderColor,
          borderWidth,
          borderRadius:    Radius.xl,
          backgroundColor: inputBg,
          // Subtle shadow when focused
          ...(focused && {
            shadowColor:   c.interactive.primary,
            shadowOffset:  { width: 0, height: 0 },
            shadowOpacity: isDark ? 0.35 : 0.15,
            shadowRadius:  6,
            elevation:     2,
          }),
        },
      ]}>
        {/* Search icon */}
        {isSearch && (
          <Text style={[styles.prefixIcon, { color: c.text.muted }]}>🔍</Text>
        )}

        {/* Number stepper − */}
        {isNumber && (
          <Pressable
            onPress={() => handleStep(-1)}
            style={[styles.stepper, {
              borderEndWidth: 1,
              borderEndColor: borderColor,
              backgroundColor: isDark ? '#1e2d42' : '#f1f5f9',
            }]}
          >
            <Text style={{ fontSize: 20, color: c.text.secondary, lineHeight: 22 }}>−</Text>
          </Pressable>
        )}

        {/* Text input */}
        <TextInput
          ref={inputRef as React.RefObject<TextInput>}
          style={[
            styles.input,
            {
              fontSize:        FontSize.md,
              color:           c.text.primary,
              textAlign,
              writingDirection: isRtl ? 'rtl' : 'ltr',
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={isPassword || isSearch || isNumber ? 'none' : rest.autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          placeholderTextColor={c.text.muted}
          returnKeyType={nextRef ? 'next' : 'done'}
          onSubmitEditing={nextRef ? () => nextRef.current?.focus() : undefined}
          blurOnSubmit={!nextRef}
          {...rest}
        />

        {/* Number stepper + */}
        {isNumber && (
          <Pressable
            onPress={() => handleStep(1)}
            style={[styles.stepper, {
              borderStartWidth: 1,
              borderStartColor: borderColor,
              backgroundColor: isDark ? '#1e2d42' : '#f1f5f9',
            }]}
          >
            <Text style={{ fontSize: 20, color: c.interactive.primary, lineHeight: 22 }}>+</Text>
          </Pressable>
        )}

        {/* Password toggle */}
        {isPassword && (
          <Pressable onPress={() => setShowPassword(v => !v)} style={styles.iconBtn}>
            <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
          </Pressable>
        )}

        {/* Clear button */}
        {showClear && (
          <Pressable onPress={onClear} style={styles.iconBtn} accessibilityLabel="Clear">
            <View style={[styles.clearIcon, { backgroundColor: c.text.muted + '30' }]}>
              <Text style={{ fontSize: 10, color: c.text.muted, fontWeight: '700' }}>✕</Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorRow}>
          <Text style={{ fontSize: 11, color: c.intent.error }}>⚠ </Text>
          <Text style={[styles.errorText, { color: c.intent.error, textAlign: isRtl ? 'right' : 'left' }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Hint (no error) */}
      {hint && !error && (
        <Text style={[styles.hint, { color: c.text.muted, textAlign: isRtl ? 'right' : 'left' }]}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   6,
  },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.1,
  },
  charCount: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems:    'center',
    minHeight:     48,
    overflow:      'hidden',
  },
  input: {
    flex:            1,
    paddingHorizontal: 14,
    paddingVertical:   12,
    includeFontPadding: false,
  },
  prefixIcon: {
    paddingStart: 14,
    fontSize:     16,
  },
  stepper: {
    width:          44,
    alignSelf:      'stretch',
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconBtn: {
    paddingHorizontal: 12,
    alignSelf:         'stretch',
    alignItems:        'center',
    justifyContent:    'center',
  },
  clearIcon: {
    width:          18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     5,
  },
  errorText: {
    fontSize: FontSize.xs,
    flex:     1,
  },
  hint: {
    fontSize:  FontSize.xs,
    marginTop: 4,
  },
});

export default AppTextInput;
