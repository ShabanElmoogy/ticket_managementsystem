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
│   ├── <feature>Columns.tsx      ← ColDef array (pure data, no hooks)
│   └── <Entity>Form.tsx          ← Form modal component
├── hooks/
│   └── use<Feature>.ts           ← useAdminFeature wrapper + export logic
├── schemas/                      ← (optional) Zod validation schemas
│   └── <feature>Schema.ts
├── types/                        ← (optional) local types — add when needed
│   └── index.ts
└── <Feature>Screen.tsx           ← Thin orchestration — renders AdminCrudScreen
```

> **Note:** Columns live in `components/` alongside the form — no separate `columns/` folder.

---

## When to Add `types/`

Add a `types/` folder when the feature needs types that go beyond the global API types in `@/src/services/api/types`:

- Local form value types that differ from the API payload type
- UI-specific interfaces (`FilterState`, `CardProps`, derived row shapes)
- Zod inferred types (if not already exported from `schemas/`)

```ts
// types/index.ts
import type { Application } from '@/src/services/api/types';
import type { applicationFormSchema } from '../schemas/applicationSchema';
import { z } from 'zod';

// Zod inferred form type (if not exported from schema file)
export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

// UI-specific derived type
export type ApplicationRow = Application & {
  ticketCount: number;
  customerCount: number;
};
```

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

### `components/<Entity>Form.tsx`
- Controlled form with local `useState` per field
- Wrapped in `AdminFormModal`
- Validates with Zod schema if one exists in `schemas/`
- Uses `useTranslation()` — all labels and placeholders come from `t()`
- Props: `item`, `onClose`, `onSave`, `submitting`

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import { AppTextInput } from '@/src/shared/components';
import type { Entity, CreateEntityData } from '@/src/services/api/types';

interface Props {
  item: Entity | null;
  onClose: () => void;
  onSave: (data: CreateEntityData) => Promise<void>;
  submitting: boolean;
}

const EntityForm: React.FC<Props> = ({ item, onClose, onSave, submitting }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(item?.name ?? '');

  return (
    <AdminFormModal
      open
      title={item ? t('<feature>.editTitle') : t('<feature>.addTitle')}
      onClose={onClose}
      onSubmit={() => onSave({ name })}
      submitting={submitting}
    >
      <AppTextInput
        label={t('<feature>.form.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('<feature>.form.namePlaceholder')}
      />
    </AdminFormModal>
  );
};

export default EntityForm;
```

---

