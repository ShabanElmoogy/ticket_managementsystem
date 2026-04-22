/**
 * theme.ts — Single source of truth for all design tokens.
 *
 * Structure:
 *   Palette      — raw named color values (never use directly in components)
 *   Colors       — semantic light/dark tokens (surfaces, text, borders, intent…)
 *   StatusColors — ticket/task status → color map
 *   PriorityColors — ticket priority → color map
 *   RoleColors   — user role → color map
 *   Spacing      — consistent spacing scale
 *   Radius       — border-radius scale
 *   Typography   — font sizes + weights
 *   Fonts        — platform font families
 *   useThemeColors — hook: returns the correct Colors[mode] based on uiStore
 */

import { Platform } from 'react-native';
import { useUiStore } from '@/src/stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Palette — raw values, not for direct use in components
// ─────────────────────────────────────────────────────────────────────────────

export const Palette = {
  // Slate
  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate850: '#273549',
  slate900: '#0f172a',

  // Gray
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray900: '#111827',

  // Blue
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',

  // Violet / Purple
  violet400: '#a78bfa',
  violet500: '#8b5cf6',
  violet600: '#7c3aed',

  // Indigo
  indigo500: '#6366f1',

  // Cyan
  cyan500: '#0ea5e9',
  cyan600: '#06b6d4',

  // Green / Emerald
  green500: '#10b981',
  green600: '#059669',

  // Amber / Yellow
  amber500: '#f59e0b',
  amber600: '#d97706',

  // Red
  red400:  '#f87171',
  red500:  '#ef4444',
  red600:  '#dc2626',
  red700:  '#b91c1c',

  // White / Black
  white: '#ffffff',
  black: '#000000',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Semantic color tokens — light + dark
// ─────────────────────────────────────────────────────────────────────────────

const light = {
  // ── Surfaces ───────────────────────────────────────────────────────────────
  surface: {
    /** Main card / dialog background */
    primary:   Palette.white,
    /** Subtle tinted background (inputs, code blocks) */
    secondary: Palette.slate50,
    /** Slightly elevated (panel headers, table headers) */
    tertiary:  Palette.slate100,
    /** Pressed / hover state */
    elevated:  Palette.gray100,
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   Palette.gray900,
    secondary: Palette.slate500,
    tertiary:  Palette.slate400,
    muted:     Palette.gray400,
    inverse:   Palette.white,
  },

  // ── Borders ────────────────────────────────────────────────────────────────
  border: {
    primary:   Palette.slate200,
    secondary: Palette.gray300,
    focus:     Palette.blue500,
  },

  // ── Intent (feedback) ──────────────────────────────────────────────────────
  intent: {
    success:        Palette.green500,
    successSurface: '#f0fdf4',
    error:          Palette.red500,
    errorSurface:   '#fef2f2',
    warning:        Palette.amber500,
    warningSurface: '#fffbeb',
    info:           Palette.blue500,
    infoSurface:    '#eff6ff',
  },

  // ── Interactive ────────────────────────────────────────────────────────────
  interactive: {
    primary:        Palette.blue500,
    primaryPressed: Palette.blue600,
    secondary:      Palette.slate200,
    disabled:       Palette.gray300,
    pressed:        Palette.slate100,
  },

  // ── Tab / Navigation ───────────────────────────────────────────────────────
  tint:           '#0a7ea4',
  icon:           Palette.slate500,
  tabIconDefault: Palette.slate500,
  tabIconSelected:'#0a7ea4',
} as const;

const dark = {
  // ── Surfaces ───────────────────────────────────────────────────────────────
  surface: {
    primary:   Palette.slate800,
    secondary: Palette.slate900,
    tertiary:  Palette.slate850,
    elevated:  Palette.slate700,
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   Palette.slate100,
    secondary: Palette.slate300,
    tertiary:  Palette.slate400,
    muted:     Palette.slate600,
    inverse:   Palette.gray900,
  },

  // ── Borders ────────────────────────────────────────────────────────────────
  border: {
    primary:   Palette.slate700,
    secondary: Palette.slate600,
    focus:     Palette.blue400,
  },

  // ── Intent (feedback) ──────────────────────────────────────────────────────
  intent: {
    success:        Palette.green500,
    successSurface: '#0c2a1a',
    error:          Palette.red500,
    errorSurface:   '#3b1515',
    warning:        Palette.amber500,
    warningSurface: '#2d1f00',
    info:           Palette.blue400,
    infoSurface:    '#0c1a2e',
  },

  // ── Interactive ────────────────────────────────────────────────────────────
  interactive: {
    primary:        Palette.blue500,
    primaryPressed: Palette.blue600,
    secondary:      Palette.slate700,
    disabled:       Palette.slate600,
    pressed:        Palette.slate700,
  },

  // ── Tab / Navigation ───────────────────────────────────────────────────────
  tint:           Palette.white,
  icon:           '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: Palette.white,
} as const;

export const Colors = { light, dark } as const;

// Structural type — uses string instead of string literals so light/dark are both assignable
export type ThemeColors = {
  surface:     { primary: string; secondary: string; tertiary: string; elevated: string };
  text:        { primary: string; secondary: string; tertiary: string; muted: string; inverse: string };
  border:      { primary: string; secondary: string; focus: string };
  intent:      { success: string; successSurface: string; error: string; errorSurface: string; warning: string; warningSurface: string; info: string; infoSurface: string };
  interactive: { primary: string; primaryPressed: string; secondary: string; disabled: string; pressed: string };
  tint:           string;
  icon:           string;
  tabIconDefault: string;
  tabIconSelected:string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Domain color maps — ticket status, priority, user role
// ─────────────────────────────────────────────────────────────────────────────

/** Ticket / task status → accent color */
export const StatusColors: Record<string, string> = {
  OPEN:              Palette.amber500,
  IN_PROGRESS:       Palette.violet600,
  PROGRAMMING:       Palette.indigo500,
  UNDER_DEVELOPMENT: Palette.violet500,
  CODE_REVIEW:       Palette.cyan500,
  TESTING:           Palette.cyan600,
  RESOLVED:          Palette.green500,
  CLOSED:            Palette.gray500,
};

/** Ticket priority → accent color */
export const PriorityColors: Record<string, string> = {
  LOW:    Palette.green500,
  MEDIUM: Palette.amber500,
  HIGH:   Palette.red500,
  URGENT: Palette.red600,
};

/** User role → accent color */
export const RoleColors: Record<string, string> = {
  SUPER_ADMIN:  Palette.red500,
  TENANT_ADMIN: Palette.amber500,
  PROGRAMMER:   Palette.violet500,
  EMPLOYEE:     Palette.blue500,
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing scale
// ─────────────────────────────────────────────────────────────────────────────

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Border radius scale
// ─────────────────────────────────────────────────────────────────────────────

export const Radius = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 20,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Typography scale
// ─────────────────────────────────────────────────────────────────────────────

export const FontSize = {
  xs:   10,
  sm:   11,
  base: 13,
  md:   14,
  lg:   15,
  xl:   16,
  '2xl': 18,
  '3xl': 20,
  '4xl': 24,
} as const;

export const FontWeight = {
  normal:    '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Platform font families
// ─────────────────────────────────────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// useThemeColors — hook: resolves Colors[mode] from uiStore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the semantic color tokens for the current color mode.
 *
 * @example
 * const c = useThemeColors();
 * <View style={{ backgroundColor: c.surface.primary, borderColor: c.border.primary }}>
 *   <Text style={{ color: c.text.primary }}>Hello</Text>
 * </View>
 */
export function useThemeColors(): ThemeColors {
  const colorMode = useUiStore((s) => s.colorMode);
  // 'system' falls back to light until system detection is wired
  return colorMode === 'dark' ? Colors.dark : Colors.light;
}

/**
 * Returns `true` when the current color mode is dark.
 * Convenience shorthand for components that only need the boolean.
 *
 * @example
 * const isDark = useIsDark();
 */
export function useIsDark(): boolean {
  const colorMode = useUiStore((s) => s.colorMode);
  return colorMode === 'dark';
}
