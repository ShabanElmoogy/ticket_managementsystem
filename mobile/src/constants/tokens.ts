/**
 * tokens.ts — Pure design tokens with zero imports.
 *
 * Safe to import at module level anywhere — no circular dependency risk.
 * Contains: Color Scales, Palette (derived), ThemeColors type, semantic token
 *           variants, ColorsByPalette, Colors, domain maps,
 *           Spacing, Radius, FontSize, FontWeight, LineHeight,
 *           BorderWidth, IconSize, Fonts.
 *
 * For reactive theme hooks (useThemeColors, useIsDark) import from theme.ts.
 *
 * Changes from v4 (shadcn-palette-rewrite):
 *  - All color scales now match shadcn/ui + Tailwind v3 exactly (11 stops: 50→950)
 *  - Zinc added — shadcn default neutral (cooler than Gray, warmer than Slate)
 *  - Neutral added — pure achromatic gray baseline
 *  - Sky added — lighter blue family distinct from Blue
 *  - Emerald added — distinct from Green (shadcn uses both)
 *  - Purple + Fuchsia added — richer warm-purple spectrum
 *  - Lime + Yellow added — complete warm end of spectrum
 *  - Green[400] corrected to #4ade80 (Tailwind value)
 *  - Cyan corrected to sky-blue family (#06b6d4 at 500)
 *  - Blue[400] → #60a5fa (Tailwind value)
 *  - No custom half-steps (750, 850) — replaced with real scale stops
 *  - Dark chip/tertiary tokens use Zinc[800]/Zinc[700] instead of custom hex
 *  - lightGreen / darkGreen variants updated to Emerald for better distinction
 *  - StatusSurfaces, PrioritySurfaces, RoleSurfaces, SubscriptionSurfaces retained
 *  - Stone scale updated to full 11-stop Tailwind spec
 *  - All six theme variants fully explicit standalone objects
 */

import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Color Scales — exact Tailwind v3 / shadcn values, 50→950 (11 stops each)
// ─────────────────────────────────────────────────────────────────────────────

const Slate = {
  50:  '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
} as const;

const Gray = {
  50:  '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712',
} as const;

/** Zinc — shadcn's default neutral base. Cooler than Gray, warmer than Slate. */
const Zinc = {
  50:  '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
} as const;

/** Neutral — pure achromatic gray. No hue cast. */
const Neutral = {
  50:  '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
} as const;

const Stone = {
  50:  '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
  950: '#0c0a09',
} as const;

const Red = {
  50:  '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
} as const;

const Orange = {
  50:  '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
} as const;

const Amber = {
  50:  '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
} as const;

const Yellow = {
  50:  '#fefce8',
  100: '#fef9c3',
  200: '#fef08a',
  300: '#fde047',
  400: '#facc15',
  500: '#eab308',
  600: '#ca8a04',
  700: '#a16207',
  800: '#854d0e',
  900: '#713f12',
  950: '#422006',
} as const;

const Lime = {
  50:  '#f7fee7',
  100: '#ecfccb',
  200: '#d9f99d',
  300: '#bef264',
  400: '#a3e635',
  500: '#84cc16',
  600: '#65a30d',
  700: '#4d7c0f',
  800: '#3f6212',
  900: '#365314',
  950: '#1a2e05',
} as const;

const Green = {
  50:  '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
} as const;

/** Emerald — distinct from Green; shadcn uses both for success semantics. */
const Emerald = {
  50:  '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
} as const;

const Teal = {
  50:  '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
} as const;

/** Cyan — sky-blue family. #06b6d4 at 500 (Tailwind exact). */
const Cyan = {
  50:  '#ecfeff',
  100: '#cffafe',
  200: '#a5f3fc',
  300: '#67e8f9',
  400: '#22d3ee',
  500: '#06b6d4',
  600: '#0891b2',
  700: '#0e7490',
  800: '#155e75',
  900: '#164e63',
  950: '#083344',
} as const;

/** Sky — lighter blue, distinct from Blue and Cyan. */
const Sky = {
  50:  '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
} as const;

const Blue = {
  50:  '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
} as const;

const Indigo = {
  50:  '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
} as const;

const Violet = {
  50:  '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
  950: '#2e1065',
} as const;

/** Purple — warm purple, richer than Violet. */
const Purple = {
  50:  '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764',
} as const;

/** Fuchsia — vivid magenta-purple. */
const Fuchsia = {
  50:  '#fdf4ff',
  100: '#fae8ff',
  200: '#f5d0fe',
  300: '#f0abfc',
  400: '#e879f9',
  500: '#d946ef',
  600: '#c026d3',
  700: '#a21caf',
  800: '#86198f',
  900: '#701a75',
  950: '#4a044e',
} as const;

const Pink = {
  50:  '#fdf2f8',
  100: '#fce7f3',
  200: '#fbcfe8',
  300: '#f9a8d4',
  400: '#f472b6',
  500: '#ec4899',
  600: '#db2777',
  700: '#be185d',
  800: '#9d174d',
  900: '#831843',
  950: '#500724',
} as const;