### `hooks/use<Feature>.ts`
- Wraps `useAdminFeature` with feature-specific config
- Calls `get<Feature>Columns(t)` with `useMemo` so columns rebuild on language change
- Owns `exporting` state + `handleExport` function
- Imports columns from `../components/<feature>Columns`
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

  // Rebuild columns when language changes
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
- Always passes `onRefresh`, `onExport`, `exporting`
- Always passes `searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage` as translated strings

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
      renderForm={(item, onClose) => (
        <EntityForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
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

## Refresh & Export Buttons

The **Refresh**, **Export PDF**, and **Add** buttons are built into `AppScreenHeader` — they appear automatically when you pass the props to `AdminCrudScreen`. No extra UI code needed.

All button labels must be passed as translated strings from the screen. Never rely on the default English fallbacks.

```tsx
// In <Feature>Screen.tsx — pass all button labels via t()
onRefresh={f.refetch}
refreshLabel={t('common.refresh')}
refreshingLabel={t('common.refreshing')}

onExport={handleExport}
exporting={exporting}
exportLabel={t('common.exportPdf')}
exportingLabel={t('common.exporting')}

addLabel={t('<feature>.addTitle')}   // feature-specific: "Add Application", "Add Customer"
```

The header renders: `[ViewToggle] | Title | 🔄 Refresh  📄 Export PDF | ➕ Add`

### Shared button keys (in `common` namespace)

These keys live in `common` — shared across all features, no duplication needed:

```json
"common": {
  "add": "Add",
  "refresh": "Refresh",
  "refreshing": "Loading…",
  "exportPdf": "Export PDF",
  "exporting": "Exporting…"
}
```

```json
// ar.json
"common": {
  "add": "إضافة",
  "refresh": "تحديث",
  "refreshing": "جاري التحميل…",
  "exportPdf": "تصدير PDF",
  "exporting": "جاري التصدير…"
}
```

---

## Translation (i18n)

Every feature must be fully translated. Add a namespace in both `en.json` and `ar.json`.

### Translation key structure

```json
// src/i18n/locales/en.json
"<feature>": {
  "title": "Entities",
  "itemType": "entity",
  "addTitle": "Add Entity",
  "editTitle": "Edit Entity",
  "searchPlaceholder": "Search entities…",
  "emptyMessage": "No entities yet",
  "emptyFilteredMessage": "No entities match your search",
  "columns": {
    "name": "Name",
    "status": "Status"
  },
  "form": {
    "name": "Name *",
    "namePlaceholder": "Entity name"
  },
  "messages": {
    "created": "Entity created successfully",
    "updated": "Entity updated successfully",
    "deleted": "Entity deleted successfully",
    "errorCreate": "Error creating entity",
    "errorUpdate": "Error updating entity",
    "errorDelete": "Error deleting entity"
  },
  "export": "Export PDF"
}
```

### Where to use `t()`

| File | Keys used |
|---|---|
| `<Feature>Screen.tsx` | `title`, `itemType`, `addTitle`, `searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage` + `common.refresh`, `common.refreshing`, `common.exportPdf`, `common.exporting` |
| `components/<Entity>Form.tsx` | `addTitle`, `editTitle`, `form.*` |
| `hooks/use<Feature>.ts` | `messages.*`, `addTitle`, `editTitle`, `title` (export), `columns.*` via `getColumns(t)` |
| `components/<feature>Columns.tsx` | `columns.*`, `active`, `inactive` — via `t` param, not hook |

### Usage pattern

```tsx
// Screen — all strings via t(), nothing hardcoded
const { t } = useTranslation();
<AdminCrudScreen
  title={t('applications.title')}
  itemType={t('applications.itemType')}
  addLabel={t('applications.addTitle')}
  exportLabel={t('common.exportPdf')}
  exportingLabel={t('common.exporting')}
  refreshLabel={t('common.refresh')}
  refreshingLabel={t('common.refreshing')}
  searchPlaceholder={t('applications.searchPlaceholder')}
  emptyMessage={t('applications.emptyMessage')}
  emptyFilteredMessage={t('applications.emptyFilteredMessage')}
  ...
/>

// Form
title={item ? t('applications.editTitle') : t('applications.addTitle')}
<AppTextInput label={t('applications.form.name')} placeholder={t('applications.form.namePlaceholder')} />

// Hook
messages: {
  success: { created: t('applications.messages.created'), ... },
  error:   { create: t('applications.messages.errorCreate'), ... },
}
```

### Checklist — Translation

- [ ] Add namespace to `src/i18n/locales/en.json`
- [ ] Add namespace to `src/i18n/locales/ar.json`
- [ ] `useTranslation()` in Screen, Form, and Hook
- [ ] All hardcoded strings replaced with `t('...')`

---

## Import Rules

- Always use `@/src/...` alias — no relative `../../../` paths
- Same-folder imports (`./components/EntityForm`, `./hooks/useEntities`) stay relative
- `ColDef` comes from `@/src/shared/components/data/AppDataTable` (not the barrel)
- `exportEntityPdf` comes from `@/src/shared/utils/exportEntityPdf`

---

## Checklist — New Admin Feature

- [ ] `api/<feature>.ts` — service class + singleton + query keys
- [ ] `components/<feature>Columns.tsx` — `get<Feature>Columns(t)` function export (not a plain array)
- [ ] `components/<Entity>Form.tsx` — form with `AdminFormModal` + `useTranslation`
- [ ] `hooks/use<Feature>.ts` — `useAdminFeature` wrapper + `useMemo` columns + export + `useTranslation`
- [ ] `schemas/<feature>Schema.ts` — Zod schema (if validation needed)
- [ ] `<Feature>Screen.tsx` — thin, renders `AdminCrudScreen` + `useTranslation`
- [ ] `en.json` + `ar.json` — translation namespace added with all required keys
- [ ] All cross-folder imports use `@/src/...` alias
- [ ] `onRefresh`, `onExport`, `exporting` passed to `AdminCrudScreen`
- [ ] `addLabel`, `exportLabel`, `exportingLabel`, `refreshLabel`, `refreshingLabel` passed as translated strings
- [ ] `searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage` passed as translated strings
- [ ] Screen registered in the admin navigation

---

## Reference Implementation

`mobile/src/features/admin/applications/` — fully follows this pattern.
