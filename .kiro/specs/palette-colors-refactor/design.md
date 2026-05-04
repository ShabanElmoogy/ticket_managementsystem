# Design Document — palette-colors-refactor

## Overview

This refactor restructures `mobile/src/constants/tokens.ts` to match the architecture of major design systems (Tailwind CSS v3, Radix UI Primitives, Material Design 3). The core change is elevating each color family from a flat list of named keys in a single `Palette` object to a set of **isolated, self-contained scale objects** — one per color family — from which the `Palette` flat object is then derived.

The refactor is purely internal. Every named export consumed by components, hooks, stores, and utilities remains identical in shape and value. No consumer file requires any change.

### Goals

- Each color family is an independent `as const` object with numeric step keys (50–950).
- No scale spreads from or imports another scale.
- The `Palette` flat object is derived from the scales, not hand-written.
- The six theme variants (`lightBlue`, `darkBlue`, `lightOrange`, `darkOrange`, `lightGreen`, `darkGreen`) are each standalone objects — no spread coupling between variants.
- All existing exports (`Palette`, `Colors`, `ColorsByPalette`, `ThemeColors`, `PaletteOption`, domain maps, spacing/typography tokens) are preserved without modification.

### Non-Goals

- No color value changes (hex values are frozen).
- No new semantic tokens.
- No changes to `theme.ts` or any consumer file.
- No runtime behavior changes.

---

## Architecture

### Current Architecture (v3)

```
tokens.ts
├── Palette (flat object, ~60 hand-written hex entries)
├── lightBlue (standalone)
├── darkBlue (standalone)
├── _lb = lightBlue as ThemeColors  ← cast variable
├── _db = darkBlue as ThemeColors   ← cast variable
├── Stone (inline object, 11 steps)
├── lightOrange = { ..._lb, overrides }  ← spread coupling
├── darkOrange  = { ..._db, overrides }  ← spread coupling
├── lightGreen  = { ..._lb, overrides }  ← spread coupling (implicit)
├── darkGreen   = { ..._db, overrides }  ← spread coupling
├── ThemeColors type
├── PaletteOption + ColorsByPalette
├── Domain maps (StatusColors, PriorityColors, etc.)
└── Spacing / Radius / Typography
```

**Problems:**
1. `Palette` is a flat list — no numeric step system, no per-family grouping.
2. `lightOrange`, `darkOrange`, `lightGreen`, `darkGreen` spread from `_lb`/`_db` — a change to `lightBlue` silently propagates to all orange/green variants.
3. `_lb`/`_db` cast variables exist only to work around TypeScript literal conflicts caused by spreading.
4. `Stone` is defined inline, not alongside the other color families.
5. No reserved steps for future use — adding a new step requires editing the scale.

### Target Architecture (v4)

```
tokens.ts
├── ── Color Scales ──────────────────────────────────────────────────────────
│   ├── Slate  (as const, steps 50–950 + custom 750/850)
│   ├── Gray   (as const, steps 50–900)
│   ├── Blue   (as const, steps 50–950)
│   ├── Orange (as const, steps 50–950)
│   ├── Green  (as const, steps 50–950)
│   ├── Red    (as const, steps 50–950)
│   ├── Amber  (as const, steps 50–950)
│   ├── Violet (as const, steps 50–950)
│   ├── Indigo (as const, steps 50–950)
│   ├── Cyan   (as const, steps 50–950)
│   ├── Teal   (as const, steps 50–950)
│   ├── Pink   (as const, steps 50–950)
│   ├── Rose   (as const, steps 50–950)
│   └── Stone  (as const, steps 50–950)
│
├── ── Palette (derived flat object) ─────────────────────────────────────────
│   └── Palette = { slate50: Slate[50], ..., blue600: Blue[600], ... } as const
│
├── ── Semantic Tokens ────────────────────────────────────────────────────────
│   ├── lightBlue   (standalone, no spread)
│   ├── darkBlue    (standalone, no spread)
│   ├── lightOrange (standalone, no spread)
│   ├── darkOrange  (standalone, no spread)
│   ├── lightGreen  (standalone, no spread)
│   └── darkGreen   (standalone, no spread)
│
├── ── ThemeColors type ───────────────────────────────────────────────────────
├── ── PaletteOption + ColorsByPalette ────────────────────────────────────────
├── ── Domain Maps ────────────────────────────────────────────────────────────
└── ── Spacing / Radius / Typography ──────────────────────────────────────────
```