const Rose = {
  50:  '#fff1f2',
  100: '#ffe4e6',
  200: '#fecdd3',
  300: '#fda4af',
  400: '#fb7185',
  500: '#f43f5e',
  600: '#e11d48',
  700: '#be123c',
  800: '#9f1239',
  900: '#881337',
  950: '#4c0519',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Palette — derived flat object
// Single source of truth for raw hex values consumed by semantic tokens and
// domain maps. Every entry is derived from its corresponding Color Scale.
// ─────────────────────────────────────────────────────────────────────────────

export const Palette = {
  // Slate
  slate50:   Slate[50],
  slate100:  Slate[100],
  slate200:  Slate[200],
  slate300:  Slate[300],
  slate400:  Slate[400],
  slate500:  Slate[500],
  slate600:  Slate[600],
  slate700:  Slate[700],
  slate800:  Slate[800],
  slate900:  Slate[900],
  slate950:  Slate[950],

  // Gray
  gray50:    Gray[50],
  gray100:   Gray[100],
  gray200:   Gray[200],
  gray300:   Gray[300],
  gray400:   Gray[400],
  gray500:   Gray[500],
  gray600:   Gray[600],
  gray700:   Gray[700],
  gray800:   Gray[800],
  gray900:   Gray[900],
  gray950:   Gray[950],

  // Zinc (shadcn default neutral)
  zinc50:    Zinc[50],
  zinc100:   Zinc[100],
  zinc200:   Zinc[200],
  zinc300:   Zinc[300],
  zinc400:   Zinc[400],
  zinc500:   Zinc[500],
  zinc600:   Zinc[600],
  zinc700:   Zinc[700],
  zinc800:   Zinc[800],
  zinc900:   Zinc[900],
  zinc950:   Zinc[950],

  // Neutral
  neutral50:  Neutral[50],
  neutral100: Neutral[100],
  neutral200: Neutral[200],
  neutral300: Neutral[300],
  neutral400: Neutral[400],
  neutral500: Neutral[500],
  neutral600: Neutral[600],
  neutral700: Neutral[700],
  neutral800: Neutral[800],
  neutral900: Neutral[900],
  neutral950: Neutral[950],

  // Stone
  stone50:   Stone[50],
  stone100:  Stone[100],
  stone200:  Stone[200],
  stone300:  Stone[300],
  stone400:  Stone[400],
  stone500:  Stone[500],
  stone600:  Stone[600],
  stone700:  Stone[700],
  stone800:  Stone[800],
  stone900:  Stone[900],
  stone950:  Stone[950],

  // Red
  red50:     Red[50],
  red100:    Red[100],
  red200:    Red[200],
  red300:    Red[300],
  red400:    Red[400],
  red500:    Red[500],
  red600:    Red[600],
  red700:    Red[700],
  red800:    Red[800],
  red900:    Red[900],
  red950:    Red[950],

  // Orange
  orange50:  Orange[50],
  orange100: Orange[100],
  orange200: Orange[200],
  orange300: Orange[300],
  orange400: Orange[400],
  orange500: Orange[500],
  orange600: Orange[600],
  orange700: Orange[700],
  orange800: Orange[800],
  orange900: Orange[900],
  orange950: Orange[950],

  // Amber
  amber50:   Amber[50],
  amber100:  Amber[100],
  amber200:  Amber[200],
  amber300:  Amber[300],
  amber400:  Amber[400],
  amber500:  Amber[500],
  amber600:  Amber[600],
  amber700:  Amber[700],
  amber800:  Amber[800],
  amber900:  Amber[900],
  amber950:  Amber[950],

  // Yellow
  yellow50:  Yellow[50],
  yellow100: Yellow[100],
  yellow200: Yellow[200],
  yellow300: Yellow[300],
  yellow400: Yellow[400],
  yellow500: Yellow[500],
  yellow600: Yellow[600],
  yellow700: Yellow[700],
  yellow800: Yellow[800],
  yellow900: Yellow[900],
  yellow950: Yellow[950],

  // Lime
  lime50:    Lime[50],
  lime100:   Lime[100],
  lime200:   Lime[200],
  lime300:   Lime[300],
  lime400:   Lime[400],
  lime500:   Lime[500],
  lime600:   Lime[600],
  lime700:   Lime[700],
  lime800:   Lime[800],
  lime900:   Lime[900],
  lime950:   Lime[950],

  // Green
  green50:   Green[50],
  green100:  Green[100],
  green200:  Green[200],
  green300:  Green[300],
  green400:  Green[400],
  green500:  Green[500],
  green600:  Green[600],
  green700:  Green[700],
  green800:  Green[800],
  green900:  Green[900],
  green950:  Green[950],

  // Emerald
  emerald50:  Emerald[50],
  emerald100: Emerald[100],
  emerald200: Emerald[200],
  emerald300: Emerald[300],
  emerald400: Emerald[400],
  emerald500: Emerald[500],
  emerald600: Emerald[600],
  emerald700: Emerald[700],
  emerald800: Emerald[800],
  emerald900: Emerald[900],
  emerald950: Emerald[950],

  // Teal
  teal50:    Teal[50],
  teal100:   Teal[100],
  teal200:   Teal[200],
  teal300:   Teal[300],
  teal400:   Teal[400],
  teal500:   Teal[500],
  teal600:   Teal[600],
  teal700:   Teal[700],
  teal800:   Teal[800],
  teal900:   Teal[900],
  teal950:   Teal[950],

  // Cyan
  cyan50:    Cyan[50],
  cyan100:   Cyan[100],
  cyan200:   Cyan[200],
  cyan300:   Cyan[300],
  cyan400:   Cyan[400],
  cyan500:   Cyan[500],
  cyan600:   Cyan[600],
  cyan700:   Cyan[700],
  cyan800:   Cyan[800],
  cyan900:   Cyan[900],
  cyan950:   Cyan[950],

  // Sky
  sky50:     Sky[50],
  sky100:    Sky[100],
  sky200:    Sky[200],
  sky300:    Sky[300],
  sky400:    Sky[400],
  sky500:    Sky[500],
  sky600:    Sky[600],
  sky700:    Sky[700],
  sky800:    Sky[800],
  sky900:    Sky[900],
  sky950:    Sky[950],

  // Blue
  blue50:    Blue[50],
  blue100:   Blue[100],
  blue200:   Blue[200],
  blue300:   Blue[300],
  blue400:   Blue[400],
  blue500:   Blue[500],
  blue600:   Blue[600],
  blue700:   Blue[700],
  blue800:   Blue[800],
  blue900:   Blue[900],
  blue950:   Blue[950],

  // Indigo
  indigo50:  Indigo[50],
  indigo100: Indigo[100],
  indigo200: Indigo[200],
  indigo300: Indigo[300],
  indigo400: Indigo[400],
  indigo500: Indigo[500],
  indigo600: Indigo[600],
  indigo700: Indigo[700],
  indigo800: Indigo[800],
  indigo900: Indigo[900],
  indigo950: Indigo[950],

  // Violet
  violet50:  Violet[50],
  violet100: Violet[100],
  violet200: Violet[200],
  violet300: Violet[300],
  violet400: Violet[400],
  violet500: Violet[500],
  violet600: Violet[600],
  violet700: Violet[700],
  violet800: Violet[800],
  violet900: Violet[900],
  violet950: Violet[950],

  // Purple
  purple50:  Purple[50],
  purple100: Purple[100],
  purple200: Purple[200],
  purple300: Purple[300],
  purple400: Purple[400],
  purple500: Purple[500],
  purple600: Purple[600],
  purple700: Purple[700],
  purple800: Purple[800],
  purple900: Purple[900],
  purple950: Purple[950],

  // Fuchsia
  fuchsia50:  Fuchsia[50],
  fuchsia100: Fuchsia[100],
  fuchsia200: Fuchsia[200],
  fuchsia300: Fuchsia[300],
  fuchsia400: Fuchsia[400],
  fuchsia500: Fuchsia[500],
  fuchsia600: Fuchsia[600],
  fuchsia700: Fuchsia[700],
  fuchsia800: Fuchsia[800],
  fuchsia900: Fuchsia[900],
  fuchsia950: Fuchsia[950],

  // Pink
  pink50:    Pink[50],
  pink100:   Pink[100],
  pink200:   Pink[200],
  pink300:   Pink[300],
  pink400:   Pink[400],
  pink500:   Pink[500],
  pink600:   Pink[600],
  pink700:   Pink[700],
  pink800:   Pink[800],
  pink900:   Pink[900],
  pink950:   Pink[950],

  // Rose
  rose50:    Rose[50],
  rose100:   Rose[100],
  rose200:   Rose[200],
  rose300:   Rose[300],
  rose400:   Rose[400],
  rose500:   Rose[500],
  rose600:   Rose[600],
  rose700:   Rose[700],
  rose800:   Rose[800],
  rose900:   Rose[900],
  rose950:   Rose[950],

  // Neutral
  white:     '#ffffff',
  black:     '#000000',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ThemeColors type
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeColors = {
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    card: string;
    header: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    inverse: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
  intent: {
    success: string;
    successSurface: string;
    error: string;
    errorSurface: string;
    warning: string;
    warningSurface: string;
    info: string;
    infoSurface: string;
  };
  interactive: {
    primary: string;
    primaryPressed: string;
    secondary: string;
    disabled: string;
    pressed: string;
    success: string;
    successPressed: string;
    warning: string;
    warningPressed: string;
    error: string;
    errorPressed: string;
    chipBg: string;
    chipBorder: string;
    chipActiveBg: string;
    chipActiveBorder: string;
    chipActiveText: string;
    chipText: string;
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
// Semantic Tokens — Light variants
// ─────────────────────────────────────────────────────────────────────────────

/** Light — Blue (shadcn default) */
const lightBlue: ThemeColors = {
  surface: {
    primary:   Palette.white,
    secondary: Palette.zinc50,
    tertiary:  Palette.zinc100,
    elevated:  Palette.zinc200,
    card:      Palette.white,
    header:    Palette.indigo500,
  },
  text: {
    primary:   Palette.zinc900,
    secondary: Palette.zinc600,
    tertiary:  Palette.zinc500,
    muted:     Palette.zinc400,
    inverse:   Palette.white,
  },
  border: {
    primary:   Palette.zinc200,
    secondary: Palette.zinc300,
    focus:     Palette.blue500,
  },
  intent: {
    success:        Palette.emerald600,
    successSurface: Palette.emerald50,
    error:          Palette.red600,
    errorSurface:   Palette.red50,
    warning:        Palette.amber600,
    warningSurface: Palette.amber50,
    info:           Palette.blue600,
    infoSurface:    Palette.blue50,
  },
  interactive: {
    primary:          Palette.blue600,
    primaryPressed:   Palette.blue700,
    secondary:        Palette.zinc200,
    disabled:         Palette.zinc300,
    pressed:          Palette.zinc100,
    success:          Palette.emerald600,
    successPressed:   Palette.emerald700,
    warning:          Palette.amber500,
    warningPressed:   Palette.amber600,
    error:            Palette.red600,
    errorPressed:     Palette.red700,
    chipBg:           Palette.zinc100,
    chipBorder:       Palette.zinc300,
    chipActiveBg:     Palette.blue600,
    chipActiveBorder: Palette.blue700,
    chipActiveText:   Palette.white,
    chipText:         Palette.zinc600,
  },
  buttons: {
    primary:   { bg: Palette.blue600,    pressed: Palette.blue700,    text: Palette.white },
    success:   { bg: Palette.emerald600, pressed: Palette.emerald700, text: Palette.white },
    danger:    { bg: Palette.red600,     pressed: Palette.red700,     text: Palette.white },
    secondary: { bg: Palette.zinc100,    text: Palette.zinc900,       border: Palette.zinc300 },
    outline:   { border: Palette.blue600, text: Palette.blue600 },
    ghost:     { text: Palette.blue600 },
    neutral:   { bg: Palette.zinc100,    pressed: Palette.zinc200,    text: Palette.zinc600 },
    cancel:    { bg: 'transparent',      pressed: Palette.zinc100,    text: Palette.zinc500, border: Palette.zinc300 },
  },
  tint:            Palette.blue600,
  icon:            Palette.zinc500,
  tabIconDefault:  Palette.zinc400,
  tabIconSelected: Palette.blue600,
  shadow:          'rgba(0,0,0,0.10)',
};

/** Light — Orange / Stone */
const lightOrange: ThemeColors = {
  surface: {
    primary:   Palette.white,
    secondary: Palette.stone50,
    tertiary:  Palette.stone100,
    elevated:  Palette.stone200,
    card:      Palette.white,
    header:    Palette.orange700,
  },
  text: {
    primary:   Palette.stone900,
    secondary: Palette.stone600,
    tertiary:  Palette.stone500,
    muted:     Palette.stone400,
    inverse:   Palette.white,
  },
  border: {
    primary:   Palette.stone200,
    secondary: Palette.stone300,
    focus:     Palette.orange500,
  },
  intent: {
    success:        Palette.emerald600,
    successSurface: Palette.emerald50,
    error:          Palette.red600,
    errorSurface:   Palette.red50,
    warning:        Palette.amber600,
    warningSurface: Palette.amber50,
    info:           Palette.blue600,
    infoSurface:    Palette.blue50,
  },
  interactive: {
    primary:          Palette.orange600,
    primaryPressed:   Palette.orange700,
    secondary:        Palette.stone200,
    disabled:         Palette.stone300,
    pressed:          Palette.stone100,
    success:          Palette.emerald600,
    successPressed:   Palette.emerald700,
    warning:          Palette.amber500,
    warningPressed:   Palette.amber600,
    error:            Palette.red600,
    errorPressed:     Palette.red700,
    chipBg:           Palette.orange50,
    chipBorder:       Palette.orange200,
    chipActiveBg:     Palette.orange600,
    chipActiveBorder: Palette.orange700,
    chipActiveText:   Palette.white,
    chipText:         Palette.orange700,
  },
  buttons: {
    primary:   { bg: Palette.orange600,  pressed: Palette.orange700,  text: Palette.white },
    success:   { bg: Palette.emerald600, pressed: Palette.emerald700, text: Palette.white },
    danger:    { bg: Palette.red600,     pressed: Palette.red700,     text: Palette.white },
    secondary: { bg: Palette.stone100,   text: Palette.stone900,      border: Palette.stone300 },
    outline:   { border: Palette.orange600, text: Palette.orange600 },
    ghost:     { text: Palette.orange600 },
    neutral:   { bg: Palette.stone100,   pressed: Palette.stone200,   text: Palette.stone600 },
    cancel:    { bg: 'transparent',      pressed: Palette.stone100,   text: Palette.stone500, border: Palette.stone300 },
  },
  tint:            Palette.orange600,
  icon:            Palette.stone500,
  tabIconDefault:  Palette.stone400,
  tabIconSelected: Palette.orange600,
  shadow:          'rgba(120,60,0,0.10)',
};

/** Light — Green */
const lightGreen: ThemeColors = {
  surface: {
    primary:   Palette.white,
    secondary: Palette.zinc50,
    tertiary:  Palette.zinc100,
    elevated:  Palette.zinc200,
    card:      Palette.white,
    header:    Palette.green700,
  },
  text: {
    primary:   Palette.zinc900,
    secondary: Palette.zinc600,
    tertiary:  Palette.zinc500,
    muted:     Palette.zinc400,
    inverse:   Palette.white,
  },
  border: {
    primary:   Palette.zinc200,
    secondary: Palette.zinc300,
    focus:     Palette.green600,
  },
  intent: {
    success:        Palette.emerald600,
    successSurface: Palette.emerald50,
    error:          Palette.red600,
    errorSurface:   Palette.red50,
    warning:        Palette.amber600,
    warningSurface: Palette.amber50,
    info:           Palette.blue600,
    infoSurface:    Palette.blue50,
  },
  interactive: {
    primary:          Palette.green600,
    primaryPressed:   Palette.green700,
    secondary:        Palette.zinc200,
    disabled:         Palette.zinc300,
    pressed:          Palette.zinc100,
    success:          Palette.emerald600,
    successPressed:   Palette.emerald700,
    warning:          Palette.amber500,
    warningPressed:   Palette.amber600,
    error:            Palette.red600,
    errorPressed:     Palette.red700,
    chipBg:           Palette.green50,
    chipBorder:       Palette.green200,
    chipActiveBg:     Palette.green600,
    chipActiveBorder: Palette.green700,
    chipActiveText:   Palette.white,
    chipText:         Palette.green700,
  },
  buttons: {
    primary:   { bg: Palette.green600,   pressed: Palette.green700,   text: Palette.white },
    success:   { bg: Palette.emerald600, pressed: Palette.emerald700, text: Palette.white },
    danger:    { bg: Palette.red600,     pressed: Palette.red700,     text: Palette.white },
    secondary: { bg: Palette.zinc100,    text: Palette.zinc900,       border: Palette.zinc300 },
    outline:   { border: Palette.green600, text: Palette.green600 },
    ghost:     { text: Palette.green600 },
    neutral:   { bg: Palette.zinc100,    pressed: Palette.zinc200,    text: Palette.zinc600 },
    cancel:    { bg: 'transparent',      pressed: Palette.zinc100,    text: Palette.zinc500, border: Palette.zinc300 },
  },
  tint:            Palette.green600,
  icon:            Palette.zinc500,
  tabIconDefault:  Palette.zinc400,
  tabIconSelected: Palette.green600,
  shadow:          'rgba(0,0,0,0.10)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Tokens — Dark variants
// ─────────────────────────────────────────────────────────────────────────────

/** Dark — Blue (shadcn default) */
const darkBlue: ThemeColors = {
  surface: {
    primary:   Palette.zinc900,
    secondary: Palette.zinc950,
    tertiary:  Palette.zinc800,
    elevated:  Palette.zinc700,
    card:      Palette.zinc900,
    header:    Palette.blue700,   // balanced blue — visible but not too bright for dark mode
  },
  text: {
    primary:   Palette.zinc50,
    secondary: Palette.zinc300,
    tertiary:  Palette.zinc400,
    muted:     Palette.zinc500,
    inverse:   Palette.zinc900,
  },
  border: {
    primary:   Palette.zinc700,
    secondary: Palette.zinc600,
    focus:     Palette.blue400,
  },
  intent: {
    success:        Palette.emerald400,
    successSurface: Palette.emerald950,
    error:          Palette.red400,
    errorSurface:   Palette.red950,
    warning:        Palette.amber400,
    warningSurface: Palette.amber950,
    info:           Palette.blue400,
    infoSurface:    Palette.blue950,
  },
  interactive: {
    primary:          Palette.blue400,
    primaryPressed:   Palette.blue500,
    secondary:        Palette.zinc700,
    disabled:         Palette.zinc600,
    pressed:          Palette.zinc700,
    success:          Palette.emerald400,
    successPressed:   Palette.emerald500,
    warning:          Palette.amber400,
    warningPressed:   Palette.amber500,
    error:            Palette.red400,
    errorPressed:     Palette.red500,
    chipBg:           Palette.zinc800,
    chipBorder:       Palette.zinc600,
    chipActiveBg:     Palette.blue400,
    chipActiveBorder: Palette.blue500,
    chipActiveText:   Palette.white,
    chipText:         Palette.zinc300,
  },
  buttons: {
    primary:   { bg: Palette.blue500,    pressed: Palette.blue600,    text: Palette.white },
    success:   { bg: Palette.emerald500, pressed: Palette.emerald600, text: Palette.white },
    danger:    { bg: Palette.red500,     pressed: Palette.red600,     text: Palette.white },
    secondary: { bg: Palette.zinc700,    text: Palette.zinc100,       border: Palette.zinc600 },
    outline:   { border: Palette.blue400, text: Palette.blue400 },
    ghost:     { text: Palette.blue400 },
    neutral:   { bg: Palette.zinc700,    pressed: Palette.zinc600,    text: Palette.zinc300 },
    cancel:    { bg: 'transparent',      pressed: Palette.zinc700,    text: Palette.zinc400, border: Palette.zinc600 },
  },
  tint:            Palette.blue400,
  icon:            Palette.zinc400,
  tabIconDefault:  Palette.zinc500,
  tabIconSelected: Palette.blue400,
  shadow:          'rgba(0,0,0,0.50)',
};

/** Dark — Orange / Stone */
const darkOrange: ThemeColors = {
  surface: {
    primary:   Palette.stone900,
    secondary: Palette.stone950,
    tertiary:  Palette.stone800,
    elevated:  Palette.stone700,
    card:      Palette.stone900,
    header:    Palette.orange700,
  },
  text: {
    primary:   Palette.stone50,
    secondary: Palette.stone300,
    tertiary:  Palette.stone400,
    muted:     Palette.stone500,
    inverse:   Palette.white,
  },
  border: {
    primary:   Palette.stone700,
    secondary: Palette.stone600,
    focus:     Palette.orange400,
  },
  intent: {
    success:        Palette.emerald400,
    successSurface: Palette.emerald950,
    error:          Palette.red400,
    errorSurface:   Palette.red950,
    warning:        Palette.amber400,
    warningSurface: Palette.amber950,
    info:           Palette.blue400,
    infoSurface:    Palette.blue950,
  },
  interactive: {
    primary:          Palette.orange400,
    primaryPressed:   Palette.orange500,
    secondary:        Palette.stone700,
    disabled:         Palette.stone600,
    pressed:          Palette.stone700,
    success:          Palette.emerald400,
    successPressed:   Palette.emerald500,
    warning:          Palette.amber400,
    warningPressed:   Palette.amber500,
    error:            Palette.red400,
    errorPressed:     Palette.red500,
    chipBg:           Palette.stone800,
    chipBorder:       Palette.stone600,
    chipActiveBg:     Palette.orange400,
    chipActiveBorder: Palette.orange500,
    chipActiveText:   Palette.white,
    chipText:         Palette.stone300,
  },
  buttons: {
    primary:   { bg: Palette.orange500,  pressed: Palette.orange600,  text: Palette.white },
    success:   { bg: Palette.emerald500, pressed: Palette.emerald600, text: Palette.white },
    danger:    { bg: Palette.red500,     pressed: Palette.red600,     text: Palette.white },
    secondary: { bg: Palette.stone700,   text: Palette.stone100,      border: Palette.stone600 },
    outline:   { border: Palette.orange400, text: Palette.orange400 },
    ghost:     { text: Palette.orange400 },
    neutral:   { bg: Palette.stone700,   pressed: Palette.stone600,   text: Palette.stone300 },
    cancel:    { bg: 'transparent',      pressed: Palette.stone700,   text: Palette.stone400, border: Palette.stone600 },
  },
  tint:            Palette.orange400,
  icon:            Palette.stone400,
  tabIconDefault:  Palette.stone500,
  tabIconSelected: Palette.orange400,
  shadow:          'rgba(0,0,0,0.55)',
};

/** Dark — Green */
const darkGreen: ThemeColors = {
  surface: {
    primary:   Palette.zinc900,
    secondary: Palette.zinc950,
    tertiary:  Palette.zinc800,
    elevated:  Palette.zinc700,
    card:      Palette.zinc900,
    header:    Palette.green800,
  },
  text: {
    primary:   Palette.zinc50,
    secondary: Palette.zinc300,
    tertiary:  Palette.zinc400,
    muted:     Palette.zinc500,
    inverse:   Palette.white,
  },
  border: {
    primary:   Palette.zinc700,
    secondary: Palette.zinc600,
    focus:     Palette.green400,
  },
  intent: {
    success:        Palette.emerald400,
    successSurface: Palette.emerald950,
    error:          Palette.red400,
    errorSurface:   Palette.red950,
    warning:        Palette.amber400,
    warningSurface: Palette.amber950,
    info:           Palette.blue400,
    infoSurface:    Palette.blue950,
  },
  interactive: {
    primary:          Palette.green400,
    primaryPressed:   Palette.green500,
    secondary:        Palette.zinc700,
    disabled:         Palette.zinc600,
    pressed:          Palette.zinc700,
    success:          Palette.emerald400,
    successPressed:   Palette.emerald500,
    warning:          Palette.amber400,
    warningPressed:   Palette.amber500,
    error:            Palette.red400,
    errorPressed:     Palette.red500,
    chipBg:           Palette.zinc800,
    chipBorder:       Palette.zinc600,
    chipActiveBg:     Palette.green400,
    chipActiveBorder: Palette.green500,
    chipActiveText:   Palette.zinc900,
    chipText:         Palette.zinc300,
  },
  buttons: {
    primary:   { bg: Palette.green500,   pressed: Palette.green600,   text: Palette.white },
    success:   { bg: Palette.emerald500, pressed: Palette.emerald600, text: Palette.white },
    danger:    { bg: Palette.red500,     pressed: Palette.red600,     text: Palette.white },
    secondary: { bg: Palette.zinc700,    text: Palette.zinc100,       border: Palette.zinc600 },
    outline:   { border: Palette.green400, text: Palette.green400 },
    ghost:     { text: Palette.green400 },
    neutral:   { bg: Palette.zinc700,    pressed: Palette.zinc600,    text: Palette.zinc300 },
    cancel:    { bg: 'transparent',      pressed: Palette.zinc700,    text: Palette.zinc400, border: Palette.zinc600 },
  },
  tint:            Palette.green400,
  icon:            Palette.zinc400,
  tabIconDefault:  Palette.zinc500,
  tabIconSelected: Palette.green400,
  shadow:          'rgba(0,0,0,0.50)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Tokens — Black & White system palettes
// Black: high-contrast dark neutral (no hue cast)
// White: clean minimal light neutral (no hue cast)
// ─────────────────────────────────────────────────────────────────────────────

/** Light — Black (high-contrast monochrome) */
const lightBlack: ThemeColors = {
  surface: {
    primary:   Palette.white,
    secondary: Palette.neutral50,
    tertiary:  Palette.neutral100,
    elevated:  Palette.neutral200,
    card:      Palette.white,
    header:    Palette.neutral900,
  },
  text: {
    primary:   Palette.neutral900,
    secondary: Palette.neutral600,
    tertiary:  Palette.neutral500,
    muted:     Palette.neutral400,
    inverse:   Palette.white,
  },
  border: {
    primary:   Palette.neutral200,
    secondary: Palette.neutral300,
    focus:     Palette.neutral900,
  },
  intent: {
    success:        Palette.emerald600,
    successSurface: Palette.emerald50,
    error:          Palette.red600,
    errorSurface:   Palette.red50,
    warning:        Palette.amber600,
    warningSurface: Palette.amber50,
    info:           Palette.blue600,
    infoSurface:    Palette.blue50,
  },
  interactive: {
    primary:          Palette.neutral900,
    primaryPressed:   Palette.neutral700,
    secondary:        Palette.neutral200,
    disabled:         Palette.neutral300,
    pressed:          Palette.neutral100,
    success:          Palette.emerald600,
    successPressed:   Palette.emerald700,
    warning:          Palette.amber500,
    warningPressed:   Palette.amber600,
    error:            Palette.red600,
    errorPressed:     Palette.red700,
    chipBg:           Palette.neutral100,
    chipBorder:       Palette.neutral300,
    chipActiveBg:     Palette.neutral900,
    chipActiveBorder: Palette.neutral700,
    chipActiveText:   Palette.white,
    chipText:         Palette.neutral600,
  },
  buttons: {
    primary:   { bg: Palette.neutral900,  pressed: Palette.neutral700,  text: Palette.white },
    success:   { bg: Palette.emerald600,  pressed: Palette.emerald700,  text: Palette.white },
    danger:    { bg: Palette.red600,      pressed: Palette.red700,      text: Palette.white },
    secondary: { bg: Palette.neutral200,  text: Palette.neutral900,     border: Palette.neutral300 },
    outline:   { border: Palette.neutral900, text: Palette.neutral900 },
    ghost:     { text: Palette.neutral900 },
    neutral:   { bg: Palette.neutral100,  pressed: Palette.neutral200,  text: Palette.neutral600 },
    cancel:    { bg: 'transparent',       pressed: Palette.neutral100,  text: Palette.neutral500, border: Palette.neutral300 },
  },
  tint:            Palette.neutral900,
  icon:            Palette.neutral500,
  tabIconDefault:  Palette.neutral400,
  tabIconSelected: Palette.neutral900,
  shadow:          'rgba(0,0,0,0.12)',
};

/** Dark — Black (deep monochrome) */
const darkBlack: ThemeColors = {
  surface: {
    primary:   Palette.neutral900,
    secondary: Palette.neutral950,
    tertiary:  Palette.neutral800,
    elevated:  Palette.neutral700,
    card:      Palette.neutral900,
    header:    Palette.neutral800,
  },
  text: {
    primary:   Palette.neutral50,
    secondary: Palette.neutral300,
    tertiary:  Palette.neutral400,
    muted:     Palette.neutral500,
    inverse:   Palette.white,
  },
  border: {
    primary:   Palette.neutral700,
    secondary: Palette.neutral600,
    focus:     Palette.neutral200,
  },
  intent: {
    success:        Palette.emerald400,
    successSurface: Palette.emerald950,
    error:          Palette.red400,
    errorSurface:   Palette.red950,
    warning:        Palette.amber400,
    warningSurface: Palette.amber950,
    info:           Palette.blue400,
    infoSurface:    Palette.blue950,
  },
  interactive: {
    primary:          Palette.neutral200,
    primaryPressed:   Palette.neutral400,
    secondary:        Palette.neutral700,
    disabled:         Palette.neutral600,
    pressed:          Palette.neutral700,
    success:          Palette.emerald400,
    successPressed:   Palette.emerald500,
    warning:          Palette.amber400,
    warningPressed:   Palette.amber500,
    error:            Palette.red400,
    errorPressed:     Palette.red500,
    chipBg:           Palette.neutral800,
    chipBorder:       Palette.neutral600,
    chipActiveBg:     Palette.neutral200,
    chipActiveBorder: Palette.neutral400,
    chipActiveText:   Palette.neutral950,
    chipText:         Palette.neutral300,
  },
  buttons: {
    primary:   { bg: Palette.white,       pressed: Palette.neutral200,  text: Palette.neutral950 },
    success:   { bg: Palette.emerald500,  pressed: Palette.emerald600,  text: Palette.white },
    danger:    { bg: Palette.red500,      pressed: Palette.red600,      text: Palette.white },
    secondary: { bg: Palette.neutral700,  text: Palette.neutral100,     border: Palette.neutral600 },
    outline:   { border: Palette.neutral200, text: Palette.neutral200 },
    ghost:     { text: Palette.neutral200 },
    neutral:   { bg: Palette.neutral700,  pressed: Palette.neutral600,  text: Palette.neutral300 },
    cancel:    { bg: 'transparent',       pressed: Palette.neutral700,  text: Palette.neutral400, border: Palette.neutral600 },
  },
  tint:            Palette.neutral200,
  icon:            Palette.neutral400,
  tabIconDefault:  Palette.neutral500,
  tabIconSelected: Palette.neutral200,
  shadow:          'rgba(0,0,0,0.60)',
};

// ─────────────────────────────────────────────────────────────────────────────
// PaletteOption + ColorsByPalette + Colors
// ─────────────────────────────────────────────────────────────────────────────

export type PaletteOption = 'blue' | 'orange' | 'green' | 'black';

export const ColorsByPalette: Record<'light' | 'dark', Record<PaletteOption, ThemeColors>> = {
  light: { blue: lightBlue, orange: lightOrange, green: lightGreen, black: lightBlack },
  dark:  { blue: darkBlue,  orange: darkOrange,  green: darkGreen,  black: darkBlack  },
};

// Colors.light / Colors.dark remain the blue-palette sets for backward compat.
export const Colors = { light: lightBlue, dark: darkBlue } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Domain Maps
// ─────────────────────────────────────────────────────────────────────────────

export const StatusColors: Record<string, string> = {
  OPEN:              Palette.amber500,
  IN_PROGRESS:       Palette.violet600,
  PROGRAMMING:       Palette.indigo500,
  UNDER_DEVELOPMENT: Palette.violet500,
  CODE_REVIEW:       Palette.cyan500,
  TESTING:           Palette.sky500,
  RESOLVED:          Palette.emerald500,
  CLOSED:            Palette.zinc500,
};

export const StatusSurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    OPEN:              Palette.amber50,
    IN_PROGRESS:       Palette.violet50,
    PROGRAMMING:       Palette.indigo50,
    UNDER_DEVELOPMENT: Palette.violet50,
    CODE_REVIEW:       Palette.cyan50,
    TESTING:           Palette.sky50,
    RESOLVED:          Palette.emerald50,
    CLOSED:            Palette.zinc100,
  },
  dark: {
    OPEN:              Palette.amber950,
    IN_PROGRESS:       Palette.violet950,
    PROGRAMMING:       Palette.indigo950,
    UNDER_DEVELOPMENT: Palette.violet950,
    CODE_REVIEW:       Palette.cyan950,
    TESTING:           Palette.sky950,
    RESOLVED:          Palette.emerald950,
    CLOSED:            Palette.zinc800,
  },
};

export const PriorityColors: Record<string, string> = {
  LOW:    Palette.emerald500,
  MEDIUM: Palette.amber500,
  HIGH:   Palette.red500,
  URGENT: Palette.rose600,
};

export const PrioritySurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    LOW:    Palette.emerald50,
    MEDIUM: Palette.amber50,
    HIGH:   Palette.red50,
    URGENT: Palette.rose50,
  },
  dark: {
    LOW:    Palette.emerald950,
    MEDIUM: Palette.amber950,
    HIGH:   Palette.red950,
    URGENT: Palette.rose950,
  },
};

export const RoleColors: Record<string, string> = {
  SUPER_ADMIN:  Palette.red600,
  TENANT_ADMIN: Palette.amber600,
  PROGRAMMER:   Palette.violet600,
  EMPLOYEE:     Palette.blue600,
};

export const RoleSurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    SUPER_ADMIN:  Palette.red50,
    TENANT_ADMIN: Palette.amber50,
    PROGRAMMER:   Palette.violet50,
    EMPLOYEE:     Palette.blue50,
  },
  dark: {
    SUPER_ADMIN:  Palette.red950,
    TENANT_ADMIN: Palette.amber950,
    PROGRAMMER:   Palette.violet950,
    EMPLOYEE:     Palette.blue950,
  },
};

