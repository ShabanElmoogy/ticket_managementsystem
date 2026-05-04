# Requirements Document

## Introduction

The mobile app currently defines its color system in `mobile/src/constants/tokens.ts` using a `Palette` object of raw hex values, then builds semantic theme tokens (`lightBlue`, `darkBlue`, `lightOrange`, `darkOrange`, `lightGreen`, `darkGreen`) by spreading and overriding those palette values. This approach has several problems: palette colors are a flat, unscaled list with no numeric step system; theme variants are built by spreading from each other (`..._lb`, `..._db`), creating hidden coupling; and there is no per-color scale (e.g. `slate.100` through `slate.900` as a self-contained object).

This feature refactors the palette layer to match the design of major UI libraries (Tailwind CSS, Radix UI Primitives, Material Design 3). Each color family gets its own isolated scale object. No scale spreads from another. Semantic tokens continue to reference palette values by name, and all existing consumer APIs (`useThemeColors()`, `Palette.*`, `ThemeColors` type, domain maps) are preserved without breaking changes.

---

## Glossary

- **Color_Scale**: A self-contained object for one color family (e.g. `Slate`, `Blue`, `Orange`) containing numeric step keys (50, 100, 200 … 950) mapped to hex strings. No scale imports or spreads from another scale.
- **Palette**: The flat lookup object exported as `Palette` from `tokens.ts`. After refactoring it is derived from the Color_Scales and remains the single source of truth for raw hex values consumed by semantic tokens and domain maps.
- **Semantic_Token**: A named, context-aware color value (e.g. `c.surface.primary`, `c.text.muted`) that maps to a Palette value and changes between light/dark modes and palette options (blue/orange/green).
- **Theme_Variant**: One combination of color mode (light or dark) and palette option (blue, orange, green), producing a complete `ThemeColors` object. There are six variants: `lightBlue`, `darkBlue`, `lightOrange`, `darkOrange`, `lightGreen`, `darkGreen`.
- **ThemeColors**: The TypeScript type describing the full shape of a theme variant object, consumed by `useThemeColors()`.
- **PaletteOption**: The union type `'blue' | 'orange' | 'green'` selecting the accent color family.
- **Domain_Map**: A record mapping domain values (ticket status, priority, role, subscription status) to color strings. Examples: `StatusColors`, `PriorityColors`, `RoleColors`, `SubscriptionColors`.
- **Consumer**: Any component, hook, or utility that imports from `tokens.ts` or `theme.ts`. Consumers must not require code changes after this refactor.
- **Spread_Coupling**: The current anti-pattern where `lightOrange` is built as `{ ..._lb, ... }` — changes to `lightBlue` silently affect `lightOrange`.
- **Stone_Scale**: The warm-neutral color family used by the orange theme variants, equivalent to Tailwind's `stone` scale.
- **WCAG_AA**: Web Content Accessibility Guidelines 2.1 Level AA — requires a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text against its background.

---

## Requirements

### Requirement 1: Per-Color Scale Objects

**User Story:** As a developer maintaining the color system, I want each color family defined as its own isolated scale object, so that I can reason about, update, or replace one color family without touching any other.

#### Acceptance Criteria

1. THE Color_System SHALL define each color family as a separate named constant (e.g. `Slate`, `Blue`, `Orange`, `Green`, `Gray`, `Red`, `Amber`, `Violet`, `Cyan`, `Teal`, `Pink`, `Rose`, `Stone`) containing all numeric step keys used by the system.
2. WHEN a Color_Scale is defined, THE Color_Scale SHALL NOT spread or import values from any other Color_Scale.
3. THE Color_System SHALL include at minimum the following step keys in each scale where those steps are currently used: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, and 950 where applicable.
4. THE Color_System SHALL mark all Color_Scale objects `as const` to prevent mutation and enable TypeScript literal inference.
5. WHERE a Color_Scale uses an intermediate step not in the standard Tailwind scale (e.g. `slate750`, `slate850`), THE Color_Scale SHALL include that step with a comment explaining its purpose.
6. THE Color_System SHALL export a `Palette` flat object derived from the Color_Scales, preserving all existing `Palette.*` key names so that no consumer import breaks.

---

### Requirement 2: No Spread Coupling Between Theme Variants

**User Story:** As a developer, I want each theme variant to be an independent, self-contained object, so that changing one variant does not silently affect another.

#### Acceptance Criteria

