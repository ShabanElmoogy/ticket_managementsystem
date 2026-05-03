# Mobile Reusable Component Pattern

> **⚠️ LIVING DOCUMENT — Always update this file when:**
> - A new shared component is added to `mobile/src/shared/components/`
> - An existing component's Modal-safety status changes
> - A component is used inside a `<Modal>` for the first time
> - A new usage location is discovered for any catalogued component

---

## Rule — Dumb components receive style, not theme

Reusable components in `mobile/src/shared/components/` that are used inside a `<Modal>` **must not** call `useThemeColors()` or any context hook internally.

**Why:** React Native `Modal` renders in a separate native view tree, outside the app's provider hierarchy. Any hook that reads from a context/store (Zustand, React context) will silently return `undefined` or stale values inside a Modal. This causes colors, theme tokens, and other context values to not apply.

**Scope:** This rule is mandatory for:
- Any component rendered inside `<Modal>` (dialogs, form modals, bottom sheets)
- Any component in `shared/components/actions/` or `shared/components/dialogs/`

Screen-level components (`AppButton`, `AppTextInput`, etc.) used only in screens/pages may call `useThemeColors()` internally — they are never inside a Modal tree.

**The pattern:**

```tsx
// ✅ Correct — dumb component, receives style as props
import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

interface Props {
  label:       string;
  onPress:     () => void;
  style?:      ViewStyle;
  labelStyle?: TextStyle;
  disabled?:   boolean;
}

const MyButton: React.FC<Props> = ({ label, onPress, style, labelStyle, disabled = false }) => (
  <Pressable style={[styles.base, style, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
    <Text style={[styles.label, labelStyle]}>{label}</Text>
  </Pressable>
);
```

```tsx
// ✅ Correct — parent resolves colors from useThemeColors() and passes via style
const MyDialog = () => {
  const c = useThemeColors();   // ← hook lives HERE, in the screen/dialog component
  return (
    <Modal>
      <MyButton
        label="Delete"
        onPress={handleDelete}
        style={{ backgroundColor: c.buttons.danger.bg }}
        labelStyle={{ color: c.buttons.danger.text }}
      />
    </Modal>
  );
};
```

```tsx
// ❌ Wrong — hook inside reusable component breaks inside Modal
const MyButton = () => {
  const c = useThemeColors();   // ← undefined inside Modal tree
  return <Pressable style={{ backgroundColor: c.buttons.danger.bg }} />;
};
```

---

## Rules

1. **No hooks in shared components.** `useThemeColors()`, `useIsDark()`, `useTranslation()`, `useDirection()` — none of these belong inside a reusable component in `shared/components/`.

2. **Accept `style` and `labelStyle` props** on every component that renders a container or text. Use `StyleSheet.create` for base/default styles only.

3. **Colors come from the caller.** The screen or dialog that uses the component calls `useThemeColors()` once and passes resolved color strings into `style` props.

4. **`StyleSheet.create` for static styles only.** Dynamic values (colors, sizes that depend on props/theme) go in the inline `style` array, not in `StyleSheet.create`.

5. **Always type style props** as `ViewStyle`, `TextStyle`, or `ImageStyle` from `react-native` — never `object` or `any`.

6. **Document every component.** Add a JSDoc header to every shared component listing: where it is used, its variants, usage examples, and Modal safety status.

---

## Component prop checklist

Every new shared component must have:

- [ ] `style?: ViewStyle` — container style override
- [ ] `labelStyle?: TextStyle` — text style override (if it renders text)
- [ ] `disabled?: boolean` — with `opacity: 0.45` in disabled style
- [ ] No `useThemeColors()`, `useIsDark()`, or any context hook
- [ ] `StyleSheet.create` for base layout only (borderRadius, padding, flexDirection)
- [ ] All color props resolved by the parent and passed via `style`
- [ ] JSDoc header with: usage locations, variants, examples, Modal safety note

---

## Component catalogue

Keep this table updated whenever a component is added or its usage changes.

