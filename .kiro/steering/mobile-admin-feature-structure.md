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
│   └── <Entity>Form.tsx          ← Form component (page + modal mode)
├── hooks/
│   ├── use<Feature>.ts           ← useAdminFeature wrapper + export logic
│   └── use<Feature>Form.ts       ← form state, validation, submit logic
├── schemas/                      ← (optional) Zod validation schemas
│   └── <feature>Schema.ts
├── types/                        ← (optional) local types — add when needed
│   └── index.ts
└── <Feature>Screen.tsx           ← Thin orchestration — renders AdminCrudScreen
```

> **Note:** Columns live in `components/` alongside the form — no separate `columns/` folder.

---

## When to Add `types/`

Add a `types/` folder when the feature needs types beyond the global API types in `@/src/services/api/types`:

- Local form value types that differ from the API payload type
- UI-specific interfaces (`FilterState`, `CardProps`, derived row shapes)
- Zod inferred types (if not already exported from `schemas/`)

If the feature only uses types from `@/src/services/api/types` and Zod inferred types already exported from `schemas/`, skip the `types/` folder.

---

## File Responsibilities

### `api/<feature>.ts`
- Extends `BaseApiService`
- Exports a singleton: `export const featureApi = new FeatureApiService()`
- Exports query keys: `export const featureKeys = { all: [...], detail: (id) => [...] }`

```ts
import { BaseApiService } from '@/src/services/api/base';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

