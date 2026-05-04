---
inclusion: always
---

# Mobile — Unified Form Pattern

**Reference implementation:** `mobile/src/features/admin/customers/components/CustomerForm.tsx`

Every admin feature form in the mobile app must follow this pattern exactly.
Do not invent a new approach — replicate CustomerForm.

---

## Architecture Overview

```
<Feature>Form.tsx
  ├── useForm() + zodResolver          ← RHF + Zod, single source of truth
  ├── useFocusInput()                  ← auto-focus first field on open
  ├── useRef() chain                   ← keyboard Next navigation
  ├── doSave()                         ← submit handler (toast + onClose)
  ├── fields_jsx                       ← shared JSX for page + modal
  ├── <AdminFormPage form={form}>      ← page mode shell
  └── <AdminFormModal>                 ← modal mode shell

schemas/<feature>Schema.ts
  └── createXFormSchema(t)             ← Zod factory with i18n errors
```

---

## 1 — Props Interface

Every form accepts exactly these props:

```tsx
interface Props {
  item:       EntityType | null;   // null = create, non-null = edit
  onClose:    () => void;
  onSave:     (data: CreateEntityData) => Promise<void>;
  submitting: boolean;             // from useAdminFeature / parent
  mode?:      'page' | 'modal';   // default: 'page'
}
```

---

## 2 — Schema File

Location: `features/admin/<feature>/schemas/<feature>Schema.ts`

```ts
import { z } from 'zod';
import type { TFunction } from 'i18next';

export const createEntityFormSchema = (t: TFunction) =>
  z.object({
    // Required string
    name: z.string().trim()
      .min(2,   t('validation.minLength', { field: t('common.name'), min: 2 }))
      .max(100, t('validation.maxLength', { field: t('common.name'), max: 100 })),

    // Required email
    email: z.string().trim()
      .check(z.email(t('validation.invalidEmail'))),

    // Optional string — allow empty string
    phone: z.string().trim()
      .max(30, t('validation.maxLength', { field: t('common.phone'), max: 30 }))
      .optional().or(z.literal('')),

    // Optional enum
    role: z.enum(['ADMIN', 'EMPLOYEE']).nullable().optional(),

    // Optional date string (YYYY-MM-DD from AppDatePicker)
    startDate: z.string().nullable().optional(),

    // Optional number from input (use z.coerce)
    estimatedHours: z.coerce.number().min(0).max(999).nullable().optional(),
  })
  // Cross-field validation
  .refine(
    (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
    { message: t('validation.endAfterStart'), path: ['endDate'] },
  );

export type EntityFormValues = z.infer<ReturnType<typeof createEntityFormSchema>>;
```

**Rules:**
- Always `.trim()` before `.min()` / `.max()`
- Optional strings: `.optional().or(z.literal(''))` — allows empty string
- Optional numbers from inputs: `z.coerce.number()` — HTML inputs return strings
- Export both the factory AND the inferred type
- Error messages always use `t()` — never hardcoded English

---

## 3 — Form Component Structure

