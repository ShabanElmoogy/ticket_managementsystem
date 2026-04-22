import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface IconTypeSelectorOption {
  value:      string;
  emoji:      string;
  label:      string;
  /** Active background + border color for this option */
  color:      string;
}

export interface IconTypeSelectorProps {
  options:   IconTypeSelectorOption[];
  value:     string;
  onChange:  (value: string) => void;
  isDark?:   boolean;
}

/**
 * IconTypeSelector — a row of stacked emoji + label tiles.
 * Each tile has its own accent color when active.
 *
 * Used for callout type pickers, priority selectors, status pickers,
 * or any set of visually distinct categorical options.
 *
 * @example
 * <IconTypeSelector
 *   options={[
 *     { value: 'info',    emoji: 'ℹ️', label: 'Info',    color: '#3b82f6' },
 *     { value: 'warning', emoji: '⚠️', label: 'Warning', color: '#f59e0b' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 *   isDark={isDark}
 * />
 */
const IconTypeSelector: React.FC<IconTypeSelectorProps> = ({
  options,
  value,
  onChange,
  isDark = false,
}) => {
  const inactiveBg     = isDark ? '#1e293b' : '#f8fafc';
  const inactiveBorder = isDark ? '#334155' : '#e2e8f0';
  const inactiveText   = isDark ? '#64748b' : '#94a3b8';

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => ({
              flex:            1,
              alignItems:      'center',
              paddingVertical: 8,
              borderRadius:    10,
              borderWidth:     1.5,
              backgroundColor: active
                ? opt.color
                : pressed
                  ? opt.color + '18'
                  : inactiveBg,
              borderColor: active ? opt.color : inactiveBorder,
            })}
          >
            <Text style={{ fontSize: 18, marginBottom: 2 }}>{opt.emoji}</Text>
            <Text style={{
              fontSize:      10,
              fontWeight:    '700',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
              color:         active ? '#fff' : inactiveText,
            }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default IconTypeSelector;