| Component | File | Has hooks? | Modal-safe? | Used in |
|---|---|---|---|---|
| `DialogButton` | `actions/DialogButton.tsx` | ❌ No | ✅ Yes | `AdminFormModal`, `AlertDialog`, `ConfirmDeleteDialog` |
| `AppButton` | `forms/AppButton.tsx` | ✅ Yes (`useThemeColors`, `useIsDark`) | ⚠️ Pass `resolvedColors` prop | `AdminFormPage`, screens |
| `AppTextInput` | `forms/AppTextInput.tsx` | ✅ Yes (`useThemeColors`, `useIsDark`, `useDirection`, `useTranslation`) | ❌ No — screens only | All admin forms |
| `AppBadge` | `forms/AppBadge.tsx` | ❌ No | ✅ Yes (no hooks — colors from static token maps) | `TicketsScreen`, `TenantsScreen`, `TemplatesScreen` |
| `ChipSelector` | `forms/ChipSelector.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `CustomerForm`, `DateFormatPanel`, `PaginationSettingsPanel`, `CalloutEditor` |
| `ChipRows` | `forms/ChipRows.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ChipSelector` (layout="rows"), `DateFormatPanel`, `CustomerForm` |
| `ChipTiles` | `forms/ChipTiles.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ChipSelector` (layout="tiles") |
| `AppSearchInput` | `forms/AppSearchInput.tsx` | ✅ Yes (`useThemeColors`, `useDirection`, `useTranslation`) | ❌ No — screens only | `AdminCrudScreen` |
| `AppDatePicker` | `forms/AppDatePicker.tsx` | ✅ Yes (`useThemeColors`, `useDirection`, `useTranslation`) | ❌ No — screens only | `CustomerForm` (subscriptionStartDate, subscriptionEndDate) |
| `AlertDialog` | `dialogs/AlertDialog.tsx` | ✅ Yes (`useThemeColors`) | ✅ Yes — `useThemeColors()` called at component level, before `<Modal>` renders | Standalone modal |
| `ConfirmDeleteDialog` | `dialogs/ConfirmDeleteDialog.tsx` | ✅ Yes (`useThemeColors`, `useTranslation`) | ❌ No | `AdminCrudScreen`, feature screens |
| `ForceDeleteConfirmDialog` | `dialogs/ForceDeleteConfirmDialog.tsx` | ✅ Yes (`useThemeColors`, `useTranslation`) | ❌ No | `UsersScreen` (force-delete), feature screens |
| `FormSection` | `forms/FormSection.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | All admin feature forms (CustomerForm, UserForm, etc.) — page context only |
| `AppForm` | `forms/AppForm.tsx` | ❌ No | ✅ Yes (no hooks) | `AdminFormPage` (when `form` prop is passed). Provides `FormProvider` + `FormFocusProvider` + `ScrollView`. Exposes `focusFirst` via `onFocusRef` callback. |
| `AppFormField` | `forms/AppFormField.tsx` | ✅ Yes (`useFormContext`, `useFormFocus`) | ❌ No — screens only | `CustomerForm` (all text input fields) |
| `FormFocusContext` | `forms/FormFocusContext.tsx` | ❌ No (context only — `useRef`, `useCallback`) | ✅ Yes | `AppForm` (provides `FormFocusProvider`), `AppFormField` (calls `useFormFocus`) |
| `SegmentedControl` | `forms/SegmentedControl.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `LanguageSwitcher` |
| `HeaderIconButton` | `actions/HeaderIconButton.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `HeaderActionGroup` |
| `DataCard` | `data/DataCard.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `AdminCrudScreen`, `ReportCard` |
| `CompactListRow` | `data/CompactListRow.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ReportCompactRow` |
| `AppDataTable` | `data/AppDataTable.tsx` | ✅ Yes (`useThemeColors`, `useWindowDimensions`) | ❌ No — screens only | `AdminCrudScreen` |
| `AppPagination` | `data/AppPagination.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `DataCard`, `PaginatedView` |
| `PaginatedView` | `data/PaginatedView.tsx` | ❌ No (no hooks — delegates to `AppPagination`) | ✅ Yes | `DataCard` (table view with pagination) |
| `FilterChipGroup` | `data/FilterChipGroup.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ReportTypeSelector`, `ActivityPeriodSelector` (reports feature) |
| `SectionHeader` | `display/SectionHeader.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `DataCard`, `ReportCardHeader`, `AdminDashboardScreen` |
| `StatBadge` | `display/StatBadge.tsx` | ❌ No | ✅ Yes | `StatCard` |
| `StatCard` | `display/StatCard.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ReportGridCard.tsx` — grid view card for report rows |
| `AppEmptyState` | `feedback/AppEmptyState.tsx` | ✅ Yes (`useThemeColors`) | ✅ Yes — `useThemeColors()` called at component level, before any `<Modal>` renders | `DataCard` (`ListEmptyComponent` for grid and compact views), `ReportCard` |
| `AppToast` | `feedback/AppToast.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — root layout only | `app/_layout.tsx` via `<Toast config={toastConfig} />` |

