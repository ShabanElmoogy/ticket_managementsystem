---
inclusion: always
---

# Mobile — Theme System & UI Rules

Complete reference for the color system, icon system, and theme-aware coding patterns in the mobile app.

---

## Architecture Overview

```
tokens.ts  (pure — zero imports, safe at module level anywhere)
  ├── Color Scales      — 22 isolated as-const objects (Slate, Gray, Zinc, Blue, …)
  ├── Palette           — derived flat object, single source of truth for raw hex
  ├── ThemeColors type  — TypeScript type for all semantic tokens
  ├── 6 variants        — lightBlue, darkBlue, lightOrange, darkOrange, lightGreen, darkGreen
  ├── ColorsByPalette / Colors
  ├── Domain maps       — StatusColors, PriorityColors, RoleColors, SubscriptionColors + *Surfaces
  └── Spacing, Radius, FontSize, FontWeight, LineHeight, BorderWidth, IconSize, Fonts

theme.ts  (reactive hooks — imports uiStore)
  ├── useThemeColors() → ThemeColors   (re-renders on palette/mode change)
  ├── useIsDark()      → boolean
  └── re-exports everything from tokens.ts
```

**Import rule:**
```ts
// For reactive colors in components
import { useThemeColors, useIsDark } from '@/src/constants/theme';

// For static tokens (Palette, Spacing, etc.) at module level
import { Palette, Spacing, Radius } from '@/src/constants/tokens';
```

---

## Color Scales

22 isolated `as const` scale objects — each color family is independent, no scale spreads from another. All values match Tailwind CSS v3 exactly.

| Scale | Notes |
|---|---|
| `Slate` | 50–950 |
| `Gray` | 50–950 |
| `Zinc` | 50–950 — shadcn default neutral (cooler than Gray, warmer than Slate) |
| `Neutral` | 50–950 — pure achromatic |
| `Stone` | 50–950 — warm neutral, used by orange theme surfaces |
| `Red` | 50–950 |
| `Orange` | 50–950 |
| `Amber` | 50–950 |
| `Yellow` | 50–950 |
| `Lime` | 50–950 |
| `Green` | 50–950 — `Green[400]` = `#4ade80` (Tailwind v3 exact) |
| `Emerald` | 50–950 — distinct from Green; used for success semantics and green theme |
| `Teal` | 50–950 |
| `Cyan` | 50–950 — `Cyan[500]` = `#06b6d4` (Tailwind v3 exact) |
| `Sky` | 50–950 — lighter blue |
| `Blue` | 50–950 |
| `Indigo` | 50–950 |
| `Violet` | 50–950 |
| `Purple` | 50–950 — warm purple |
| `Fuchsia` | 50–950 |
| `Pink` | 50–950 |
| `Rose` | 50–950 |

**Scales are module-internal** — only `Palette` is exported as the flat lookup.

---

## Palette

Derived flat object — every entry comes from its scale (`Palette.blue600 = Blue[600]`). 240+ keys covering all 22 families at all 11 steps.

```ts
import { Palette } from '@/src/constants/tokens';

// ✅ Use Palette for domain color maps at module level (outside components)
const STATUS_COLORS = {
  OPEN:     Palette.amber500,
  RESOLVED: Palette.emerald500,
  CLOSED:   Palette.zinc500,
};

// ❌ Never use Palette inside component render — ignores dark mode
<View style={{ backgroundColor: Palette.blue600 }} />  // wrong
```

**`Palette` is allowed ONLY in:**
1. Module-level constant maps (outside components) — status configs, priority maps, role colors, nav item colors
2. `tokens.ts` itself

---

## Six Theme Variants

All six variants are **fully explicit standalone objects** — no spread coupling between variants.

| Variant | Mode | Accent | Neutral base | Header bg |
|---|---|---|---|---|
| `lightBlue` | Light | `blue600` | Zinc | `indigo500` |
| `darkBlue` | Dark | `blue400` | Zinc | `#0f172a` |
| `lightOrange` | Light | `orange600` | Stone | `orange700` |
| `darkOrange` | Dark | `orange400` | Stone | `orange700` |
| `lightGreen` | Light | `emerald600` | Zinc | `emerald700` |
| `darkGreen` | Dark | `emerald400` | Zinc | `emerald800` |

