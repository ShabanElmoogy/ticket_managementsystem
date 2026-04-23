# Mobile Admin Feature Structure

Reference implementation: `mobile/src/features/admin/applications/`

Use this pattern for every admin CRUD feature on mobile.

---

## Folder Layout

```
features/admin/<feature>/
├── api/
│   └── <feature>.ts              ← BaseApiService subclass + singleton + query keys
├── components/
│   ├── <feature>Columns.tsx      ← ColDef function (translated, no hooks)
│   ├── <Entity>Form.tsx          ← Form component (page + modal mode)
│   └── <Entity>DetailScreen.tsx  ← (optional) read-only detail view
├── hooks/
│   ├── use<Feature>.ts           ← useAdminFeature wrapper + export logic + selectedId
│   └── use<Feature>Form.ts       ← form state, validation, submit logic
├── schemas/
│   └── <feature>Schema.ts        ← Zod factory function createXSchema(t)
├── types/                        ← (optional) local types — add when needed
│   └── index.ts
└── <Feature>Screen.tsx           ← Orchestration: list / detail / edit views
```

---

## When to Add `types/`

Add a `types/` folder when the feature needs types beyond the global API types in `@/src/services/api/types`:
- Local form value types that differ from the API payload type
- UI-specific interfaces (`FilterState`, `CardProps`, derived row shapes)
- Zod inferred types (if not already exported from `schemas/`)

---

## Screen View States

`<Feature>Screen.tsx` manages **three mutually exclusive view states**:

```
selectedId === null                       → List view  (AdminCrudScreen)
selectedId !== null && !editingFromDetail → Detail view (<Entity>DetailScreen)
editingFromDetail !== null                → Edit-from-detail view (<Entity>Form)
```

```tsx
// ── Detail view ────────────────────────────────────────────────────────────
if (selectedId && !editingFromDetail) {
  const selectedItem = f.entities.find((e) => e.id === selectedId);
  return (
    <>
      <EntityDetailScreen
        entityId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={() => setEditingFromDetail(selectedItem ?? null)}
        onDelete={() => setDeletingFromDetail(selectedItem ?? null)}
        queryEnabled={!deletingFromDetail}
      />
      <AppDeleteDialog
        open={!!deletingFromDetail}
        onClose={() => setDeletingFromDetail(null)}
        onConfirm={handleDeleteFromDetail}
        itemName={deletingFromDetail?.name}
        itemType={t('<feature>.itemType')}
        loading={deleting}
      />
    </>
  );
}

// ── Edit from detail ────────────────────────────────────────────────────────
if (editingFromDetail) {
  return (
    <EntityForm
      item={editingFromDetail}
      onClose={() => {
        setEditingFromDetail(null);
        setSelectedId(editingFromDetail.id);
      }}
      submitting={false}
      mode="page"
      onSave={async (data) => {
        await f.update(editingFromDetail.id, data);
        setEditingFromDetail(null);
        setSelectedId(editingFromDetail.id);
      }}
    />
  );
}

// ── List view ───────────────────────────────────────────────────────────────
return (
  <AdminCrudScreen<Entity>
    ...
    onRowPress={(item) => setSelectedId(item.id)}
    ...
  />
);
```

### Delete from detail — cache cleanup

```tsx
const handleDeleteFromDetail = async () => {
  if (!deletingFromDetail) return;
  setDeleting(true);
  try {
    await f.remove(deletingFromDetail.id);
    queryClient.removeQueries({ queryKey: entityKeys.detail(deletingFromDetail.id) });
    toast.success(t('<feature>.messages.deleted'));
    setSelectedId(null);
    setDeletingFromDetail(null);
  } catch {
    toast.error(t('<feature>.messages.errorDelete'));
  } finally {
    setDeleting(false);
  }
};
```

---

## File Responsibilities

### `api/<feature>.ts`

