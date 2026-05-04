# Implementation Plan: palette-colors-refactor

## Overview

Refactor `mobile/src/constants/tokens.ts` from a flat hand-written `Palette` object and spread-coupled theme variants to a set of isolated per-family color scale objects from which `Palette` is derived, and six fully explicit (no-spread) theme variant objects. No consumer file changes. All existing named exports are preserved with identical values.

Implementation target: `mobile/src/constants/tokens.ts`
Test file: `mobile/src/constants/__tests__/tokens.test.ts`
Test framework: Jest (Expo default) + fast-check for property-based tests

---

## Tasks

- [x] 1. Install fast-check and set up the test file scaffold
  - Run `npx expo install fast-check` (or `npm install --save-dev fast-check`) in the `mobile/` directory
  - Create `mobile/src/constants/__tests__/tokens.test.ts` with the file-level import block and empty `describe` shells for each of the five property tests and the unit test suite
  - Verify Jest can discover and run the empty file without errors: `npx jest src/constants/__tests__/tokens.test.ts --testPathPattern tokens` from `mobile/`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Define the fourteen color scale objects
  - [x] 2.1 Add the Color Scales section banner and define `Slate` (steps 50–950 including custom 750 and 850 with inline comments)
    - All steps must be `as const`
    - Custom steps: `750: '#2a3a4f'  // dark chip bg (between 700 and 800)` and `850: '#273549'  // dark surface.tertiary (between 800 and 900)`
    - Reserved steps (not currently used by any semantic token) marked with `// reserved`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 2.2 Define `Gray`, `Blue`, `Orange`, `Green`, `Red`, `Amber`, `Violet`, `Indigo`, `Cyan`, `Teal`, `Pink`, `Rose` scales (steps 50–950 each, reserved steps commented)
    - Each scale is a standalone `as const` object — no scale spreads from another
    - Hex values must exactly match the current `Palette` entries for all used steps
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4_
  - [x] 2.3 Define `Stone` scale (steps 50–950, all used by orange variants)
    - Hex values must exactly match the current inline `Stone` object in `tokens.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.4 Write property test for color scale independence (Property 4)
    - **Property 4: No two Color_Scale objects share a reference — each scale is an independent object**
    - **Validates: Requirements 10.4, 1.2**
    - Tag: `// Feature: palette-colors-refactor, Property 4: No two Color_Scale objects share a reference`
    - Since scales are not exported, verify independence via the structural check described in the design: slate and blue families must have zero overlapping hex values
    - _Requirements: 10.4, 1.2_

- [x] 3. Replace the hand-written `Palette` export with a derived flat object
  - [x] 3.1 Replace the existing `export const Palette = { ... }` block with a new block that derives every entry from its corresponding scale (e.g. `slate200: Slate[200]`)
    - Preserve all 60 existing key names exactly (see Palette Key Inventory in design.md)
    - Include `white: '#ffffff'` and `black: '#000000'` as literal values (no scale for these)
    - Add the section banner comment and the "derived from Color_Scales" JSDoc
    - Mark `as const`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.2 Write property test for Palette hex validity (Property 1)
    - **Property 1: For any key in `Palette`, the value is a non-empty string matching `#[0-9a-fA-F]{3,8}`**
    - **Validates: Requirements 10.1**
    - Tag: `// Feature: palette-colors-refactor, Property 1: For any key in Palette, value is a valid hex string`
    - Use `fc.constantFrom(...Object.keys(Palette))` as the arbitrary; run 100 iterations
    - _Requirements: 10.1_
  - [x] 3.3 Write unit tests for specific Palette key values
    - Assert `Palette.blue600 === '#2563eb'` and a representative sample of ~10 other keys match their expected hex values (guards against accidental value changes)
    - Assert `Palette.slate750 === '#2a3a4f'` and `Palette.slate850 === '#273549'` (custom steps)
    - _Requirements: 3.3, 1.5_

- [x] 4. Move `ThemeColors` type above the theme variant objects
  - Relocate the `export type ThemeColors = { ... }` declaration to immediately after the `Palette` export and before any theme variant object
  - Add the ThemeColors section banner
  - No changes to the type shape — preserve all existing keys and sub-keys exactly
  - _Requirements: 4.1, 4.2, 9.1_