---

## ThemeColors Token Reference

```ts
const c = useThemeColors();

// ── Surface ──────────────────────────────────────────────────────────────────
c.surface.primary      // main bg: white / zinc-900 / stone-900
c.surface.secondary    // subtle tinted bg
c.surface.tertiary     // panel headers, table headers
c.surface.elevated     // pressed/hover state, toggle buttons
c.surface.card         // card background
c.surface.header       // app header bar background (palette-colored)

// ── Text ─────────────────────────────────────────────────────────────────────
c.text.primary         // main text
c.text.secondary       // secondary/label text
c.text.tertiary        // tertiary text
c.text.muted           // placeholder, disabled, captions
c.text.inverse         // white — use on colored surfaces (header, primary buttons)

// ── Border ───────────────────────────────────────────────────────────────────
c.border.primary       // main border
c.border.secondary     // secondary border
c.border.focus         // focus ring (palette accent color)

// ── Intent ───────────────────────────────────────────────────────────────────
c.intent.success        c.intent.successSurface
c.intent.error          c.intent.errorSurface
c.intent.warning        c.intent.warningSurface
c.intent.info           c.intent.infoSurface

// ── Interactive ───────────────────────────────────────────────────────────────
c.interactive.primary          // palette accent: blue600 / orange600 / emerald600
c.interactive.primaryPressed   // darker on press
c.interactive.secondary        // secondary interactive surface
c.interactive.disabled         // disabled state
c.interactive.pressed          // generic pressed surface
c.interactive.success          c.interactive.successPressed
c.interactive.warning          c.interactive.warningPressed
c.interactive.error            c.interactive.errorPressed
c.interactive.chipBg           c.interactive.chipBorder
c.interactive.chipActiveBg     c.interactive.chipActiveBorder
c.interactive.chipActiveText   c.interactive.chipText

// ── Buttons ───────────────────────────────────────────────────────────────────
c.buttons.primary.bg    c.buttons.primary.pressed    c.buttons.primary.text
c.buttons.success.bg    c.buttons.success.pressed    c.buttons.success.text
c.buttons.danger.bg     c.buttons.danger.pressed     c.buttons.danger.text
c.buttons.secondary.bg  c.buttons.secondary.text     c.buttons.secondary.border
c.buttons.outline.border  c.buttons.outline.text
c.buttons.ghost.text
c.buttons.neutral.bg    c.buttons.neutral.pressed    c.buttons.neutral.text
c.buttons.cancel.bg     c.buttons.cancel.pressed     c.buttons.cancel.text  c.buttons.cancel.border

// ── Scalar ────────────────────────────────────────────────────────────────────
c.tint             // palette primary accent (same as interactive.primary in light)
c.icon             // icon color
c.tabIconDefault   // inactive tab icon
c.tabIconSelected  // active tab icon (palette accent)
c.shadow           // pre-tuned rgba shadow per palette — use with shadowOpacity: 1
```

---

## Shadow Rule

Always use `c.shadow` — never hardcode rgba values.

```tsx
// ✅ Correct — adapts to palette
shadowColor:   c.shadow,
shadowOffset:  { width: 0, height: 2 },
shadowOpacity: 1,        // opacity is baked into c.shadow rgba alpha
shadowRadius:  6,
elevation:     4,

// ❌ Wrong — hardcoded, clashes with orange/green palettes
shadowColor:   '#1d4ed8',
shadowOpacity: 0.35,
```

`c.shadow` values per palette:
- Light blue/green: `rgba(0,0,0,0.12)`
- Light orange: `rgba(120,60,0,0.10)` — warm subtle shadow
- Dark blue/green: `rgba(0,0,0,0.50)`
- Dark orange: `rgba(0,0,0,0.55)`

---

## Palette-Aware Active Color Rule

For tab bars, chip bars, and any element with per-item accent colors:

```tsx
import { useUiStore } from '@/src/stores/uiStore';

const paletteOption = useUiStore((s) => s.paletteOption);
const useItemColors = paletteOption === 'blue';

// Blue palette: per-item colors (multi-hue look)
// Orange/Green palette: c.tint (cohesive with active palette)
const activeColor = useItemColors ? item.color : c.tint;
```