1. THE Color_System SHALL define each of the six Theme_Variants (`lightBlue`, `darkBlue`, `lightOrange`, `darkOrange`, `lightGreen`, `darkGreen`) as a standalone object that does NOT use the spread operator (`...`) to inherit tokens from another Theme_Variant.
2. WHEN a token value is shared across multiple Theme_Variants, THE Color_System SHALL repeat the value explicitly in each variant rather than spreading it from a base object.
3. THE Color_System SHALL NOT use intermediate cast variables (e.g. `_lb`, `_db`) to work around TypeScript literal conflicts caused by spreading.
4. THE Color_System SHALL preserve all existing token keys and their semantic meaning across all six Theme_Variants.
5. IF a Theme_Variant previously relied on spread inheritance for a token group (e.g. `intent`, `buttons`), THEN THE Color_System SHALL define that token group explicitly in the variant with the same values.

---

### Requirement 3: Palette Flat Object Derived from Scales

**User Story:** As a developer using `Palette.blue600` or `Palette.slate200` in domain maps and component styles, I want the `Palette` export to remain unchanged in shape, so that no existing consumer code needs to be updated.

#### Acceptance Criteria

1. THE Color_System SHALL export a `Palette` object whose keys exactly match the current set of named palette entries (e.g. `slate50` through `slate900`, `blue400` through `blue700`, `orange50` through `orange700`, etc.).
2. WHEN the `Palette` object is constructed, THE Color_System SHALL derive each entry from its corresponding Color_Scale (e.g. `Palette.slate200 = Slate[200]`) rather than defining the hex value twice.
3. THE Color_System SHALL preserve all hex values currently in `Palette` without modification, so that domain maps and component styles produce identical colors after the refactor.
4. THE Color_System SHALL mark the `Palette` object `as const`.
5. THE Color_System SHALL include the intermediate steps (`slate750`, `slate850`) in the `Palette` object, derived from the `Slate` Color_Scale.

---

### Requirement 4: Semantic Token Preservation

**User Story:** As a component developer using `useThemeColors()`, I want all existing semantic token paths (e.g. `c.surface.primary`, `c.interactive.chipActiveBg`, `c.buttons.danger.bg`) to continue working without any changes to component code.

#### Acceptance Criteria

1. THE Color_System SHALL preserve the complete `ThemeColors` TypeScript type with all existing top-level keys: `surface`, `text`, `border`, `intent`, `interactive`, `buttons`, `tint`, `icon`, `tabIconDefault`, `tabIconSelected`, `shadow`.
2. THE Color_System SHALL preserve all sub-keys within each top-level group as defined in the current `ThemeColors` type.
3. WHEN `useThemeColors()` is called in a component, THE Hook SHALL return a `ThemeColors` object whose token values are identical to the current values for the same mode and palette option.
4. THE Color_System SHALL preserve the `Colors` export (`Colors.light` and `Colors.dark`) pointing to the blue-palette light and dark variants for backward compatibility.
5. THE Color_System SHALL preserve the `ColorsByPalette` export with the same structure: `Record<'light' | 'dark', Record<PaletteOption, ThemeColors>>`.

---

### Requirement 5: Domain Map Preservation

**User Story:** As a developer using `StatusColors`, `PriorityColors`, `RoleColors`, `SubscriptionColors`, and their paired `*Surfaces` maps, I want these exports to remain unchanged in shape and values, so that badge and chip components continue to render the correct colors.

#### Acceptance Criteria

1. THE Color_System SHALL export `StatusColors`, `StatusSurfaces`, `PriorityColors`, `PrioritySurfaces`, `RoleColors`, `RoleSurfaces`, `SubscriptionColors`, and `SubscriptionSurfaces` with the same keys and hex values as the current implementation.
2. WHEN a Domain_Map references a color, THE Domain_Map SHALL reference it via `Palette.*` (e.g. `Palette.green500`) rather than a raw hex string, so that the value is traceable to its Color_Scale.
3. THE Color_System SHALL NOT change any hex value in any Domain_Map as part of this refactor.

---

### Requirement 6: WCAG AA Contrast Compliance

**User Story:** As a user of the app, I want all text tokens to meet WCAG AA contrast requirements against their paired background tokens, so that the app is readable for users with low vision.

#### Acceptance Criteria

1. THE Color_System SHALL maintain all contrast ratios that currently pass WCAG AA (4.5:1 for normal text) without regression.
2. WHEN a new Color_Scale step is introduced or an existing step is changed, THE Color_System SHALL verify the contrast ratio of any semantic text token that references that step against its paired surface token.
3. THE Color_System SHALL preserve the existing WCAG AA fixes documented in the `tokens.ts` changelog (e.g. `light text.tertiary: slate500`, `light text.muted: gray500`, `dark text.muted: slate500`).

---

