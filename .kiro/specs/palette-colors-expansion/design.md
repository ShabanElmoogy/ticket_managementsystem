# Design Document — Palette Colors Expansion

## Overview

This feature extends the mobile app's theme system from a single fixed blue accent to three user-selectable palette options: **Blue** (existing), **Orange**, and **Green**. The selected palette is persisted per-device via the existing Zustand `persist` middleware and applied consistently across light and dark modes without requiring an app restart.

The change is purely additive at the token layer. All existing components that consume `useThemeColors()` automatically pick up the new palette without any per-component code changes. Only the `Interactive_Primary_Family` tokens vary by palette; all neutral, surface, text, and intent tokens remain fixed.

### Key design decisions

1. **Six token sets** — `lightBlue`, `lightOrange`, `lightGreen`, `darkBlue`, `darkOrange`, `darkGreen` — are defined statically in `tokens.ts` and exposed via a `ColorsByPalette` lookup map. This keeps the token file as a zero-import pure constant module.
2. **`paletteOption`** is added to `uiStore` alongside `colorMode`, persisted via the existing AsyncStorage middleware, and defaults to `'blue'` for full backward compatibility.
3. **`useThemeColors()`** is updated to subscribe to both `colorMode` and `paletteOption`, selecting from the six token sets. The change is a two-line addition to the existing hook.
4. **`PaletteSelector`** is a new shared component that follows the Modal-safety rule: it accepts `resolvedColors` as a prop rather than calling `useThemeColors()` internally.
5. **`Colors.light` and `Colors.dark`** continue to export the blue-palette token sets, preserving backward compatibility for any code that imports them directly.

---

## Architecture

```
tokens.ts (zero imports)
  ├── Palette          — raw hex values (extended with orange400–700, green400)
  ├── lightBlue        — existing light token set (unchanged)
  ├── lightOrange      — new: orange Interactive_Primary_Family, same neutrals
  ├── lightGreen       — new: green Interactive_Primary_Family, same neutrals
  ├── darkBlue         — existing dark token set (unchanged)
  ├── darkOrange       — new
  ├── darkGreen        — new
  ├── Colors           — { light: lightBlue, dark: darkBlue } (backward compat)
  ├── ColorsByPalette  — { light: { blue, orange, green }, dark: { blue, orange, green } }
  └── ThemeColors      — type (unchanged)

uiStore.ts
  ├── paletteOption: 'blue' | 'orange' | 'green'  (new, default 'blue', persisted)
  └── setPaletteOption(option)                     (new action)

theme.ts
  └── useThemeColors()  — subscribes to paletteOption + colorMode, returns ColorsByPalette[mode][palette]

PaletteSelector.tsx  (new)
  mobile/src/shared/components/display/PaletteSelector.tsx
  └── Props: { resolvedColors: ThemeColors; isRtlOverride?: boolean }

profile.tsx  (updated)
  └── renders <PaletteSelector resolvedColors={c} />
```

### Data flow

```
User taps swatch in PaletteSelector
  → setPaletteOption('orange')
    → uiStore updates paletteOption
      → Zustand persist writes to AsyncStorage
        → useThemeColors() re-runs (subscribed to paletteOption)
          → returns ColorsByPalette['light']['orange']
            → all consuming components re-render with orange tokens
```

---

## Components and Interfaces

### `Palette` additions (`tokens.ts`)

```typescript
// New orange ramp
orange400: '#fb923c',
orange500: '#f97316',
orange600: '#ea580c',
orange700: '#c2410c',

// New green shade (green500–700 already exist)
green400: '#34d399',
```

### `ColorsByPalette` lookup map (`tokens.ts`)

```typescript
export type PaletteOption = 'blue' | 'orange' | 'green';

export const ColorsByPalette: Record<'light' | 'dark', Record<PaletteOption, ThemeColors>> = {
  light: { blue: lightBlue, orange: lightOrange, green: lightGreen },
  dark:  { blue: darkBlue,  orange: darkOrange,  green: darkGreen  },
};
```

`Colors` continues to be exported as `{ light: lightBlue, dark: darkBlue }` for backward compatibility.

