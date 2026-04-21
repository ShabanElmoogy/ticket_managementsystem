import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** Show spinner on the option that is NOT currently active (the one being switched to) */
  loading?: boolean;
  isDark?: boolean;
  /** Active background color */
  activeColor?: string;
}

/**
 * SegmentedControl — generic two-or-more option pill selector.
 * Zero app logic: no i18n, no routing, no store.
 *
 * Used by LanguageSwitcher, ViewToggle alternatives, any binary/ternary toggle.
 */
const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  loading = false,
  isDark = false,
  activeColor,
}) => {
  const trackBg    = isDark ? '#334155' : '#f1f5f9';
  const activeBg   = activeColor ?? (isDark ? '#1e40af' : '#3b82f6');
  const textColor  = isDark ? '#e2e8f0' : '#1e293b';
  const activeText = '#ffffff';

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {options.map((opt) => {
        const isActive   = opt.value === value;
        // Show spinner on the inactive option while switching
        const showSpinner = loading && !isActive;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={loading || isActive}
            style={[
              styles.option,
              { backgroundColor: isActive ? activeBg : 'transparent' },
            ]}
          >
            {showSpinner ? (
              <ActivityIndicator size="small" color={textColor} />
            ) : (
              <Text
                style={[
                  styles.label,
                  {
                    color:      isActive ? activeText : textColor,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
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
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
  },
});

export default SegmentedControl;