```ts
import { BaseApiService } from '@/src/services/api/base';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

export class EntityApiService extends BaseApiService {
  getAll   = ()                                            => this.get<Entity[]>('/entities');
  getOne   = (id: string)                                  => this.get<Entity>(`/entities/${id}`);
  create   = (data: CreateEntityData)                      => this.post<Entity>('/entities', data);
  update   = (id: string, data: Partial<CreateEntityData>) => this.put<Entity>(`/entities/${id}`, data);
  remove   = (id: string)                                  => this.delete<{ message: string }>(`/entities/${id}`);
}

export const entityApi  = new EntityApiService();
export const entityKeys = {
  all:    ['entities']                      as const,
  detail: (id: string) => ['entities', id]  as const,
};
```

---

### `components/<feature>Columns.tsx`

Exports a **function** `get<Feature>Columns(t)` — not a plain array. Called with `useMemo(() => get<Feature>Columns(t), [t])` so columns rebuild on language change.

```tsx
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

export function getEntityColumns(t: TFunction): ColDef<Entity>[] {
  return [
    { field: 'name', headerName: t('<feature>.columns.name'), flex: 1, sortable: true },
  ];
}
```

---

### `schemas/<feature>Schema.ts`

**Never hardcode English strings in Zod schemas.** Always use `createXSchema(t)`.

```ts
import { z } from 'zod';
import type { TFunction } from 'i18next';

export const createEntityFormSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim()
      .min(3,   t('validation.minLength', { field: t('common.name'), min: 3 }))
      .max(100, t('validation.maxLength', { field: t('common.name'), max: 100 })),
    description: z.string().trim()
      .max(500, t('validation.maxLength', { field: t('common.description'), max: 500 }))
      .optional().or(z.literal('')),
  });

export type EntityFormValues = z.infer<ReturnType<typeof createEntityFormSchema>>;
```

### Shared validation keys

```json
"validation": {
  "required":     "{{field}} is required",
  "minLength":    "{{field}} must be at least {{min}} characters",
  "maxLength":    "{{field}} must be at most {{max}} characters",
  "invalidEmail": "Invalid email address"
}
```

---

### `hooks/use<Feature>Form.ts`

All state, validation, and submit logic extracted from the component.

**Key behaviours:**
- `getInitial` depends only on `item?.id` — prevents re-running on every render
- Errors are **deleted** (not set to `''`) on field change
- `isDirty` starts `false` — tracks whether any field differs from initial values
- `isSubmitting` is local — separate from the parent `submitting` prop
- `firstErrorFieldId` exposed for `scrollToFirstError` integration
- Toast shown **before** `onClose()` — page unmounts on close, toast must be queued first

```ts
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createEntityFormSchema } from '../schemas/entitySchema';
import { useToast } from '@/src/shared/hooks/useToast';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

export function useEntityForm({ item, onSave, onClose }: Args) {
  const { t } = useTranslation();
  const toast = useToast();

  const getInitial = useCallback(
    (): EntityFormValues => ({ name: item?.name ?? '', description: item?.description ?? '' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item?.id],
  );

  const [fields,            setFields]            = useState<EntityFormValues>(getInitial);
  const [errors,            setErrors]            = useState<Record<string, string>>({});
  const [isDirty,           setIsDirty]           = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [firstErrorFieldId, setFirstErrorFieldId] = useState<string | null>(null);

  useEffect(() => {
    setFields(getInitial());
    setErrors({});
    setIsDirty(false);
    setFirstErrorFieldId(null);
  }, [getInitial]);

  const handleChange = useCallback((field: keyof EntityFormValues, value: string) => {
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(/* checkDirty(next) */);
      return next;
    });
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];   // ← delete, never set to ''
      return next;
    });
  }, [/* checkDirty */]);

  const handleSubmit = useCallback(async () => {
    const result = createEntityFormSchema(t).safeParse(fields);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? '');
        if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      const ORDER: Array<keyof EntityFormValues> = ['name', 'description'];
      setFirstErrorFieldId(ORDER.find((k) => k in fieldErrors) ?? null);
      toast.error(t('<feature>.messages.validationError'));
      return;
    }

    setErrors({});
    setFirstErrorFieldId(null);
    setIsSubmitting(true);

    try {
      await onSave({ name: result.data.name, description: result.data.description || undefined });
      setIsDirty(false);
      // ⚠️ Toast BEFORE onClose — page unmounts on close
      toast.success(item ? t('<feature>.messages.updated') : t('<feature>.messages.created'));
      onClose();
    } catch {
      toast.error(item ? t('<feature>.messages.errorUpdate') : t('<feature>.messages.errorCreate'));
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, t, onSave, onClose, item, toast]);

  return { fields, errors, isDirty, firstErrorFieldId, isSubmitting, handleChange, handleClear: (f) => handleChange(f, ''), handleSubmit };
}
```

