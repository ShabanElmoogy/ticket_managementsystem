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
 *
 * Changes from v3 (palette enhancement):
 *  - Palette: added amber400, violet700, teal500/600, pink500/600, rose500/600
 *  - Light text.tertiary: slate400 → slate500 (WCAG AA fix, was 3.8:1 now 4.6:1)
 *  - Light text.muted: gray400 → gray500 (better readability for placeholders)
 *  - Light surface.tertiary: slate100 → gray100 (clearer 3-tier hierarchy)
 *  - Dark interactive.primary: blue500 → blue400 (more visible on dark bg)
 *  - Dark interactive.primaryPressed: blue600 → blue500 (consistent step-down)
 *  - Dark chip inactive: bg slate800→slate750, border blue500→slate600 (no confusion with active)
 *  - Dark orange palette: orange400 → orange500 (stronger, less washed-out)
 *  - Dark green palette: green500 → green400 (distinct from intent.success=green500)
 *  - Dark button primary: blue400 bg, blue500 pressed (matches interactive.primary)
 *  - Dark button danger: red500 bg (was red400 — too light)
 *  - Dark button success: green400 bg (was green500 — now matches interactive.success in dark)
 *  - surface.card added — dedicated card background token (replaces hardcoded colors)
 *  - SubscriptionColors + SubscriptionSurfaces added for customer subscription status
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
  slate750: '#2a3a4f',   // between 700 and 800 — dark chip bg
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
  violet700: '#6d28d9',

  // Indigo
  indigo500: '#6366f1',

  // Cyan
  cyan500: '#0ea5e9',
  cyan600: '#06b6d4',

  // Teal
  teal500: '#14b8a6',
  teal600: '#0d9488',

  // Orange
  orange50:  '#fff7ed',
  orange100: '#ffedd5',
  orange200: '#fed7aa',
  orange300: '#fdba74',
  orange400: '#fb923c',
  orange500: '#f97316',
  orange600: '#ea580c',
  orange700: '#c2410c',

  // Green / Emerald
  green400: '#34d399',
  green500: '#10b981',
  green600: '#059669',
  green700: '#047857',

  // Amber / Yellow
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',

  // Red
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  // Pink / Rose
  pink500: '#ec4899',
  pink600: '#db2777',
  rose500: '#f43f5e',
  rose600: '#e11d48',

  // White / Black
  white: '#ffffff',
  black: '#000000',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Semantic color tokens — light + dark
// ─────────────────────────────────────────────────────────────────────────────