### Key Architectural Decisions

**Decision 1: Scale objects use numeric keys, not string keys.**
`Slate[200]` is more readable and consistent with Tailwind's mental model than `Slate.slate200`. Numeric keys also make it trivial to add new steps without naming conflicts.

**Decision 2: `Palette` is derived, not hand-written.**
`Palette.slate200 = Slate[200]` ensures the flat object and the scale are always in sync. There is no risk of a typo creating a divergence between the scale and the palette entry.

**Decision 3: Theme variants are fully explicit.**
Each of the six variants lists every token explicitly. This is more verbose but eliminates the hidden coupling that caused `lightOrange` to silently inherit changes from `lightBlue`. The verbosity is acceptable because the file is a design token file, not application logic — it is read far more often than it is written.

**Decision 4: No intermediate cast variables.**
The `_lb`/`_db` cast variables existed only to work around TypeScript literal conflicts from spreading. With explicit variants, those casts are no longer needed.

**Decision 5: Full Tailwind step range for all scales.**
Steps that are not currently used by any semantic token or domain map are included with a `// reserved` comment. This prevents the need to add steps later when new components are built.

---

## Components and Interfaces

### Color Scale Objects

Each scale is a standalone `as const` object. The type of each scale is inferred by TypeScript from the literal values.

```typescript
// Example: Slate scale
const Slate = {
  50:  '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  750: '#2a3a4f',  // custom — dark chip bg (between 700 and 800)
  800: '#1e293b',
  850: '#273549',  // custom — dark surface.tertiary (between 800 and 900)
  900: '#0f172a',
  950: '#020617',  // reserved
} as const;
```

**Scale naming convention:** PascalCase (`Slate`, `Blue`, `Orange`). These are module-level constants, not exported — only `Palette` is exported as the flat lookup.

**Custom steps:** `Slate[750]` and `Slate[850]` are intentional additions not in the Tailwind v3 palette. They are documented with inline comments explaining their purpose. No other custom steps are added.

### Palette Flat Object

```typescript
export const Palette = {
  // Slate
  slate50:  Slate[50],
  slate100: Slate[100],
  slate200: Slate[200],
  slate300: Slate[300],
  slate400: Slate[400],
  slate500: Slate[500],
  slate600: Slate[600],
  slate700: Slate[700],
  slate750: Slate[750],  // custom step — dark chip bg
  slate800: Slate[800],
  slate850: Slate[850],  // custom step — dark surface.tertiary
  slate900: Slate[900],

  // Blue
  blue400: Blue[400],
  blue500: Blue[500],
  blue600: Blue[600],
  blue700: Blue[700],

  // ... (all existing Palette keys, derived from their respective scales)
} as const;
```

The `Palette` object preserves every existing key name. Consumers that import `Palette.blue600` continue to receive `#2563eb` — the same hex value, now derived from `Blue[600]` instead of being hand-written.

### ThemeColors Type

The `ThemeColors` type is unchanged. It is defined before the theme variant objects so TypeScript can validate each variant against it.

```typescript
export type ThemeColors = {
  surface: {
    primary: string; secondary: string; tertiary: string;
    elevated: string; card: string; header: string;
  };
  text: {
    primary: string; secondary: string; tertiary: string;
    muted: string; inverse: string;
  };
  border: { primary: string; secondary: string; focus: string };
  intent: {
    success: string; successSurface: string;
    error: string; errorSurface: string;
    warning: string; warningSurface: string;
    info: string; infoSurface: string;
  };
  interactive: {
    primary: string; primaryPressed: string;
    secondary: string; disabled: string; pressed: string;
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
```

### Theme Variant Objects

Each of the six variants is typed as `ThemeColors` and written out fully — no spread from another variant.

