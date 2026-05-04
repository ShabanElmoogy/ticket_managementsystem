---
inclusion: always
---

# Mobile — Reusable Component Rule

## Rule: Always check shared components before building new UI

Before writing any new UI element in the mobile app, check whether a shared component already exists in `mobile/src/shared/components/`. If it does, use it. If a pattern appears in 2+ places, extract it.

---

## Shared component catalogue — check this first

### Buttons
| Need | Use |
|---|---|
| Any action button | `AppButton` from `@/src/shared/components/forms/AppButton` |
| Icon-only header button | `HeaderIconButton` from `@/src/shared/components/actions/HeaderIconButton` |
| Dialog confirm/cancel | `DialogButton` from `@/src/shared/components/actions/DialogButton` |

**`AppButton` variants:** `primary` · `secondary` · `outline` · `ghost` · `danger` · `success`  
**`AppButton` sizes:** `small` · `medium` · `large`  
**`AppButton` icon props:** `leftIcon` · `rightIcon` — pass `<Ionicons>` node  
**Modal rule:** always pass `resolvedColors={c}` and `isRtlOverride={isRtl}` when inside a `<Modal>`.

```tsx
// ✅ Correct — uses AppButton with resolvedColors inside Modal
const c = useThemeColors();
<AppButton variant="primary" size="large" fullWidth loading={busy}
  resolvedColors={c} isRtlOverride={isRtl} onPress={handleSubmit}>
  Save
</AppButton>

// ✅ With Ionicons icon
<AppButton
  variant="primary"
  leftIcon={<Ionicons name="add-circle-outline" size={16} color="#ffffff" />}
  onPress={handleAdd}
>
  Add Item
</AppButton>

// ❌ Wrong — custom Pressable + hardcoded colors
<Pressable style={{ backgroundColor: '#2563eb', borderRadius: 12 }} onPress={handleSubmit}>
  <Text style={{ color: '#fff' }}>Save</Text>
</Pressable>
```

### Icons — Ionicons only
**No emoji icons in UI components.** All icons use `@expo/vector-icons` Ionicons.

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { IoniconName } from '@/src/components/layout/header/navItems';

// ✅ Correct
<Ionicons name="map-outline" size={20} color={c.text.secondary} />

// ❌ Wrong — emoji
<Text style={{ fontSize: 20 }}>🗺️</Text>
```

See `mobile-theme-system.md` for the full icon map.

### Inputs
| Need | Use |
|---|---|
| Text input | `AppTextInput` from `@/src/shared/components/forms/AppTextInput` |
| Search input | `AppSearchInput` from `@/src/shared/components/forms/AppSearchInput` |
| Date picker | `AppDatePicker` from `@/src/shared/components/forms/AppDatePicker` |
| Chip selector | `ChipSelector` from `@/src/shared/components/forms/ChipSelector` |

### Dialogs
| Need | Use |
|---|---|
| Delete confirmation | `ConfirmDeleteDialog` from `@/src/shared/components/dialogs/ConfirmDeleteDialog` |
| Force-delete (type to confirm) | `ForceDeleteConfirmDialog` |
| Generic alert | `AlertDialog` |

### Data display
| Need | Use |
|---|---|
| Status/priority pill | `AppBadge` from `@/src/shared/components/forms/AppBadge` |
| Stat card (number + label) | `AdminStatCard` from `@/src/features/admin/shared/AdminStatCard` |
| Section heading | `SectionHeader` from `@/src/shared/components/display/SectionHeader` |
| Empty state (with Ionicons) | `AppEmptyState` from `@/src/shared/components/feedback/AppEmptyState` |
| Table + pagination | `AppDataTable` + `DataCard` |

**`AppEmptyState` — Ionicons support:**
```tsx
// ✅ New — Ionicons with palette-aware color
<AppEmptyState
  ionicon="calendar-outline"
  ioniconColor={c.tint}
  message={t('visits.noVisitsYet')}
  actionLabel={t('visits.logFirstVisit')}
  actionIcon="add-circle-outline"
  onAction={handleLogVisit}
/>

// Legacy emoji still works
<AppEmptyState icon="📭" message="No data" />
```

### Navigation
| Need | Use |
|---|---|
| Bottom tab item | `BottomNavItem` — uses Ionicons, per-tab accent colors |
| Drawer nav item | `NavItem` — colored icon badge + label |
| Screen header | `AppScreenHeader` |
| View toggle | `ViewToggle` |

### Layout
| Need | Use |
|---|---|
| Form section with title | `FormSection` |
| Form field wrapper | `AppFormField` |
| Admin CRUD screen | `AdminCrudScreen` |
| Admin detail screen | `AdminDetailScreen` |
| Detail info card | `DetailInfoCard` |
| Detail stat row | `DetailStatRow` |

---

## When to extract a new shared component

Extract to `mobile/src/shared/components/` when **any** of these are true:

1. The same JSX pattern appears in **2 or more** different feature files
2. The component has **no domain-specific logic** (no API calls, no feature types)
3. It is purely presentational — driven entirely by props

---

## Color rule — no hardcoded hex in components

```tsx
// ❌ Wrong — hardcoded hex
backgroundColor: '#2563eb'
color: '#dc2626'
borderColor: '#e2e8f0'
shadowColor: '#1d4ed8'