---

## AppBadge — component note

`AppBadge` (`mobile/src/shared/components/forms/AppBadge.tsx`) is a colored pill badge.

**Variants:**
- `'status'` — auto-resolves color from `StatusColors` (OPEN, IN_PROGRESS, RESOLVED, CLOSED, etc.)
- `'priority'` — auto-resolves color from `PriorityColors` (LOW, MEDIUM, HIGH, URGENT)
- `'role'` — reserved for future role badges
- `'custom'` — pass explicit `color` prop

**Current usages:**
1. `TicketsScreen` — status + priority columns in the data table
2. `TenantsScreen` — subscription status column
3. `TemplatesScreen` — priority column

**⚠️ Modal rule:** `AppBadge` is Modal-safe — it has no hooks. Colors are resolved from static `StatusColors` / `PriorityColors` token maps. You can render it directly inside a `<Modal>` without any extra steps.

---

## Reference implementation

`mobile/src/shared/components/actions/DialogButton.tsx` — canonical example of this pattern.

```tsx
const DialogButton: React.FC<DialogButtonProps> = ({
  label, onPress, style, labelStyle, disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={[styles.base, style, disabled && styles.disabled]}
  >
    <Text style={[styles.label, labelStyle]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base:     { width: '100%', borderRadius: Radius.xl, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, letterSpacing: 0.3 },
  disabled: { opacity: 0.45 },
});
```

---

## Localization (i18n)

> **Always update both `en.json` and `ar.json` together.** A key missing in one language will fall back to the key string, not the English text.

### Setup

- Library: `i18next` + `react-i18next`
- Languages: `en` (default) + `ar` (Arabic, RTL)
- Files: `mobile/src/i18n/locales/en.json` and `ar.json`
- Init: `mobile/src/i18n/index.ts` — synchronous init at module load, async language restore from `AsyncStorage`