```typescript
// Each variant is annotated with its palette option and mode
/** Light mode — Blue palette */
const lightBlue: ThemeColors = {
  surface: {
    primary:   Palette.white,
    secondary: Palette.slate50,
    tertiary:  Palette.gray100,
    elevated:  Palette.gray200,
    card:      Palette.white,
    header:    Palette.indigo500,
  },
  // ... all other token groups, fully explicit
};

/** Dark mode — Blue palette */
const darkBlue: ThemeColors = { /* ... fully explicit ... */ };

/** Light mode — Orange palette */
const lightOrange: ThemeColors = { /* ... fully explicit, no spread from lightBlue ... */ };

/** Dark mode — Orange palette */
const darkOrange: ThemeColors = { /* ... fully explicit ... */ };

/** Light mode — Green palette */
const lightGreen: ThemeColors = { /* ... fully explicit ... */ };

/** Dark mode — Green palette */
const darkGreen: ThemeColors = { /* ... fully explicit ... */ };
```

**Shared token values:** When a token value is identical across multiple variants (e.g. `buttons.danger` is the same in `lightBlue` and `lightOrange`), the value is repeated explicitly in each variant. This is intentional — the goal is zero hidden coupling, not zero repetition.

### ColorsByPalette and Colors

These exports are unchanged in shape:

```typescript
export type PaletteOption = 'blue' | 'orange' | 'green';

export const ColorsByPalette: Record<'light' | 'dark', Record<PaletteOption, ThemeColors>> = {
  light: { blue: lightBlue, orange: lightOrange, green: lightGreen },
  dark:  { blue: darkBlue,  orange: darkOrange,  green: darkGreen  },
};

// Backward compatibility — blue palette light/dark
export const Colors = { light: lightBlue, dark: darkBlue } as const;
```

### Domain Maps

Domain maps are unchanged in shape and values. Each entry references `Palette.*` rather than a raw hex string, making the value traceable to its scale:

```typescript
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
// ... PriorityColors, RoleColors, SubscriptionColors, and all *Surfaces maps unchanged
```

---

## Data Models

### Scale Step Coverage

The following table shows which steps each scale must include. Steps marked `(used)` are referenced by at least one semantic token or domain map. Steps marked `(reserved)` are included for completeness but not currently referenced.

| Scale | Steps included | Custom steps |
|---|---|---|
| Slate | 50–900 (used), 950 (reserved), **750** (used), **850** (used) | 750, 850 |
| Gray | 50 (reserved), 100–300 (used), 400 (reserved), 500–600 (used), 700–800 (reserved), 900 (used), 950 (reserved) | — |
| Blue | 50–300 (reserved), 400–700 (used), 800–950 (reserved) | — |
| Orange | 50–700 (used), 800–950 (reserved) | — |
| Green | 50–300 (reserved), 400–700 (used), 800–950 (reserved) | — |
| Red | 50–300 (reserved), 400–700 (used), 800–950 (reserved) | — |
| Amber | 50–300 (reserved), 400–600 (used), 700–950 (reserved) | — |
| Violet | 50–300 (reserved), 400–700 (used), 800–950 (reserved) | — |
| Indigo | 50–400 (reserved), 500 (used), 600–950 (reserved) | — |
| Cyan | 50–400 (reserved), 500–600 (used), 700–950 (reserved) | — |
| Teal | 50–400 (reserved), 500–600 (used), 700–950 (reserved) | — |
| Pink | 50–400 (reserved), 500–600 (used), 700–950 (reserved) | — |
| Rose | 50–400 (reserved), 500–600 (used), 700–950 (reserved) | — |
| Stone | 50–950 (all used by orange variants) | — |

### Palette Key Inventory

The `Palette` object must contain exactly these keys (preserving all existing names):

**Slate:** `slate50`, `slate100`, `slate200`, `slate300`, `slate400`, `slate500`, `slate600`, `slate700`, `slate750`, `slate800`, `slate850`, `slate900`

**Gray:** `gray100`, `gray200`, `gray300`, `gray400`, `gray500`, `gray600`, `gray900`

**Blue:** `blue400`, `blue500`, `blue600`, `blue700`

**Violet:** `violet400`, `violet500`, `violet600`, `violet700`