```tsx
const EntityForm: React.FC<Props> = ({ item, onClose, onSave, submitting, mode = 'page' }) => {
  const { t }   = useTranslation();
  const toast   = useToast();

  // ── Duplicate detection ──────────────────────────────────────────────────
  const isDuplicateError = useRef(false);

  useEffect(() => {
    const unsub = networkEvents.onOkPress(() => {
      if (isDuplicateError.current) {
        isDuplicateError.current = false;
        onClose();
      }
    });
    return unsub;
  }, [onClose]);

  // ── RHF setup ────────────────────────────────────────────────────────────
  const toDateStr = (v: unknown): string => {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(v as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const form = useForm({
    resolver: zodResolver(createEntityFormSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      name:  item?.name  ?? '',
      email: item?.email ?? '',
      phone: item?.phone ?? '',
      // Date fields — always normalize to YYYY-MM-DD string
      startDate: toDateStr(item?.startDate),
      // Nullable fields
      role: item?.role ?? null,
    },
  });

  const { control, handleSubmit, watch, formState: { isSubmitting, errors } } = form;

  // ── Keyboard chain ───────────────────────────────────────────────────────
  const firstInputRef = useFocusInput({
    inModal: mode === 'modal',
    enabled: true,
    delay:   mode === 'page' ? 100 : undefined,
  });
  const emailRef = useRef<any>(null);
  const phoneRef = useRef<any>(null);
  // Add one ref per text input in the chain

  // ── Submit ───────────────────────────────────────────────────────────────
  const doSave = async (data: any) => {
    try {
      await onSave({
        name:  data.name,
        email: data.email,
        phone: data.phone || undefined,   // empty string → undefined
        role:  data.role  ?? undefined,
      } as CreateEntityData);

      // ✅ Toast BEFORE onClose — component unmounts on close
      toast.success(item ? t('entity.messages.updated') : t('entity.messages.created'));
      onClose();

    } catch (err: any) {
      // NetworkErrorDialog handles all API errors automatically.
      // Only special-case duplicate errors to show a specific toast + close on dismiss.
      const serverMsg: string =
        err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';

      if (serverMsg.toLowerCase().includes('already exists')) {
        isDuplicateError.current = true;
        // ✅ Show specific toast for duplicate — user knows what happened
        toast.error(t('entity.duplicateError.title'), t('entity.duplicateError.message'));
      }
      // All other errors: NetworkErrorDialog shows automatically — do NOT toast here
    }
  };

  const formTitle  = item ? t('entity.editTitle') : t('entity.addTitle');
  const isDisabled = submitting || isSubmitting;

  // ── Fields JSX — shared between page and modal ───────────────────────────
  const fields_jsx = (
    <>
      {/* Required fields — always expanded */}
      <FormSection
        title={t('entity.sections.basicInfo')}
        icon="📋"
        hasError={!!(errors.name || errors.email)}
      >
        <AppFormField name="name" control={control}>
          <AppTextInput
            inputRef={firstInputRef}
            nextRef={emailRef}
            label={t('entity.form.name')}
            placeholder={t('entity.form.namePlaceholder')}
            required
            autoCapitalize="words"
            maxLength={100}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="email" control={control}>
          <AppTextInput
            inputRef={emailRef}
            nextRef={phoneRef}
            label={t('entity.form.email')}
            placeholder={t('entity.form.emailPlaceholder')}
            required
            fieldType="email"
            maxLength={150}
            showClearButton
          />
        </AppFormField>
      </FormSection>

      {/* Optional section — collapsible */}
      <FormSection
        title={t('entity.sections.optional')}
        icon="⚙️"
        collapsible
        hasError={!!(errors.phone)}
      >
        <AppFormField name="phone" control={control}>
          <AppTextInput
            inputRef={phoneRef}
            label={t('entity.form.phone')}
            placeholder={t('entity.form.phonePlaceholder')}
            maxLength={30}
            keyboardType="phone-pad"
            showClearButton
            blurOnSubmit
          />
        </AppFormField>
      </FormSection>

      {/* Non-text inputs — use Controller directly */}
      <FormSection title={t('entity.sections.settings')} icon="🔧" collapsible last={!item}>
        <Controller
          name="role"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label={t('entity.form.role')}
              options={ROLE_OPTIONS}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormSection>

      {/* Linked stats — edit mode only */}
      {item && <LinkedStats item={item} />}
    </>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  if (mode === 'page') {
    return (
      <AdminFormPage
        title={formTitle}
        onBack={onClose}
        onSubmit={doSave}       // AdminFormPage calls form.handleSubmit(doSave) internally
        submitting={isDisabled}
        form={form}             // enables: dirty tracking, discard guard, scroll-to-error
        submitLabel={t('common.save')}
      >
        {fields_jsx}
      </AdminFormPage>
    );
  }

  return (
    <AdminFormModal
      open
      title={formTitle}
      onClose={onClose}
      onSubmit={handleSubmit(doSave)}   // modal: call handleSubmit manually
      submitting={isDisabled}
      submitLabel={t('common.save')}
    >
      {fields_jsx}
    </AdminFormModal>
  );
};
```

---

## 4 — Field Wiring Rules

### Text inputs → `AppFormField`

```tsx
// ✅ Correct — AppFormField injects value, onChangeText, error, onClear automatically
<AppFormField name="email" control={control}>
  <AppTextInput
    inputRef={emailRef}
    nextRef={phoneRef}
    label={t('entity.form.email')}
    placeholder="email@example.com"
    required
    fieldType="email"
    maxLength={150}
    showClearButton
    // DO NOT pass: value, onChangeText, error, onClear — AppFormField handles them
  />
</AppFormField>

// ❌ Wrong — manual wiring
<AppTextInput
  value={fields.email}
  onChangeText={(v) => handleChange('email', v)}
  error={errors.email}
  onClear={() => handleClear('email')}
/>
```