---

### `components/<Entity>Form.tsx`

Supports **two modes**:
- `mode="page"` (default) — `AdminFormPage`, full-screen Modal, OS handles keyboard
- `mode="modal"` — `AdminFormModal`, bottom sheet

**Submit button behaviour:**
- Always enabled (never disabled by `!isDirty`) — pressing it shows validation errors
- Shows `t('common.fillRequired')` label + gray color when `!isDirty`
- Shows `t('common.save')` label + blue color when `isDirty`
- Disabled only while `submitting || isSubmitting`

```tsx
const isDisabled  = submitting || isSubmitting;   // ← NOT !isDirty
const isSubmittingAll = submitting || isSubmitting;

// Pass isDirty to AdminFormPage so button label/color adapts
<AdminFormPage
  ...
  submitDisabled={isDisabled}
  isDirty={isDirty}
  submitLabel={t('common.save')}
>
```

**Key patterns:**
- `FormField` wraps each input with stable `fieldId`
- `useFocusInput` auto-focuses first field
- `nextRef` chain for return-key navigation
- `scrollToFirstError` called after failed submit
- Linked stats shown in edit mode (if entity has `_count` relations)
- Multiline fields: use `multiline`, `numberOfLines`, `blurOnSubmit` (or `submitBehavior="blurAndSubmit"`)

```tsx
const EntityForm: React.FC<Props> = ({ item, onClose, onSave, submitting, mode = 'page' }) => {
  const { t }                  = useTranslation();
  const { scrollToFirstError } = useFormScroll();

  const { fields, errors, isDirty, firstErrorFieldId, isSubmitting, handleChange, handleClear, handleSubmit }
    = useEntityForm({ item, onSave, onClose });

  const firstInputRef  = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });
  const descriptionRef = useRef<TextInput | null>(null);

  const onChangeName        = useCallback((v: string) => handleChange('name', v),        [handleChange]);
  const onChangeDescription = useCallback((v: string) => handleChange('description', v), [handleChange]);

  const onSubmit = useCallback(async () => {
    await handleSubmit();
    if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
  }, [handleSubmit, firstErrorFieldId, scrollToFirstError]);

  const formTitle   = item ? t('<feature>.editTitle') : t('<feature>.addTitle');
  const isDisabled  = submitting || isSubmitting;

  const fields_jsx = (
    <>
      <FormField fieldId="name">
        <AppTextInput inputRef={firstInputRef} nextRef={descriptionRef} ... />
      </FormField>
      <FormField fieldId="description">
        <AppTextInput inputRef={descriptionRef} ... />
      </FormField>
    </>
  );

  if (mode === 'page') {
    return (
      <AdminFormPage title={formTitle} onBack={onClose} onSubmit={onSubmit}
        submitting={isSubmittingAll} submitDisabled={isDisabled} isDirty={isDirty}
        submitLabel={t('common.save')}>
        {fields_jsx}
      </AdminFormPage>
    );
  }
  return (
    <AdminFormModal open title={formTitle} onClose={onClose} onSubmit={onSubmit}
      submitting={isSubmittingAll} submitDisabled={isDisabled}
      submitLabel={t('common.save')}>
      {fields_jsx}
    </AdminFormModal>
  );
};
```

---

### `components/<Entity>DetailScreen.tsx`

Read-only detail view. Shown when a row is tapped in the list. Fetches the single entity via `useQuery` with `staleTime: 2 * 60_000`.

**Location:** `mobile/src/features/admin/<feature>/components/<Entity>DetailScreen.tsx`

