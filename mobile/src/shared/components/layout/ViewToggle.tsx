/**
 * ViewToggle — 3-option segmented control for switching between table / grid / compact views.
 *
 * @usedIn AppScreenHeader (via `view` + `onViewChange` props)
 * @variants table | grid | compact
 * @modalSafe ❌ No — calls useThemeColors() and useTranslation() internally; screens only
 *
 * @example
 * <ViewToggle current={view} onChange={setView} />
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, Radius } from '@/src/constants/theme';
import type { AdminView } from '@/src/stores/uiStore';

interface ViewOption {
  view:    AdminView;
  icon:    string;
  labelKey: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { view: 'table',   icon: '⊞', labelKey: 'common.viewTable'   },
  { view: 'grid',    icon: '▦', labelKey: 'common.viewGrid'    },
  { view: 'compact', icon: '☰', labelKey: 'common.viewCompact' },
];

export interface ViewToggleProps {
  current:  AdminView;
  onChange: (v: AdminView) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ current, onChange }) => {
  const c      = useThemeColors();
  const { t }  = useTranslation();

  return (
    <View
      style={[styles.track, { borderColor: c.border.secondary }]}
      accessibilityRole="radiogroup"
    >
      {VIEW_OPTIONS.map(({ view, icon, labelKey }) => {
        const active = current === view;
        return (
          <Pressable
            key={view}
            onPress={() => onChange(view)}
            accessibilityRole="radio"
            accessibilityLabel={t(labelKey)}
            accessibilityState={{ selected: active }}
            style={[
              styles.option,
              { backgroundColor: active ? c.interactive.primary : c.surface.primary },
            ]}
          >
            <Text
              style={[styles.icon, { color: active ? c.text.inverse : c.text.secondary }]}
              accessibilityElementsHidden
            >
              {icon}
            </Text>
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
    overflow:      'hidden',
    borderWidth:   1,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical:   6,
    alignItems:        'center',
    justifyContent:    'center',
  },
  icon: {
    fontSize: FontSize.md,
  },
});

export default ViewToggle;
