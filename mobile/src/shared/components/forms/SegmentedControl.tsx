/**
 * SegmentedControl — pill-style tab switcher with optional loading state.
 *
 * @usage
 *   - `LanguageSwitcher` (navigation/LanguageSwitcher.tsx)
 *
 * @variants
 *   - Default: uses `c.interactive.primary` / `c.text.inverse` for the active segment
 *   - Custom colors: pass `activeColor` and/or `activeTextColor` to override
 *   - Loading: pass `loading={true}` to show a spinner on the active segment and
 *     dim inactive segments; all presses are ignored while loading
 *
 * @example
 *   <SegmentedControl
 *     options={[{ value: 'en', label: 'EN' }, { value: 'ar', label: 'عربي' }]}
 *     value={lang}
 *     onChange={setLang}
 *   />
 *
 * @modal-safety ❌ NOT Modal-safe — calls `useThemeColors()` internally.
 *   Do not render inside a `<Modal>`. Use in screens and page-level components only.
 */
import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

// Opacity for inactive segments while loading
const LOADING_INACTIVE_OPACITY = 0.5;

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options:          SegmentedOption[];
  value:            string;
  onChange:         (value: string) => void;
  loading?:         boolean;
  /** Active segment background color — defaults to c.interactive.primary */
  activeColor?:     string;
  /** Active segment text color — defaults to c.text.inverse */
  activeTextColor?: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options, value, onChange,
  loading = false, activeColor, activeTextColor,
}) => {
  const c         = useThemeColors();
  const activeBg  = activeColor     ?? c.interactive.primary;
  const activeTxt = activeTextColor ?? c.text.inverse;

  return (
    <View
      style={[styles.track, { backgroundColor: c.surface.tertiary }]}
      accessibilityRole="radiogroup"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={loading}
            accessibilityRole="radio"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: isActive, disabled: loading }}
            style={[
              styles.option,
              { backgroundColor: isActive ? activeBg : 'transparent' },
              loading && !isActive && { opacity: LOADING_INACTIVE_OPACITY },
            ]}
          >
            {loading && isActive ? (
              <ActivityIndicator size="small" color={activeTxt} />
            ) : (
              <Text style={[
                styles.label,
                {
                  color:      isActive ? activeTxt : c.text.secondary,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.medium,
                },
              ]}>
                {opt.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius:  Radius.md,
    padding:       2,
    gap:           2,
    alignSelf:     'flex-start',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical:   6,
    borderRadius:      Radius.sm,
    minWidth:          50,
    minHeight:         32,
    alignItems:        'center',
    justifyContent:    'center',
  },
  label: {
    fontSize: FontSize.base,
  },
});

export default SegmentedControl;