### Non-text inputs → `Controller`

```tsx
// ✅ ChipSelector, AppDatePicker, LocationPicker, custom pickers
<Controller
  name="priority"
  control={control}
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <ChipSelector
      label={t('entity.form.priority')}
      options={PRIORITY_OPTIONS}
      value={value}
      onChange={onChange}
      error={error?.message}
    />
  )}
/>

// ✅ AppDatePicker
<Controller
  name="startDate"
  control={control}
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <AppDatePicker
      label={t('entity.form.startDate')}
      value={value ?? ''}
      onChange={onChange}
      placeholder={t('common.selectDate')}
      error={error?.message}
    />
  )}
/>
```

### `AppFormField` props reference

| Prop | Required | Notes |
|---|---|---|
| `name` | ✅ | Must match a key in the Zod schema |
| `control` | ✅ | From `useForm()` |
| `children` | ✅ | Must be `<AppTextInput>` |
| `transform` | — | Optional value transformer before RHF onChange |
| `style` | — | Container margin override |
| `disabled` | — | Dims + blocks interaction |

### `AppTextInput` props reference

| Prop | Notes |
|---|---|
| `inputRef` | Ref for focus — use `useFocusInput()` for first field, `useRef()` for others |
| `nextRef` | Ref to focus when keyboard "Next" is pressed — `AppFormField` wraps it to validate first |
| `label` | Always use `t()` — never hardcoded |
| `placeholder` | Always use `t()` |
| `required` | Shows `*` in label, registers as required in `FormScrollContext` |
| `fieldType` | `'email'` \| `'password'` \| `'search'` \| `'number'` |
| `maxLength` | Always set — prevents unbounded input |
| `showClearButton` | Always set on optional fields |
| `multiline` | For address / description fields |
| `blurOnSubmit` | Set on last field in chain (no nextRef) |
| `autoCapitalize` | `'words'` for names, `'sentences'` for descriptions, `'none'` for email/version |

---

## 5 — `FormSection` Rules

```tsx
// Required fields — always expanded, never collapsible
<FormSection title={t('entity.sections.required')} icon="📋" hasError={!!(errors.name)}>
  ...
</FormSection>

// Optional fields — collapsible, starts expanded
<FormSection title={t('entity.sections.optional')} icon="⚙️" collapsible hasError={!!(errors.phone)}>
  ...
</FormSection>

// Optional fields — collapsible, starts COLLAPSED (no data yet)
<FormSection
  title={t('entity.sections.advanced')}
  icon="🔧"
  collapsible
  defaultCollapsed={!item?.advancedField}
  hasError={!!(errors.advancedField)}
>
  ...
</FormSection>

// Last section — removes bottom margin
<FormSection title={t('entity.sections.last')} icon="💳" collapsible last={!item}>
  ...
</FormSection>
```

**`hasError` rule:** always pass `hasError` on collapsible sections — forces open when validation fails so the user can see the error.

---

## 6 — `doSave` Pattern

```tsx
const doSave = async (data: any) => {
  try {
    // 1. Transform data before sending (empty strings → undefined, coerce numbers)
    await onSave({
      name:  data.name,
      email: data.email,
      phone: data.phone || undefined,          // '' → undefined
      count: data.count != null ? Number(data.count) : null,
    } as CreateEntityData);

    // 2. ✅ Toast BEFORE onClose — component unmounts on close, toast won't show after
    toast.success(item ? t('entity.messages.updated') : t('entity.messages.created'));
    onClose();

  } catch (err: any) {
    // 3. Extract server error message
    const serverMsg: string =
      err?.response?.data?.error ??
      err?.response?.data?.message ??
      err?.message ?? '';

    // 4. Handle duplicate — show specific toast + flag for dismiss-to-close
    if (serverMsg.toLowerCase().includes('already exists')) {
      isDuplicateError.current = true;
      toast.error(
        t('entity.duplicateError.title'),
        t('entity.duplicateError.message'),
      );
      return;
    }

    // 5. All other errors: NetworkErrorDialog handles automatically
    //    DO NOT call toast.error() here — it would double-show the error
  }
};
```