### How to use in components

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <Text>{t('common.save')}</Text>;
};
```

### Key structure — namespace map

All keys live under a flat namespace (no sub-namespaces). Top-level sections:

| Section | Purpose | Example key |
|---|---|---|
| `common.*` | Shared UI labels (Save, Cancel, Back…) | `t('common.save')` |
| `validation.*` | Form validation messages | `t('validation.required', { field: 'Name' })` |
| `nav.*` | Navigation labels | `t('nav.adminPanel')` |
| `applications.*` | Applications feature | `t('applications.addTitle')` |
| `customers.*` | Customers feature | `t('customers.form.name')` |
| `users.*` | Users feature | `t('users.roles.employee')` |
| `tenants.*` | Tenants feature | `t('tenants.columns.status')` |
| `templates.*` | Templates feature | `t('templates.messages.created')` |
| `tickets.*` | Tickets feature | `t('tickets.title')` |
| `dashboard.*` | Dashboard screen | `t('dashboard.title')` |
| `adminDashboard.*` | Admin dashboard stats | `t('adminDashboard.totalCustomers')` |
| `settings.*` | Settings panels | `t('settings.pagination.title')` |
| `errors.*` | Error boundary messages | `t('errors.network.message')` |
| `deviceInfo.*` | Device info screen | `t('deviceInfo.labels.osVersion')` |

### Feature key pattern

Every admin feature follows this structure:

```json
"featureName": {
  "title":               "Feature Name",
  "itemType":            "item",
  "addTitle":            "Add Item",
  "editTitle":           "Edit Item",
  "notFound":            "Item not found",
  "searchPlaceholder":   "Search items…",
  "emptyMessage":        "No items yet",
  "emptyFilteredMessage":"No items match your search",
  "columns": { "name": "Name", "created": "Created" },
  "form":    { "name": "Name *", "namePlaceholder": "Item name" },
  "messages": {
    "created":         "Item created successfully",
    "updated":         "Item updated successfully",
    "deleted":         "Item deleted successfully",
    "errorCreate":     "Error creating item",
    "errorUpdate":     "Error updating item",
    "errorDelete":     "Error deleting item",
    "validationError": "Please fix the errors before saving"
  }
}
```

### Interpolation

```tsx
// Variable substitution
t('validation.required', { field: 'Name' })
// → "Name is required"

// Plural (not yet used — use explicit keys instead)
t('users.forceDelete.message', { name: user.name })
// → '"John" has tickets or comments...'
```

### RTL support

Direction is controlled by `uiStore.direction` (`'ltr'` | `'rtl'`), set automatically when language changes.

- **Do NOT use `marginLeft`/`marginRight`** — use `marginStart`/`marginEnd` (logical properties that flip with RTL)
- **Text alignment** — always set explicitly: `textAlign: isRtl ? 'right' : 'left'`
- **`TextInput`** — set `writingDirection` and `textAlign` explicitly (not inherited)
- **`flexDirection: 'row'`** — inherits from `DirectionProvider` root View, flips automatically

```tsx
// ✅ RTL-safe
const { isRtl } = useDirection();
<Text style={{ textAlign: isRtl ? 'right' : 'left' }}>{t('common.save')}</Text>
<View style={{ marginStart: 8 }} />   // flips automatically

// ❌ Not RTL-safe
<Text style={{ textAlign: 'left' }} />
<View style={{ marginLeft: 8 }} />
```

### Adding a new feature — checklist

When adding a new admin feature, add keys to **both** locale files:

- [ ] `en.json` — English strings
- [ ] `ar.json` — Arabic strings (same structure, translated values)
- [ ] Follow the feature key pattern above
- [ ] Add `sections.*` keys if the form uses `<FormSection>` grouping
- [ ] Add `pdf.*` keys if the feature has PDF export
- [ ] Use `t()` for ALL user-visible strings — no hardcoded English in JSX

### Locale file location

```
mobile/src/i18n/
├── index.ts              ← init + changeLanguage + getCurrentLanguage
└── locales/
    ├── en.json           ← English (source of truth)
    └── ar.json           ← Arabic (must mirror en.json structure exactly)
```

### Language switching

```ts
import { changeLanguage } from '@/src/i18n';

// Switch to Arabic — updates i18n + uiStore.direction + AsyncStorage
await changeLanguage('ar');

