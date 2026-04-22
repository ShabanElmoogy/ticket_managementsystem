import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  type TextInputProps, type StyleProp, type ViewStyle,
} from 'react-native';
import { useDirection } from '../../../providers/DirectionProvider';

export type AppTextInputFieldType = 'text' | 'search' | 'password' | 'number' | 'email';

export interface AppTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  fieldType?: AppTextInputFieldType;
  showClearButton?: boolean;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  /** Min value for number fields */
  min?: number;
  /** Max value for number fields */
  max?: number;
  /** Step for +/- stepper (default 1) */
  step?: number;
  /** Ref forwarded to the underlying TextInput — used for auto-focus */
  inputRef?: React.RefObject<TextInput | null>;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  fieldType = 'text',
  showClearButton,
  onClear,
  containerStyle,
  value,
  onChangeText,
  maxLength,
  min,
  max,
  step = 1,
  inputRef,
  ...rest
}) => {
  const [focused,      setFocused]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // isRtl is used only for text alignment — layout direction is inherited
  // from DirectionProvider's root View (same as AppSearchInput does it)
  const { isRtl } = useDirection();

  const isPassword = fieldType === 'password';
  const isSearch   = fieldType === 'search';
  const isNumber   = fieldType === 'number';
  const hasValue   = String(value ?? '').length > 0;
  const charCount  = String(value ?? '').length;
  const showClear  = (showClearButton ?? isSearch) && hasValue;
  const showBadge  = maxLength !== undefined && !isNumber;

  // ── Three-level badge color ───────────────────────────────────────────────
  // green  0–74%  | amber  75–89%  | red  90–100%
  const badgeLevel: 'green' | 'amber' | 'red' = (() => {
    if (!maxLength) return 'green';
    const pct = charCount / maxLength;
    if (pct >= 0.90) return 'red';
    if (pct >= 0.75) return 'amber';
    return 'green';
  })();

  const BADGE_COLORS = {
    green: { bg: focused ? '#f0fdf4' : '#f3f4f6', border: focused ? '#bbf7d0' : '#e5e7eb', text: focused ? '#16a34a' : '#9ca3af' },
    amber: { bg: '#fffbeb',  border: '#fde68a', text: '#d97706' },
    red:   { bg: '#fef2f2',  border: '#fca5a5', text: '#ef4444' },
  } as const;

  const badge = BADGE_COLORS[badgeLevel];

  const keyboardType: TextInputProps['keyboardType'] =
    isNumber ? 'numeric' :
    fieldType === 'email' ? 'email-address' : 'default';

  const borderColor = error ? '#ef4444' : focused ? '#3b82f6' : '#d1d5db';
  // Text alignment follows direction; number fields always centered
  const textAlign = isNumber ? 'center' : isRtl ? 'right' : 'left';

  const handleStep = (dir: 1 | -1) => {
    const current = parseFloat(String(value ?? '0')) || 0;
    let next = current + dir * step;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChangeText?.(String(next));
  };

  // Badge pill — last child in the row so it sits at the trailing edge
  const CountBadge = showBadge ? (
    <View style={{
      marginHorizontal: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: badge.bg,
      borderWidth: 1,
      borderColor: badge.border,
    }}>
      <Text style={{
        fontSize: 11,
        fontWeight: '700',
        color: badge.text,
        fontVariant: ['tabular-nums'],
      }}>
        {charCount}/{maxLength}
      </Text>
    </View>
  ) : null;

  return (
    <View style={[{ marginBottom: 12 }, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={{
          fontSize: 13, fontWeight: '600', marginBottom: 4,
          color: error ? '#ef4444' : '#374151',
          textAlign: isRtl ? 'right' : 'left',
        }}>
          {label}
        </Text>
      )}

      {/* Input row — inherits direction from DirectionProvider, no override needed */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2, borderColor, borderRadius: 10,
        backgroundColor: '#ffffff',
        minHeight: 44,
        overflow: 'hidden',
      }}>
        {/* Search icon — leading edge */}
        {isSearch && (
          <Text style={{ paddingHorizontal: 12, color: '#9ca3af', fontSize: 16 }}>🔍</Text>
        )}

        {/* Number stepper — minus (leading) */}
        {isNumber && (
          <Pressable
            onPress={() => handleStep(-1)}
            style={{
              width: 40, alignSelf: 'stretch',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? '#eff6ff' : '#f9fafb',
              borderRightWidth: 1,
              borderRightColor: borderColor,
            }}
          >
            <Text style={{ fontSize: 20, color: '#6b7280', lineHeight: 24 }}>−</Text>
          </Pressable>
        )}

        {/* Text input */}
        <TextInput
          ref={inputRef as React.RefObject<TextInput>}
          style={{
            flex: 1,
            fontSize: 15,
            color: '#111827',
            paddingHorizontal: 12,
            paddingVertical: 10,
            textAlign,
            writingDirection: isRtl ? 'rtl' : 'ltr',
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
          placeholderTextColor="#9ca3af"
          {...rest}
        />

        {/* Number stepper — plus (trailing) */}
        {isNumber && (
          <Pressable
            onPress={() => handleStep(1)}
            style={{
              width: 40, alignSelf: 'stretch',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? '#eff6ff' : '#f9fafb',
              borderLeftWidth: 1,
              borderLeftColor: borderColor,
            }}
          >
            <Text style={{ fontSize: 20, color: '#3b82f6', lineHeight: 24 }}>+</Text>
          </Pressable>
        )}

        {/* Char count badge — trailing end (last before password/clear) */}
        {CountBadge}

        {/* Password toggle */}
        {isPassword && (
          <Pressable onPress={() => setShowPassword(v => !v)} style={{ padding: 10 }}>
            <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
          </Pressable>
        )}

        {/* Clear button */}
        {showClear && (
          <Pressable onPress={onClear} style={{ padding: 10 }} accessibilityLabel="Clear">
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Error message */}
      {error && (
        <Text style={{
          fontSize: 11, color: '#ef4444', marginTop: 4,
          textAlign: isRtl ? 'right' : 'left',
        }}>
          {error}
        </Text>
      )}

      {/* Focus hint for number fields */}
      {isNumber && focused && (
        <Text style={{
          fontSize: 10, color: '#3b82f6', marginTop: 3,
          textAlign: isRtl ? 'right' : 'left',
        }}>
          Tap − / + or type a value
        </Text>
      )}
    </View>
  );
};

export default AppTextInput;