**Critical rules:**
- `toast.success()` must be called **before** `onClose()` — the component unmounts on close
- Empty catch is wrong — always check for duplicate specifically
- Never `toast.error()` for generic API errors — `NetworkErrorDialog` already shows them
- `isDuplicateError.current = true` enables the `networkEvents.onOkPress` handler to close the form when user dismisses the dialog

---

## 7 — Duplicate Error Handling

Every form that creates/updates a unique-field entity (email, slug, name) must handle duplicates:

```tsx
// 1. Ref to track duplicate state
const isDuplicateError = useRef(false);

// 2. Subscribe to NetworkErrorDialog dismiss — close form after duplicate
useEffect(() => {
  const unsub = networkEvents.onOkPress(() => {
    if (isDuplicateError.current) {
      isDuplicateError.current = false;
      onClose();
    }
  });
  return unsub;
}, [onClose]);

// 3. In doSave catch block
if (serverMsg.toLowerCase().includes('already exists')) {
  isDuplicateError.current = true;
  toast.error(t('entity.duplicateError.title'), t('entity.duplicateError.message'));
  return;
}
```

**i18n keys to add for every entity with unique fields:**
```json
"entity": {
  "duplicateError": {
    "title": "Email Already Exists",
    "message": "An entity with this email already exists. Fix the email or dismiss to cancel."
  }
}
```

---

## 8 — Keyboard Navigation Chain

```tsx
// First field — useFocusInput auto-focuses on open
const firstInputRef = useFocusInput({
  inModal: mode === 'modal',
  enabled: true,
  delay:   mode === 'page' ? 100 : undefined,
});

// Subsequent fields — plain useRef
const emailRef   = useRef<any>(null);
const phoneRef   = useRef<any>(null);
const companyRef = useRef<any>(null);

// Wire in AppTextInput props
<AppTextInput inputRef={firstInputRef} nextRef={emailRef}   ... />
<AppTextInput inputRef={emailRef}      nextRef={phoneRef}   ... />
<AppTextInput inputRef={phoneRef}      nextRef={companyRef} ... />
<AppTextInput inputRef={companyRef}    blurOnSubmit         ... />  // last in chain
```

**Rules:**
- `useFocusInput` only on the first field — `useRef` for all others
- `nextRef` on every field except the last
- Last field: `blurOnSubmit` (dismisses keyboard) — no `nextRef`
- `AppFormField` wraps `nextRef` to validate the current field before advancing

---

## 9 — Linked Stats (Edit Mode)

Show related-data counts when editing. Use `Palette.*` for colors — no hardcoded hex:

```tsx
import { Palette } from '@/src/constants/theme';

const STAT_DEFS = [
  { key: 'tickets'   as const, label: t('entity.columns.tickets'),   color: Palette.blue700,  bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'customers' as const, label: t('entity.columns.customers'), color: Palette.green700, bg: '#f0fdf4', border: '#bbf7d0' },
];

{item && (
  <View style={styles.statsRow}>
    {STAT_DEFS.map((def) => (
      <View key={def.key} style={[styles.statCard, { backgroundColor: def.bg, borderColor: def.border }]}>
        <Text style={[styles.statValue, { color: def.color }]}>{item._count?.[def.key] ?? 0}</Text>
        <Text style={[styles.statLabel, { color: def.color }]}>{def.label}</Text>
      </View>
    ))}
  </View>
)}

const styles = StyleSheet.create({
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:  { flex: 1, padding: 14, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, marginTop: 3, fontWeight: FontWeight.medium },
});
```

---

## 10 — `AdminFormPage` vs `AdminFormModal`

| | `AdminFormPage` | `AdminFormModal` |
|---|---|---|
| Shell | Full-screen slide-up Modal | Bottom sheet |
| `form=` prop | ✅ Pass `form` — enables dirty tracking + discard guard + scroll-to-error | ❌ Not supported — call `handleSubmit(doSave)` manually |
| `onSubmit` | Receives raw `doSave` — wraps with `form.handleSubmit()` internally | Receives `handleSubmit(doSave)` |
| Discard guard | ✅ Automatic when `form` is passed | ❌ Not built-in |
| Scroll-to-error | ✅ Automatic via `AppForm` + `FormFocusContext` | ✅ Via `FormScrollProvider` inside modal |