// Switch to English
await changeLanguage('en');
```

No app reload needed. `DirectionProvider` re-renders instantly when `uiStore.direction` changes.

---

## Common Patterns — Admin Feature Development

> These patterns are used in every admin feature. Follow them exactly for consistency.

---

### Pattern 1 — Feature Folder Structure

Every admin feature follows this exact layout:

```
features/admin/<feature>/
├── api/
│   └── <feature>.ts              ← BaseApiService subclass + singleton + query keys
├── components/
│   ├── <feature>Columns.tsx      ← ColDef[] factory: get<Feature>Columns(t)
│   ├── <Entity>Form.tsx          ← Dual-mode form (page + modal)
│   └── <Entity>DetailScreen.tsx  ← Read-only detail view
├── hooks/
│   ├── use<Feature>.ts           ← useAdminFeature wrapper + export/selectedId
│   └── use<Feature>Form.ts       ← Form state, validation, submit
├── schemas/
│   └── <feature>Schema.ts        ← Zod factory: createXSchema(t)
├── utils/
│   └── export<Entity>Pdf.ts      ← PDF export function
└── <Feature>Screen.tsx           ← Orchestration: list / detail / edit
```

---

### Pattern 2 — API Service Class

```typescript
// ✅ Correct pattern
export class CustomersApiService extends BaseApiService {
  getCustomers   = (params?: Record<string, string>) => this.get<Customer[]>(API.CUSTOMERS.LIST, { params });
  getCustomer    = (id: string)                      => this.get<Customer>(API.CUSTOMERS.BY_ID(id));
  createCustomer = (data: CreateCustomerData)        => this.post<Customer>(API.CUSTOMERS.LIST, data);
  updateCustomer = (id: string, data: Partial<...>)  => this.put<Customer>(API.CUSTOMERS.BY_ID(id), data);
  deleteCustomer = (id: string)                      => this.delete<{ message: string }>(API.CUSTOMERS.BY_ID(id));
}

