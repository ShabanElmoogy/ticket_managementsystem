/**
 * PaletteSelector — Three tappable color swatches for accent palette selection.
 *
 * Modal-safety rule: accepts `resolvedColors` as a prop — does NOT call
 * `useThemeColors()` internally. Reads `paletteOption` and `setPaletteOption`
 * directly from `useUiStore` (Zustand is global — safe inside Modals).
 *
 * Usage:
 *   const c = useThemeColors();
 *   <PaletteSelector resolvedColors={c} />
 *
 * Used in: profile.tsx
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useUiStore } from '@/src/stores/uiStore';
import { Palette, Spacing, Radius, BorderWidth, FontSize, FontWeight } from '@/src/constants/tokens';
import type { ThemeColors, PaletteOption } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PaletteSwatch {
  option:    PaletteOption;
  label:     string;
  color:     string;   // primary color for the swatch circle (light mode representative)
  darkColor: string;   // darker shade for the pressed/border state
}

export interface PaletteSelectorProps {
  resolvedColors:  ThemeColors;   // Modal-safety: caller resolves via useThemeColors()
  isRtlOverride?:  boolean;       // for use inside Modal trees
}

// ─────────────────────────────────────────────────────────────────────────────
// Swatch definitions — static, no imports needed
// ─────────────────────────────────────────────────────────────────────────────

const SWATCHES: PaletteSwatch[] = [
  { option: 'blue',   label: 'Blue',   color: Palette.blue500,   darkColor: Palette.blue600   },
  { option: 'orange', label: 'Orange', color: Palette.orange500, darkColor: Palette.orange600 },
  { option: 'green',  label: 'Green',  color: Palette.green600,  darkColor: Palette.green700  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const PaletteSelector: React.FC<PaletteSelectorProps> = ({ resolvedColors: c }) => {
  // Zustand is global — safe inside Modal trees
  const paletteOption    = useUiStore((s) => s.paletteOption);
  const setPaletteOption = useUiStore((s) => s.setPaletteOption);

  return (
    <View style={[styles.row, { borderColor: c.border.primary }]}>
      {SWATCHES.map((swatch) => {
        const isActive = paletteOption === swatch.option;
        return (
          <Pressable
            key={swatch.option}
            testID={`swatch-${swatch.option}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isActive }}
            accessibilityLabel={`${swatch.label} palette${isActive ? ', selected' : ''}`}
            onPress={() => setPaletteOption(swatch.option)}
            style={({ pressed }) => [
              styles.swatch,
              {
                backgroundColor: isActive ? swatch.color : c.surface.secondary,
                borderColor: isActive ? swatch.darkColor : c.border.primary,
                borderWidth: isActive ? BorderWidth.thick : BorderWidth.thin,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {/* Color dot */}
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: swatch.color,
                  borderColor: isActive ? Palette.white : swatch.darkColor,
                },
              ]}
            />

            {/* Label */}
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? Palette.white : c.text.secondary,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.medium,
                },
              ]}
            >
              {swatch.label}
            </Text>

            {/* Active checkmark overlay */}
            {isActive && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles — static layout only; dynamic colors applied inline
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  swatch: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
    minHeight: 72,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: BorderWidth.thick,
  },
  label: {
    fontSize: FontSize.sm,
    letterSpacing: 0.2,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.xs,
    // Use 'end' for RTL safety — logical property
    end: Spacing.xs,
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Palette.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    lineHeight: 14,
  },
});

export default PaletteSelector;