- [x] 5. Rewrite the six theme variant objects as fully explicit standalone objects
  - [x] 5.1 Rewrite `lightBlue` as a fully explicit `const lightBlue: ThemeColors = { ... }` object
    - Remove the `as const` suffix (typed as `ThemeColors` instead)
    - All token values reference `Palette.*` entries — no raw hex strings except for the two hardcoded surface values (`'rgba(0,0,0,0.12)'` for shadow and `'transparent'` for cancel.bg)
    - Add the `/** Light mode — Blue palette */` JSDoc comment
    - _Requirements: 2.1, 2.4, 4.3, 9.4_
  - [x] 5.2 Rewrite `darkBlue` as a fully explicit `const darkBlue: ThemeColors = { ... }` object
    - Same rules as 5.1; preserve the `'#1a2744'` header value and `'rgba(0,0,0,0.50)'` shadow
    - Add the `/** Dark mode — Blue palette */` JSDoc comment
    - _Requirements: 2.1, 2.4, 4.3, 9.4_
  - [x] 5.3 Rewrite `lightOrange` as a fully explicit `const lightOrange: ThemeColors = { ... }` object
    - No spread from `_lb` or `lightBlue` — every token group written out in full
    - Surface, text, border tokens reference `Stone[N]` scale entries; interactive/buttons reference `Palette.*`
    - Preserve the `'rgba(120,60,0,0.12)'` shadow value
    - Add the `/** Light mode — Orange palette */` JSDoc comment
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 9.4_
  - [x] 5.4 Rewrite `darkOrange` as a fully explicit `const darkOrange: ThemeColors = { ... }` object
    - No spread from `_db` or `darkBlue` — every token group written out in full
    - Preserve the two hardcoded chip values (`'#2d1f0e'` and `'#7c3a10'`)
    - Add the `/** Dark mode — Orange palette */` JSDoc comment
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 9.4_
  - [x] 5.5 Write `lightGreen` as a fully explicit `const lightGreen: ThemeColors = { ... }` object
    - `lightGreen` is currently missing from `tokens.ts` (referenced in `ColorsByPalette` but never defined) — this task creates it
    - Base all non-green tokens on `lightBlue` values; override `border.focus`, `interactive.primary/primaryPressed`, chip active tokens, `buttons.primary/outline/ghost`, `tint`, `tabIconSelected` to use `Palette.green600` / `Palette.green700`
    - Add the `/** Light mode — Green palette */` JSDoc comment
    - _Requirements: 2.1, 2.4, 4.3, 9.4_
  - [x] 5.6 Rewrite `darkGreen` as a fully explicit `const darkGreen: ThemeColors = { ... }` object
    - No spread from `_db` or `darkBlue` — every token group written out in full (currently uses spread)
    - Override green-specific tokens: `border.focus`, `interactive.primary/primaryPressed`, chip active tokens, `buttons.primary/outline/ghost`, `tint`, `tabIconSelected` to use `Palette.green400` / `Palette.green500`
    - `buttons.primary.text` must be `Palette.slate900` (dark text on green400 bg — same as current)
    - Add the `/** Dark mode — Green palette */` JSDoc comment
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 9.4_

- [x] 6. Checkpoint — verify structural correctness before writing remaining tests
  - Run TypeScript type-check: `npx tsc --noEmit` from `mobile/` — must produce zero errors
  - Run the test file: `npx jest src/constants/__tests__/tokens.test.ts --testPathPattern tokens` from `mobile/` — all tests written so far must pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Remove the intermediate cast variables and update `ColorsByPalette` / `Colors`
  - Delete the `_lb`, `_db` cast variable declarations and their associated ESLint-disable comments
  - Preserve `export type PaletteOption`, `export const ColorsByPalette`, and `export const Colors` exactly — no shape or value changes
  - Add the PaletteOption + ColorsByPalette section banner
  - _Requirements: 2.3, 4.4, 4.5, 7.1_