**Applied in:** `AppBottomNav`, `AdminPanel` tab bar, any horizontal tab/chip bar with per-item colors.

---

## Icon System — Ionicons

All icons use `@expo/vector-icons` Ionicons. **No emoji icons in UI components.**

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { IoniconName } from '@/src/components/layout/header/navItems';

// ✅ Correct
<Ionicons name="map-outline" size={20} color={c.text.secondary} />

// ❌ Wrong — emoji
<Text style={{ fontSize: 20 }}>🗺️</Text>
```

---

## Emoji → Ionicons Migration Steps

When you encounter an emoji icon in any component, follow these steps to replace it:

### Step 1 — Identify the emoji and its purpose

```tsx
// Before
<Text style={{ fontSize: 20 }}>🗺️</Text>   // map / navigation
<Text style={{ fontSize: 16 }}>✏️</Text>    // edit action
<Text style={{ fontSize: 16 }}>🗑️</Text>    // delete action
<Text style={{ fontSize: 16 }}>👁️</Text>    // view action
<Text style={{ fontSize: 16 }}>←</Text>     // back navigation
<Text style={{ fontSize: 20 }}>🔔</Text>    // notifications
<Text style={{ fontSize: 20 }}>☰</Text>     // menu / hamburger
<Text style={{ fontSize: 20 }}>✕</Text>     // close
```

### Step 2 — Add the Ionicons import

```tsx
import { Ionicons } from '@expo/vector-icons';
```

If the component accepts an icon as a prop, also import the type:

```tsx
import type { IoniconName } from '@/src/components/layout/header/navItems';
```

### Step 3 — Replace with Ionicons using a theme color

```tsx
// After — use c.* token for color, never hardcode
<Ionicons name="map-outline"          size={20} color={c.text.secondary} />
<Ionicons name="create-outline"       size={15} color={c.interactive.primary} />
<Ionicons name="trash-outline"        size={15} color={c.intent.error} />
<Ionicons name="eye-outline"          size={15} color={c.interactive.primary} />
<Ionicons name="arrow-back-outline"   size={20} color={c.text.secondary} />
<Ionicons name="notifications-outline" size={20} color={c.text.inverse} />
<Ionicons name="menu-outline"         size={22} color={c.text.inverse} />
<Ionicons name="close-outline"        size={22} color={c.text.inverse} />
```

### Step 4 — Apply background color to action buttons

Action buttons (edit/delete/view) need a tinted background:

```tsx
// Edit button
<Pressable style={[styles.actionBtn, { backgroundColor: c.intent.infoSurface }]}>
  <Ionicons name="create-outline" size={15} color={c.interactive.primary} />
</Pressable>

// Delete button
<Pressable style={[styles.actionBtn, { backgroundColor: c.intent.errorSurface }]}>
  <Ionicons name="trash-outline" size={15} color={c.intent.error} />
</Pressable>

// View button
<Pressable style={[styles.actionBtn, { backgroundColor: c.intent.infoSurface }]}>
  <Ionicons name="eye-outline" size={15} color={c.interactive.primary} />