export const SubscriptionColors: Record<string, string> = {
  ACTIVE:        Palette.emerald600,
  TRIAL:         Palette.violet600,
  EXPIRED:       Palette.red600,
  INACTIVE:      Palette.zinc500,
  PAY_AS_YOU_GO: Palette.cyan500,
};

export const SubscriptionSurfaces: { light: Record<string, string>; dark: Record<string, string> } = {
  light: {
    ACTIVE:        Palette.emerald50,
    TRIAL:         Palette.violet50,
    EXPIRED:       Palette.red50,
    INACTIVE:      Palette.zinc100,
    PAY_AS_YOU_GO: Palette.cyan50,
  },
  dark: {
    ACTIVE:        Palette.emerald950,
    TRIAL:         Palette.violet950,
    EXPIRED:       Palette.red950,
    INACTIVE:      Palette.zinc800,
    PAY_AS_YOU_GO: Palette.cyan950,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Spacing / Radius / Typography
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
  normal:    '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const LineHeight = {
  xs:    14,
  sm:    16,
  base:  20,
  md:    20,
  lg:    22,
  xl:    24,
  '2xl': 28,
  '3xl': 30,
  '4xl': 36,
} as const;

export const BorderWidth = {
  hairline: 0.5,
  thin:     1,
  base:     1.5,
  thick:    2,
} as const;

export const IconSize = {
  xs:    14,
  sm:    16,
  md:    20,
  lg:    24,
  xl:    28,
  '2xl': 32,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});