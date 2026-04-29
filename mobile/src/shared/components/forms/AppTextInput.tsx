/**
 * AppTextInput — themed text input with label, error, hint, and field-type variants.
 *
 * @variants
 *   - text     — default single-line input
 *   - search   — prefixed with 🔍, shows clear button when non-empty
 *   - password — toggleable show/hide via 👁️ button
 *   - number   — stepper (−/+) buttons, numeric keyboard
 *   - email    — email keyboard
 *
 * @usage
 *   Used in all admin forms and screens (never inside a <Modal>):
 *   - CustomerForm, ApplicationForm, UserForm, TenantForm, TemplateForm
 *   - LoginScreen, ProfileScreen, and any other screen-level form
 *
 * @modal-safety ❌ NOT Modal-safe
 *   Calls useThemeColors(), useIsDark(), and useDirection() internally.
 *   These hooks read from React context which is unavailable inside a <Modal> tree.
 *   For Modal use, pass resolved colors via the `containerStyle` prop or use DialogButton instead.
 *
 * @rtl
 *   Reads isRtl from useDirection() for textAlign and writingDirection.
 *   Uses logical margin/padding properties (marginStart/End) for RTL-safe spacing.
 */
/**
 * AppTextInput — styled text input with label, error, validation, and field types.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIELD TYPES
 * ─────────────────────────────────────────────────────────────────────────────
 *   text     — default, plain text
 *   search   — shows 🔍 icon, auto-shows clear button
 *   password — shows 👁️ toggle, hides text
 *   number   — shows − / + steppers, numeric keyboard
 *   email    — email keyboard, validation
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FEATURES
 * ─────────────────────────────────────────────────────────────────────────────
 *   - Label with required * indicator
 *   - Character count badge (colored by fill %)
 *   - Clear button (circular badge)
 *   - Error message with ⚠ icon
 *   - Hint text (shown when no error)
 *   - Focus state: blue border + colored shadow
 *   - Return key chain: validates required fields before advancing
 *   - RTL support: text alignment + writing direction
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors(), useIsDark(), useDirection() internally.
 * Do NOT use inside a <Modal> — screens only.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   All admin forms: CustomerForm, UserForm, ApplicationForm, etc.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   <AppTextInput
 *     label="Email *"
 *     value={fields.email}
 *     onChangeText={(v) => handleChange('email', v)}
 *     placeholder="email@example.com"
 *     error={errors.email}
 *     required
 *     fieldType="email"
 *     maxLength={150}
 *     showClearButton
 *     onClear={() => handleClear('email')}
 *     inputRef={emailRef}
 *     nextRef={phoneRef}
 *   />
 */

import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useThemeColors, useIsDark, FontSize, FontWeight, Radius } from '@/src/constants/theme';

// Bypass @types/react-native@0.72 named export conflicts
const RN = require('react-native') as any;
const TextInput = RN.TextInput as any;

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppTextInputFieldType = 'text' | 'search' | 'password' | 'number' | 'email';

export interface AppTextInputProps {
  // Core
  value?:           string;
  onChangeText?:    (v: string) => void;
  placeholder?:     string;
  // Label / validation
  label?:           string;
  hint?:            string;
  error?:           string;
  required?:        boolean;
  // Field type
  fieldType?:       AppTextInputFieldType;
  keyboardType?:    string;
  // Clear button
  showClearButton?: boolean;
  onClear?:         () => void;
  // Container
  containerStyle?:  object;
  // Limits
  maxLength?:       number;
  min?:             number;
  max?:             number;
  step?:            number;
  // Refs
  inputRef?:        React.RefObject<any>;
  nextRef?:         React.RefObject<any>;
  // TextInput passthrough
  autoCapitalize?:  'none' | 'sentences' | 'words' | 'characters';
  multiline?:       boolean;
  numberOfLines?:   number;
  blurOnSubmit?:    boolean;
  autoCorrect?:     boolean;
  autoFocus?:       boolean;
  returnKeyType?:   string;
  onBlur?:          () => void;
  onFocus?:         () => void;
  onSubmitEditing?: () => void;
  secureTextEntry?: boolean;
  editable?:        boolean;
  testID?:          string;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
  label, hint, error, required = false,
  fieldType = 'text',
  showClearButton, onClear, containerStyle,
  value, onChangeText, maxLength,
  min, max, step = 1,
  inputRef, nextRef,
  keyboardType: keyboardTypeProp,  // extract so it doesn't conflict with internal resolution
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
  const badgeBg    = pct >= 0.9 ? c.intent.errorSurface
                   : pct >= 0.75 ? c.intent.warningSurface
                   : focused     ? c.intent.infoSurface
                   : c.surface.elevated;
  const badgeText  = pct >= 0.9 ? c.intent.error
                   : pct >= 0.75 ? c.intent.warning
                   : focused     ? c.interactive.primary
                   : c.text.muted;
  const badgeBorder = pct >= 0.9 ? c.intent.error + '55'
                    : pct >= 0.75 ? c.intent.warning + '55'
                    : focused     ? c.interactive.primary + '44'
                    : c.border.primary;

  const defaultKeyboardType: string =
    isNumber ? 'numeric' :
    fieldType === 'email' ? 'email-address' : 'default';

  // Explicit keyboardType prop takes precedence over fieldType-derived default
  const keyboardType = keyboardTypeProp ?? defaultKeyboardType;

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
          ref={inputRef}
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
          onSubmitEditing={nextRef ? () => {
            // Only advance if field has a value OR it's not required
            const hasValue = String(value ?? '').trim().length > 0;
            if (hasValue || !required) {
              nextRef.current?.focus();
            } else {
              // Show alert — field is required and empty
              const fieldLabel = String(label ?? 'This field').replace(' *', '').trim();
              Toast.show({
                type:           'error',
                text1:          'Required field',
                text2:          `"${fieldLabel}" must be filled before continuing.`,
                visibilityTime: 3000,
                position:       'top',
              });
            }
          } : undefined}
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

        {/* Character count badge — inside input, right side */}
        {showBadge && (focused || charCount > 0) && (
          <View style={[styles.charBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <Text style={[styles.charBadgeText, { color: badgeText }]}>
              {charCount}/{maxLength}
            </Text>
          </View>
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
  charBadge: {
    paddingHorizontal: 7,
    paddingVertical:   3,
    borderRadius:      Radius.full,
    borderWidth:       1,
    marginEnd:         8,
    alignSelf:         'center',
  },
  charBadgeText: {
    fontSize:    FontSize.xs,
    fontWeight:  FontWeight.bold,
    fontVariant: ['tabular-nums'] as any,
    letterSpacing: 0.2,
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