// ✅ Correct — theme tokens
backgroundColor: c.interactive.primary      // from useThemeColors()
color:           c.intent.error
borderColor:     c.border.primary
shadowColor:     c.shadow                   // pre-tuned rgba per palette

// ✅ Also correct — Palette constants (module-level domain maps only)
import { Palette } from '@/src/constants/tokens';
const STATUS_COLORS = { OPEN: Palette.amber500 };  // ✅ module level
```

**Rule:** `useThemeColors()` for all UI colors. `Palette.*` only for domain-specific color maps defined at module level outside components. Never use `Palette.*` inside component render.

---

## Shadow rule

```tsx
// ✅ Correct — c.shadow adapts to palette
shadowColor:   c.shadow,
shadowOffset:  { width: 0, height: 2 },
shadowOpacity: 1,        // opacity is baked into c.shadow rgba alpha
shadowRadius:  6,
elevation:     4,

// ❌ Wrong — hardcoded, clashes with orange/green palettes
shadowColor:   '#1d4ed8',
shadowOpacity: 0.35,
```

---

## Palette-aware active color rule

For tab bars, chip bars, and any element with per-item accent colors:

```tsx
import { useUiStore } from '@/src/stores/uiStore';

const paletteOption = useUiStore((s) => s.paletteOption);
const useItemColors = paletteOption === 'blue';

// Blue palette: use per-item colors (multi-hue)
// Orange/Green palette: use c.tint (cohesive with palette)
const activeColor = useItemColors ? item.color : c.tint;
```

---

## Spacing/sizing rule — no magic numbers

```tsx
// ❌ Wrong
paddingHorizontal: 20
borderRadius: 12
gap: 8

// ✅ Correct
import { Spacing, Radius, BorderWidth } from '@/src/constants/theme';
paddingHorizontal: Spacing.xl      // 20
borderRadius:      Radius.lg       // 12
gap:               Spacing.sm      // 8
```

---

## StyleSheet rule — no dynamic values in StyleSheet.create

```tsx
// ❌ Wrong — c.* not available at module level
const st = StyleSheet.create({
  btn: { backgroundColor: c.interactive.primary }
});

// ✅ Correct — static layout only, dynamic colors inline
const st = StyleSheet.create({
  btn: { borderRadius: Radius.lg, paddingVertical: Spacing.md }
});
<View style={[st.btn, { backgroundColor: c.interactive.primary }]} />
```

---

## Modal safety rule

Components rendered inside `<Modal>` cannot access React context providers.

| Hook | Inside Modal? | Fix |
|---|---|---|
| `useThemeColors()` | ❌ Returns stale/undefined | Call in parent, pass as `resolvedColors` prop |
| `useDirection()` | ❌ Returns undefined | Use `useUiStore(s => s.direction)` instead |
| `useTranslation()` | ✅ Works | i18next is global |
| `useAuthStore()` | ✅ Works | Zustand is global |

```tsx
// ✅ Pattern for any component used inside a Modal
const MyModalContent: React.FC<{ resolvedColors: ThemeColors }> = ({ resolvedColors: c }) => {
  const direction = useUiStore((s) => s.direction);
  const isRtl = direction === 'rtl';
  // Use c.* for all colors — never call useThemeColors() here
};
```

---

## Checklist before writing new UI code

- [ ] Checked `mobile/src/shared/components/` catalogue — no existing component for this need
- [ ] All colors use `c.*` tokens from `useThemeColors()` — no hardcoded hex
- [ ] `Palette.*` only at module level for domain maps — never inside render
- [ ] `c.shadow` used for shadow color with `shadowOpacity: 1`
- [ ] All spacing uses `Spacing.*`, `Radius.*`, `BorderWidth.*` tokens
- [ ] `StyleSheet.create` contains only static values (no `c.*` references)
- [ ] Icons use `<Ionicons>` — no emoji in UI
- [ ] Icon color uses `c.*` token — not hardcoded `'#ffffff'`
- [ ] `c.text.inverse` for text on colored backgrounds (header, primary buttons)
- [ ] Tab/chip active colors: `c.tint` for orange/green palettes, per-item for blue
- [ ] Buttons use `AppButton` — not custom `Pressable` + `ActivityIndicator`
- [ ] Text inputs use `AppTextInput` or `AppSearchInput` — not raw `TextInput`
- [ ] Delete confirmations use `ConfirmDeleteDialog` — not custom modal
- [ ] Status/priority badges use `AppBadge` — not custom `View` + `Text`
- [ ] If inside a `<Modal>`: `AppButton` receives `resolvedColors={c}`, direction from `useUiStore`
- [ ] If pattern appears in 2+ places: extracted to `shared/components/`
- [ ] Domain status/priority/role colors from token maps — not hardcoded
