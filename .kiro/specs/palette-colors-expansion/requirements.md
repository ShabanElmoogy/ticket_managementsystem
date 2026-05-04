# Requirements Document

## Introduction

The mobile app currently uses a fixed blue-based color palette for all interactive and primary UI elements (buttons, chips, focus rings, tab icons, etc.). This feature expands the theme system to support three palette options — **Blue** (existing), **Orange**, and **Green** — so users can personalize the app's accent color. The selected palette is persisted per-device and applied consistently across light and dark modes without requiring an app restart.

The palette selection affects only the *interactive/primary* color family (buttons, active chips, focus borders, tab selection, tint). Semantic intent colors (success = green, error = red, warning = amber, info = blue) remain fixed regardless of the chosen palette, because they carry meaning that must not change.

## Glossary

- **Palette**: A named set of raw color hex values (e.g., `Palette.blue500`). Currently defined in `mobile/src/constants/tokens.ts`.
- **Palette_Option**: One of the three user-selectable accent color sets: `blue`, `orange`, or `green`.
- **Semantic_Token**: A named color role (e.g., `c.interactive.primary`) that maps to a raw palette value depending on the active `Palette_Option` and light/dark mode.
- **ThemeColors**: The TypeScript type and runtime object returned by `useThemeColors()`, containing all semantic tokens for the current mode.
- **Colors**: The `Colors.light` / `Colors.dark` objects in `tokens.ts` that define semantic token values.
- **uiStore**: The Zustand store (`mobile/src/stores/uiStore.ts`) that holds persisted UI preferences including `colorMode`.
- **useThemeColors**: The reactive hook in `theme.ts` that returns the correct `ThemeColors` object for the current mode and palette.
- **Interactive_Primary_Family**: The group of semantic tokens driven by the active palette: `interactive.primary`, `interactive.primaryPressed`, `interactive.chipActiveBg`, `interactive.chipActiveBorder`, `buttons.primary.*`, `buttons.outline.*`, `buttons.ghost.*`, `border.focus`, `tint`, `tabIconSelected`.
- **Intent_Colors**: Fixed semantic tokens for success, error, warning, and info — these are NOT affected by palette selection.

---

## Requirements

### Requirement 1: Orange and Green Raw Palette Values

**User Story:** As a developer, I want orange and green color ramps defined in the `Palette` object, so that they can be referenced as named constants throughout the codebase without hardcoded hex strings.

#### Acceptance Criteria

1. THE `Palette` object SHALL include an orange color ramp with at minimum the shades: `orange400`, `orange500`, `orange600`, `orange700`.
2. THE `Palette` object SHALL include a green color ramp with at minimum the shades: `green400`, `green500`, `green600`, `green700`. (Note: `green500`, `green600`, `green700` already exist; `green400` SHALL be added if absent.)
3. WHEN a `Palette` color value is referenced anywhere in the codebase, THE value SHALL be a named constant from the `Palette` object — never a hardcoded hex string.
4. THE `Palette` object SHALL remain a plain `const` object with no imports, preserving its zero-dependency guarantee.

---

### Requirement 2: Palette Option Type and Store State

**User Story:** As a user, I want my chosen accent palette to be remembered across app restarts, so that I don't have to re-select it every time I open the app.

#### Acceptance Criteria

1. THE `uiStore` SHALL include a `paletteOption` field of type `'blue' | 'orange' | 'green'` with a default value of `'blue'`.
2. THE `uiStore` SHALL include a `setPaletteOption` action that updates `paletteOption`.
3. WHEN `paletteOption` is updated, THE `uiStore` SHALL persist the new value to `AsyncStorage` via the existing Zustand `persist` middleware.
4. WHEN the app is restarted, THE `uiStore` SHALL rehydrate `paletteOption` from `AsyncStorage` so the previously selected palette is restored.
5. IF `paletteOption` is absent from `AsyncStorage` (first launch or cleared storage), THEN THE `uiStore` SHALL default `paletteOption` to `'blue'`.

---

### Requirement 3: Palette-Aware Semantic Token Sets

**User Story:** As a developer, I want `Colors.light` and `Colors.dark` to provide correct semantic token values for each palette option, so that components using `useThemeColors()` automatically reflect the active palette without any per-component changes.

#### Acceptance Criteria

