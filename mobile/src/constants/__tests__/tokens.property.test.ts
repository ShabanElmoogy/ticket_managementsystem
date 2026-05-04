// Feature: palette-colors-expansion, Property 1: For any (mode, palette), ColorsByPalette[mode][palette] is a complete ThemeColors object

import * as fc from 'fast-check';
import { ColorsByPalette } from '../tokens';
import type { ThemeColors } from '../tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Property 1 — Six complete token sets exist
//
// For any combination of mode ('light' | 'dark') and palette option
// ('blue' | 'orange' | 'green'), ColorsByPalette[mode][palette] SHALL be a
// complete ThemeColors object containing all required top-level keys.
// ─────────────────────────────────────────────────────────────────────────────

describe('ColorsByPalette — Property 1: six complete token sets exist', () => {
  // The full list of top-level keys required by ThemeColors
  const TOP_LEVEL_KEYS: Array<keyof ThemeColors> = [
    'surface',
    'text',
    'border',
    'intent',
    'interactive',
    'buttons',
    'tint',
    'icon',
    'tabIconDefault',
    'tabIconSelected',
    'shadow',
  ];

  it('every (mode, palette) combination produces a defined ThemeColors object', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const tokens = ColorsByPalette[mode][palette];
          expect(tokens).toBeDefined();
          expect(typeof tokens).toBe('object');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('every (mode, palette) combination has all required top-level keys defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const tokens = ColorsByPalette[mode][palette];

          for (const key of TOP_LEVEL_KEYS) {
            expect(tokens[key]).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('surface sub-keys are all defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const { surface } = ColorsByPalette[mode][palette];
          expect(surface.primary).toBeDefined();
          expect(surface.secondary).toBeDefined();
          expect(surface.tertiary).toBeDefined();
          expect(surface.elevated).toBeDefined();
          expect(surface.header).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('text sub-keys are all defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const { text } = ColorsByPalette[mode][palette];
          expect(text.primary).toBeDefined();
          expect(text.secondary).toBeDefined();
          expect(text.tertiary).toBeDefined();
          expect(text.muted).toBeDefined();
          expect(text.inverse).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('border sub-keys are all defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const { border } = ColorsByPalette[mode][palette];
          expect(border.primary).toBeDefined();
          expect(border.secondary).toBeDefined();
          expect(border.focus).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('intent sub-keys are all defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const { intent } = ColorsByPalette[mode][palette];
          expect(intent.success).toBeDefined();
          expect(intent.successSurface).toBeDefined();
          expect(intent.error).toBeDefined();
          expect(intent.errorSurface).toBeDefined();
          expect(intent.warning).toBeDefined();
          expect(intent.warningSurface).toBeDefined();
          expect(intent.info).toBeDefined();
          expect(intent.infoSurface).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('interactive sub-keys are all defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const { interactive } = ColorsByPalette[mode][palette];
          expect(interactive.primary).toBeDefined();
          expect(interactive.primaryPressed).toBeDefined();
          expect(interactive.secondary).toBeDefined();
          expect(interactive.disabled).toBeDefined();
          expect(interactive.pressed).toBeDefined();
          expect(interactive.success).toBeDefined();
          expect(interactive.successPressed).toBeDefined();
          expect(interactive.warning).toBeDefined();
          expect(interactive.warningPressed).toBeDefined();
          expect(interactive.error).toBeDefined();
          expect(interactive.errorPressed).toBeDefined();
          expect(interactive.chipBg).toBeDefined();
          expect(interactive.chipBorder).toBeDefined();
          expect(interactive.chipActiveBg).toBeDefined();
          expect(interactive.chipActiveBorder).toBeDefined();
          expect(interactive.chipActiveText).toBeDefined();
          expect(interactive.chipText).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('buttons sub-keys are all defined', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const { buttons } = ColorsByPalette[mode][palette];
          expect(buttons.primary).toBeDefined();
          expect(buttons.primary.bg).toBeDefined();
          expect(buttons.primary.pressed).toBeDefined();
          expect(buttons.primary.text).toBeDefined();
          expect(buttons.success).toBeDefined();
          expect(buttons.danger).toBeDefined();
          expect(buttons.secondary).toBeDefined();
          expect(buttons.outline).toBeDefined();
          expect(buttons.outline.border).toBeDefined();
          expect(buttons.outline.text).toBeDefined();
          expect(buttons.ghost).toBeDefined();
          expect(buttons.ghost.text).toBeDefined();
          expect(buttons.neutral).toBeDefined();
          expect(buttons.cancel).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('scalar top-level tokens (tint, icon, tabIconDefault, tabIconSelected, shadow) are non-empty strings', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        fc.constantFrom('blue' as const, 'orange' as const, 'green' as const),
        (mode, palette) => {
          const tokens = ColorsByPalette[mode][palette];
          expect(typeof tokens.tint).toBe('string');
          expect(tokens.tint.length).toBeGreaterThan(0);
          expect(typeof tokens.icon).toBe('string');
          expect(tokens.icon.length).toBeGreaterThan(0);
          expect(typeof tokens.tabIconDefault).toBe('string');
          expect(tokens.tabIconDefault.length).toBeGreaterThan(0);
          expect(typeof tokens.tabIconSelected).toBe('string');
          expect(tokens.tabIconSelected.length).toBeGreaterThan(0);
          expect(typeof tokens.shadow).toBe('string');
          expect(tokens.shadow.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Exhaustive check — all 6 combinations explicitly verified
  it('all six (mode × palette) combinations exist as distinct objects', () => {
    const modes = ['light', 'dark'] as const;
    const palettes = ['blue', 'orange', 'green'] as const;

    for (const mode of modes) {
      for (const palette of palettes) {
        expect(ColorsByPalette[mode][palette]).toBeDefined();
        expect(typeof ColorsByPalette[mode][palette]).toBe('object');
      }
    }

    // Verify all 6 are distinct references
    const allSets = [
      ColorsByPalette.light.blue,
      ColorsByPalette.light.orange,
      ColorsByPalette.light.green,
      ColorsByPalette.dark.blue,
      ColorsByPalette.dark.orange,
      ColorsByPalette.dark.green,
    ];
    const uniqueSets = new Set(allSets);
    expect(uniqueSets.size).toBe(6);
  });
});