**Reference implementation:** `mobile/src/features/admin/customers/components/CustomerDetailScreen.tsx`

#### Props interface

```tsx
interface Props {
  <entity>Id:    string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  /** Set false while delete is in progress — prevents refetch of deleted resource */
  queryEnabled?: boolean;
}
```

#### Full skeleton

```tsx
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { AppBadge } from '@/src/shared/components';
import { useIsDark } from '@/src/constants/theme';
import { entityApi, entityKeys } from '../api/<feature>';

const EntityDetailScreen: React.FC<Props> = ({
  entityId, onClose, onEdit, onDelete, queryEnabled = true,
}) => {
  const { t }  = useTranslation();
  const isDark = useIsDark();

  const { data: entity, isLoading } = useQuery({
    queryKey: entityKeys.detail(entityId),
    queryFn:  () => entityApi.getOne(entityId),
    staleTime: 2 * 60_000,   // fresh for 2 minutes
    enabled:  queryEnabled,  // false while delete is in flight
  });

  // ── Theme tokens ─────────────────────────────────────────────────────────
  const bg         = isDark ? '#0f172a' : '#f8fafc';
  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const border     = isDark ? '#334155' : '#e5e7eb';
  const textPri    = isDark ? '#f1f5f9' : '#111827';
  const textSec    = isDark ? '#94a3b8' : '#6b7280';
  const labelColor = isDark ? '#64748b' : '#9ca3af';

  // ── Reusable label/value row ──────────────────────────────────────────────
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: labelColor, width: 90, paddingTop: 1 }}>{label}</Text>
        <Text style={{ flex: 1, fontSize: 13, color: textSec, lineHeight: 20 }}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Header: back ← | title | Edit | Delete ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: cardBg,
        borderBottomWidth: 1, borderBottomColor: border,
      }}>
        <Pressable
          onPress={onClose}
          style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: isDark ? '#334155' : '#f3f4f6',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: textSec, fontSize: 18 }}>←</Text>
        </Pressable>

        <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: textPri }} numberOfLines={1}>
          {entity?.name ?? t('<feature>.title')}
        </Text>

        <Pressable
          onPress={onEdit}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
            backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>
            ✏️ {t('common.edit')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
            backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>
            🗑️ {t('common.delete')}
          </Text>
        </Pressable>
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : !entity ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: textSec }}>{t('<feature>.notFound')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

          {/* ── Main info card ── */}
          <View style={{
            backgroundColor: cardBg, borderRadius: 12,
            borderWidth: 1, borderColor: border, padding: 16,
          }}>
            {/* Title row + status badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: textPri }} numberOfLines={2}>
                {entity.name}
              </Text>
              {entity.status && (
                <AppBadge label={entity.status} variant="status" size="small" />
              )}
            </View>

            {/* Key fields via InfoRow */}
            <InfoRow label={t('<feature>.columns.email')}   value={entity.email} />
            <InfoRow label={t('<feature>.columns.phone')}   value={entity.phone} />
            <InfoRow label={t('<feature>.detail.company')}  value={entity.company} />

            {/* Created date */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: labelColor, width: 90 }}>
                {t('<feature>.columns.created')}
              </Text>
              <Text style={{ fontSize: 13, color: textSec }}>
                {formatDate(entity.createdAt)}
              </Text>
            </View>
          </View>

          {/* ── Optional: description card ── */}
          {!!entity.description && (
            <View style={{
              backgroundColor: cardBg, borderRadius: 12,
              borderWidth: 1, borderColor: border, padding: 16,
            }}>
              <Text style={{
                fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.5, color: labelColor, marginBottom: 8,
              }}>
                {t('common.description')}
              </Text>
              <Text style={{ fontSize: 14, color: textPri, lineHeight: 22 }}>
                {entity.description}
              </Text>
            </View>
          )}

          {/* ── Stat card (ticket count, etc.) ── */}
          <View style={{
            backgroundColor: '#eff6ff', borderRadius: 12,
            borderWidth: 1, borderColor: '#bfdbfe',
            padding: 16, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#1d4ed8' }}>
              {entity._count?.tickets ?? 0}
            </Text>
            <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>
              {t('<feature>.columns.tickets')}
            </Text>
          </View>

        </ScrollView>
      )}
    </View>
  );
};

export default EntityDetailScreen;
```