### `uiStore` additions

```typescript
export type PaletteOption = 'blue' | 'orange' | 'green';

// Added to UiState interface:
paletteOption: PaletteOption;
setPaletteOption: (option: PaletteOption) => void;

// Added to partialize (persisted):
paletteOption: state.paletteOption,
```

### `useThemeColors()` update (`theme.ts`)

```typescript
export function useThemeColors(): ThemeColors {
  const colorMode     = useUiStore((s) => s.colorMode);
  const paletteOption = useUiStore((s) => s.paletteOption);
  const systemScheme  = useColorScheme();

  const isDark =
    colorMode === 'dark'  ? true  :
    colorMode === 'light' ? false :
    systemScheme === 'dark';

  return ColorsByPalette[isDark ? 'dark' : 'light'][paletteOption ?? 'blue'];
}
```

`useIsDark()` is unchanged — it does not read `paletteOption`.

### `PaletteSelector` component

```typescript
// mobile/src/shared/components/display/PaletteSelector.tsx

interface PaletteSwatch {
  option:  PaletteOption;
  label:   string;
  color:   string;   // the primary color for the swatch circle
  darkColor: string; // darker shade for the pressed/border state
}

interface PaletteSelectorProps {
  resolvedColors:  ThemeColors;   // Modal-safety: caller resolves via useThemeColors()
  isRtlOverride?:  boolean;       // for use inside Modal trees
}
```

The component reads `paletteOption` and `setPaletteOption` directly from `useUiStore` (Zustand is global — safe inside Modals). It renders three tappable swatches in a horizontal row. The active swatch shows a checkmark overlay and a colored border ring. Spacing uses `marginStart`/`marginEnd` for RTL safety.

---

## Data Models

### Token set structure — Interactive_Primary_Family tokens by palette

The six token sets share identical `surface`, `text`, `border.primary`, `border.secondary`, `intent`, `buttons.success`, `buttons.danger`, `buttons.secondary`, `buttons.neutral`, `buttons.cancel`, `icon`, `tabIconDefault`, and `shadow` values. Only the following tokens differ by palette:

| Token | blue (light) | orange (light) | green (light) |
|---|---|---|---|
| `interactive.primary` | `blue500` | `orange500` | `green600` |
| `interactive.primaryPressed` | `blue600` | `orange600` | `green700` |
| `interactive.chipActiveBg` | `blue500` | `orange500` | `green600` |
| `interactive.chipActiveBorder` | `blue600` | `orange600` | `green700` |
| `buttons.primary.bg` | `blue500` | `orange500` | `green600` |
| `buttons.primary.pressed` | `blue600` | `orange600` | `green700` |
| `buttons.outline.border` | `blue500` | `orange500` | `green600` |
| `buttons.outline.text` | `blue500` | `orange500` | `green600` |
| `buttons.ghost.text` | `blue500` | `orange500` | `green600` |
| `border.focus` | `blue500` | `orange500` | `green600` |
| `tint` | `'#0a7ea4'` | `orange600` | `green600` |
| `tabIconSelected` | `'#0a7ea4'` | `orange600` | `green600` |

| Token | blue (dark) | orange (dark) | green (dark) |
|---|---|---|---|
| `interactive.primary` | `blue500` | `orange400` | `green500` |
| `interactive.primaryPressed` | `blue600` | `orange500` | `green600` |
| `interactive.chipActiveBg` | `blue500` | `orange400` | `green500` |
| `interactive.chipActiveBorder` | `blue400` | `orange500` | `green400` |
| `buttons.primary.bg` | `blue400` | `orange400` | `green500` |
| `buttons.primary.pressed` | `blue500` | `orange500` | `green600` |
| `buttons.outline.border` | `blue400` | `orange400` | `green500` |
| `buttons.outline.text` | `blue400` | `orange400` | `green500` |
| `buttons.ghost.text` | `blue400` | `orange400` | `green500` |
| `border.focus` | `blue400` | `orange400` | `green500` |
| `tint` | `white` | `orange400` | `green400` |
| `tabIconSelected` | `white` | `orange400` | `green400` |