```tsx
// Page mode
<AdminFormPage
  title={formTitle}
  onBack={onClose}
  onSubmit={doSave}           // ← raw function, NOT handleSubmit(doSave)
  submitting={isDisabled}
  form={form}                 // ← required for dirty tracking + scroll-to-error
  submitLabel={t('common.save')}
>
  {fields_jsx}
</AdminFormPage>

// Modal mode
<AdminFormModal
  open
  title={formTitle}
  onClose={onClose}
  onSubmit={handleSubmit(doSave)}   // ← must wrap manually
  submitting={isDisabled}
  submitLabel={t('common.save')}
>
  {fields_jsx}
</AdminFormModal>
```

---

## 11 — Date Field Normalization

API may return `Date` objects or ISO strings. Always normalize to `YYYY-MM-DD` in `defaultValues`:

```tsx
const toDateStr = (v: unknown): string => {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v as string);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

defaultValues: {
  startDate: toDateStr(item?.startDate),
  endDate:   toDateStr(item?.endDate),
}
```

---

## 12 — Refactoring Existing Forms

Forms using the old pattern (`useXForm` hook + `FormField` + manual state):

**Step 1 — Delete the manual hook**
`useUserForm.ts`, `useApplicationForm.ts` → delete entirely

**Step 2 — Replace `FormField` with `AppFormField`**
```tsx
// ❌ Old
<FormField fieldId="name">
  <AppTextInput value={fields.name} onChangeText={onChangeName} error={errors.name} onClear={onClearName} />
</FormField>

// ✅ New
<AppFormField name="name" control={control}>
  <AppTextInput label={t('entity.form.name')} required showClearButton />
</AppFormField>
```

**Step 3 — Replace `Pressable` role/chip selectors with `ChipSelector`**
```tsx
// ❌ Old — custom Pressable chips
{ROLES.map(role => (
  <Pressable onPress={() => onChange(role)} style={{ borderColor: isActive ? cfg.color : c.border.primary }}>
    <Text>{ROLE_LABELS[role]}</Text>
  </Pressable>
))}

// ✅ New
<Controller name="role" control={control}
  render={({ field: { value, onChange } }) => (
    <ChipSelector label={t('entity.form.role')} options={ROLE_OPTIONS} value={value} onChange={onChange} />
  )}
/>
```

**Step 4 — Fix linked stats colors**
```tsx
// ❌ Old — hardcoded hex
backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8'

// ✅ New — Palette constants
backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: Palette.blue700
// Or use c.* tokens:
backgroundColor: c.intent.infoSurface, borderColor: c.border.secondary, color: c.intent.info
```

**Step 5 — Add `FormSection` grouping**
Wrap related fields in `FormSection` with `collapsible` for optional groups.

**Step 6 — Add duplicate error handling**
Add `isDuplicateError` ref + `networkEvents.onOkPress` + specific toast in catch.

---

## 13 — New Form Checklist

- [ ] Schema in `schemas/<feature>Schema.ts` — factory `createXSchema(t)`, exports inferred type
- [ ] `useForm({ resolver: zodResolver(createXSchema(t)), mode: 'onBlur', defaultValues: {...} })`
- [ ] Date fields normalized with `toDateStr()` in `defaultValues`
- [ ] `useFocusInput` on first field, `useRef` on all others
- [ ] `nextRef` chain — every field except last; last field has `blurOnSubmit`
- [ ] All text inputs wrapped in `AppFormField name= control=` — no manual `value`/`onChangeText`/`error`/`onClear`
- [ ] Non-text inputs (ChipSelector, AppDatePicker, custom) use `Controller`
- [ ] `FormSection` groups related fields — `hasError` on every collapsible section
- [ ] `doSave`: toast before `onClose`, duplicate check with specific toast, empty catch for others
- [ ] `isDuplicateError` ref + `networkEvents.onOkPress` subscription
- [ ] `AdminFormPage` receives `form={form}` — NOT `isDirty` prop
- [ ] `AdminFormModal` receives `onSubmit={handleSubmit(doSave)}`
- [ ] `fields_jsx` defined once, used in both page and modal render
- [ ] Linked stats use `Palette.*` constants — no hardcoded hex
- [ ] i18n keys: `messages.created`, `messages.updated`, `duplicateError.title`, `duplicateError.message`
- [ ] `mode` prop defaults to `'page'`