#### Rules

- **`queryEnabled={!deletingFromDetail}`** — prevents a refetch hitting the now-deleted resource while delete is in flight
- **`staleTime: 2 * 60_000`** — detail data is fresh for 2 minutes; avoids redundant fetches when navigating back and forth
- **`useIsDark()`** from `@/src/constants/theme` — not `useUiStore` directly
- **Header always has:** back ←, entity name as title, Edit button (blue), Delete button (red)
- **`InfoRow` helper** — renders `label | value` pairs; returns `null` when value is empty (no empty rows)
- **Section cards** — group related fields into rounded cards with border; use uppercase section labels
- **Stat cards** — show `_count` relations (tickets, applications) as large number + label
- **`t('<feature>.notFound')`** — shown when entity is null after loading; add this key to both locale files

#### Required locale keys

```json
"<feature>": {
  "notFound": "Entity not found",
  "detail": {
    "company":   "Company",
    "address":   "Address",
    "maintenance": "Maintenance"
  }
}
```

---

### `hooks/use<Feature>.ts`

```ts
export function useEntities() {
  const { t } = useTranslation();
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const columns = useMemo(() => getEntityColumns(t), [t]);

  const f = useAdminFeature<Entity, CreateEntityData>({
    entityName: 'entities',
    queryKey: entityKeys.all,
    api: { getAll, create, update, delete: remove },
    messages: {
      success: { created: t('...'), updated: t('...'), deleted: t('...') },
      error:   { create:  t('...'), update:  t('...'), delete:  t('...') },
      titles:  { create:  t('...'), edit:    t('...')                    },
    },
  });

  return { f, columns, exporting, handleExport, selectedId, setSelectedId };
}
```

---

## Form Infrastructure (shared)

### `AdminFormPage` props

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Page header title |
| `onBack` | `() => void` | Back button handler |
| `onSubmit` | `() => void` | Submit handler |
| `submitting?` | `boolean` | Shows spinner on button |
| `submitDisabled?` | `boolean` | Disables button (only while saving) |
| `isDirty?` | `boolean` | Controls button label/color — `false` = gray "Fill required fields", `true` = blue "Save" |
| `submitLabel?` | `string` | Custom label (default: `t('common.save')`) |
| `children` | `ReactNode` | Form fields |

**Button states:**

| `isDirty` | `submitting` | Button | Color |
|---|---|---|---|
| `false` | `false` | "Fill required fields" | Gray |
| `true` | `false` | "Save" | Blue |
| any | `true` | "Saving…" + spinner | Blue |

### `AdminFormModal` props

Same as `AdminFormPage` except `onBack` → `onClose`, no `isDirty` prop (modal always shows "Save").

### `FormField`

Wraps each input. In modal mode: registers Y position for scroll-to-error. In page mode: plain `View` wrapper.

```tsx
<FormField fieldId="name">
  <AppTextInput ... />
</FormField>
```

Always pass a stable `fieldId` string matching the field name.

### `FormScrollContext` / `useFormScroll`

```tsx
const { scrollToFirstError } = useFormScroll();

await handleSubmit();
if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
```

`FormScrollProvider` is set up inside `AdminFormPage` and `AdminFormModal` — no manual setup needed.

### `useFocusInput`

```ts
// Page mode (100ms delay — no modal animation)
const firstInputRef = useFocusInput({ inModal: false, enabled: true, delay: 100 });

// Modal mode (platform-appropriate delay — wait for slide animation)
const firstInputRef = useFocusInput({ inModal: true, enabled: true });

// Only focus when creating
const firstInputRef = useFocusInput({ inModal: true, enabled: item === null });
```

### Return-key navigation (`nextRef`)

