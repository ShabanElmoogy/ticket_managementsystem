/**
 * ViewToggle — 3-option segmented control for switching between table / grid / compact views.
 *
 * @usedIn AppScreenHeader (via `view` + `onViewChange` props)
 * @variants table | grid | compact
 * @modalSafe ❌ No — calls useThemeColors() and useTranslation() internally; screens only
 */
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColors, Radius } from '@/src/constants/theme';
import type { AdminView } from '@/src/stores/uiStore';

interface ViewOption {
  view:     AdminView;
  icon:     'list-outline' | 'grid-outline' | 'reorder-three-outline';
  labelKey: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { view: 'table',   icon: 'list-outline',          labelKey: 'common.viewTable'   },
  { view: 'grid',    icon: 'grid-outline',           labelKey: 'common.viewGrid'    },
  { view: 'compact', icon: 'reorder-three-outline',  labelKey: 'common.viewCompact' },
];

export interface ViewToggleProps {
  current:  AdminView;
  onChange: (v: AdminView) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ current, onChange }) => {
  const c     = useThemeColors();
  const { t } = useTranslation();

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
            <Ionicons
              name={icon}
              size={16}
              // c.buttons.primary.text adapts: white on colored bg, dark on light bg (dark black)
              color={active ? c.buttons.primary.text : c.text.secondary}
              accessibilityElementsHidden
            />
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
    paddingVertical:   7,
    alignItems:        'center',
    justifyContent:    'center',
  },
});

export default ViewToggle;
