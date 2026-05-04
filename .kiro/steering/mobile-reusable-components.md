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
**Modal rule:** always pass `resolvedColors={c}` and `isRtlOverride={isRtl}` when inside a `<Modal>`.

```tsx
// ✅ Correct — uses AppButton with resolvedColors inside Modal
const c = useThemeColors();
<AppButton variant="primary" size="large" fullWidth loading={busy}
  resolvedColors={c} isRtlOverride={isRtl} onPress={handleSubmit}>
  Save
</AppButton>

// ❌ Wrong — custom Pressable + ActivityIndicator + hardcoded colors
<Pressable style={{ backgroundColor: '#2563eb', borderRadius: 12 }} onPress={handleSubmit}>
  <ActivityIndicator color="#fff" />
  <Text style={{ color: '#fff' }}>Save</Text>
</Pressable>
```

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
| Stat card (number + label) | `StatCard` from `@/src/shared/components/display/StatCard` |
| Section heading | `SectionHeader` from `@/src/shared/components/display/SectionHeader` |
| Empty state | `AppEmptyState` from `@/src/shared/components/feedback/AppEmptyState` |
| Table + pagination | `AppDataTable` + `DataCard` |

### Layout
| Need | Use |
|---|---|
| Screen header with actions | `AppScreenHeader` |
| View toggle (table/grid/compact) | `ViewToggle` |
| Form section with title | `FormSection` |
| Form field wrapper | `AppFormField` |

---

## When to extract a new shared component

Extract to `mobile/src/shared/components/` when **any** of these are true:

1. The same JSX pattern appears in **2 or more** different feature files
2. The component has **no domain-specific logic** (no API calls, no feature types)
3. It is purely presentational — driven entirely by props

**Do not extract** when:
- The component is only used in one feature
- It contains feature-specific business logic or API calls
- It imports from a specific feature's types

---

## Color rule — no hardcoded hex in components

```tsx
// ❌ Wrong — hardcoded hex
backgroundColor: '#2563eb'
color: '#dc2626'
borderColor: '#e2e8f0'

// ✅ Correct — theme tokens
backgroundColor: c.interactive.primary      // from useThemeColors()
color: c.intent.error
borderColor: c.border.primary

// ✅ Also correct — Palette constants (for domain color maps only)
import { Palette } from '@/src/constants/theme';
pinColor={Palette.blue600}
```

**Rule:** `useThemeColors()` for all UI colors. `Palette.*` only for domain-specific color maps (status configs, priority maps) defined at module level outside components.

---

## Spacing/sizing rule — no magic numbers

```tsx
// ❌ Wrong
paddingHorizontal: 20
borderRadius: 12
gap: 8
borderWidth: 1

// ✅ Correct
import { Spacing, Radius, BorderWidth } from '@/src/constants/theme';
paddingHorizontal: Spacing.xl      // 20
borderRadius: Radius.lg            // 12
gap: Spacing.sm                    // 8
borderWidth: BorderWidth.thin      // 1
```

---

## StyleSheet rule — no dynamic values in StyleSheet.create

```tsx
// ❌ Wrong — dynamic value in StyleSheet.create
const st = StyleSheet.create({
  btn: { backgroundColor: c.interactive.primary }  // c is not available at module level
});

// ✅ Correct — static layout in StyleSheet, dynamic colors inline
const st = StyleSheet.create({
  btn: { borderRadius: Radius.lg, paddingVertical: Spacing.md }
});
// Then in JSX:
<View style={[st.btn, { backgroundColor: c.interactive.primary }]} />
```

---

## Modal safety rule

Components rendered inside `<Modal>` cannot access React context providers. Follow these rules:

| Hook | Inside Modal? | Fix |
|---|---|---|
| `useThemeColors()` | ❌ Returns stale/undefined | Call in parent, pass as `resolvedColors` prop |
| `useDirection()` | ❌ Returns undefined | Use `useUiStore(s => s.direction)` instead |
| `useTranslation()` | ✅ Works | i18next is global, not context-based |
| `useAuthStore()` | ✅ Works | Zustand is global |

```tsx
// ✅ Pattern for any component used inside a Modal
const MyModalContent: React.FC<{ resolvedColors: ThemeColors }> = ({ resolvedColors: c }) => {
  const direction = useUiStore((s) => s.direction);  // ✅ Zustand — works in Modal
  const isRtl = direction === 'rtl';
  // Use c.* for all colors — never call useThemeColors() here
};
```

---

## Checklist before writing new UI code

- [ ] Checked `mobile/src/shared/components/` catalogue — no existing component for this need
- [ ] All colors use `c.*` tokens from `useThemeColors()` or `Palette.*` constants
- [ ] All spacing uses `Spacing.*`, `Radius.*`, `BorderWidth.*` tokens
- [ ] `StyleSheet.create` contains only static values (no `c.*` references)
- [ ] Buttons use `AppButton` — not custom `Pressable` + `ActivityIndicator`
- [ ] Text inputs use `AppTextInput` or `AppSearchInput` — not raw `TextInput`
- [ ] Delete confirmations use `ConfirmDeleteDialog` — not custom modal
- [ ] Status/priority badges use `AppBadge` — not custom `View` + `Text`
- [ ] If inside a `<Modal>`: `AppButton` receives `resolvedColors={c}`, direction from `useUiStore`
- [ ] If pattern appears in 2+ places: extracted to `shared/components/`