```tsx
const emailRef = useRef<TextInput | null>(null);
const phoneRef = useRef<TextInput | null>(null);

<AppTextInput inputRef={firstInputRef} nextRef={emailRef} ... />   // shows "Next"
<AppTextInput inputRef={emailRef}      nextRef={phoneRef} ... />   // shows "Next"
<AppTextInput inputRef={phoneRef}                         ... />   // shows "Done"
```

Last field has no `nextRef` → `returnKeyType="done"` → keyboard dismisses.

---

## Toast System

All CRUD operations show toasts via `useToast()`.

```ts
import { useToast } from '@/src/shared/hooks/useToast';

const toast = useToast();
toast.success('Application created successfully');
toast.error('Error creating application');
toast.info('No changes to save');
```

### Rules

- Call `toast.success()` **before** `onClose()` in form hooks — the page unmounts on close
- `useAdminFeature` automatically shows toasts for create/update/delete operations
- `use<Feature>Form` shows toasts for validation errors and save success/failure
- `<Feature>Screen` shows toasts for delete-from-detail operations

### Custom toast config

`AppToast.tsx` provides a custom config with:
- Left accent bar colored by type (green/red/blue)
- Icon badge per type (✅/❌/ℹ️)
- **Copy button** on success and error toasts
- Registered in root layout: `<Toast config={toastConfig} />`

---

## Network Error Dialog

`NetworkErrorDialog` shows when API requests fail due to network issues.

### Offline retry queue

Failed network requests are automatically queued and retried when connectivity is restored:

```
Request fails (network error)
  → networkEvents.emit() → dialog shows
  → networkEvents.enqueue(config) → request saved in queue
  → Promise stays pending

Network returns
  → expo-network listener fires
  → drainQueue() → all queued requests retried
  → Dialog transitions to "Reconnecting…" state
  → After 600ms → dialog dismisses + success toast
```

### Dev vs Production

| | Development (`__DEV__`) | Production |
|---|---|---|
| Message | Raw error from server | Generic friendly message |
| Copy button | ✅ Shown | Hidden |
| Count badge | ✅ Shown | Hidden |
| Subtitle | "Network unavailable" | Hidden |

---

## Pagination

Built into `AdminCrudScreen` — no extra code needed in feature screens.

`PAGE_SIZE = 5` (module-level constant in `AdminCrudScreen.tsx`).

`AppPagination` returns `null` automatically when `totalPages <= 1`.

---

## Views — Table / Grid / Compact

All three views are built into `AdminCrudScreen`. Each view shows action buttons for every row.

### Action buttons per view

| View | Tap row | Action buttons |
|---|---|---|
| Table | Navigates to detail (if `onRowPress` provided) | 👁️ View · ✏️ Edit · ✕ Delete |
| Grid | Navigates to detail (if `onRowPress` provided) | 👁️ View · ✏️ Edit · ✕ Delete |
| Compact | Navigates to detail (if `onRowPress` provided) | 👁️ View · ✏️ Edit · ✕ Delete |

- **👁️ View** — only shown when `onRowPress` is provided. Calls `onRowPress(item)`.
- **✏️ Edit** — opens the form in page mode.
- **✕ Delete** — opens the delete confirmation dialog.
- Tapping the row body (outside buttons) also calls `onRowPress` in grid and compact views.

### Wiring detail navigation

Pass `onRowPress` to `AdminCrudScreen` to enable the View button and row tap:

```tsx
onRowPress={(item) => setSelectedId(item.id)}
```

If `onRowPress` is not provided, the View button is hidden and row tap does nothing.

---

## Refresh & Export Buttons

```tsx
onRefresh={f.refetch}
refreshLabel={t('common.refresh')}
refreshingLabel={t('common.refreshing')}

onExport={handleExport}
exporting={exporting}
exportLabel={t('common.exportPdf')}
exportingLabel={t('common.exporting')}

addLabel={t('<feature>.addTitle')}
deleteSuccessMessage={t('<feature>.messages.deleted')}
```

`RefreshButton` has a spin animation — the 🔄 icon spins while `loading=true` and also does a single spin on press for instant feedback.

---

## Translation (i18n)

### Full key structure per feature