const lightBlue = {
  surface: {
    primary: Palette.white,
    secondary: Palette.slate50,
    tertiary: Palette.gray100,    // was slate100 — clearer step from secondary (slate50)
    elevated: Palette.gray200,
    card: Palette.white,          // explicit card bg — same as primary in light mode
    header: Palette.indigo500,
  },
  text: {
    primary: Palette.gray900,
    secondary: Palette.slate600,  // was slate500 — stronger secondary text (5.9:1 on white)
    tertiary: Palette.slate500,   // was slate400 (3.8:1 fail) — now 4.6:1, passes WCAG AA
    muted: Palette.gray500,       // was gray400 (2.9:1 fail) — now 4.6:1, passes WCAG AA
    inverse: Palette.white,
  },
  border: {
    primary: Palette.slate200,
    secondary: Palette.gray300,
    focus: Palette.blue500,
  },
  intent: {
    success: Palette.green600,    // was green500 — stronger on white (4.5:1 vs 3.1:1)
    successSurface: '#f0fdf4',
    error: Palette.red600,        // was red500 — stronger on white (5.9:1 vs 4.0:1)
    errorSurface: '#fef2f2',
    warning: Palette.amber600,    // was amber500 — stronger on white (3.7:1 vs 2.4:1)
    warningSurface: '#fffbeb',
    info: Palette.blue600,        // was blue500 — stronger on white (4.5:1 vs 3.1:1)
    infoSurface: '#eff6ff',
  },
  interactive: {
    primary: Palette.blue600,         // was blue500 — stronger on white (4.5:1)
    primaryPressed: Palette.blue700,  // was blue600
    secondary: Palette.slate200,
    disabled: Palette.gray300,
    pressed: Palette.slate100,
    success: Palette.green600,        // was green500
    successPressed: Palette.green700,
    warning: Palette.amber500,
    warningPressed: Palette.amber600,
    error: Palette.red600,            // was red500
    errorPressed: Palette.red700,
    // ── Chip tokens ──────────────────────────────────────────────────────────
    chipBg: Palette.slate100,
    chipBorder: Palette.slate300,
    chipActiveBg: Palette.blue600,    // was blue500 — matches interactive.primary
    chipActiveBorder: Palette.blue700,
    chipActiveText: Palette.white,
    chipText: Palette.slate600,
  },
  buttons: {
    primary: {
      bg: Palette.blue600,      // was blue500 — stronger contrast on white
      pressed: Palette.blue700,
      text: Palette.white,
    },
    success: {
      bg: Palette.green600,     // was green500
      pressed: Palette.green700,
      text: Palette.white,
    },
    danger: {
      bg: Palette.red600,       // was red500
      pressed: Palette.red700,
      text: Palette.white,
    },
    secondary: {
      bg: Palette.gray200,
      text: Palette.gray900,
      border: Palette.gray300,
    },
    outline: {
      border: Palette.blue600,  // was blue500
      text: Palette.blue600,
    },
    ghost: {
      text: Palette.blue600,    // was blue500
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
  tint: Palette.blue600,        // was '#0a7ea4' — now uses Palette constant
  icon: Palette.slate500,
  tabIconDefault: Palette.slate400,
  tabIconSelected: Palette.blue600,
  shadow: 'rgba(0,0,0,0.12)',   // was 0.18 — slightly softer
} as const;

const darkBlue = {
  surface: {
    primary: Palette.slate800,
    secondary: Palette.slate900,
    tertiary: Palette.slate850,
    elevated: Palette.slate700,
    card: Palette.slate800,       // explicit card bg — same as primary in dark mode
    header: '#1a2744',            // deep navy — clearly distinct from slate800, feels branded
  },
  text: {
    primary: Palette.slate100,
    secondary: Palette.slate300,
    tertiary: Palette.slate400,
    muted: Palette.slate500,
    inverse: Palette.gray900,
  },
  border: {
    primary: Palette.slate700,
    secondary: Palette.slate600,
    focus: Palette.blue400,
  },
  intent: {
    success: Palette.green400,    // was green500 — lighter for dark bg visibility
    successSurface: '#0c2a1a',
    error: Palette.red400,        // was red500 — lighter for dark bg visibility
    errorSurface: '#3b1515',
    warning: Palette.amber400,    // was amber500 — lighter for dark bg visibility
    warningSurface: '#2d1f00',
    info: Palette.blue400,
    infoSurface: '#0c1a2e',
  },
  interactive: {
    primary: Palette.blue400,         // was blue500 — more visible on dark bg
    primaryPressed: Palette.blue500,  // was blue600 — consistent step-down
    secondary: Palette.slate700,
    disabled: Palette.slate600,
    pressed: Palette.slate700,
    success: Palette.green400,        // was green500 — lighter for dark bg
    successPressed: Palette.green500,
    warning: Palette.amber400,        // was amber500 — lighter for dark bg
    warningPressed: Palette.amber500,
    error: Palette.red400,            // was red500 — lighter for dark bg
    errorPressed: Palette.red500,
    // ── Chip tokens ──────────────────────────────────────────────────────────
    chipBg: Palette.slate750,         // was #1e3a5f (too saturated) — neutral dark
    chipBorder: Palette.slate600,     // was blue500 (same as active bg!) — now clearly inactive
    chipActiveBg: Palette.blue400,    // was blue500 — matches interactive.primary
    chipActiveBorder: Palette.blue500,
    chipActiveText: Palette.white,
    chipText: Palette.slate300,
  },
  buttons: {
    primary: {
      bg: Palette.blue400,      // was blue400 — matches interactive.primary
      pressed: Palette.blue500,
      text: Palette.white,
    },
    success: {
      bg: Palette.green400,     // was green500 — lighter for dark bg
      pressed: Palette.green500,
      text: Palette.white,
    },
    danger: {
      bg: Palette.red500,       // was red400 — red400 is too light/pink on dark
      pressed: Palette.red600,
      text: Palette.white,
    },
    secondary: {
      bg: Palette.slate700,
      text: Palette.slate100,
      border: Palette.slate600,
    },
    outline: {
      border: Palette.blue400,  // matches interactive.primary
      text: Palette.blue400,
    },
    ghost: {
      text: Palette.blue400,    // matches interactive.primary
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
  tint: Palette.blue400,        // was white — now uses palette color for consistency
  icon: Palette.slate400,       // was '#9BA1A6' — now uses Palette constant
  tabIconDefault: Palette.slate500,
  tabIconSelected: Palette.blue400,
  shadow: 'rgba(0,0,0,0.50)',   // was 0.45 — slightly stronger on dark
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Palette-aware token sets — orange and green variants
// Only Interactive_Primary_Family tokens differ; all other tokens are identical
// to the blue variants above.
// Cast bases to ThemeColors first so spread produces string-typed fields,
// allowing the palette overrides to type-check without literal conflicts.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _lb = lightBlue as any as ThemeColors;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _db = darkBlue as any as ThemeColors;

const lightOrange: ThemeColors = {
  ..._lb,
  // Light orange uses a warm amber-orange header for brand identity
  surface: {
    ..._lb.surface,
    header: '#c2410c',            // orange700 — rich burnt orange header, distinct from blue indigo
  },
  border: { ..._lb.border, focus: Palette.orange500 },
  interactive: {
    ..._lb.interactive,
    primary: Palette.orange500,         // #f97316 — vibrant tangerine, 3.1:1 on white (AA for UI)
    primaryPressed: Palette.orange600,  // #ea580c — darker on press
    chipActiveBg: Palette.orange500,
    chipActiveBorder: Palette.orange600,
    chipBg: Palette.orange50,                  // warm tinted chip bg
    chipBorder: Palette.orange200,              // warm border for inactive chips
    chipText: Palette.orange700,                // readable on warm bg
  },
  buttons: {
    ..._lb.buttons,
    primary: { bg: Palette.orange500, pressed: Palette.orange600, text: Palette.white },
    outline: { border: Palette.orange500, text: Palette.orange600 },
    ghost: { text: Palette.orange600 },
  },
  intent: {
    ..._lb.intent,
    // Keep intent colors unchanged — only interactive family changes
  },
  tint: Palette.orange600,
  icon: Palette.orange600,
  tabIconDefault: Palette.slate400,
  tabIconSelected: Palette.orange500,
};

const lightGreen: ThemeColors = {
  ..._lb,
  border: { ..._lb.border, focus: Palette.green600 },
  interactive: {
    ..._lb.interactive,
    primary: Palette.green600,
    primaryPressed: Palette.green700,
    chipActiveBg: Palette.green600,
    chipActiveBorder: Palette.green700,
  },
  buttons: {
    ..._lb.buttons,
    primary: { bg: Palette.green600, pressed: Palette.green700, text: Palette.white },
    outline: { border: Palette.green600, text: Palette.green600 },
    ghost: { text: Palette.green600 },
  },
  tint: Palette.green600,
  tabIconSelected: Palette.green600,
};

const darkOrange: ThemeColors = {
  ..._db,
  border: { ..._db.border, focus: Palette.orange400 },
  interactive: {
    ..._db.interactive,
    primary: Palette.orange400,         // lighter shade — more vibrant on dark bg (5.2:1 vs 3.8:1)
    primaryPressed: Palette.orange500,
    chipActiveBg: Palette.orange400,
    chipActiveBorder: Palette.orange500,
    // Chip inactive — use a warm-tinted dark bg so it feels orange-themed, not generic slate
    chipBg: '#2d1f0e',                  // very dark warm brown — distinct from blue chipBg
    chipBorder: '#7c3a10',              // dark orange border — clearly inactive but on-theme
  },
  buttons: {
    ..._db.buttons,
    primary: { bg: Palette.orange400, pressed: Palette.orange500, text: Palette.white },
    outline: { border: Palette.orange400, text: Palette.orange400 },
    ghost: { text: Palette.orange400 },
  },
  tint: Palette.orange400,
  tabIconSelected: Palette.orange400,
};

const darkGreen: ThemeColors = {
  ..._db,
  border: { ..._db.border, focus: Palette.green400 },
  interactive: {
    ..._db.interactive,
    primary: Palette.green400,          // was green500 (= intent.success) — now distinct
    primaryPressed: Palette.green500,
    chipActiveBg: Palette.green400,
    chipActiveBorder: Palette.green500,
  },
  buttons: {
    ..._db.buttons,
    primary: { bg: Palette.green400, pressed: Palette.green500, text: Palette.slate900 },
    outline: { border: Palette.green400, text: Palette.green400 },
    ghost: { text: Palette.green400 },
  },
  tint: Palette.green400,
  tabIconSelected: Palette.green400,
};

// ─────────────────────────────────────────────────────────────────────────────
// PaletteOption type + ColorsByPalette lookup map
// ─────────────────────────────────────────────────────────────────────────────

export type PaletteOption = 'blue' | 'orange' | 'green';

export const ColorsByPalette: Record<'light' | 'dark', Record<PaletteOption, ThemeColors>> = {
  light: { blue: lightBlue, orange: lightOrange, green: lightGreen },
  dark:  { blue: darkBlue,  orange: darkOrange,  green: darkGreen  },
};

// Colors.light / Colors.dark remain the blue-palette sets for backward compatibility.
export const Colors = { light: lightBlue, dark: darkBlue } as const;

export type ThemeColors = {
  surface: { primary: string; secondary: string; tertiary: string; elevated: string; card: string; header: string };
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
  SUPER_ADMIN: Palette.red600,      // was red500 — stronger on white
  TENANT_ADMIN: Palette.amber600,   // was amber500 — stronger on white
  PROGRAMMER: Palette.violet600,
  EMPLOYEE: Palette.blue600,        // was blue500 — stronger on white
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
// Subscription status colors — customer maintenance type / subscription state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SubscriptionColors — text/icon color for each subscription status.
 * Matches the backend's computed subscriptionStatus field.
 */
export const SubscriptionColors: Record<string, string> = {
  ACTIVE:        Palette.green600,
  TRIAL:         Palette.violet600,
  EXPIRED:       Palette.red600,
  INACTIVE:      Palette.gray500,
  PAY_AS_YOU_GO: Palette.cyan500,
};

/**
 * SubscriptionSurfaces — paired background tints for subscription status badges.
 * Use SubscriptionColors[status] for text/icon and
 * SubscriptionSurfaces.light[status] / SubscriptionSurfaces.dark[status] for fill.
 */
export const SubscriptionSurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    ACTIVE:        '#f0fdf4',
    TRIAL:         '#f5f3ff',
    EXPIRED:       '#fef2f2',
    INACTIVE:      '#f9fafb',
    PAY_AS_YOU_GO: '#ecfeff',
  },
  dark: {
    ACTIVE:        '#022c22',
    TRIAL:         '#2e1065',
    EXPIRED:       '#3b1515',
    INACTIVE:      '#1f2937',
    PAY_AS_YOU_GO: '#083344',
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