export class EntityApiService extends BaseApiService {
  getAll   = ()                                            => this.get<Entity[]>('/entities');
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
- Exports a **function** `get<Feature>Columns(t)` — not a plain array
- Accepts `TFunction` so column headers and cell labels are translated
- Called in `hooks/use<Feature>.ts` with `useMemo(() => get<Feature>Columns(t), [t])`
- Rebuilds automatically when language changes

```tsx
import React from 'react';
import { AppBadge } from '@/src/shared/components';
import type { Entity } from '@/src/services/api/types';
import type { ColDef } from '@/src/shared/components/data/AppDataTable';
import type { TFunction } from 'i18next';

export function getEntityColumns(t: TFunction): ColDef<Entity>[] {
  return [
    { field: 'name',   headerName: t('<feature>.columns.name'),   flex: 1,    sortable: true },
    {
      field: 'status', headerName: t('<feature>.columns.status'), width: 110, align: 'center',
      renderCell: (row) => (
        <AppBadge
          label={row.isActive ? t('<feature>.active') : t('<feature>.inactive')}
          color={row.isActive ? '#10b981' : '#6b7280'}
          size="small"
        />
      ),
    },
  ];
}
```

---

### `schemas/<feature>Schema.ts`

Zod schemas use a **factory function** pattern so error messages can be translated.

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

### Shared validation keys (`validation` namespace)

Add these to **both** `en.json` and `ar.json` — shared across all features:

```json
"validation": {
  "required":     "{{field}} is required",
  "minLength":    "{{field}} must be at least {{min}} characters",
  "maxLength":    "{{field}} must be at most {{max}} characters",
  "invalidEmail": "Invalid email address"
}
```

Field names come from `common.*` keys (e.g. `t('common.name')`, `t('common.email')`).

---

### `hooks/use<Feature>Form.ts`

Dedicated form hook — all state, validation, and submit logic extracted from the component.

**Why a separate hook:**
- Component stays pure JSX — no business logic
- Logic is testable independently
- `isDirty` tracking prevents accidental empty submits
- `firstErrorFieldId` enables scroll-to-first-error
- State syncs correctly when `item` changes (modal re-opened with different entity)

```ts
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createEntityFormSchema } from '../schemas/entitySchema';
import { useToast } from '@/src/shared/hooks/useToast';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

export interface EntityFormValues {
  name:        string;
  description: string;
}

interface Args {
  item:    Entity | null;
  onSave:  (data: CreateEntityData) => Promise<void>;
  onClose: () => void;
}

export function useEntityForm({ item, onSave, onClose }: Args) {
  const { t } = useTranslation();
  const toast = useToast();

  const getInitial = useCallback(
    (): EntityFormValues => ({
      name:        item?.name        ?? '',
      description: item?.description ?? '',
    }),
    // Re-derive only when item identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item?.id],
  );

  const [fields,            setFields]            = useState<EntityFormValues>(getInitial);
  const [errors,            setErrors]            = useState<Record<string, string>>({});
  const [isDirty,           setIsDirty]           = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [firstErrorFieldId, setFirstErrorFieldId] = useState<string | null>(null);

  // Sync state when item changes (modal re-opened with different item)
  useEffect(() => {
    setFields(getInitial());
    setErrors({});
    setIsDirty(false);
    setFirstErrorFieldId(null);
  }, [getInitial]);

  const checkDirty = useCallback(
    (next: EntityFormValues): boolean => {
      const initial = getInitial();
      return next.name !== initial.name || next.description !== initial.description;
    },
    [getInitial],
  );

  const handleChange = useCallback(
    (field: keyof EntityFormValues, value: string) => {
      setFields((prev) => {
        const next = { ...prev, [field]: value };
        setIsDirty(checkDirty(next));
        return next;
      });
      // Delete the error key — never set to ''
      setErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [checkDirty],
  );

  const handleClear = useCallback(
    (field: keyof EntityFormValues) => handleChange(field, ''),
    [handleChange],
  );

  const handleSubmit = useCallback(async () => {
    const result = createEntityFormSchema(t).safeParse(fields);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? '');
        if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);

      // First error in visual order
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
      toast.success(item ? t('<feature>.messages.updated') : t('<feature>.messages.created'));
      onClose();
    } catch {
      toast.error(item ? t('<feature>.messages.errorUpdate') : t('<feature>.messages.errorCreate'));
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, t, onSave, onClose, item, toast]);

  return { fields, errors, isDirty, firstErrorFieldId, isSubmitting, handleChange, handleClear, handleSubmit };
}
```

**Rules:**
- `getInitial` depends only on `item?.id` — prevents re-running on every render
- Errors are **deleted** (not set to `''`) on field change — avoids stale empty strings
- `isDirty` is `false` on open — submit button is disabled until user changes something
- `isSubmitting` is separate from the parent `submitting` prop — both are combined in the form

---

### `components/<Entity>Form.tsx`

Form component supports **two modes**:
- `mode="page"` (default, recommended) — full-screen `AdminFormPage`, OS handles keyboard
- `mode="modal"` — bottom sheet `AdminFormModal`, use for quick edits

```tsx
import React, { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField      from '@/src/features/admin/shared/FormField';
import { useFormScroll } from '@/src/features/admin/shared/FormScrollContext';
import { AppTextInput } from '@/src/shared/components';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useEntityForm } from '../hooks/useEntityForm';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

interface Props {
  item:       Entity | null;
  onClose:    () => void;
  onSave:     (data: CreateEntityData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';  // default: 'page'
}

const EntityForm: React.FC<Props> = ({ item, onClose, onSave, submitting, mode = 'page' }) => {
  const { t }                  = useTranslation();
  const { scrollToFirstError } = useFormScroll();

  const {
    fields, errors, isDirty, firstErrorFieldId,
    isSubmitting, handleChange, handleClear, handleSubmit,
  } = useEntityForm({ item, onSave, onClose });

  // Auto-focus first input — longer delay in modal (animation)
  const firstInputRef = useFocusInput({ inModal: mode === 'modal', enabled: true });

  // Refs for return-key navigation between fields
  const descriptionRef = useRef<TextInput | null>(null);

  const onChangeName        = useCallback((v: string) => handleChange('name', v),        [handleChange]);
  const onChangeDescription = useCallback((v: string) => handleChange('description', v), [handleChange]);
  const onClearName         = useCallback(() => handleClear('name'),        [handleClear]);
  const onClearDescription  = useCallback(() => handleClear('description'), [handleClear]);

  const onSubmit = useCallback(async () => {
    await handleSubmit();
    if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
  }, [handleSubmit, firstErrorFieldId, scrollToFirstError]);

  const formTitle   = item ? t('<feature>.editTitle') : t('<feature>.addTitle');
  const isDisabled  = submitting || isSubmitting || !isDirty;

  const fields_jsx = (
    <>
      <FormField fieldId="name">
        <AppTextInput
          inputRef={firstInputRef}
          nextRef={descriptionRef}
          label={t('<feature>.form.name')}
          value={fields.name}
          onChangeText={onChangeName}
          placeholder={t('<feature>.form.namePlaceholder')}
          error={errors.name}
          autoCapitalize="words"
          maxLength={100}
          showClearButton
          onClear={onClearName}
        />
      </FormField>

      <FormField fieldId="description">
        <AppTextInput
          inputRef={descriptionRef}
          label={t('<feature>.form.description')}
          value={fields.description}
          onChangeText={onChangeDescription}
          placeholder={t('<feature>.form.descriptionPlaceholder')}
          error={errors.description}
          autoCapitalize="sentences"
          maxLength={500}
          showClearButton
          onClear={onClearDescription}
        />
      </FormField>
    </>
  );

  if (mode === 'page') {
    return (
      <AdminFormPage
        title={formTitle}
        onBack={onClose}
        onSubmit={onSubmit}
        submitting={submitting || isSubmitting}
        submitDisabled={isDisabled}
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
      onSubmit={onSubmit}
      submitting={submitting || isSubmitting}
      submitDisabled={isDisabled}
      submitLabel={t('common.save')}
    >
      {fields_jsx}
    </AdminFormModal>
  );
};

export default EntityForm;
```

**Key patterns:**
- `FormField` wraps each input — registers Y position for scroll-to-error in modal mode
- `useFocusInput` auto-focuses the first field on open
- `nextRef` on `AppTextInput` enables return-key navigation between fields
- `isDirty` disables submit until user changes something
- `isDisabled = submitting || isSubmitting || !isDirty`

---

### `hooks/use<Feature>.ts`
- Wraps `useAdminFeature` with feature-specific config
- Calls `get<Feature>Columns(t)` with `useMemo` so columns rebuild on language change
- Owns `exporting` state + `handleExport` function
- Returns `{ f, columns, exporting, handleExport }`

```ts
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import { entityApi, entityKeys } from '../api/<feature>';
import { exportEntityPdf } from '@/src/shared/utils/exportEntityPdf';
import { getEntityColumns } from '../components/<feature>Columns';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

export function useEntities() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const columns = useMemo(() => getEntityColumns(t), [t]);

  const f = useAdminFeature<Entity, CreateEntityData>({
    entityName: 'entities',
    queryKey: entityKeys.all,
    api: {
      getAll:  entityApi.getAll.bind(entityApi),
      create:  entityApi.create.bind(entityApi),
      update:  entityApi.update.bind(entityApi),
      delete:  entityApi.remove.bind(entityApi),
    },
    messages: {
      success: { created: t('<feature>.messages.created'), updated: t('<feature>.messages.updated'), deleted: t('<feature>.messages.deleted') },
      error:   { create: t('<feature>.messages.errorCreate'), update: t('<feature>.messages.errorUpdate'), delete: t('<feature>.messages.errorDelete') },
      titles:  { create: t('<feature>.addTitle'), edit: t('<feature>.editTitle') },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportEntityPdf(t('<feature>.title'), f.entities, columns); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport };
}
```

---

### `<Feature>Screen.tsx`
- Thin orchestration — no business logic, no state
- Renders `AdminCrudScreen` with data from the hook
- All strings passed as translated values via `t()`
- `mode="page"` on the form (recommended default)

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminCrudScreen from '@/src/features/admin/shared/AdminCrudScreen';
import EntityForm      from './components/EntityForm';
import { useEntities } from './hooks/useEntities';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

const EntitiesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { f, columns, exporting, handleExport } = useEntities();

