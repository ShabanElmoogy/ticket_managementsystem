/**
 * tokens.ts — Pure design tokens with zero imports.
 *
 * Safe to import at module level anywhere — no circular dependency risk.
 * Contains: Palette, Colors, ThemeColors type, domain maps,
 *           Spacing, Radius, FontSize, FontWeight, Fonts.
 *
 * For reactive theme hooks (useThemeColors, useIsDark) import from theme.ts.
 *
 * Changes from v1:
 *  - surface.elevated bumped to gray200 (#e5e7eb) for clear 3-tier light hierarchy
 *  - dark surface.header changed to slate700 (#334155) — no longer identical to primary
 *  - dark text.muted changed to slate500 (#64748b) — was slate600 (1.9:1 contrast, WCAG fail)
 *  - interactive{} gains warning + warningPressed tokens (amber500/600)
 *  - StatusSurfaces map added — paired light/dark tints for every status key
 *  - ThemeColors type updated to reflect new interactive tokens
 *
 * Changes from v2:
 *  - PrioritySurfaces added — paired light/dark tints matching PriorityColors keys
 *  - RoleSurfaces added — paired light/dark tints matching RoleColors keys
 *  - LineHeight scale added — proportional to FontSize (×1.5), replaces hardcoded values
 *  - BorderWidth scale added — hairline/thin/base/thick replaces magic numbers in components
 *  - IconSize scale added — distinct from FontSize, for icon rendering consistency
 */

import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Palette — raw named color values
// ─────────────────────────────────────────────────────────────────────────────

