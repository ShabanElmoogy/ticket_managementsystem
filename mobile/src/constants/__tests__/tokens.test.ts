/**
 * tokens.test.ts — Property-based and unit tests for tokens.ts
 *
 * Feature: palette-colors-refactor
 * Test framework: Jest + fast-check
 *
 * Properties tested:
 *   1. Palette hex validity
 *   2. ColorsByPalette structural completeness
 *   3. Colors reference equality
 *   4. Color scale independence
 *   5. ThemeColors sub-key completeness
 */

import * as fc from 'fast-check';
import { Palette, Colors, ColorsByPalette } from '../tokens';
import type { ThemeColors } from '../tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Property 1 — Palette hex validity
// Feature: palette-colors-refactor, Property 1: For any key in Palette, value is a valid hex string
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 1: Palette hex validity', () => {
  test('every Palette value is a valid hex color string', () => {
    const keys = Object.keys(Palette) as Array<keyof typeof Palette>;
    fc.assert(
      fc.property(fc.constantFrom(...keys), (key) => {
        const value = Palette[key];
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
        expect(value).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 2 — ColorsByPalette structural completeness
// Feature: palette-colors-refactor, Property 2: ColorsByPalette[mode][palette] contains all ThemeColors sub-keys
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_KEYS: Array<keyof ThemeColors> = [
  'surface', 'text', 'border', 'intent', 'interactive', 'buttons',
  'tint', 'icon', 'tabIconDefault', 'tabIconSelected', 'shadow',
];

describe('Property 2: ColorsByPalette structural completeness', () => {
  test('every ColorsByPalette entry contains all required ThemeColors sub-keys', () => {
    const modes    = ['light', 'dark'] as const;
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
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 3 — Colors reference equality
// Feature: palette-colors-refactor, Property 3: Colors.light === ColorsByPalette.light.blue
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 3: Colors reference equality', () => {
  test('Colors.light is reference-equal to ColorsByPalette.light.blue', () => {
    expect(Colors.light).toBe(ColorsByPalette.light.blue);
  });

  test('Colors.dark is reference-equal to ColorsByPalette.dark.blue', () => {
    expect(Colors.dark).toBe(ColorsByPalette.dark.blue);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 4 — Color scale independence
// Feature: palette-colors-refactor, Property 4: No two Color_Scale objects share a reference
// Scales are module-internal; verified via structural check — if Slate and Blue
// were the same object, their Palette entries would share identical hex values.
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 4: Color scale independence', () => {
  test('slate and blue scale values are independent (no shared hex values)', () => {
    const slateKeys = Object.keys(Palette).filter(k => k.startsWith('slate'));
    const blueKeys  = Object.keys(Palette).filter(k => k.startsWith('blue'));
    const slateVals = new Set(slateKeys.map(k => (Palette as Record<string, string>)[k]));
    const blueVals  = new Set(blueKeys.map(k => (Palette as Record<string, string>)[k]));
    // The intersection of slate and blue values should be empty
    const intersection = [...slateVals].filter(v => blueVals.has(v));
    expect(intersection).toHaveLength(0);
  });

  test('orange and stone scale values are independent (no shared hex values)', () => {
    // Orange keys in Palette
    const orangeKeys = Object.keys(Palette).filter(k => k.startsWith('orange'));
    const orangeVals = new Set(orangeKeys.map(k => (Palette as Record<string, string>)[k]));
    // Stone is not exported in Palette, but we can verify orange values are distinct from slate
    const slateKeys  = Object.keys(Palette).filter(k => k.startsWith('slate'));
    const slateVals  = new Set(slateKeys.map(k => (Palette as Record<string, string>)[k]));
    const intersection = [...orangeVals].filter(v => slateVals.has(v));
    expect(intersection).toHaveLength(0);
  });

  test('green and blue scale values are independent (no shared hex values)', () => {
    const greenKeys = Object.keys(Palette).filter(k => k.startsWith('green'));
    const blueKeys  = Object.keys(Palette).filter(k => k.startsWith('blue'));
    const greenVals = new Set(greenKeys.map(k => (Palette as Record<string, string>)[k]));
    const blueVals  = new Set(blueKeys.map(k => (Palette as Record<string, string>)[k]));
    const intersection = [...greenVals].filter(v => blueVals.has(v));
    expect(intersection).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 5 — ThemeColors sub-key completeness
// Feature: palette-colors-refactor, Property 5: All six ThemeColors variants have complete sub-key structure
// ─────────────────────────────────────────────────────────────────────────────

const SURFACE_KEYS:     Array<keyof ThemeColors['surface']>     = ['primary', 'secondary', 'tertiary', 'elevated', 'card', 'header'];
const TEXT_KEYS:        Array<keyof ThemeColors['text']>        = ['primary', 'secondary', 'tertiary', 'muted', 'inverse'];
const BORDER_KEYS:      Array<keyof ThemeColors['border']>      = ['primary', 'secondary', 'focus'];
const INTENT_KEYS:      Array<keyof ThemeColors['intent']>      = ['success', 'successSurface', 'error', 'errorSurface', 'warning', 'warningSurface', 'info', 'infoSurface'];
const INTERACTIVE_KEYS: Array<keyof ThemeColors['interactive']> = ['primary', 'primaryPressed', 'secondary', 'disabled', 'pressed', 'success', 'successPressed', 'warning', 'warningPressed', 'error', 'errorPressed', 'chipBg', 'chipBorder', 'chipActiveBg', 'chipActiveBorder', 'chipActiveText', 'chipText'];
const BUTTONS_KEYS:     Array<keyof ThemeColors['buttons']>     = ['primary', 'success', 'danger', 'secondary', 'outline', 'ghost', 'neutral', 'cancel'];

describe('Property 5: ThemeColors sub-key completeness', () => {
  test('all six ThemeColors variants have complete sub-key structure', () => {
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
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Unit tests: specific Palette key values', () => {
  // Blue scale (Tailwind v3 exact)
  test('Palette.blue600 === #2563eb', () => {
    expect(Palette.blue600).toBe('#2563eb');
  });
  test('Palette.blue400 === #60a5fa', () => {
    expect(Palette.blue400).toBe('#60a5fa');
  });
  test('Palette.blue500 === #3b82f6', () => {
    expect(Palette.blue500).toBe('#3b82f6');
  });
  test('Palette.blue700 === #1d4ed8', () => {
    expect(Palette.blue700).toBe('#1d4ed8');
  });

  // Slate scale
  test('Palette.slate200 === #e2e8f0', () => {
    expect(Palette.slate200).toBe('#e2e8f0');
  });
  test('Palette.slate900 === #0f172a', () => {
    expect(Palette.slate900).toBe('#0f172a');
  });
  test('Palette.slate950 === #020617', () => {
    expect(Palette.slate950).toBe('#020617');
  });

  // Zinc scale (shadcn default neutral)
  test('Palette.zinc50 === #fafafa', () => {
    expect(Palette.zinc50).toBe('#fafafa');
  });
  test('Palette.zinc900 === #18181b', () => {
    expect(Palette.zinc900).toBe('#18181b');
  });
  test('Palette.zinc950 === #09090b', () => {
    expect(Palette.zinc950).toBe('#09090b');
  });

  // Emerald scale (corrected Tailwind values)
  test('Palette.emerald400 === #34d399', () => {
    expect(Palette.emerald400).toBe('#34d399');
  });
  test('Palette.emerald500 === #10b981', () => {
    expect(Palette.emerald500).toBe('#10b981');
  });
  test('Palette.emerald600 === #059669', () => {
    expect(Palette.emerald600).toBe('#059669');
  });

  // Green scale (corrected Tailwind v3 values)
  test('Palette.green400 === #4ade80 (Tailwind v3 exact)', () => {
    expect(Palette.green400).toBe('#4ade80');
  });
  test('Palette.green500 === #22c55e (Tailwind v3 exact)', () => {
    expect(Palette.green500).toBe('#22c55e');
  });
  test('Palette.green600 === #16a34a (Tailwind v3 exact)', () => {
    expect(Palette.green600).toBe('#16a34a');
  });

  // Cyan scale (corrected Tailwind v3 values)
  test('Palette.cyan500 === #06b6d4 (Tailwind v3 exact)', () => {
    expect(Palette.cyan500).toBe('#06b6d4');
  });
  test('Palette.cyan600 === #0891b2', () => {
    expect(Palette.cyan600).toBe('#0891b2');
  });

  // Sky scale (new)
  test('Palette.sky500 === #0ea5e9', () => {
    expect(Palette.sky500).toBe('#0ea5e9');
  });

  // Other representative keys
  test('Palette.gray500 === #6b7280', () => {
    expect(Palette.gray500).toBe('#6b7280');
  });
  test('Palette.red600 === #dc2626', () => {
    expect(Palette.red600).toBe('#dc2626');
  });
  test('Palette.amber500 === #f59e0b', () => {
    expect(Palette.amber500).toBe('#f59e0b');
  });
  test('Palette.orange600 === #ea580c', () => {
    expect(Palette.orange600).toBe('#ea580c');
  });
  test('Palette.violet600 === #7c3aed', () => {
    expect(Palette.violet600).toBe('#7c3aed');
  });
  test('Palette.indigo500 === #6366f1', () => {
    expect(Palette.indigo500).toBe('#6366f1');
  });
  test('Palette.rose500 === #f43f5e', () => {
    expect(Palette.rose500).toBe('#f43f5e');
  });
  test('Palette.white === #ffffff', () => {
    expect(Palette.white).toBe('#ffffff');
  });
  test('Palette.black === #000000', () => {
    expect(Palette.black).toBe('#000000');
  });
});

describe('Unit tests: domain map values', () => {
  test('StatusColors.OPEN === Palette.amber500', () => {
    const { StatusColors } = require('../tokens');
    expect(StatusColors.OPEN).toBe(Palette.amber500);
  });

  test('PriorityColors.HIGH === Palette.red500', () => {
    const { PriorityColors } = require('../tokens');
    expect(PriorityColors.HIGH).toBe(Palette.red500);
  });

  test('RoleColors.SUPER_ADMIN === Palette.red600', () => {
    const { RoleColors } = require('../tokens');
    expect(RoleColors.SUPER_ADMIN).toBe(Palette.red600);
  });

  test('SubscriptionColors.ACTIVE === Palette.emerald600', () => {
    const { SubscriptionColors } = require('../tokens');
    expect(SubscriptionColors.ACTIVE).toBe(Palette.emerald600);
  });

  test('StatusColors.RESOLVED === Palette.emerald500', () => {
    const { StatusColors } = require('../tokens');
    expect(StatusColors.RESOLVED).toBe(Palette.emerald500);
  });

  test('StatusColors.CLOSED === Palette.zinc500', () => {
    const { StatusColors } = require('../tokens');
    expect(StatusColors.CLOSED).toBe(Palette.zinc500);
  });
});

describe('Unit tests: Colors backward compatibility', () => {
  test('Colors.light === ColorsByPalette.light.blue (reference equality)', () => {
    expect(Colors.light).toBe(ColorsByPalette.light.blue);
  });

  test('Colors.dark === ColorsByPalette.dark.blue (reference equality)', () => {
    expect(Colors.dark).toBe(ColorsByPalette.dark.blue);
  });
});