  return (
    <AdminCrudScreen<Entity>
      title={t('<feature>.title')}
      icon="📋"
      itemType={t('<feature>.itemType')}
      entities={f.entities}
      loading={f.loading}
      columns={columns}
      searchFields={['name']}
      getItemName={(e) => e.name}
      onDelete={(id) => f.remove(id)}
      onRefresh={f.refetch}
      onExport={handleExport}
      exporting={exporting}
      addLabel={t('<feature>.addTitle')}
      exportLabel={t('common.exportPdf')}
      exportingLabel={t('common.exporting')}
      refreshLabel={t('common.refresh')}
      refreshingLabel={t('common.refreshing')}
      searchPlaceholder={t('<feature>.searchPlaceholder')}
      emptyMessage={t('<feature>.emptyMessage')}
      emptyFilteredMessage={t('<feature>.emptyFilteredMessage')}
      deleteSuccessMessage={t('<feature>.messages.deleted')}
      renderForm={(item, onClose) => (
        <EntityForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
          mode="page"
          onSave={async (data: CreateEntityData) => {
            if (item) await f.update(item.id, data);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default EntitiesScreen;
```

---

## Form Infrastructure (shared)

These shared components live in `mobile/src/features/admin/shared/` and are used by all feature forms.

### `AdminFormPage` vs `AdminFormModal`

| | `AdminFormPage` | `AdminFormModal` |
|---|---|---|
| Layout | Full-screen Modal | Bottom sheet |
| Keyboard | OS handles natively ✅ | Manual scroll needed |
| Animation | Native screen slide | Slide up |
| Space | Full screen | ~85% screen height |
| **Use when** | Default — always prefer | Quick edits only |

### `FormField`

Wraps each input. In modal mode, registers the field's Y position for scroll-to-error. In page mode, it's a plain `View` wrapper with zero overhead.

```tsx
import FormField from '@/src/features/admin/shared/FormField';

<FormField fieldId="name">
  <AppTextInput ... />
</FormField>
```

Always pass a stable `fieldId` string matching the field name. Used by `scrollToFirstError`.

### `FormScrollContext` / `useFormScroll`

Provides `scrollToFirstError(ids)` — scrolls to the first field with an error.

```tsx
const { scrollToFirstError } = useFormScroll();

// In onSubmit:
await handleSubmit();
if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
```

`FormScrollProvider` is already set up inside `AdminFormPage` and `AdminFormModal` — no manual setup needed.

### `useFocusInput`

Auto-focuses the first input when the form opens. Handles timing issues, modal animation delay, and Android IME.

```ts
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';

// Page mode (shorter delay — no modal animation)
const firstInputRef = useFocusInput({ inModal: false, enabled: true });

// Modal mode (longer delay — wait for slide animation)
const firstInputRef = useFocusInput({ inModal: true, enabled: true });

// Only focus when creating (not editing)
const firstInputRef = useFocusInput({ inModal: true, enabled: item === null });
```

Pass the ref to the first `AppTextInput` via `inputRef` prop.

### Return-key navigation (`nextRef`)

`AppTextInput` accepts a `nextRef` prop — when the user presses return/next on the keyboard, focus moves to the next field.

```tsx
const versionRef     = useRef<TextInput | null>(null);
const descriptionRef = useRef<TextInput | null>(null);

<AppTextInput inputRef={firstInputRef} nextRef={versionRef}     ... />
<AppTextInput inputRef={versionRef}    nextRef={descriptionRef} ... />
<AppTextInput inputRef={descriptionRef}                         ... />  // last field
```

---

## Pagination

Pagination is built into `AdminCrudScreen` — no extra code needed in feature screens.

### How it works

`AdminCrudScreen` maintains a `page` state and slices `filtered` rows into pages of `PAGE_SIZE = 6`. The same `pageRows` slice is passed to **all three views** (table, grid, compact). `AppPagination` renders at the bottom of each view and returns `null` automatically when `totalPages <= 1`.

```
filtered rows (all matching search)
  └─ pageRows = filtered.slice((page-1)*6, page*6)
       ├─ Table  → AppDataTable(pageRows) + AppPagination footer
       ├─ Grid   → FlatList(pageRows)     + AppPagination footer
       └─ Compact → FlatList(pageRows)   + AppPagination footer
```

### Page reset

The page resets to 1 automatically when:
- The search query changes
- (The `safePage = Math.min(page, totalPages)` guard also prevents out-of-range pages when data shrinks after a delete)

### Changing page size

`PAGE_SIZE` is a module-level constant in `AdminCrudScreen.tsx`. Change it once to affect all admin screens:

```ts
const PAGE_SIZE = 6;  // ← change here
```

### AppPagination behaviour

- Returns `null` when `totalPages <= 1` — no bar shown for small lists
- Shows `from–to of total` range on the left
- Shows `‹ page/total ›` controls on the right
- Prev/Next buttons are disabled (opacity 0.35) at the boundaries

---

## Refresh & Export Buttons

All button labels must be passed as translated strings. Never rely on English fallbacks.

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

### Shared button keys (`common` namespace)

```json
"common": {
  "add": "Add",
  "refresh": "Refresh",
  "refreshing": "Loading…",
  "exportPdf": "Export PDF",
  "exporting": "Exporting…",
  "save": "Save",
  "saving": "Saving…",
  "back": "Back"
}
```

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
  "columns": {
    "name": "Name",
    "status": "Status",
    "created": "Created"
  },
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

### Where to use `t()`

| File | Keys used |
|---|---|
| `<Feature>Screen.tsx` | `title`, `itemType`, `addTitle`, `messages.deleted` + all `common.*` button labels |
| `components/<Entity>Form.tsx` | `addTitle`, `editTitle`, `form.*`, `common.save` |
| `hooks/use<Feature>Form.ts` | `messages.*`, `validation.*` via schema factory |
| `hooks/use<Feature>.ts` | `messages.*`, `addTitle`, `editTitle`, `title` (export) |
| `components/<feature>Columns.tsx` | `columns.*`, `active`, `inactive` — via `t` param |

---

## Import Rules

- Always use `@/src/...` alias — no relative `../../../` paths
- Same-folder imports (`./components/EntityForm`, `./hooks/useEntities`) stay relative
- `ColDef` comes from `@/src/shared/components/data/AppDataTable` (not the barrel)
- `exportEntityPdf` comes from `@/src/shared/utils/exportEntityPdf`

---

## Checklist — New Admin Feature

### Files
- [ ] `api/<feature>.ts` — service class + singleton + query keys
- [ ] `components/<feature>Columns.tsx` — `get<Feature>Columns(t)` function
- [ ] `components/<Entity>Form.tsx` — dual-mode form (page + modal) + `useTranslation`
- [ ] `hooks/use<Feature>Form.ts` — form state, validation, submit, `isDirty`, `firstErrorFieldId`
- [ ] `hooks/use<Feature>.ts` — `useAdminFeature` wrapper + `useMemo` columns + export
- [ ] `schemas/<feature>Schema.ts` — `createXSchema(t)` factory using `validation.*` keys
- [ ] `<Feature>Screen.tsx` — thin, renders `AdminCrudScreen`, `mode="page"` on form

### Translation
- [ ] Add namespace to `en.json` and `ar.json` with all keys including `messages.validationError`
- [ ] All hardcoded strings replaced with `t('...')`
- [ ] `deleteSuccessMessage={t('<feature>.messages.deleted')}` passed to `AdminCrudScreen`

### Form UX
- [ ] `useFocusInput` on first field
- [ ] `nextRef` chain for return-key navigation between fields
- [ ] `FormField` wrapping each input with stable `fieldId`
- [ ] `isDirty` disables submit until user changes something
- [ ] `scrollToFirstError` called after failed submit

### AdminCrudScreen props
- [ ] `onRefresh`, `onExport`, `exporting` passed
- [ ] All button labels: `addLabel`, `exportLabel`, `exportingLabel`, `refreshLabel`, `refreshingLabel`
- [ ] `searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage`
- [ ] `deleteSuccessMessage`

### General
- [ ] All cross-folder imports use `@/src/...` alias
- [ ] Screen registered in the admin navigation

---

## Reference Implementation

`mobile/src/features/admin/applications/` — fully follows this pattern.