</Pressable>
```

### Step 5 — Remove unused imports

After replacing all emojis, remove any imports that are no longer needed:

```tsx
// Remove if no longer used
import { Text } from 'react-native';   // only if Text was used solely for emoji
import { FontSize } from '@/src/constants/theme';  // only if used solely for emoji fontSize
```

### Step 6 — Verify with getDiagnostics

Run diagnostics on the changed file to confirm zero TypeScript errors.

---

### Emoji → Ionicons quick reference

| Emoji | Ionicons name | Typical color |
|---|---|---|
| `✏️` edit | `create-outline` | `c.interactive.primary` |
| `🗑️` delete | `trash-outline` | `c.intent.error` |
| `👁️` view | `eye-outline` | `c.interactive.primary` |
| `←` back | `arrow-back-outline` | `c.text.secondary` |
| `✕` close | `close-outline` | `c.text.secondary` |
| `🔔` bell | `notifications-outline` | `c.text.inverse` |
| `☰` menu | `menu-outline` | `c.text.inverse` |
| `🗺️` map | `map-outline` | `c.interactive.primary` |
| `📍` location | `location-outline` | `c.text.muted` |
| `📅` calendar | `calendar-outline` | `c.tint` |
| `⚙️` settings | `settings-outline` | `c.text.secondary` |
| `🔍` search | `search-outline` | `c.text.muted` |
| `➕` add | `add-circle-outline` | `c.interactive.primary` |
| `📄` document | `document-outline` | `c.text.secondary` |
| `🔄` refresh | `refresh-outline` | `c.text.secondary` |
| `📊` chart | `bar-chart-outline` | `c.text.secondary` |
| `👤` person | `person-outline` | `c.text.secondary` |
| `👥` people | `people-outline` | `c.text.secondary` |
| `📱` phone | `phone-portrait-outline` | `c.text.secondary` |
| `💡` idea | `bulb-outline` | `c.text.secondary` |
| `🌳` tree/epics | `git-branch-outline` | `c.text.secondary` |
| `💻` code | `code-slash-outline` | `c.text.secondary` |
| `🚪` logout | `log-out-outline` | `c.intent.error` |
| `⏳` loading | `hourglass-outline` | `c.text.muted` |
| `🏢` building | `business-outline` | `c.text.secondary` |
| `📦` package | `cube-outline` | `c.text.secondary` |
| `✅` check | `checkmark-circle-outline` | `c.intent.success` |
| `⚠️` warning | `warning-outline` | `c.intent.warning` |
| `🔒` lock | `lock-closed-outline` | `c.text.muted` |
| `📋` clipboard | `clipboard-outline` | `c.text.secondary` |
| `📤` share | `share-outline` | `c.text.secondary` |

---

### Icon naming convention
- **Outline** (`-outline` suffix) — inactive state, secondary actions
- **Filled** (no suffix) — active state, primary actions

### Common icon map

| Purpose | Inactive | Active |
|---|---|---|
| Dashboard | `grid-outline` | `grid` |
| Tickets | `ticket-outline` | `ticket` |
| Kanban | `albums-outline` | `albums` |
| Profile | `person-outline` | `person` |
| Customers | `people-outline` | `people` |
| Applications | `phone-portrait-outline` | `phone-portrait` |
| Users | `person-outline` | `person` |
| Settings | `settings-outline` | `settings` |
| Documents | `document-text-outline` | `document-text` |
| Reports | `bar-chart-outline` | `bar-chart` |
| Epics | `git-branch-outline` | `git-branch` |
| Features | `bulb-outline` | `bulb` |
| Programming | `code-slash-outline` | `code-slash` |
| Notifications | `notifications-outline` | `notifications` |
| Map | `map-outline` | `map` |
| Location | `location-outline` | `location` |
| Back | `arrow-back-outline` | — |
| Close | `close-outline` | — |
| Menu | `menu-outline` | — |
| Add | `add-circle-outline` | `add-circle` |
| Edit | `create-outline` | `create` |
| Delete | `trash-outline` | `trash` |
| View | `eye-outline` | `eye` |
| Refresh | `refresh-outline` | — |
| Export | `document-outline` | — |
| Search | `search-outline` | — |
| Calendar | `calendar-outline` | `calendar` |
| Logout | `log-out-outline` | — |

---

## Nav Item Colors

Each drawer nav item has a fixed accent color for its icon badge. These do **not** change with the palette.

| Item | Icon | Badge color |
|---|---|---|
| Dashboard | `grid` | `Palette.blue500` |
| Tickets | `ticket` | `Palette.violet500` |
| Kanban | `albums` | `Palette.amber500` |
| Epics | `git-branch` | `Palette.emerald500` |
| Features | `bulb` | `Palette.yellow500` |
| Documents | `document-text` | `Palette.cyan500` |
| Programming | `code-slash` | `Palette.indigo500` |
| Admin | `settings` | `Palette.slate500` |
| Profile | `person-circle` | `Palette.teal500` |
| Device Info | `phone-portrait` | `Palette.slate400` |
| Logout | `log-out` | `Palette.red500` |

Bottom tab accent colors (blue palette only — orange/green use `c.tint`):

| Tab | Color |
|---|---|
| Dashboard | `#3b82f6` blue-500 |
| Tickets | `#8b5cf6` violet-500 |
| Kanban | `#f59e0b` amber-500 |
| Profile | `#14b8a6` teal-500 |