```json
"<feature>": {
  "title": "Entities",
  "itemType": "entity",
  "addTitle": "Add Entity",
  "editTitle": "Edit Entity",
  "searchPlaceholder": "Search entities…",
  "emptyMessage": "No entities yet",
  "emptyFilteredMessage": "No entities match your search",
  "active": "ACTIVE",
  "inactive": "INACTIVE",
  "columns": { "name": "Name", "status": "Status" },
  "form": {
    "name": "Name *",
    "namePlaceholder": "Entity name",
    "description": "Description",
    "descriptionPlaceholder": "Brief description"
  },
  "messages": {
    "created": "Entity created successfully",
    "updated": "Entity updated successfully",
    "deleted": "Entity deleted successfully",
    "errorCreate": "Error creating entity",
    "errorUpdate": "Error updating entity",
    "errorDelete": "Error deleting entity",
    "validationError": "Please fix the errors above"
  }
}
```

### Shared `common` keys required

```json
"common": {
  "save": "Save",
  "saving": "Saving…",
  "close": "Close",
  "back": "Back",
  "fillRequired": "Fill required fields",
  "add": "Add",
  "edit": "Edit",
  "delete": "Delete",
  "refresh": "Refresh",
  "refreshing": "Loading…",
  "exportPdf": "Export PDF",
  "exporting": "Exporting…"
}
```

---

## Import Rules

- Always use `@/src/...` alias — no relative `../../../` paths
- Same-folder imports stay relative
- `ColDef` from `@/src/shared/components/data/AppDataTable` (not the barrel)
- `exportEntityPdf` from `@/src/shared/utils/exportEntityPdf`
- `useIsDark()` from `@/src/constants/theme` — not `useUiStore` directly

---

## Checklist — New Admin Feature

### Files
- [ ] `api/<feature>.ts` — service + singleton + query keys + `getOne`
- [ ] `components/<feature>Columns.tsx` — `get<Feature>Columns(t)` function
- [ ] `components/<Entity>Form.tsx` — dual-mode (page + modal), `isDirty` passed to `AdminFormPage`
- [ ] `components/<Entity>DetailScreen.tsx` — read-only detail with Edit + Delete
- [ ] `hooks/use<Feature>Form.ts` — state, validation, submit, `isDirty`, `firstErrorFieldId`, toast before `onClose`
- [ ] `hooks/use<Feature>.ts` — `useAdminFeature` + columns + export + `selectedId`
- [ ] `schemas/<feature>Schema.ts` — `createXSchema(t)` factory
- [ ] `<Feature>Screen.tsx` — three view states: list / detail / edit-from-detail

### Form UX
- [ ] `useFocusInput` on first field (`delay: 100` for page mode)
- [ ] `nextRef` chain for return-key navigation
- [ ] `FormField` wrapping each input with stable `fieldId`
- [ ] `submitDisabled={submitting || isSubmitting}` — NOT `!isDirty`
- [ ] `isDirty` passed to `AdminFormPage` for button label/color
- [ ] `scrollToFirstError` called after failed submit
- [ ] Toast called before `onClose()` in form hook
- [ ] Linked stats shown in edit mode (if entity has `_count`)

### Detail screen
- [ ] `queryEnabled={!deletingFromDetail}` passed
- [ ] `staleTime: 2 * 60_000` on detail query
- [ ] `queryClient.removeQueries` after delete
- [ ] Navigate away before closing delete dialog

### Translation
- [ ] `en.json` + `ar.json` namespace with all keys including `messages.validationError`
- [ ] `common.fillRequired` key present in both locales
- [ ] `deleteSuccessMessage={t('<feature>.messages.deleted')}` passed to `AdminCrudScreen`

### AdminCrudScreen props
- [ ] `onRowPress={(item) => setSelectedId(item.id)}` — enables 👁️ View button + row tap in all three views (table, grid, compact)
- [ ] All button labels: `addLabel`, `exportLabel`, `exportingLabel`, `refreshLabel`, `refreshingLabel`
- [ ] `searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage`, `deleteSuccessMessage`

---

## Reference Implementation

`mobile/src/features/admin/applications/` — fully follows this pattern.