**Green palette contrast rationale:** `green600` (`#059669`) against white (`#ffffff`) has a contrast ratio of approximately 3.1:1, meeting WCAG AA for UI components (≥3:1). It is visually distinct from `intent.success` which uses `green500` (`#10b981`, ~2.9:1 against white). In dark mode, `green500` is used for primary (same as intent.success) — this is acceptable because dark surfaces provide sufficient contrast and the intent colors are contextually distinct from interactive elements.

### `PaletteOption` type

```typescript
// Exported from tokens.ts (zero imports — plain string union)
export type PaletteOption = 'blue' | 'orange' | 'green';
```

Also re-exported from `uiStore.ts` for convenience.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Six complete token sets exist

*For any* combination of mode (`'light'` | `'dark'`) and palette option (`'blue'` | `'orange'` | `'green'`), `ColorsByPalette[mode][palette]` SHALL be a complete `ThemeColors` object containing all required top-level keys (`surface`, `text`, `border`, `intent`, `interactive`, `buttons`, `tint`, `icon`, `tabIconDefault`, `tabIconSelected`, `shadow`).

**Validates: Requirements 3.1**

---

### Property 2: Interactive_Primary_Family uses the correct palette ramp

*For any* palette option `p` and mode `m`, every token in the `Interactive_Primary_Family` (`interactive.primary`, `interactive.primaryPressed`, `interactive.chipActiveBg`, `interactive.chipActiveBorder`, `buttons.primary.bg`, `buttons.primary.pressed`, `buttons.outline.border`, `buttons.outline.text`, `buttons.ghost.text`, `border.focus`) SHALL be a value drawn from the `Palette` object's corresponding ramp (blue ramp for `'blue'`, orange ramp for `'orange'`, green ramp for `'green'`).

**Validates: Requirements 3.2, 6.1, 6.2**

---

### Property 3: Intent and neutral tokens are palette-invariant

*For any* palette option `p` and mode `m`, the `intent`, `surface`, `text`, `border.primary`, and `border.secondary` tokens in `ColorsByPalette[m][p]` SHALL be deeply equal to the corresponding tokens in `ColorsByPalette[m]['blue']`.

**Validates: Requirements 3.3, 3.4**

---

### Property 4: Blue palette is backward-compatible

*For any* token key `k` in `ThemeColors`, `ColorsByPalette['light']['blue'][k]` SHALL deeply equal `Colors.light[k]`, and `ColorsByPalette['dark']['blue'][k]` SHALL deeply equal `Colors.dark[k]`.

**Validates: Requirements 7.2, 7.4**

---

### Property 5: setPaletteOption round-trip

*For any* palette option value `p` in `{'blue', 'orange', 'green'}`, calling `setPaletteOption(p)` SHALL result in `uiStore.getState().paletteOption === p`.

**Validates: Requirements 2.2**

---

### Property 6: useThemeColors selects the correct token set

*For any* combination of `colorMode` and `paletteOption`, `useThemeColors()` SHALL return the same object reference as `ColorsByPalette[resolvedMode][paletteOption]`, where `resolvedMode` is `'dark'` when `colorMode === 'dark'` and `'light'` otherwise.

**Validates: Requirements 4.1, 4.3**

---

### Property 7: useIsDark is palette-independent

*For any* palette option `p`, changing `paletteOption` to `p` SHALL NOT change the value returned by `useIsDark()` — it SHALL continue to return only a boolean based on `colorMode` and the system color scheme.

**Validates: Requirements 4.5**

---

### Property 8: PaletteSelector tap calls setPaletteOption

*For any* palette option `p` displayed in `PaletteSelector`, tapping the swatch for `p` SHALL result in `setPaletteOption` being called with exactly `p`.

**Validates: Requirements 5.2**

---

## Error Handling

### Invalid `paletteOption` in AsyncStorage

If AsyncStorage contains a `paletteOption` value that is not one of `'blue' | 'orange' | 'green'` (e.g., from a future downgrade or corrupted storage), `useThemeColors()` uses the `?? 'blue'` fallback in the lookup:

```typescript
return ColorsByPalette[isDark ? 'dark' : 'light'][paletteOption ?? 'blue'];
```

If `paletteOption` is an unrecognized string, `ColorsByPalette[mode][paletteOption]` will be `undefined`. The hook should guard against this:

```typescript
const safeOption: PaletteOption =
  (paletteOption === 'blue' || paletteOption === 'orange' || paletteOption === 'green')
    ? paletteOption
    : 'blue';
return ColorsByPalette[isDark ? 'dark' : 'light'][safeOption];
```

### Missing `paletteOption` on first launch

Zustand's `persist` middleware handles this via the `partialize` default: if `paletteOption` is absent from AsyncStorage, the store initializes with the default value `'blue'` defined in the store creator. No additional error handling is needed.

### `PaletteSelector` with undefined `resolvedColors`

The component should not be rendered before `useThemeColors()` has returned a valid object. Since `useThemeColors()` always returns a valid token set (with the `'blue'` fallback), this is not a practical concern. TypeScript's type system enforces that `resolvedColors` is a non-optional `ThemeColors` prop.

---

## Testing Strategy

### Unit tests (example-based)

- Verify `Palette` contains `orange400`, `orange500`, `orange600`, `orange700` with valid hex values
- Verify `Palette` contains `green400` with a valid hex value
- Verify `Colors.light` and `Colors.dark` still export the blue-palette token sets (backward compat)
- Verify `uiStore` initializes with `paletteOption === 'blue'`
- Verify `green600` (`#059669`) has contrast ratio ≥ 3:1 against white (WCAG AA for UI components)
- Verify `PaletteSelector` renders three swatches
- Verify `PaletteSelector` shows the active indicator on the currently selected swatch

### Property-based tests

The project should use a property-based testing library appropriate for the TypeScript/React Native stack. **fast-check** is the recommended choice — it is well-maintained, TypeScript-native, and works in Jest/Vitest environments without additional setup.

Each property test must run a minimum of **100 iterations**.

Tag format for each test: `// Feature: palette-colors-expansion, Property N: <property_text>`

**Property 1 — Six complete token sets exist**
```typescript
// Feature: palette-colors-expansion, Property 1: For any (mode, palette), ColorsByPalette[mode][palette] is a complete ThemeColors object
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  fc.constantFrom('blue', 'orange', 'green'),
  (mode, palette) => {
    const tokens = ColorsByPalette[mode][palette];
    expect(tokens).toBeDefined();
    expect(tokens.surface).toBeDefined();
    expect(tokens.text).toBeDefined();
    expect(tokens.border).toBeDefined();
    expect(tokens.intent).toBeDefined();
    expect(tokens.interactive).toBeDefined();
    expect(tokens.buttons).toBeDefined();
  }
), { numRuns: 100 });
```

**Property 2 — Interactive_Primary_Family uses the correct palette ramp**
```typescript
// Feature: palette-colors-expansion, Property 2: Interactive_Primary_Family tokens use the correct palette ramp
const ORANGE_RAMP = new Set([Palette.orange400, Palette.orange500, Palette.orange600, Palette.orange700]);
const GREEN_RAMP  = new Set([Palette.green400, Palette.green500, Palette.green600, Palette.green700]);
const BLUE_RAMP   = new Set([Palette.blue400, Palette.blue500, Palette.blue600, Palette.blue700]);

fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  fc.constantFrom('blue', 'orange', 'green'),
  (mode, palette) => {
    const t = ColorsByPalette[mode][palette];
    const ramp = palette === 'blue' ? BLUE_RAMP : palette === 'orange' ? ORANGE_RAMP : GREEN_RAMP;
    expect(ramp.has(t.interactive.primary)).toBe(true);
    expect(ramp.has(t.interactive.primaryPressed)).toBe(true);
    expect(ramp.has(t.interactive.chipActiveBg)).toBe(true);
    expect(ramp.has(t.buttons.primary.bg)).toBe(true);
  }
), { numRuns: 100 });
```

