import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  type TextInputProps, type StyleProp, type ViewStyle,
} from 'react-native';
import { useDirection } from '../../../providers/DirectionProvider';
import { useThemeColors, FontSize, FontWeight, Radius } from '../../../constants/theme';

export type AppTextInputFieldType = 'text' | 'search' | 'password' | 'number' | 'email';

export interface AppTextInputProps extends Omit<TextInputProps, 'style'> {
  label?:           string;
  error?:           string;
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
  label, error, fieldType = 'text',
  showClearButton, onClear, containerStyle,
  value, onChangeText, maxLength,
  min, max, step = 1,
  inputRef, nextRef,
  ...rest
}) => {
  const [focused,      setFocused]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isRtl } = useDirection();
  const c = useThemeColors();

  const isPassword = fieldType === 'password';
  const isSearch   = fieldType === 'search';
  const isNumber   = fieldType === 'number';
  const hasValue   = String(value ?? '').length > 0;
  const charCount  = String(value ?? '').length;
  const showClear  = (showClearButton ?? isSearch) && hasValue;
  const showBadge  = maxLength !== undefined && !isNumber;

  const badgeLevel: 'green' | 'amber' | 'red' = (() => {
    if (!maxLength) return 'green';
    const pct = charCount / maxLength;
    if (pct >= 0.90) return 'red';
    if (pct >= 0.75) return 'amber';
    return 'green';
  })();

  const BADGE_COLORS = {
    green: { bg: focused ? c.intent.successSurface : c.surface.tertiary, border: focused ? c.intent.success + '44' : c.border.primary, text: focused ? c.intent.success : c.text.muted },
    amber: { bg: c.intent.warningSurface, border: c.intent.warning + '55', text: c.intent.warning },
    red:   { bg: c.intent.errorSurface,   border: c.intent.error,          text: c.intent.error   },
  } as const;

  const badge = BADGE_COLORS[badgeLevel];

  const keyboardType: TextInputProps['keyboardType'] =
    isNumber ? 'numeric' :
    fieldType === 'email' ? 'email-address' : 'default';

  const borderColor = error ? c.intent.error : focused ? c.border.focus : c.border.secondary;
  const textAlign   = isNumber ? 'center' : isRtl ? 'right' : 'left';

  const handleStep = (dir: 1 | -1) => {
    const current = parseFloat(String(value ?? '0')) || 0;
    let next = current + dir * step;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChangeText?.(String(next));
  };

  const CountBadge = showBadge ? (
    <View style={{
      marginHorizontal: 8, paddingHorizontal: 7, paddingVertical: 3,
      borderRadius: Radius.full, backgroundColor: badge.bg,
      borderWidth: 1, borderColor: badge.border,
    }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: badge.text, fontVariant: ['tabular-nums'] }}>
        {charCount}/{maxLength}
      </Text>
    </View>
  ) : null;

  const stepperBg = focused ? c.intent.infoSurface : c.surface.tertiary;

  return (
    <View style={[{ marginBottom: 12 }, containerStyle]}>
      {label && (
        <Text style={{
          fontSize: FontSize.base, fontWeight: FontWeight.semibold, marginBottom: 4,
          color: error ? c.intent.error : c.text.secondary,
          textAlign: isRtl ? 'right' : 'left',
        }}>
          {label}
        </Text>
      )}

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 2, borderColor, borderRadius: Radius.lg,
        backgroundColor: c.surface.primary,
        minHeight: 44, overflow: 'hidden',
      }}>
        {isSearch && (
          <Text style={{ paddingHorizontal: 12, color: c.text.muted, fontSize: FontSize.xl }}>🔍</Text>
        )}

        {isNumber && (
          <Pressable
            onPress={() => handleStep(-1)}
            style={{
              width: 40, alignSelf: 'stretch',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: stepperBg,
              borderEndWidth: 1, borderEndColor: borderColor,
            }}
          >
            <Text style={{ fontSize: FontSize['3xl'], color: c.text.secondary, lineHeight: 24 }}>−</Text>
          </Pressable>
        )}

        <TextInput
          ref={inputRef as React.RefObject<TextInput>}
          style={{
            flex: 1, fontSize: FontSize.lg,
            color: c.text.primary,
            paddingHorizontal: 12, paddingVertical: 10,
            textAlign, writingDirection: isRtl ? 'rtl' : 'ltr',
          }}
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

        {isNumber && (
          <Pressable
            onPress={() => handleStep(1)}
            style={{
              width: 40, alignSelf: 'stretch',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: stepperBg,
              borderStartWidth: 1, borderStartColor: borderColor,
            }}
          >
            <Text style={{ fontSize: FontSize['3xl'], color: c.interactive.primary, lineHeight: 24 }}>+</Text>
          </Pressable>
        )}

        {CountBadge}

        {isPassword && (
          <Pressable onPress={() => setShowPassword(v => !v)} style={{ padding: 10 }}>
            <Text style={{ fontSize: FontSize.xl }}>{showPassword ? '🙈' : '👁️'}</Text>
          </Pressable>
        )}

        {showClear && (
          <Pressable onPress={onClear} style={{ padding: 10 }} accessibilityLabel="Clear">
            <Text style={{ color: c.text.muted, fontSize: FontSize.xl }}>✕</Text>
          </Pressable>
        )}
      </View>

      {error && (
        <Text style={{ fontSize: FontSize.xs, color: c.intent.error, marginTop: 4, textAlign: isRtl ? 'right' : 'left' }}>
          {error}
        </Text>
      )}

      {isNumber && focused && (
        <Text style={{ fontSize: FontSize.xs, color: c.interactive.primary, marginTop: 3, textAlign: isRtl ? 'right' : 'left' }}>
          Tap − / + or type a value
        </Text>
      )}
    </View>
  );
};

export default AppTextInput;