export const Palette = {
  // Slate
  slate50: '#f8fafc',
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
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  // White / Black
  white: '#ffffff',
  black: '#000000',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Semantic color tokens — light + dark
// ─────────────────────────────────────────────────────────────────────────────

const light = {
  surface: {
    primary: Palette.white,
    secondary: Palette.slate50,
    tertiary: Palette.slate100,
    elevated: Palette.gray200,    // was gray100 — now clearly distinct from tertiary
    header: Palette.indigo500,
  },
  text: {
    primary: Palette.gray900,
    secondary: Palette.slate500,
    tertiary: Palette.slate400,
    muted: Palette.gray400,    // decorative/placeholder only — does not meet WCAG AA
    inverse: Palette.white,
  },
  border: {
    primary: Palette.slate200,
    secondary: Palette.gray300,
    focus: Palette.blue500,
  },
  intent: {
    success: Palette.green500,
    successSurface: '#f0fdf4',
    error: Palette.red500,
    errorSurface: '#fef2f2',
    warning: Palette.amber500,
    warningSurface: '#fffbeb',
    info: Palette.blue500,
    infoSurface: '#eff6ff',
  },
  interactive: {
    primary: Palette.blue500,
    primaryPressed: Palette.blue600,
    secondary: Palette.slate200,
    disabled: Palette.gray300,
    pressed: Palette.slate100,
    success: Palette.green500,
    successPressed: Palette.green600,
    warning: Palette.amber500,
    warningPressed: Palette.amber600,
    error: Palette.red500,
    errorPressed: Palette.red600,
    // ── Chip tokens ──────────────────────────────────────────────────────────
    chipBg: Palette.slate100,   // inactive chip background
    chipBorder: Palette.slate300,   // inactive chip border
    chipActiveBg: Palette.blue500,    // active chip background
    chipActiveBorder: Palette.blue600,  // active chip border
    chipActiveText: Palette.white,      // active chip label
    chipText: Palette.slate600,   // inactive chip label
  },
  // 🔥 ── Buttons tokens (NEW) ───────────────────────────────
  buttons: {
    primary: {
      bg: Palette.blue500,
      pressed: Palette.blue600,
      text: Palette.white,
    },

    success: {
      bg: Palette.green500,
      pressed: Palette.green600,
      text: Palette.white,
    },

    danger: {
      bg: Palette.red500,
      pressed: Palette.red600,
      text: Palette.white,
    },

    secondary: {
      bg: Palette.gray200,
      text: Palette.gray900,
      border: Palette.gray300,
    },

    outline: {
      border: Palette.blue500,
      text: Palette.blue500,
    },

    ghost: {
      text: Palette.blue500,
    },
    neutral: {
      bg: Palette.slate100,
      pressed: Palette.gray200,
      text: Palette.slate600,
    },
    cancel: {
      bg: 'transparent',
      pressed: Palette.slate100,
      text: Palette.slate500,
      border: Palette.slate300,
    },
  },
  tint: '#0a7ea4',
  icon: Palette.slate500,
  tabIconDefault: Palette.slate500,
  tabIconSelected: '#0a7ea4',
  shadow: 'rgba(0,0,0,0.18)',
} as const;

const dark = {
  surface: {
    primary: Palette.slate800,
    secondary: Palette.slate900,
    tertiary: Palette.slate850,
    elevated: Palette.slate700,
    header: Palette.slate700,   // was slate800 (= primary) — now visually distinct
  },
  text: {
    primary: Palette.slate100,
    secondary: Palette.slate300,
    tertiary: Palette.slate400,
    muted: Palette.slate500,   // was slate600 (1.9:1 on slate800, WCAG fail) — now slate500 (3.1:1)
    inverse: Palette.gray900,
  },
  border: {
    primary: Palette.slate700,
    secondary: Palette.slate600,
    focus: Palette.blue400,
  },
  intent: {
    success: Palette.green500,
    successSurface: '#0c2a1a',
    error: Palette.red500,
    errorSurface: '#3b1515',
    warning: Palette.amber500,
    warningSurface: '#2d1f00',
    info: Palette.blue400,
    infoSurface: '#0c1a2e',
  },
  interactive: {
    primary: Palette.blue500,
    primaryPressed: Palette.blue600,
    secondary: Palette.slate700,
    disabled: Palette.slate600,
    pressed: Palette.slate700,
    success: Palette.green500,
    successPressed: Palette.green600,
    warning: Palette.amber500,
    warningPressed: Palette.amber600,
    error: Palette.red500,
    errorPressed: Palette.red600,
    // ── Chip tokens ──────────────────────────────────────────────────────────
    chipBg: '#1e3a5f',   // dark blue tint — visible on dark bg
    chipBorder: '#3b82f6',   // blue border — always visible
    chipActiveBg: Palette.blue500,
    chipActiveBorder: Palette.blue400,
    chipActiveText: Palette.white,
    chipText: Palette.slate300,   // readable on dark
  },
  // 🔥 ── Buttons tokens (NEW) ───────────────────────────────
  buttons: {
    primary: {
      bg: Palette.blue400,   // 👈 أفتح عشان يبان في dark
      pressed: Palette.blue500,
      text: Palette.white,
    },

    success: {
      bg: Palette.green500,
      pressed: Palette.green600,
      text: Palette.white,
    },

    danger: {
      bg: Palette.red400,    // 👈 أفتح شوية
      pressed: Palette.red500,
      text: Palette.white,
    },

    secondary: {
      bg: Palette.slate700,
      text: Palette.slate100,
      border: Palette.slate600,
    },

    outline: {
      border: Palette.blue400,
      text: Palette.blue400,
    },

    ghost: {
      text: Palette.blue400,
    },
    neutral: {
      bg: Palette.slate700,
      pressed: Palette.slate600,
      text: Palette.slate300,
    },
    cancel: {
      bg: 'transparent',
      pressed: Palette.slate700,
      text: Palette.slate400,
      border: Palette.slate600,
    },
  },
  tint: Palette.white,
  icon: '#9BA1A6',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: Palette.white,
  shadow: 'rgba(0,0,0,0.45)',
} as const;

export const Colors = { light, dark } as const;

export type ThemeColors = {
  surface: { primary: string; secondary: string; tertiary: string; elevated: string; header: string };
  text: { primary: string; secondary: string; tertiary: string; muted: string; inverse: string };
  border: { primary: string; secondary: string; focus: string };
  intent: { success: string; successSurface: string; error: string; errorSurface: string; warning: string; warningSurface: string; info: string; infoSurface: string };
  interactive: {
    primary: string; primaryPressed: string;
    secondary: string;
    disabled: string; pressed: string;
    success: string; successPressed: string;
    warning: string; warningPressed: string;
    error: string; errorPressed: string;
    chipBg: string; chipBorder: string;
    chipActiveBg: string; chipActiveBorder: string;
    chipActiveText: string; chipText: string;
  };
  buttons: {
    primary:   { bg: string; pressed: string; text: string };
    success:   { bg: string; pressed: string; text: string };
    danger:    { bg: string; pressed: string; text: string };
    secondary: { bg: string; text: string; border: string };
    outline:   { border: string; text: string };
    ghost:     { text: string };
    neutral:   { bg: string; pressed: string; text: string };
    cancel:    { bg: string; pressed: string; text: string; border: string };
  };
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  shadow: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Domain color maps
// ─────────────────────────────────────────────────────────────────────────────

export const StatusColors: Record<string, string> = {
  OPEN: Palette.amber500,
  IN_PROGRESS: Palette.violet600,
  PROGRAMMING: Palette.indigo500,
  UNDER_DEVELOPMENT: Palette.violet500,
  CODE_REVIEW: Palette.cyan500,
  TESTING: Palette.cyan600,
  RESOLVED: Palette.green500,
  CLOSED: Palette.gray500,
};

/**
 * StatusSurfaces — paired background tints for status chips/badges.
 * Use StatusColors[status] for the text/icon color and
 * StatusSurfaces.light[status] / StatusSurfaces.dark[status] for the fill.
 * This replaces per-component rgba() guesswork with shared, consistent tokens.
 */
export const StatusSurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    OPEN: '#fffbeb',
    IN_PROGRESS: '#ede9fe',
    PROGRAMMING: '#e0e7ff',
    UNDER_DEVELOPMENT: '#f5f3ff',
    CODE_REVIEW: '#ecfeff',
    TESTING: '#f0fdfa',
    RESOLVED: '#d1fae5',
    CLOSED: '#f3f4f6',
  },
  dark: {
    OPEN: '#292109',
    IN_PROGRESS: '#2d1b69',
    PROGRAMMING: '#1e1b4b',
    UNDER_DEVELOPMENT: '#2e1065',
    CODE_REVIEW: '#083344',
    TESTING: '#042f2e',
    RESOLVED: '#022c22',
    CLOSED: '#1f2937',
  },
};