---

## Domain Maps

Use exported token maps — never hardcode domain colors.

```ts
import {
  StatusColors, StatusSurfaces,
  PriorityColors, PrioritySurfaces,
  RoleColors, RoleSurfaces,
  SubscriptionColors, SubscriptionSurfaces,
} from '@/src/constants/tokens';

// ✅ Correct
const color = SubscriptionColors['ACTIVE'];          // '#059669'
const bg    = SubscriptionSurfaces.light['ACTIVE'];  // '#f0fdf4'

// ❌ Wrong — hardcoded
const color = '#16a34a';
```

---

## Drawer & Header Components

### AppHeaderBar
- Background: `c.surface.header` (palette-colored)
- Logo icon: `ticket-outline` Ionicons, color `c.text.inverse`
- App name: `c.text.inverse`
- Action icons: `c.text.inverse`
- Avatar: `c.interactive.primary` background

### AppDrawerOverlay
- Panel background: `c.surface.primary`
- Border: `c.border.primary`
- Passes `resolvedColors={c}` to `DrawerUserCard` and `DrawerNavList`

### DrawerUserCard
- Avatar: `c.interactive.primary` background (palette-aware)
- Name: `c.text.primary`
- Role badge: `c.tint` color + `c.tint + '22'` background
- Toggle buttons: `c.surface.elevated` background, `c.text.primary` text
- Theme toggle icon: `sunny-outline` / `moon-outline`
- Language toggle icon: `language-outline`

---

## AppEmptyState — Ionicons support

```tsx
// ✅ Ionicons with palette-aware color + action button with icon
<AppEmptyState
  ionicon="calendar-outline"
  ioniconColor={c.tint}
  ioniconSize={56}
  message={t('visits.noVisitsYet')}
  actionLabel={t('visits.logFirstVisit')}
  actionIcon="add-circle-outline"
  onAction={handleLogVisit}
/>

// Legacy emoji still works
<AppEmptyState icon="📭" message="No data" />
```

---

## AdminCrudScreen Action Buttons

Action buttons (View / Edit / Delete) in table rows, grid cards, and compact rows use Ionicons:

```tsx
// View
<Ionicons name="eye-outline" size={14} color={c.interactive.primary} />

// Edit
<Ionicons name="create-outline" size={14} color={c.interactive.primary} />

// Delete
<Ionicons name="trash-outline" size={14} color={c.intent.error} />
```

Background colors:
- View/Edit: `c.intent.infoSurface`
- Delete: `c.intent.errorSurface`

---

## HeaderIconButton Variants

| Variant | Background | Icon color |
|---|---|---|
| `add` | `c.interactive.primary + '20'` | `c.interactive.primary` |
| `export` | `c.intent.error + '20'` | `c.intent.error` |
| `refresh` | `c.surface.elevated` | `c.interactive.primary` |
| `neutral` | `c.surface.elevated` | `c.interactive.primary` |

Icons: `add-circle-outline`, `document-outline`, `refresh-outline`, `ellipsis-horizontal`

---

## Checklist — New Component or Screen

- [ ] All colors use `c.*` tokens from `useThemeColors()`
- [ ] `Palette.*` only at module level for domain maps — never inside render
- [ ] No hardcoded hex strings anywhere
- [ ] `c.shadow` used for shadow color with `shadowOpacity: 1`
- [ ] Icons use `<Ionicons>` — no emoji in UI
- [ ] Icon color uses `c.*` token — not hardcoded `'#ffffff'`
- [ ] `c.text.inverse` for text on colored backgrounds (header, primary buttons)
- [ ] Tab/chip active colors: `c.tint` for orange/green palettes, per-item for blue
- [ ] `StyleSheet.create` contains only static layout values — no `c.*` references
- [ ] Domain status/priority/role/subscription colors from token maps — not hardcoded
- [ ] `Pressable` style callbacks typed: `({ pressed }: { pressed: boolean }) => ...`
- [ ] If inside `<Modal>`: pass `resolvedColors={c}`, use `useUiStore(s => s.direction)`