1. THE `Colors` object SHALL provide a complete `ThemeColors` token set for each combination of mode (`light` | `dark`) and palette option (`blue` | `orange` | `green`) — resulting in six token sets total.
2. FOR ALL palette options, THE `Interactive_Primary_Family` tokens SHALL use color values from the corresponding palette ramp (blue ramp for `blue`, orange ramp for `orange`, green ramp for `green`).
3. FOR ALL palette options, THE `Intent_Colors` tokens (`intent.success`, `intent.error`, `intent.warning`, `intent.info` and their surface variants) SHALL remain identical to the current blue-palette values — palette selection SHALL NOT alter intent colors.
4. FOR ALL palette options, THE surface, text, and border tokens SHALL remain identical to the current blue-palette values — palette selection SHALL NOT alter neutral tokens.
5. WHEN the `orange` palette is active in light mode, THE `interactive.primary` token SHALL map to `Palette.orange500` and `interactive.primaryPressed` SHALL map to `Palette.orange600`.
6. WHEN the `orange` palette is active in dark mode, THE `interactive.primary` token SHALL map to `Palette.orange400` and `interactive.primaryPressed` SHALL map to `Palette.orange500`.
7. WHEN the `green` palette is active in light mode, THE `interactive.primary` token SHALL map to a green shade that is visually distinct from `intent.success` (which is also green) — the chosen shade SHALL have sufficient contrast against white surfaces (WCAG AA, ≥ 4.5:1 for text, ≥ 3:1 for UI components).
8. WHEN the `green` palette is active in dark mode, THE `interactive.primary` token SHALL use a lighter green shade to maintain visibility against dark surfaces.

---

### Requirement 4: Reactive `useThemeColors` Hook

**User Story:** As a developer, I want `useThemeColors()` to automatically return the correct token set when the user changes their palette, so that all components re-render with the new accent color without any code changes.

#### Acceptance Criteria

1. WHEN `paletteOption` changes in `uiStore`, THE `useThemeColors` hook SHALL return the updated `ThemeColors` object reflecting the new palette on the next render.
2. THE `useThemeColors` hook SHALL subscribe to `uiStore.paletteOption` so that palette changes trigger a re-render in all consuming components.
3. WHEN both `colorMode` and `paletteOption` are considered together, THE `useThemeColors` hook SHALL select the correct one of the six token sets (2 modes × 3 palettes).
4. THE `useThemeColors` hook SHALL remain a pure selector with no side effects — it SHALL only read state and return a token object.
5. THE `useIsDark` hook SHALL NOT be affected by palette changes — it SHALL continue to return only a boolean based on `colorMode` and the system scheme.

---

### Requirement 5: Palette Selector UI

**User Story:** As a user, I want to see and select from the available palette options in the app's settings or profile screen, so that I can personalize the accent color of the app.

#### Acceptance Criteria

1. THE app SHALL provide a palette selector UI component that displays the three palette options (`blue`, `orange`, `green`) as tappable color swatches or chips.
2. WHEN a palette option is tapped, THE selector SHALL call `setPaletteOption` on `uiStore` and the active palette SHALL change immediately without requiring an app restart or navigation.
3. THE selector SHALL visually indicate the currently active palette option (e.g., a checkmark, border highlight, or scale effect on the active swatch).
4. THE palette selector SHALL be accessible from the Profile or Settings screen.
5. WHERE the app supports RTL layout, THE palette selector SHALL render correctly in both LTR and RTL directions using logical spacing properties (`marginStart`/`marginEnd`).
6. THE palette selector component SHALL follow the Modal-safety rule: if rendered inside a `<Modal>`, it SHALL receive resolved colors via props rather than calling `useThemeColors()` internally.

---

### Requirement 6: Chip Selector Active State Follows Palette

**User Story:** As a user, I want the active chip color in form selectors (role picker, priority picker, etc.) to match my chosen palette, so that the UI feels consistent with my color preference.

#### Acceptance Criteria

1. WHEN the active palette is `orange`, THE `interactive.chipActiveBg` token SHALL map to `Palette.orange500` and `interactive.chipActiveBorder` SHALL map to `Palette.orange600`.
2. WHEN the active palette is `green`, THE `interactive.chipActiveBg` token SHALL map to the same green shade used for `interactive.primary` in the active palette set.
3. WHEN the active palette is `blue`, THE chip active tokens SHALL remain unchanged from the current values (`Palette.blue500` / `Palette.blue600`).
4. THE `ChipSelector` component SHALL NOT require any code changes — it SHALL automatically reflect the correct chip active colors by reading `c.interactive.chipActiveBg` and `c.interactive.chipActiveBorder` from `useThemeColors()`.

---

### Requirement 7: Backward Compatibility

**User Story:** As a developer, I want all existing components that use `useThemeColors()` to continue working correctly after this change, so that no component-level code changes are required to support the new palettes.

#### Acceptance Criteria

1. THE `ThemeColors` type interface SHALL remain structurally identical — no existing token keys SHALL be removed or renamed.
2. WHEN `paletteOption` is `'blue'` (the default), THE token values returned by `useThemeColors()` SHALL be identical to the values returned before this feature was implemented.
3. THE `Colors` export from `tokens.ts` SHALL remain available for any code that imports it directly, with the same shape as before.
4. IF any component currently imports `Colors.light` or `Colors.dark` directly (rather than via `useThemeColors()`), THEN THE `Colors.light` and `Colors.dark` objects SHALL continue to export the blue-palette token set as the default, preserving backward compatibility.
5. THE `Palette` object SHALL remain importable from `tokens.ts` with all existing keys intact — no existing palette key SHALL be removed.
