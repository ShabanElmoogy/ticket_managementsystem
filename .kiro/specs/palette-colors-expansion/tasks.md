# Implementation Plan: Palette Colors Expansion

## Overview

Extend the mobile app's theme system from a single fixed blue accent to three user-selectable palette options (Blue, Orange, Green). The change is purely additive at the token layer — all existing components that consume `useThemeColors()` automatically pick up the new palette without per-component changes. Only the `Interactive_Primary_Family` tokens vary by palette; all neutral, surface, text, and intent tokens remain fixed.

## Tasks

- [x] 1. Extend `Palette` object in `tokens.ts` with orange and green ramps
  - Add `orange400`, `orange500`, `orange600`, `orange700` hex values to the `Palette` const in `mobile/src/constants/tokens.ts`
  - Add `green400: '#34d399'` to the `Palette` const (green500–700 already exist)
  - Verify the `Palette` object remains a plain `const` with no imports (zero-dependency guarantee)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.1 Write unit tests for new Palette entries
    - Verify `Palette.orange400`, `orange500`, `orange600`, `orange700` are defined and are valid hex strings matching `/#[0-9a-f]{6}/i`
    - Verify `Palette.green400` is defined and is a valid hex string
    - Verify all existing Palette keys remain intact (backward compat)
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. Define the six palette-aware token sets and `ColorsByPalette` lookup map in `tokens.ts`
  - Export `PaletteOption` type: `'blue' | 'orange' | 'green'`
  - Create `lightOrange` token set — copy `light` (lightBlue) and override only the `Interactive_Primary_Family` tokens using the orange ramp per the design's token table
  - Create `lightGreen` token set — copy `light` and override only the `Interactive_Primary_Family` tokens using the green ramp (`green600`/`green700` for light mode)
  - Create `darkOrange` token set — copy `dark` and override only the `Interactive_Primary_Family` tokens using the orange ramp per the design's dark-mode token table
  - Create `darkGreen` token set — copy `dark` and override only the `Interactive_Primary_Family` tokens using the green ramp (`green500`/`green600` for dark mode)
  - Rename existing `light` → `lightBlue` and `dark` → `darkBlue` (internal names only)
  - Export `ColorsByPalette: Record<'light' | 'dark', Record<PaletteOption, ThemeColors>>`
  - Keep `Colors = { light: lightBlue, dark: darkBlue }` export unchanged for backward compatibility
  - `ThemeColors` type interface must remain structurally identical — no keys removed or renamed
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.1, 6.2, 6.3, 7.1, 7.3, 7.4, 7.5_

  - [x] 2.1 Write property test: six complete token sets exist (Property 1)
    - **Property 1: For any (mode, palette), `ColorsByPalette[mode][palette]` is a complete `ThemeColors` object**
    - Use `fast-check` with `fc.constantFrom` for mode and palette, `numRuns: 100`
    - Assert all top-level keys (`surface`, `text`, `border`, `intent`, `interactive`, `buttons`, `tint`, `icon`, `tabIconDefault`, `tabIconSelected`, `shadow`) are defined
    - Tag: `// Feature: palette-colors-expansion, Property 1`
    - **Validates: Requirements 3.1**

  - [ ]* 2.2 Write property test: Interactive_Primary_Family uses correct palette ramp (Property 2)
    - **Property 2: For any (mode, palette), every Interactive_Primary_Family token is drawn from the correct palette ramp**
    - Define `ORANGE_RAMP`, `GREEN_RAMP`, `BLUE_RAMP` sets from `Palette.*` values
    - Assert `interactive.primary`, `interactive.primaryPressed`, `interactive.chipActiveBg`, `buttons.primary.bg` are all in the correct ramp set
    - Tag: `// Feature: palette-colors-expansion, Property 2`
    - **Validates: Requirements 3.2, 6.1, 6.2**

  - [ ]* 2.3 Write property test: intent and neutral tokens are palette-invariant (Property 3)
    - **Property 3: For any (mode, palette), intent/surface/text/border tokens equal the blue-palette values**
    - Compare `intent`, `surface`, `text`, `border.primary`, `border.secondary` against `ColorsByPalette[mode]['blue']`
    - Tag: `// Feature: palette-colors-expansion, Property 3`
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 2.4 Write property test: blue palette is backward-compatible (Property 4)
    - **Property 4: `ColorsByPalette[mode]['blue']` deep-equals `Colors[mode]`**
    - Assert `ColorsByPalette['light']['blue']` deep-equals `Colors.light` and `ColorsByPalette['dark']['blue']` deep-equals `Colors.dark`
    - Tag: `// Feature: palette-colors-expansion, Property 4`
    - **Validates: Requirements 7.2, 7.4**

- [x] 3. Checkpoint — Verify token layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add `paletteOption` state and `setPaletteOption` action to `uiStore`
  - Import `PaletteOption` type from `tokens.ts` (or re-export from `uiStore.ts` for convenience)
  - Add `paletteOption: PaletteOption` field to `UiState` interface with default value `'blue'`
  - Add `setPaletteOption: (option: PaletteOption) => void` action to `UiState` interface
  - Implement `setPaletteOption` in the store creator: `(paletteOption) => set({ paletteOption })`
  - Add `paletteOption` to the `partialize` function so it is persisted to AsyncStorage via the existing Zustand `persist` middleware
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.1 Write property test: `setPaletteOption` round-trip (Property 5)
    - **Property 5: Calling `setPaletteOption(p)` results in `uiStore.getState().paletteOption === p`**
    - Use `fc.constantFrom('blue', 'orange', 'green')`, `numRuns: 100`
    - Tag: `// Feature: palette-colors-expansion, Property 5`
    - **Validates: Requirements 2.2**

  - [ ]* 4.2 Write unit tests for `uiStore` paletteOption
    - Verify `uiStore` initializes with `paletteOption === 'blue'`
    - Verify `paletteOption` is included in the `partialize` output (persisted keys)
    - _Requirements: 2.1, 2.5_