### Requirement 7: No Consumer Breaking Changes

**User Story:** As a developer who has written components using the existing color API, I want the refactor to be a pure internal restructuring, so that I do not need to update any component, hook, store, or utility file.

#### Acceptance Criteria

1. THE Color_System SHALL preserve all named exports from `tokens.ts` that are currently imported by other files: `Palette`, `Colors`, `ColorsByPalette`, `ThemeColors`, `PaletteOption`, `StatusColors`, `StatusSurfaces`, `PriorityColors`, `PrioritySurfaces`, `RoleColors`, `RoleSurfaces`, `SubscriptionColors`, `SubscriptionSurfaces`, `Spacing`, `Radius`, `FontSize`, `FontWeight`, `LineHeight`, `BorderWidth`, `IconSize`, `Fonts`.
2. THE Color_System SHALL preserve all named exports from `theme.ts` that are currently imported by other files: `useThemeColors`, `useIsDark`, `syncAppearance`, and all re-exports from `tokens.ts`.
3. IF a consumer currently imports `Palette.blue600`, THEN THE Color_System SHALL ensure that import resolves to the same hex value (`#2563eb`) after the refactor.
4. THE Color_System SHALL NOT rename, remove, or restructure any export that is referenced in the steering rules (`mobile-reusable-components.md`, `ADMIN_FEATURES.md`, `mobile-component-pattern.md`).

---

### Requirement 8: Scale Completeness for Future Use

**User Story:** As a developer adding new UI components, I want each Color_Scale to include the full standard step range (50–950), so that I can pick any step without needing to add new entries to the scale.

#### Acceptance Criteria

1. THE Color_System SHALL define each Color_Scale with at minimum the steps 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 for all primary color families (Slate, Gray, Blue, Orange, Green, Red, Amber, Violet, Teal, Cyan, Pink, Rose, Stone).
2. WHERE a step is not currently used by any semantic token or domain map, THE Color_Scale SHALL still include it with the correct Tailwind CSS hex value for that step, marked with a comment `// reserved`.
3. THE Color_System SHALL add step 950 to scales where it is used (e.g. `Stone[950]`) or where the Tailwind scale defines it.
4. THE Color_System SHALL NOT add steps that do not exist in the Tailwind CSS v3 color palette for that family, except for the documented intermediate steps (`slate750`, `slate850`) which are intentional custom additions.

---

### Requirement 9: File Structure and Documentation

**User Story:** As a developer reading the color system file, I want the file to be clearly organized with section headers and inline documentation, so that I can quickly locate any color family or token group.

#### Acceptance Criteria

1. THE Color_System SHALL organize `tokens.ts` into clearly labeled sections using comment banners: Color Scales, Palette (derived flat object), Semantic Tokens (light/dark per palette option), PaletteOption + ColorsByPalette, Domain Maps, Spacing/Radius/Typography.
2. THE Color_System SHALL include a file-level JSDoc comment listing the major structural changes from the previous version.
3. WHEN a Color_Scale includes a non-standard step (e.g. `750`, `850`), THE Color_Scale SHALL include an inline comment explaining why the step exists.
4. THE Color_System SHALL include a comment on each Theme_Variant explaining which palette option and mode it represents.
5. THE Color_System SHALL include a comment on the `Palette` object explaining that it is derived from Color_Scales and is the single source of truth for raw hex values.

---

### Requirement 10: Parser / Serializer Round-Trip (Token Integrity)

**User Story:** As a developer running automated tests, I want a property-based test that verifies the refactored token structure is internally consistent, so that regressions in the palette derivation are caught automatically.

#### Acceptance Criteria

1. THE Test_Suite SHALL verify that every key in `Palette` resolves to a non-empty hex string matching the pattern `#[0-9a-fA-F]{3,8}`.
2. THE Test_Suite SHALL verify that for every combination of mode (`light`, `dark`) and PaletteOption (`blue`, `orange`, `green`), the `ColorsByPalette` entry exists and contains all required `ThemeColors` sub-keys.
3. THE Test_Suite SHALL verify that `Colors.light` is reference-equal to `ColorsByPalette.light.blue` and `Colors.dark` is reference-equal to `ColorsByPalette.dark.blue`.
4. THE Test_Suite SHALL verify that no two Color_Scales share a reference (i.e. `Slate !== Blue`, `Orange !== Stone`, etc.) — each scale is an independent object.
5. FOR ALL six Theme_Variants, THE Test_Suite SHALL verify that the `surface`, `text`, `border`, `intent`, `interactive`, and `buttons` groups each contain the same set of sub-keys as the `ThemeColors` type definition (round-trip structural check).
