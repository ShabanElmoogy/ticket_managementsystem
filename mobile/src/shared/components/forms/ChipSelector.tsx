/**
 * ChipSelector — unified option selector with two layouts:
 *
 * layout="rows"  (default) — full-width vertical rows with icon + label + description + preview badge.
 *                            Used for maintenance type, date format, settings pickers.
 *
 * layout="tiles"           — equal-width horizontal tiles with emoji + short label, each with its own accent color.
 *                            Used for callout types, priority pickers, status pickers.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

// ── Option types ──────────────────────────────────────────────────────────────

export interface ChipOption<T extends string = string> {
  value:        T;
  label:        string;
  /** Emoji shown in both layouts */
  icon?:        string;
  /** rows layout only — subtitle below label */
  description?: string;
  /** rows layout only — monospace badge on the right */
  preview?:     string;
  /** tiles layout only — accent color when active */
  color?:       string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ChipSelectorProps<T extends string = string> {
  options:   ChipOption<T>[];
  value:     T | null;
  onChange:  (value: T) => void;
  label?:    string;
  disabled?: boolean;
  /** 'rows' = full-width vertical list (default) | 'tiles' = horizontal equal-width grid */
  layout?:   'rows' | 'tiles';
}

// ── Component ─────────────────────────────────────────────────────────────────

function ChipSelector<T extends string = string>({
  options, value, onChange, label, disabled = false, layout = 'rows',
}: ChipSelectorProps<T>) {
  const c = useThemeColors();

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.secondary, marginBottom: 8 }}>
          {label}
        </Text>
      )}

      {layout === 'tiles' ? (
        // ── Tiles layout ────────────────────────────────────────────────────
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {options.map((opt) => {
            const active      = value === opt.value;
            const accentColor = opt.color ?? c.interactive.chipActiveBg;
            return (
              <Pressable
                key={opt.value}
                onPress={() => !disabled && onChange(opt.value)}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ selected: active, disabled }}
                style={({ pressed }: { pressed: boolean }) => ({
                  flex:            1,
                  alignItems:      'center',
                  paddingVertical: 8,
                  borderRadius:    10,
                  borderWidth:     1.5,
                  opacity:         disabled ? 0.45 : 1,
                  backgroundColor: active
                    ? accentColor
                    : pressed ? accentColor + '18' : (c.surface.secondary),
                  borderColor: active ? accentColor : c.border.primary,
                })}
              >
                {opt.icon && (
                  <Text style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</Text>
                )}
                <Text style={{
                  fontSize:      10,
                  fontWeight:    '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  color:         active ? '#fff' : c.text.muted,
                }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        // ── Rows layout ─────────────────────────────────────────────────────
        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const isActive = value === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => !disabled && onChange(opt.value)}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive, disabled }}
                style={{
                  flexDirection:   'row',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  padding:         12,
                  borderRadius:    10,
                  backgroundColor: isActive ? c.interactive.chipActiveBg + '18' : c.surface.secondary,
                  borderWidth:     2,
                  borderColor:     isActive ? c.interactive.chipActiveBg : c.border.primary,
                  opacity:         disabled ? 0.45 : 1,
                }}
              >
                {/* Left: icon + label + description */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  {opt.icon && <Text style={{ fontSize: 20 }}>{opt.icon}</Text>}
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.primary }}>
                      {opt.label}
                    </Text>
                    {opt.description && (
                      <Text style={{ fontSize: 11, color: c.text.muted, marginTop: 2 }}>
                        {opt.description}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Right: preview badge + checkmark */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {opt.preview && (
                    <View style={{
                      backgroundColor: isActive ? c.interactive.chipActiveBg : c.surface.tertiary,
                      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                      <Text style={{
                        fontSize: 11, fontWeight: '700', fontFamily: 'monospace',
                        color: isActive ? c.interactive.chipActiveText : c.text.secondary,
                      }}>
                        {opt.preview}
                      </Text>
                    </View>
                  )}
                  {isActive && (
                    <Text style={{ color: c.interactive.chipActiveBg, fontSize: 16 }}>✓</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default ChipSelector;
