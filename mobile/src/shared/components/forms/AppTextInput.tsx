import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  type TextInputProps, type StyleProp, type ViewStyle,
} from 'react-native';

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
  ...rest
}) => {
  const [focused,      setFocused]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = fieldType === 'password';
  const isSearch   = fieldType === 'search';
  const isNumber   = fieldType === 'number';
  const hasValue   = String(value ?? '').length > 0;
  const charCount  = String(value ?? '').length;
  const atLimit    = maxLength !== undefined && charCount >= maxLength;
  const showClear  = (showClearButton ?? isSearch) && hasValue;

  const keyboardType: TextInputProps['keyboardType'] =
    isNumber ? 'numeric' :
    fieldType === 'email' ? 'email-address' : 'default';

  // Border color: error → red, focused → blue, default → gray
  const borderColor = error ? '#ef4444' : focused ? '#3b82f6' : '#d1d5db';
  const borderWidth = focused ? 2 : 2;

  // Stepper handlers
  const handleStep = (dir: 1 | -1) => {
    const current = parseFloat(String(value ?? '0')) || 0;
    let next = current + dir * step;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChangeText?.(String(next));
  };

  return (
    <View style={[{ marginBottom: 12 }, containerStyle]}>
      {label && (
        <Text style={{
          fontSize: 13, fontWeight: '600', marginBottom: 4,
          color: error ? '#ef4444' : '#374151',
        }}>
          {label}
        </Text>
      )}

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderWidth, borderColor, borderRadius: 10,
        backgroundColor: '#ffffff',
        minHeight: 44,
        overflow: 'hidden',
      }}>
        {/* Search icon */}
        {isSearch && (
          <Text style={{ paddingLeft: 12, color: '#9ca3af', fontSize: 16 }}>🔍</Text>
        )}

        {/* Number stepper — minus */}
        {isNumber && (
          <Pressable
            onPress={() => handleStep(-1)}
            style={{
              width: 40, alignSelf: 'stretch',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? '#eff6ff' : '#f9fafb',
              borderRightWidth: 1, borderRightColor: borderColor,
            }}
          >
            <Text style={{ fontSize: 20, color: '#6b7280', lineHeight: 24 }}>−</Text>
          </Pressable>
        )}

        {/* Input */}
        <TextInput
          style={{
            flex: 1,
            fontSize: 15,
            color: '#111827',
            paddingHorizontal: 12,
            paddingVertical: 10,
            textAlign: isNumber ? 'center' : 'left',
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

        {/* Number stepper — plus */}
        {isNumber && (
          <Pressable
            onPress={() => handleStep(1)}
            style={{
              width: 40, alignSelf: 'stretch',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? '#eff6ff' : '#f9fafb',
              borderLeftWidth: 1, borderLeftColor: borderColor,
            }}
          >
            <Text style={{ fontSize: 20, color: '#3b82f6', lineHeight: 24 }}>+</Text>
          </Pressable>
        )}

        {/* Char counter */}
        {maxLength !== undefined && !isNumber && (
          <Text style={{
            fontSize: 11, marginRight: 8,
            color: atLimit ? '#ef4444' : '#9ca3af',
          }}>
            {charCount}/{maxLength}
          </Text>
        )}

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
        <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</Text>
      )}

      {/* Focus hint for number fields */}
      {isNumber && focused && (
        <Text style={{ fontSize: 10, color: '#3b82f6', marginTop: 3 }}>
          Tap − / + or type a value
        </Text>
      )}
    </View>
  );
};

export default AppTextInput;