- [x] 8. Write the remaining property-based and unit tests
  - [x] 8.1 Write property test for `ColorsByPalette` structural completeness (Property 2)
    - **Property 2: For any combination of mode and PaletteOption, `ColorsByPalette[mode][palette]` exists and contains all required `ThemeColors` sub-keys**
    - **Validates: Requirements 10.2, 4.5**
    - Tag: `// Feature: palette-colors-refactor, Property 2: ColorsByPalette[mode][palette] contains all ThemeColors sub-keys`
    - Use `fc.constantFrom(...modes)` and `fc.constantFrom(...palettes)`; check all 11 top-level keys; run 100 iterations
    - _Requirements: 10.2, 4.5_
  - [x] 8.2 Write property test for `Colors` reference equality (Property 3)
    - **Property 3: `Colors.light` is reference-equal to `ColorsByPalette.light.blue` and `Colors.dark` is reference-equal to `ColorsByPalette.dark.blue`**
    - **Validates: Requirements 10.3, 4.4**
    - Tag: `// Feature: palette-colors-refactor, Property 3: Colors.light === ColorsByPalette.light.blue`
    - Two `test()` assertions using `toBe` (reference equality)
    - _Requirements: 10.3, 4.4_
  - [x] 8.3 Write property test for `ThemeColors` sub-key completeness (Property 5)
    - **Property 5: All six theme variants have the same sub-key structure as the `ThemeColors` type for `surface`, `text`, `border`, `intent`, `interactive`, and `buttons`**
    - **Validates: Requirements 10.5, 4.1, 4.2**
    - Tag: `// Feature: palette-colors-refactor, Property 5: All six ThemeColors variants have complete sub-key structure`
    - Use the exact key arrays from the design document; run 100 iterations
    - _Requirements: 10.5, 4.1, 4.2_
  - [x] 8.4 Write unit tests for domain map values and backward compatibility
    - Assert `StatusColors.OPEN === Palette.amber500`, `PriorityColors.HIGH === Palette.red500`, `RoleColors.SUPER_ADMIN === Palette.red600`, `SubscriptionColors.ACTIVE === Palette.green600`
    - Assert `Colors.light === ColorsByPalette.light.blue` and `Colors.dark === ColorsByPalette.dark.blue` (reference equality, complements Property 3)
    - _Requirements: 4.4, 5.1, 7.3_

- [x] 9. Verify domain maps reference `Palette.*` and preserve all existing exports
  - Confirm `StatusColors`, `StatusSurfaces`, `PriorityColors`, `PrioritySurfaces`, `RoleColors`, `RoleSurfaces`, `SubscriptionColors`, `SubscriptionSurfaces` all reference `Palette.*` keys (not raw hex strings) where applicable
  - The `*Surfaces` maps use raw hex strings for their light/dark tint values — this is acceptable as they are not derived from the named palette scales
  - Confirm all exports listed in Requirement 7.1 are present: `Palette`, `Colors`, `ColorsByPalette`, `ThemeColors`, `PaletteOption`, all domain maps, `Spacing`, `Radius`, `FontSize`, `FontWeight`, `LineHeight`, `BorderWidth`, `IconSize`, `Fonts`
  - _Requirements: 5.1, 5.2, 5.3, 7.1_

- [x] 10. Add file-level JSDoc and section banners
  - Update the file-level JSDoc comment to list the v4 structural changes (per Requirement 9.2)
  - Verify all eight section banners are present in the correct order: Color Scales, Palette, ThemeColors type, Semantic Tokens — Light variants, Semantic Tokens — Dark variants, PaletteOption + ColorsByPalette + Colors, Domain Maps, Spacing / Radius / Typography
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 11. Final checkpoint — full test run and type-check
  - Run `npx tsc --noEmit` from `mobile/` — zero errors required
  - Run `npx jest src/constants/__tests__/tokens.test.ts --testPathPattern tokens` from `mobile/` — all five property tests and all unit tests must pass
  - Confirm no consumer files were modified (only `tokens.ts` and the new test file should differ from the original)
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks 2.4, 3.2, 3.3, 8.1, 8.2, 8.3, and 8.4 are property-based and unit tests — they are **required** parts of this implementation, not optional
- Each property test must include the tag comment `// Feature: palette-colors-refactor, Property N: ...` as specified in the design
- The `Stone` scale is module-internal (not exported) — it is used only by `lightOrange` and `darkOrange`
- All other color scales (`Slate`, `Blue`, etc.) are also module-internal — only `Palette` is exported as the flat lookup
- `lightGreen` is currently missing from `tokens.ts` (task 5.5 creates it); all other variants exist and need rewriting
- The `_lb` / `_db` cast variables and their ESLint-disable comments are removed in task 7 after all six variants are fully explicit
- Hex values must not change — the refactor is purely structural