- [x] 5. Update `useThemeColors()` hook in `theme.ts` to subscribe to `paletteOption`
  - Import `ColorsByPalette` and `PaletteOption` from `tokens.ts`
  - Subscribe to `paletteOption` from `uiStore` alongside the existing `colorMode` subscription
  - Add a safe-option guard: if `paletteOption` is not one of `'blue' | 'orange' | 'green'`, fall back to `'blue'`
  - Return `ColorsByPalette[isDark ? 'dark' : 'light'][safeOption]` instead of `isDark ? Colors.dark : Colors.light`
  - `useIsDark()` must remain unchanged — it must NOT read `paletteOption`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.1 Write property test: `useThemeColors` selects the correct token set (Property 6)
    - **Property 6: `useThemeColors()` returns `ColorsByPalette[resolvedMode][paletteOption]`**
    - Use `renderHook` with mocked `uiStore` state for each combination of `colorMode` and `paletteOption`
    - Assert `result.current` deep-equals `ColorsByPalette[expectedMode][palette]`
    - Tag: `// Feature: palette-colors-expansion, Property 6`
    - **Validates: Requirements 4.1, 4.3**

  - [ ]* 5.2 Write property test: `useIsDark` is palette-independent (Property 7)
    - **Property 7: Changing `paletteOption` does NOT change the value returned by `useIsDark()`**
    - For any `colorMode` and two different palette values, assert `useIsDark()` returns the same boolean
    - Tag: `// Feature: palette-colors-expansion, Property 7`
    - **Validates: Requirements 4.5**

- [x] 6. Checkpoint — Verify store and hook layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create `PaletteSelector` shared component
  - Create `mobile/src/shared/components/display/PaletteSelector.tsx`
  - Define `PaletteSwatch` interface: `{ option: PaletteOption; label: string; color: string; darkColor: string }`
  - Define `PaletteSelectorProps`: `{ resolvedColors: ThemeColors; isRtlOverride?: boolean }`
  - Read `paletteOption` and `setPaletteOption` directly from `useUiStore` (Zustand is global — safe inside Modals)
  - Render three tappable swatches in a horizontal row using `marginStart`/`marginEnd` for RTL safety
  - Active swatch: show a checkmark overlay (`✓`) and a colored border ring
  - Each swatch must have `testID={`swatch-${option}`}` for property test targeting
  - Follow the Modal-safety rule: accept `resolvedColors` as a prop, do NOT call `useThemeColors()` internally
  - Use `Spacing`, `Radius`, `BorderWidth` tokens for all layout values — no magic numbers
  - Export from `mobile/src/shared/components/display/index.ts`
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [ ]* 7.1 Write unit tests for `PaletteSelector`
    - Verify the component renders exactly three swatches
    - Verify the active swatch shows the active indicator (checkmark or border) for the currently selected palette
    - _Requirements: 5.1, 5.3_

  - [ ]* 7.2 Write property test: tapping a swatch calls `setPaletteOption` (Property 8)
    - **Property 8: Tapping the swatch for palette `p` calls `setPaletteOption` with exactly `p`**
    - Mock `useUiStore` to capture `setPaletteOption` calls
    - Use `fireEvent.press(getByTestId(`swatch-${palette}`))` for each palette option
    - Tag: `// Feature: palette-colors-expansion, Property 8`
    - **Validates: Requirements 5.2**

- [x] 8. Integrate `PaletteSelector` into the Profile screen
  - Open `mobile/app/(app)/profile.tsx`
  - Call `useThemeColors()` to get `c` (already done or add it)
  - Import `PaletteSelector` from `@/src/shared/components/display`
  - Render `<PaletteSelector resolvedColors={c} />` in the profile screen body
  - The selector must be accessible from the Profile screen without requiring navigation
  - _Requirements: 5.4_

  - [ ]* 8.1 Write integration test: `PaletteSelector` is rendered in the Profile screen
    - Render the Profile screen and assert that the palette selector is present in the output
    - _Requirements: 5.4_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses TypeScript throughout — all code must be TypeScript
- `fast-check` is the recommended property-based testing library (`npm install --save-dev fast-check` in the `mobile/` directory if not already installed)
- Each property test must run a minimum of 100 iterations (`numRuns: 100`)
- Tag format for each property test: `// Feature: palette-colors-expansion, Property N: <property_text>`
- The `Palette` object and `ColorsByPalette` map must remain in `tokens.ts` (zero imports) — never move them to `theme.ts`
- `Colors.light` and `Colors.dark` must continue to export the blue-palette token sets for backward compatibility
- No existing component requires changes — all components consuming `useThemeColors()` automatically reflect the active palette
- The `ChipSelector` component requires no changes — it reads `c.interactive.chipActiveBg` and `c.interactive.chipActiveBorder` which are already part of the `Interactive_Primary_Family`