export const customersApi  = new CustomersApiService();
export const customersKeys = QUERY_KEYS.CUSTOMERS;  // ← always from constants/api
```

**Rules:**
- All methods are arrow function class properties (not class methods)
- All paths use `API.*` constants — never hardcoded strings
- Query keys from `QUERY_KEYS.*` — never defined locally
- `getAll` method accepts `params?: Record<string, string>` for pagination

---

### Pattern 3 — useAdminFeature Hook

```typescript
export function useCustomers() {
  const { t } = useTranslation();
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const columns = useMemo(() => getCustomerColumns(t), [t]);

  const f = useAdminFeature<Customer, CreateCustomerData>({
    entityName: 'customers',
    queryKey:   customersKeys.all,
    api: {
      getAll:  customersApi.getCustomers.bind(customersApi),
      create:  customersApi.createCustomer.bind(customersApi),
      update:  customersApi.updateCustomer.bind(customersApi),
      delete:  customersApi.deleteCustomer.bind(customersApi),
    },
    messages: {
      success: { created: t('customers.messages.created'), updated: t('...'), deleted: t('...') },
      error:   { create:  t('customers.messages.errorCreate'), update: t('...'), delete: t('...') },
      titles:  { create:  t('customers.addTitle'), edit: t('customers.editTitle') },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportCustomerPdf(f.entities, t); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport, selectedId, setSelectedId };
}
```

**`f` object contains:** `entities`, `loading`, `refetch`, `create`, `update`, `remove`, `ui`, `apiMeta`, `openDialog`, `closeDialog`, `messages`, `handleSubmit`, `handleDeleteConfirm`

---

### Pattern 4 — Column Definitions Factory

```typescript
export function getCustomerColumns(t: TFunction): ColDef<Customer>[] {
  return [
    { field: 'name',  headerName: t('customers.columns.name'),  flex: 1, sortable: true },
    { field: 'email', headerName: t('customers.columns.email'), width: 160 },
    {
      field: '_count', headerName: t('customers.columns.tickets'), width: 70, align: 'center',
      valueGetter: (row) => row._count?.tickets ?? 0,
      renderCell:  (row) => <CountBadge count={row._count?.tickets ?? 0} />,
    },
  ];
}
```

**Rules:**
- Signature: `(t: TFunction): ColDef<T>[]`
- All header names use `t()`
- Empty values shown as `'—'`
- Memoized in feature hook: `useMemo(() => getXColumns(t), [t])`

---

### Pattern 5 — Zod Schema Factory

```typescript
export const createCustomerFormSchema = (t: TFunction) =>
  z.object({
    name:  z.string().trim().min(2, t('validation.minLength', { field: t('common.name'), min: 2 })),
    email: z.string().trim().check(z.email(t('validation.invalidEmail'))),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    maintenanceType: z.enum(MAINTENANCE_TYPES).nullable().optional(),
  })
  .refine(
    (d) => !d.maintenanceType || !!d.subscriptionStartDate,
    { message: t('validation.required', { field: '...' }), path: ['subscriptionStartDate'] },
  );

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerFormSchema>>;
```

**Rules:**
- Signature: `(t: TFunction) => ZodSchema`
- Always `.trim()` before `.min()` / `.max()`
- Optional string fields: `.optional().or(z.literal(''))`
- Cross-field validation: `.refine()` with `path: [fieldName]`
- Export inferred type: `z.infer<ReturnType<typeof schema>>`

---

### Pattern 6 — Form Hook (use\<Feature\>Form)

```typescript
export function useCustomerForm({ item, onSave, onClose }) {
  const getInitial = useCallback((): FormFields => ({
    name:  item?.name  ?? '',
    email: item?.email ?? '',
  }), [item?.id]); // ← dep on id only, not full object

  const [fields,       setFields]       = useState(getInitial);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [isDirty,      setIsDirty]      = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setFields(getInitial()); setErrors({}); setIsDirty(false); }, [getInitial]);

  const handleChange = useCallback((field: keyof FormFields, value: string) => {
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(checkDirty(next));
      return next;
    });
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, [checkDirty]);

  const handleSubmit = useCallback(async () => {
    const result = schema.safeParse(fields);
    if (!result.success) { /* set errors, toast */ return; }
    setIsSubmitting(true);
    try {
      await onSave(result.data);
      toast.success(item ? t('...updated') : t('...created'));
      onClose(); // ← toast BEFORE onClose
    } catch { toast.error('...'); }
    finally { setIsSubmitting(false); }
  }, [fields, ...]);

  return { fields, errors, isDirty, isSubmitting, handleChange, handleClear, handleSubmit };
}
```

**Rules:**
- `getInitial` deps: `[item?.id]` only — not `[item]`
- Date fields normalized to `YYYY-MM-DD` via `toISOString().split('T')[0]`
- Errors deleted (not set to `''`) on field change
- Toast called **before** `onClose()` — page unmounts on close
- Return shape: `{ fields, errors, isDirty, isSubmitting, handleChange, handleClear, handleSubmit }`

---

### Pattern 7 — Screen Orchestration (3 view states)

```typescript
const CustomersScreen: React.FC = () => {
  const { f, columns, selectedId, setSelectedId } = useCustomers();
  const [editingFromDetail, setEditingFromDetail] = useState<Customer | null>(null);

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedId && !editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Customers">
        <CustomerDetailScreen
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditingFromDetail(f.entities.find(c => c.id === selectedId) ?? null)}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── Edit from detail ─────────────────────────────────────────────────────
  if (editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Customers">
        <CustomerForm
          item={editingFromDetail}
          onClose={() => { setEditingFromDetail(null); setSelectedId(editingFromDetail.id); }}
          onSave={async (data) => {
            await f.update(editingFromDetail.id, data);
            setEditingFromDetail(null);
            setSelectedId(editingFromDetail.id); // ← return to detail
          }}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── List view (default) ──────────────────────────────────────────────────
  return (
    <FeatureErrorBoundary featureName="Customers">
      <AdminCrudScreen<Customer>
        title={t('customers.title')}
        entities={f.entities}
        loading={f.loading}
        columns={columns}
        onRowPress={(c) => setSelectedId(c.id)}
        renderForm={(item, onClose) => <CustomerForm item={item} onClose={onClose} ... />}
      />
    </FeatureErrorBoundary>
  );
};
```

**State machine:** `list` → `detail` (selectedId set) → `edit` (editingFromDetail set)
After edit save → return to detail. After detail close → return to list.

---

### Pattern 8 — AdminCrudScreen Props

Required props:

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | `t('feature.title')` |
| `entities` | `T[]` | From `f.entities` |
| `loading` | `boolean` | From `f.loading` |
| `columns` | `ColDef<T>[]` | From `getXColumns(t)` |
| `searchFields` | `(keyof T)[]` | Fields to search |
| `onDelete` | `(id) => Promise<void>` | `f.remove` |
| `renderForm` | `(item, onClose) => ReactNode` | Form component |

Optional but common:

| Prop | Notes |
|---|---|
| `onRowPress` | Shows View button, navigates to detail |
| `onExport` | Shows Export button |
| `onRefresh` | Shows Refresh button |
| `apiTotal` | SERVER pagination: total from API |
| `onPageChange` | SERVER pagination: called on page change |

---

### Pattern 9 — Detail Screen Layout

Standard layout for every detail screen:

```tsx
<AdminDetailScreen title={entity?.name} subtitle={entity?.company} isLoading={isLoading} ...>

  {/* 1. Hero card — accent bar + avatar + name + badge */}
  <View style={heroCardStyle}>
    <View style={[accentBar, { backgroundColor: accentColor }]} />
    <InitialsAvatar name={entity.name} color={accentColor} />
    <Text>{entity.name}</Text>
    <StatusBadge />
  </View>

  {/* 2. Stats row — _count relations */}
  <DetailStatRow stats={[
    { value: entity._count?.tickets ?? 0, label: t('...'), color: '#1d4ed8', bgColor: '#eff6ff' },
  ]} />

  {/* 3. Info cards — metadata */}
  <DetailInfoCard title={t('...')} fields={[
    { icon: '✉️', label: t('common.email'), value: entity.email },
    { icon: '📅', label: t('common.created'), value: formatDate(entity.createdAt) },
  ]} />

