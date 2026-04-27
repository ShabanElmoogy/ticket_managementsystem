/**
 * theme.ts — Reactive theme hooks.
 *
 * Imports uiStore (has side effects). For pure tokens with no side effects:
 *   import { Palette, Colors, Radius, ... } from '@/src/constants/tokens';
 *
 * Components:
 *   const c = useThemeColors();   // reactive — re-renders on theme change
 *   const isDark = useIsDark();   // boolean shorthand
 */

import { useColorScheme } from 'react-native';
import { useUiStore } from '@/src/stores/uiStore';
import { Colors, type ThemeColors } from './tokens';

// Re-export everything from tokens so existing `import ... from './theme'` keep working
export * from './tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Reactive hooks — require uiStore
// ─────────────────────────────────────────────────────────────────────────────

export function useThemeColors(): ThemeColors {
  const colorMode    = useUiStore((s) => s.colorMode);
  const systemScheme = useColorScheme();

  const isDark =
    colorMode === 'dark'   ? true  :
    colorMode === 'light'  ? false :
    systemScheme === 'dark';

  return isDark ? Colors.dark : Colors.light;
}

export function useIsDark(): boolean {
  const colorMode    = useUiStore((s) => s.colorMode);
  const systemScheme = useColorScheme();

  return colorMode === 'dark'  ? true  :
         colorMode === 'light' ? false :
         systemScheme === 'dark';
}

export function syncAppearance(_colorMode: 'light' | 'dark' | 'system'): void {
  // Appearance.setColorScheme not available in this RN version — no-op
}