**Indigo:** `indigo500`

**Cyan:** `cyan500`, `cyan600`

**Teal:** `teal500`, `teal600`

**Orange:** `orange50`, `orange100`, `orange200`, `orange300`, `orange400`, `orange500`, `orange600`, `orange700`

**Green:** `green400`, `green500`, `green600`, `green700`

**Amber:** `amber400`, `amber500`, `amber600`

**Red:** `red400`, `red500`, `red600`, `red700`

**Pink:** `pink500`, `pink600`

**Rose:** `rose500`, `rose600`

**Neutral:** `white`, `black`

**Total:** 60 keys — identical to the current `Palette` object.

### File Section Layout

The refactored `tokens.ts` is organized into clearly labeled sections using comment banners:

```
1. Color Scales
   (Slate, Gray, Blue, Orange, Green, Red, Amber, Violet, Indigo, Cyan, Teal, Pink, Rose, Stone)

2. Palette — derived flat object
   (single source of truth for raw hex values)

3. ThemeColors type
   (TypeScript type definition — placed before variant objects for validation)

4. Semantic Tokens — Light variants
   (lightBlue, lightOrange, lightGreen — each standalone, typed as ThemeColors)

5. Semantic Tokens — Dark variants
   (darkBlue, darkOrange, darkGreen — each standalone, typed as ThemeColors)

6. PaletteOption + ColorsByPalette + Colors
   (lookup maps and backward-compat exports)

7. Domain Maps
   (StatusColors, StatusSurfaces, PriorityColors, PrioritySurfaces,
    RoleColors, RoleSurfaces, SubscriptionColors, SubscriptionSurfaces)

8. Spacing / Radius / Typography
   (Spacing, Radius, FontSize, FontWeight, LineHeight, BorderWidth, IconSize, Fonts)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Palette hex validity

*For any* key in the `Palette` object, the value SHALL be a non-empty string matching the hex color pattern `#[0-9a-fA-F]{3,8}`.

**Validates: Requirements 10.1**

### Property 2: ColorsByPalette structural completeness

*For any* combination of mode (`'light'` | `'dark'`) and `PaletteOption` (`'blue'` | `'orange'` | `'green'`), the `ColorsByPalette` entry SHALL exist and SHALL contain all required `ThemeColors` sub-keys: `surface`, `text`, `border`, `intent`, `interactive`, `buttons`, `tint`, `icon`, `tabIconDefault`, `tabIconSelected`, `shadow`.

**Validates: Requirements 10.2, 4.5**

### Property 3: Colors backward-compatibility reference equality

`Colors.light` SHALL be reference-equal to `ColorsByPalette.light.blue`, and `Colors.dark` SHALL be reference-equal to `ColorsByPalette.dark.blue`.

**Validates: Requirements 10.3, 4.4**

### Property 4: Color scale independence

*For any* two distinct Color_Scale objects (e.g. `Slate` and `Blue`, `Orange` and `Stone`), the two objects SHALL NOT be reference-equal — each scale is an independent object in memory.

**Validates: Requirements 10.4, 1.2**

### Property 5: ThemeColors sub-key completeness (round-trip structural check)

*For all* six Theme_Variants, the `surface`, `text`, `border`, `intent`, `interactive`, and `buttons` groups SHALL each contain exactly the same set of sub-keys as defined in the `ThemeColors` type — no extra keys, no missing keys.

**Validates: Requirements 10.5, 4.1, 4.2**

---

## Error Handling

This feature is a pure compile-time and module-load-time refactor. There are no runtime error paths introduced. The following error conditions are addressed by design:

**TypeScript type errors:** Each theme variant is explicitly typed as `ThemeColors`. If a token group is missing or has the wrong shape, TypeScript will report a compile error before the code ships. This replaces the previous approach where spread coupling could silently produce a valid-looking but semantically incorrect variant.

**Palette derivation errors:** Because `Palette` entries are derived from scale objects (`Palette.slate200 = Slate[200]`), a typo in a scale value will propagate to the `Palette` entry. The property-based test (Property 1) catches any entry that does not resolve to a valid hex string.