</AdminDetailScreen>
```

---

### Pattern 10 — PDF Export

```typescript
export async function exportEntityPdf(items: Entity[], t: TFunction): Promise<void> {
  const head = `<tr><th>${esc(t('entity.columns.name'))}</th>...</tr>`;
  const body = items.map((item) => `<tr><td>${esc(item.name)}</td>...</tr>`).join('');
  const html = buildPdfPage(`${t('entity.title')} (${items.length})`,
    `<table><thead>${head}</thead><tbody>${body}</tbody></table>`);

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}
```

**Helpers:** `buildPdfPage(title, body)` from `@/src/shared/utils/pdfTemplate` · `esc(s)` from `@/src/shared/utils/htmlUtils`

---

### New Feature Checklist

When adding a new admin feature, complete all steps:

**Files to create:**
- [ ] `api/<feature>.ts` — service + singleton + query keys
- [ ] `components/<feature>Columns.tsx` — `get<Feature>Columns(t)` factory
- [ ] `components/<Entity>Form.tsx` — dual-mode form (page + modal)
- [ ] `components/<Entity>DetailScreen.tsx` — read-only detail
- [ ] `hooks/use<Feature>.ts` — `useAdminFeature` wrapper
- [ ] `hooks/use<Feature>Form.ts` — form state + validation
- [ ] `schemas/<feature>Schema.ts` — Zod factory
- [ ] `utils/export<Entity>Pdf.ts` — PDF export
- [ ] `<Feature>Screen.tsx` — 3-state orchestration

**Constants to add:**
- [ ] `API.<FEATURE>.*` paths in `mobile/src/constants/api.ts`
- [ ] `QUERY_KEYS.<FEATURE>` in `mobile/src/constants/api.ts`

**i18n keys to add (both `en.json` and `ar.json`):**
- [ ] `<feature>.title`, `itemType`, `addTitle`, `editTitle`, `notFound`
- [ ] `<feature>.searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage`
- [ ] `<feature>.columns.*`
- [ ] `<feature>.form.*`
- [ ] `<feature>.messages.*` (created, updated, deleted, errorCreate, errorUpdate, errorDelete, validationError)
- [ ] `<feature>.pdf.*` (if PDF export)
- [ ] `<feature>.sections.*` (if FormSection used)

**Wire into AdminPanel:**
- [ ] Import screen in `mobile/src/features/admin/AdminPanel.tsx`
- [ ] Add menu item to `MENU_ITEMS` array with `id`, `label`, `icon`, optional `roles`
- [ ] Add `case` in `renderContent()` switch
