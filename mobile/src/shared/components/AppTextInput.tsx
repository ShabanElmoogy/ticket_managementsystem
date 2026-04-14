import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';

export type AppTextInputFieldType = 'text' | 'search' | 'password' | 'number' | 'email';

export interface AppTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  fieldType?: AppTextInputFieldType;
  showClearButton?: boolean;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
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
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = fieldType === 'password';
  const isSearch   = fieldType === 'search';
  const hasValue   = String(value ?? '').length > 0;
  const charCount  = String(value ?? '').length;
  const atLimit    = maxLength !== undefined && charCount >= maxLength;
  const showClear  = (showClearButton ?? isSearch) && hasValue;

  const keyboardType: TextInputProps['keyboardType'] =
    fieldType === 'number' ? 'numeric' :
    fieldType === 'email'  ? 'email-address' : 'default';

  return (
    <View className="mb-3" style={containerStyle}>
      {label && (
        <Text className={`text-sm font-semibold mb-1 ${error ? 'text-red-500' : 'text-gray-700'}`}>
          {label}
        </Text>
      )}

      <View className={`flex-row items-center border-2 rounded-lg bg-white px-3 min-h-[44px] ${error ? 'border-red-500' : 'border-gray-300'}`}>
        {isSearch && <Text className="mr-2 text-gray-400">🔍</Text>}

        <TextInput
          className="flex-1 text-base text-gray-900 py-2"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={isPassword || isSearch ? 'none' : rest.autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          placeholderTextColor="#9ca3af"
          {...rest}
        />

        {maxLength !== undefined && (
          <Text className={`text-xs ml-1 ${atLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount}/{maxLength}
          </Text>
        )}

        {isPassword && (
          <Pressable onPress={() => setShowPassword(v => !v)} className="p-1 ml-1">
            <Text className="text-base">{showPassword ? '🙈' : '👁️'}</Text>
          </Pressable>
        )}

        {showClear && (
          <Pressable onPress={onClear} className="p-1 ml-1" accessibilityLabel="Clear">
            <Text className="text-gray-400 text-base">✕</Text>
          </Pressable>
        )}
      </View>

      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
};

export default AppTextInput;
