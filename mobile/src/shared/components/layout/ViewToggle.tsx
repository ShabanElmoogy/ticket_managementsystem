import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors, FontSize, Radius } from '@/src/constants/theme';
import type { AdminView } from '@/src/stores/uiStore';

const VIEW_OPTIONS: { view: AdminView; icon: string; label: string }[] = [
  { view: 'table',   icon: '⊞', label: 'Table'   },
  { view: 'grid',    icon: '▦', label: 'Grid'    },
  { view: 'compact', icon: '☰', label: 'Compact' },
];

interface Props {
  current:  AdminView;
  onChange: (v: AdminView) => void;
  /** @deprecated — component reads theme internally via useThemeColors() */
  isDark?:  boolean;
}

const ViewToggle: React.FC<Props> = ({ current, onChange }) => {
  const c = useThemeColors();
  return (
    <View style={{
      flexDirection: 'row', borderRadius: Radius.md, overflow: 'hidden',
      borderWidth: 1, borderColor: c.border.secondary,
    }}>
      {VIEW_OPTIONS.map(({ view, icon, label }) => {
        const active = current === view;
        return (
          <Pressable
            key={view}
            onPress={() => onChange(view)}
            accessibilityLabel={label}
            style={{
              paddingHorizontal: 10, paddingVertical: 6,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: active ? c.interactive.primary : c.surface.primary,
            }}
          >
            <Text style={{ fontSize: FontSize.md, color: active ? c.text.inverse : c.text.secondary }}>
              {icon}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default ViewToggle;
