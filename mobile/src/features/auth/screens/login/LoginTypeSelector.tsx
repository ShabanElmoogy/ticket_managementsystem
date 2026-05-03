import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';

export interface LoginTypeSelectorProps {
  isSystemLogin: boolean;
  isRtl:         boolean;
  disabled:      boolean;
  onChange:      (isSystem: boolean) => void;
}

/**
 * LoginTypeSelector — segmented control for switching between
 * System login (SUPER_ADMIN) and Tenant login.
 * Segment order is reversed in RTL for natural reading direction.
 */
const LoginTypeSelector: React.FC<LoginTypeSelectorProps> = ({
  isSystemLogin, isRtl, disabled, onChange,
}) => {
  const c     = useThemeColors();
  const { t } = useTranslation();

  const segments = isRtl ? [
    { key: 'tenant', label: t('auth.tenantLogin'), active: !isSystemLogin, onPress: () => onChange(false) },
    { key: 'system', label: t('auth.systemLogin'), active: isSystemLogin,  onPress: () => onChange(true)  },
  ] : [
    { key: 'system', label: t('auth.systemLogin'), active: isSystemLogin,  onPress: () => onChange(true)  },
    { key: 'tenant', label: t('auth.tenantLogin'), active: !isSystemLogin, onPress: () => onChange(false) },
  ];

  return (
    <View style={[styles.control, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
      {segments.map((seg) => (
        <Pressable
          key={seg.key}
          style={[
            styles.segment,
            seg.active && [styles.segmentActive, { backgroundColor: c.interactive.primary }],
          ]}
          onPress={seg.onPress}
          disabled={disabled}
          accessibilityRole="radio"
          accessibilityLabel={seg.label}
          accessibilityState={{ selected: seg.active }}
        >
          <Text style={[styles.segmentText, { color: seg.active ? c.text.inverse : c.text.secondary }]}>
            {seg.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  control: {
    flexDirection:  'row',
    borderRadius:   12,
    borderWidth:    1,
    padding:        3,
    marginBottom:   16,
  },
  segment: {
    flex:            1,
    borderRadius:    9,
    paddingVertical: 9,
    alignItems:      'center',
    justifyContent:  'center',
  },
  segmentActive: {
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius:  4,
    elevation:     3,
  },
  segmentText: { fontSize: 13, fontWeight: '600' },
});

export default LoginTypeSelector;