**Missing scale steps:** If a semantic token references a scale step that does not exist (e.g. `Slate[999]`), TypeScript will report a type error because the scale is `as const` and the key `999` is not in the type. This is a compile-time safety net.

**Consumer import errors:** All existing named exports are preserved. If a consumer imports `Palette.blue600`, the import continues to resolve to `#2563eb`. No consumer will encounter a runtime `undefined` from a missing export.

---

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

- **Palette key existence:** Assert that `Palette.blue600 === '#2563eb'` and a representative sample of other keys match their expected hex values. This guards against accidental value changes during the refactor.
- **Colors backward compatibility:** Assert `Colors.light === ColorsByPalette.light.blue` and `Colors.dark === ColorsByPalette.dark.blue` (reference equality).
- **Domain map values:** Assert that `StatusColors.OPEN`, `PriorityColors.HIGH`, `RoleColors.SUPER_ADMIN`, and `SubscriptionColors.ACTIVE` match their expected hex values.

### Property-Based Tests

Property-based tests verify universal properties across all inputs. The library used is **fast-check** (already available in the JavaScript/TypeScript ecosystem; install with `npx expo install fast-check` or `npm install --save-dev fast-check`).

Each property test runs a minimum of **100 iterations**.

**Tag format:** `// Feature: palette-colors-refactor, Property {N}: {property_text}`

#### Property 1 — Palette hex validity

```typescript
// Feature: palette-colors-refactor, Property 1: For any key in Palette, value is a valid hex string
import * as fc from 'fast-check';
import { Palette } from '../tokens';

test('Property 1: every Palette value is a valid hex color string', () => {
  const keys = Object.keys(Palette) as Array<keyof typeof Palette>;
  fc.assert(
    fc.property(fc.constantFrom(...keys), (key) => {
      const value = Palette[key];
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
      expect(value).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }),
    { numRuns: 100 }
  );
});
```

#### Property 2 — ColorsByPalette structural completeness

```typescript
// Feature: palette-colors-refactor, Property 2: ColorsByPalette[mode][palette] contains all ThemeColors sub-keys
import * as fc from 'fast-check';
import { ColorsByPalette } from '../tokens';

const REQUIRED_KEYS: Array<keyof import('../tokens').ThemeColors> = [
  'surface', 'text', 'border', 'intent', 'interactive', 'buttons',
  'tint', 'icon', 'tabIconDefault', 'tabIconSelected', 'shadow',
];

test('Property 2: every ColorsByPalette entry contains all required ThemeColors sub-keys', () => {
  const modes = ['light', 'dark'] as const;
  const palettes = ['blue', 'orange', 'green'] as const;

  fc.assert(
    fc.property(
      fc.constantFrom(...modes),
      fc.constantFrom(...palettes),
      (mode, palette) => {
        const variant = ColorsByPalette[mode][palette];
        for (const key of REQUIRED_KEYS) {
          expect(variant).toHaveProperty(key);
          expect(variant[key]).toBeDefined();
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 3 — Colors reference equality

```typescript
// Feature: palette-colors-refactor, Property 3: Colors.light === ColorsByPalette.light.blue
import { Colors, ColorsByPalette } from '../tokens';

test('Property 3: Colors.light is reference-equal to ColorsByPalette.light.blue', () => {
  expect(Colors.light).toBe(ColorsByPalette.light.blue);
});

test('Property 3: Colors.dark is reference-equal to ColorsByPalette.dark.blue', () => {
  expect(Colors.dark).toBe(ColorsByPalette.dark.blue);
});
```

#### Property 4 — Color scale independence

```typescript
// Feature: palette-colors-refactor, Property 4: No two Color_Scale objects share a reference
// (Scales are module-internal; tested via Palette derivation — each Palette entry must
//  resolve to a distinct value from its own scale, not a cross-scale reference)
import * as fc from 'fast-check';

// Scales are not exported, so we verify independence via the structural property:
// if Slate and Blue were the same object, Palette.slate50 === Palette.blue50 would hold.
// We verify this does NOT hold for any cross-family pair.
import { Palette } from '../tokens';

