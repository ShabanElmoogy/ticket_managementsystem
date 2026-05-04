/**
 * VisitToolbar.tsx
 * Visit search input + view mode toggle (table / grid / compact).
 * Uses AppTextInput for search — no raw TextInput.
 * All colors use c.* theme tokens.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Spacing, Radius, BorderWidth } from '@/src/constants/theme';
import AppTextInput from '@/src/shared/components/forms/AppTextInput';
import s from './visits.styles';
import type { ViewMode } from './visits.types';

const VIEW_MODES: Array<{ mode: ViewMode; icon: string }> = [
  { mode: 'table',   icon: '☰' },
  { mode: 'grid',    icon: '⊞' },
  { mode: 'compact', icon: '≡' },
];

interface Props {
  search:           string;
  onSearchChange:   (v: string) => void;
  viewMode:         ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  placeholder:      string;
}

const VisitToolbar: React.FC<Props> = ({
  search, onSearchChange, viewMode, onViewModeChange, placeholder,
}) => {
  const c = useThemeColors();

  return (
    <View style={[
      s.toolbar,
      {
        backgroundColor:  c.surface.primary,
        borderTopColor:   c.border.primary,
        borderBottomColor:c.border.primary,
      },
    ]}>
      {/* Search — AppTextInput with fieldType="search" */}
      <View style={{ flex: 1 }}>
        <AppTextInput
          fieldType="search"
          value={search}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          showClearButton
          onClear={() => onSearchChange('')}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* View toggle */}
      <View style={[
        s.viewToggle,
        { backgroundColor: c.surface.secondary, borderColor: c.border.primary },
      ]}>
        {VIEW_MODES.map(({ mode, icon }) => {
          const active = viewMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => onViewModeChange(mode)}
              style={[
                s.viewBtn,
                { backgroundColor: active ? c.interactive.primary : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={mode}
            >
              <Text style={[
                s.viewBtnText,
                { color: active ? c.text.inverse : c.text.secondary },
              ]}>
                {icon}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default VisitToolbar;
