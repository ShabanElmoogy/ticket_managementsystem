import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { AdminView } from '../../../stores/uiStore';

const VIEW_OPTIONS: { view: AdminView; icon: string; label: string }[] = [
  { view: 'table',   icon: '⊞', label: 'Table'   },
  { view: 'grid',    icon: '▦', label: 'Grid'    },
  { view: 'compact', icon: '☰', label: 'Compact' },
];

interface Props {
  current: AdminView;
  onChange: (v: AdminView) => void;
  isDark: boolean;
}

/**
 * Three-way view toggle — Table / Grid / Compact.
 * Used in AdminCrudScreen and ReportsScreen headers.
 */
const ViewToggle: React.FC<Props> = ({ current, onChange, isDark }) => (
  <View style={{
    flexDirection: 'row', borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: isDark ? '#475569' : '#d1d5db',
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
            backgroundColor: active
              ? '#2563eb'
              : isDark ? '#334155' : '#fff',
          }}
        >
          <Text style={{ fontSize: 14, color: active ? '#fff' : isDark ? '#94a3b8' : '#6b7280' }}>
            {icon}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

export default ViewToggle;