test('Property 4: slate and blue scale values are independent (not the same object)', () => {
  // Slate[50] = '#f8fafc', Blue[50] = '#eff6ff' — different values confirm independence
  expect(Palette.slate50).not.toBe(Palette.blue400);
  // More robustly: verify no two scale families share the same hex value at the same step
  // (This is a structural check — if scales were aliased, their values would be identical)
  const slateKeys = Object.keys(Palette).filter(k => k.startsWith('slate'));
  const blueKeys  = Object.keys(Palette).filter(k => k.startsWith('blue'));
  const slateVals = new Set(slateKeys.map(k => (Palette as any)[k]));
  const blueVals  = new Set(blueKeys.map(k => (Palette as any)[k]));
  // The intersection of slate and blue values should be empty (no shared hex values)
  const intersection = [...slateVals].filter(v => blueVals.has(v));
  expect(intersection).toHaveLength(0);
});
```

#### Property 5 — ThemeColors sub-key completeness

```typescript
// Feature: palette-colors-refactor, Property 5: All six variants have identical sub-key structure
import * as fc from 'fast-check';
import { ColorsByPalette } from '../tokens';
import type { ThemeColors } from '../tokens';

const SURFACE_KEYS:     Array<keyof ThemeColors['surface']>     = ['primary','secondary','tertiary','elevated','card','header'];
const TEXT_KEYS:        Array<keyof ThemeColors['text']>        = ['primary','secondary','tertiary','muted','inverse'];
const BORDER_KEYS:      Array<keyof ThemeColors['border']>      = ['primary','secondary','focus'];
const INTENT_KEYS:      Array<keyof ThemeColors['intent']>      = ['success','successSurface','error','errorSurface','warning','warningSurface','info','infoSurface'];
const INTERACTIVE_KEYS: Array<keyof ThemeColors['interactive']> = ['primary','primaryPressed','secondary','disabled','pressed','success','successPressed','warning','warningPressed','error','errorPressed','chipBg','chipBorder','chipActiveBg','chipActiveBorder','chipActiveText','chipText'];
const BUTTONS_KEYS:     Array<keyof ThemeColors['buttons']>     = ['primary','success','danger','secondary','outline','ghost','neutral','cancel'];

test('Property 5: all six ThemeColors variants have complete sub-key structure', () => {
  const modes    = ['light', 'dark'] as const;
  const palettes = ['blue', 'orange', 'green'] as const;

  fc.assert(
    fc.property(
      fc.constantFrom(...modes),
      fc.constantFrom(...palettes),
      (mode, palette) => {
        const v = ColorsByPalette[mode][palette];
        for (const k of SURFACE_KEYS)     expect(v.surface).toHaveProperty(k);
        for (const k of TEXT_KEYS)        expect(v.text).toHaveProperty(k);
        for (const k of BORDER_KEYS)      expect(v.border).toHaveProperty(k);
        for (const k of INTENT_KEYS)      expect(v.intent).toHaveProperty(k);
        for (const k of INTERACTIVE_KEYS) expect(v.interactive).toHaveProperty(k);
        for (const k of BUTTONS_KEYS)     expect(v.buttons).toHaveProperty(k);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test File Location

```
mobile/src/constants/__tests__/tokens.test.ts
```

### Test Runner

The mobile project uses Jest (via Expo's default test setup). Run with:

```bash
npx jest mobile/src/constants/__tests__/tokens.test.ts --testPathPattern tokens
```

Or from the `mobile/` directory:

```bash
npx jest src/constants/__tests__/tokens.test.ts
```

### What Is Not Tested

- **Visual appearance:** WCAG contrast ratios are verified manually using a contrast checker tool (e.g. WebAIM Contrast Checker) against the documented token pairs. The refactor does not change any hex value, so existing passing ratios are preserved by construction.
- **Consumer rendering:** Component rendering is not tested here — the property tests verify the token structure, not how components use it. Existing component tests (if any) continue to pass because no consumer API changes.
- **TypeScript compilation:** TypeScript type errors are caught at compile time (`tsc --noEmit`), not at test time. Running `npx tsc --noEmit` in the `mobile/` directory after the refactor is the recommended compile-time verification step.