export const PriorityColors: Record<string, string> = {
  LOW: Palette.green500,
  MEDIUM: Palette.amber500,
  HIGH: Palette.red500,
  URGENT: Palette.red600,
};

/**
 * PrioritySurfaces — paired background tints for priority chips/badges.
 * Use PriorityColors[priority] for text/icon color and
 * PrioritySurfaces.light[priority] / PrioritySurfaces.dark[priority] for the fill.
 */
export const PrioritySurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    LOW: '#f0fdf4',
    MEDIUM: '#fffbeb',
    HIGH: '#fef2f2',
    URGENT: '#fff1f2',
  },
  dark: {
    LOW: '#022c22',
    MEDIUM: '#292109',
    HIGH: '#3b1515',
    URGENT: '#4c0519',
  },
};

export const RoleColors: Record<string, string> = {
  SUPER_ADMIN: Palette.red500,
  TENANT_ADMIN: Palette.amber500,
  PROGRAMMER: Palette.violet500,
  EMPLOYEE: Palette.blue500,
};

/**
 * RoleSurfaces — paired background tints for role chips/badges.
 * Use RoleColors[role] for text/icon color and
 * RoleSurfaces.light[role] / RoleSurfaces.dark[role] for the fill.
 */
export const RoleSurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    SUPER_ADMIN: '#fef2f2',
    TENANT_ADMIN: '#fffbeb',
    PROGRAMMER: '#f5f3ff',
    EMPLOYEE: '#eff6ff',
  },
  dark: {
    SUPER_ADMIN: '#3b1515',
    TENANT_ADMIN: '#292109',
    PROGRAMMER: '#2e1065',
    EMPLOYEE: '#0c1a2e',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing, Radius, Typography
// ─────────────────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 48,
} as const;

export const Radius = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999,
} as const;

export const FontSize = {
  xs: 10, sm: 11, base: 13, md: 14, lg: 15, xl: 16,
  '2xl': 18, '3xl': 20, '4xl': 24,
} as const;

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

/**
 * LineHeight — proportional to FontSize (approx ×1.5).
 * Replaces magic numbers like `lineHeight: 18` in component styles.
 */
export const LineHeight = {
  xs: 14,
  sm: 16,
  base: 20,
  md: 20,
  lg: 22,
  xl: 24,
  '2xl': 28,
  '3xl': 30,
  '4xl': 36,
} as const;

/**
 * BorderWidth — named widths for borders, underlines, dividers.
 * Replaces magic numbers like `borderWidth: 1.5` in component styles.
 */
export const BorderWidth = {
  hairline: 0.5,
  thin: 1,
  base: 1.5,
  thick: 2,
} as const;

/**
 * IconSize — independent of FontSize; use for icon `width`/`height`.
 * Keeps icon sizing consistent across components.
 */
export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});