**Property 3 — Intent and neutral tokens are palette-invariant**
```typescript
// Feature: palette-colors-expansion, Property 3: intent/surface/text/border tokens are identical across all palettes
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  fc.constantFrom('orange', 'green'),
  (mode, palette) => {
    const base    = ColorsByPalette[mode]['blue'];
    const variant = ColorsByPalette[mode][palette];
    expect(variant.intent).toEqual(base.intent);
    expect(variant.surface).toEqual(base.surface);
    expect(variant.text).toEqual(base.text);
    expect(variant.border.primary).toEqual(base.border.primary);
    expect(variant.border.secondary).toEqual(base.border.secondary);
  }
), { numRuns: 100 });
```

**Property 4 — Blue palette is backward-compatible**
```typescript
// Feature: palette-colors-expansion, Property 4: ColorsByPalette[mode]['blue'] deep-equals Colors[mode]
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  (mode) => {
    expect(ColorsByPalette[mode]['blue']).toEqual(Colors[mode]);
  }
), { numRuns: 100 });
```

**Property 5 — setPaletteOption round-trip**
```typescript
// Feature: palette-colors-expansion, Property 5: setPaletteOption(p) results in paletteOption === p
fc.assert(fc.property(
  fc.constantFrom('blue', 'orange', 'green'),
  (palette) => {
    useUiStore.getState().setPaletteOption(palette);
    expect(useUiStore.getState().paletteOption).toBe(palette);
  }
), { numRuns: 100 });
```

**Property 6 — useThemeColors selects the correct token set**
```typescript
// Feature: palette-colors-expansion, Property 6: useThemeColors() returns ColorsByPalette[resolvedMode][paletteOption]
fc.assert(fc.property(
  fc.constantFrom('light', 'dark', 'system'),
  fc.constantFrom('blue', 'orange', 'green'),
  (colorMode, palette) => {
    // Set store state
    useUiStore.setState({ colorMode, paletteOption: palette });
    // Render hook with mocked system scheme
    const { result } = renderHook(() => useThemeColors());
    const expectedMode = colorMode === 'dark' ? 'dark' : 'light'; // simplified (system → light in test)
    expect(result.current).toEqual(ColorsByPalette[expectedMode][palette]);
  }
), { numRuns: 100 });
```

**Property 7 — useIsDark is palette-independent**
```typescript
// Feature: palette-colors-expansion, Property 7: useIsDark() is unaffected by paletteOption changes
fc.assert(fc.property(
  fc.constantFrom('light', 'dark'),
  fc.constantFrom('blue', 'orange', 'green'),
  fc.constantFrom('blue', 'orange', 'green'),
  (colorMode, palette1, palette2) => {
    useUiStore.setState({ colorMode, paletteOption: palette1 });
    const { result: r1 } = renderHook(() => useIsDark());
    useUiStore.setState({ paletteOption: palette2 });
    const { result: r2 } = renderHook(() => useIsDark());
    expect(r1.current).toBe(r2.current);
  }
), { numRuns: 100 });
```

**Property 8 — PaletteSelector tap calls setPaletteOption**
```typescript
// Feature: palette-colors-expansion, Property 8: tapping a swatch calls setPaletteOption with that palette
fc.assert(fc.property(
  fc.constantFrom('blue', 'orange', 'green'),
  (palette) => {
    const mockSet = jest.fn();
    // Render PaletteSelector with mocked store action
    const { getByTestId } = render(
      <PaletteSelector resolvedColors={ColorsByPalette['light']['blue']} />
    );
    fireEvent.press(getByTestId(`swatch-${palette}`));
    expect(mockSet).toHaveBeenCalledWith(palette);
  }
), { numRuns: 100 });
```

### Integration tests

- Verify `paletteOption` is included in the Zustand `partialize` output (persisted to AsyncStorage)
- Verify rehydration restores `paletteOption` from AsyncStorage
- Verify `PaletteSelector` is rendered in the Profile screen

### Testing library

**fast-check** (`npm install --save-dev fast-check`) — TypeScript-native property-based testing library. Works with Jest (already configured in the mobile project). No additional configuration required.
