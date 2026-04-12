# Admin Feature Structure

Reference implementation: `web/src/components/admin/customersManagement/`

---

## Page Types — Choose the Right One

| Type | When to use | Hook | Example |
|---|---|---|---|
| **A — Standard CRUD** | Full create/edit/delete with a table + form dialog | `useAdminFeature` | Customers, Applications, Tenants |
| **B — CRUD + Aux Data** | Same as A but form needs dropdown data from another API | `useAdminFeature` + `useAuxData` | Customers (needs applications), Tasks (needs boards + users) |
| **C — CRUD + Custom Logic** | CRUD with extra actions beyond create/edit/delete | `useAdminFeature` + manual handlers | Users (seats, force-delete, reset password), Tenants (status change) |
| **D — Read-only / Dashboard** | No mutations — data display, filters, PDF export | `useQuery` / `useAuxData` directly | Reports |
| **E — Settings / Config** | Form that saves config, no entity list | Local state + direct API call | Scheduler, SLA, Email Ingest |

---

## Folder Layout (all types)

```
components/admin/<featureName>/
├── index.ts                        ← public barrel (only export from here)
├── api/
│   ├── <feature>.ts                ← API service class + singleton
│   └── queryKeys.ts                ← typed query key factory
├── components/
│   ├── <Entity>FormDialog.tsx      ← create/edit dialog
│   ├── <Entity>Table.tsx           ← data grid wrapper
│   └── <Entity>Columns.tsx         ← column definitions
├── schemas/
│   └── <feature>Schema.ts          ← zod validation schema
├── utils/
│   └── toFormValues.ts             ← entity → form values mapper
└── types/
    └── types.ts                    ← re-exports + feature-local types
```

`utils/` and `schemas/` are only needed for CRUD types (A/B/C).

---

## `api/queryKeys.ts`

Always create this — other features may need to invalidate your cache.

```ts
export const entityKeys = {
  all:    ['entities']                        as const,
  detail: (id: string) => ['entities', id]    as const,
};
```

---

## `utils/toFormValues.ts`

Pure mapper — entity from API → initial form values. Never inline this in JSX.

```ts
import type { Entity } from '../../../../services/api/types/entity.ts';
import type { EntityFormValues } from '../types/types';

export function entityToFormValues(e: Entity): EntityFormValues {
  return {
    name:        e.name,
    description: e.description ?? '',
    // dates: e.someDate ? new Date(e.someDate) : null,
  };
}
```

---

## `types/types.ts`

Two sections — re-exports from the API layer, then feature-local UI types only.

```ts
// ── Re-export shared API types ────────────────────────────────────────────────
export type { Entity, CreateEntityData } from '../../../../services/api/types/entity.ts';

// ── Feature-local UI types ────────────────────────────────────────────────────
import type { CreateEntityData } from '../../../../services/api/types/entity.ts';

export type EntityFormValues = CreateEntityData;

export interface EntityFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: EntityFormValues;
  onClose: () => void;
  onSubmit: (values: EntityFormValues) => void;
  submitting?: boolean;
}

export interface UseEntityFormArgs {
  open: boolean;
  initialValues?: EntityFormValues;
  onSubmit: (values: EntityFormValues) => void;
}
```

**Rules:**
- Never redefine a type that already exists in `services/api/types/`
- Re-export it so feature code has one import location
- Only define UI-specific types here (`FormDialogProps`, `UseFormArgs`, etc.)
- If a type is needed by 2+ features → move it to `services/api/types/`

---

## `schemas/<feature>Schema.ts`

```ts
import { z } from 'zod';

export const entityFormSchema = z.object({
  name:  z.string().trim().min(3).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  // cross-field: .refine((d) => ..., { message: '...', path: ['field'] })
});

export type EntityFormSchema       = typeof entityFormSchema;
export type EntityFormSchemaValues = z.infer<typeof entityFormSchema>;
```

---

## `api/<feature>.ts`

```ts
import { BaseApiService } from '../../../../services/api/base';
import type { Entity, CreateEntityData } from '../../../../services/api/types';

export class EntityApiService extends BaseApiService {
  getAll  = ()                                        => this.get<Entity[]>('/entities');
  getOne  = (id: string)                              => this.get<Entity>(`/entities/${id}`);
  create  = (data: CreateEntityData)                  => this.post<Entity>('/entities', data);
  update  = (id: string, data: Partial<CreateEntityData>) => this.put<Entity>(`/entities/${id}`, data);
  remove  = (id: string)                              => this.delete<{ message: string }>(`/entities/${id}`);
}

export const entityApi = new EntityApiService();
```

---

## Type A — Standard CRUD page

```tsx
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { entityKeys } from '../entityManagement/api/queryKeys';
import { entityToFormValues } from '../entityManagement/utils/toFormValues';

export default function EntityManagement() {
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
      success: { created: 'Entity created', updated: 'Entity updated', deleted: 'Entity deleted' },
      error:   { create:  'Error creating', update:  'Error updating', delete:  'Error deleting' },
      titles:  { create:  'Create Entity',  edit:    'Edit Entity'                               },
    },
  });

  return (
    <ErrorBoundary>
      <Box>
        <MyGridHeader title="Entities" onAdd={() => f.openDialog()} icon={MyIcon} />

        <EntityTable
          entities={f.entities}
          loading={f.loading}
          onEdit={f.openDialog}
          onDelete={f.openDeleteDialog}
        />

        <EntityFormDialog
          open={f.ui.dialogOpen}
          editing={!!f.ui.editingItem}
          initialValues={f.ui.editingItem ? entityToFormValues(f.ui.editingItem) : undefined}
          onClose={f.closeDialog}
          onSubmit={(values) => f.handleSubmit(values)}
          submitting={f.ui.submitting}
        />

        <DeleteConfirmDialog
          open={f.ui.deleteDialog.open}
          onClose={f.closeDeleteDialog}
          onConfirm={() => f.handleDeleteConfirm((e) => e.id)}
          itemName={f.ui.deleteDialog.item?.name}
          itemType="entity"
          loading={false}
        />

        <Snackbar open={f.ui.snackbar.open} autoHideDuration={6000} onClose={f.closeSnackbar}>
          <Alert onClose={f.closeSnackbar} severity={f.ui.snackbar.severity}>
            {f.ui.snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
```

---

## Type B — CRUD + Aux Data

Use `useAuxData` for dropdown data. It caches for 5 minutes — no re-fetch on every dialog open.

```tsx
import { useAuxData } from '../../../shared/hooks/useAuxData';
import { otherKeys } from '../otherManagement/api/queryKeys';

export default function EntityManagement() {
  const f = useAdminFeature<Entity, CreateEntityData>({ ... });

  // Aux data for dropdowns — cached 5 min, no useEffect needed
  const { data: options = [], isLoading: optionsLoading } = useAuxData<Option[]>(
    otherKeys.all,
    otherApi.getAll.bind(otherApi),
  );

  return (
    <ErrorBoundary>
      <Box>
        ...
        <EntityFormDialog
          ...
          options={options}                              // ← pass to form
          loading={f.loading || optionsLoading}
        />
        ...
      </Box>
    </ErrorBoundary>
  );
}
```

Real example: `CustomersManagement` (needs applications), `TasksManagement` (needs boards + users).

---

## Type C — CRUD + Custom Logic

Use `useAdminFeature` for the base, add manual handlers for extra actions.
Call `f.setSubmitting`, `f.showSnackbar`, `f.handleError`, `f.refetch` directly.

```tsx
export default function EntityManagement() {
  const f = useAdminFeature<Entity, CreateEntityData>({ ... });

  // Extra action beyond standard CRUD
  const handleCustomAction = async (entity: Entity, value: string) => {
    try {
      await entityApi.customAction(entity.id, value);
      f.showSnackbar('Action completed', 'success');
      f.refetch();
    } catch (error) {
      f.showSnackbar(f.handleError(error, 'Action failed'), 'error');
    }
  };

  // Custom delete with fallback (e.g. force-delete)
  const handleDeleteConfirm = async () => {
    if (!f.ui.deleteDialog.item) return;
    try {
      await f.remove(f.ui.deleteDialog.item.id);
      f.showSnackbar(f.messages.success.deleted, 'success');
      f.closeDeleteDialog();
    } catch (error) {
      const msg = f.handleError(error, f.messages.error.delete);
      if (msg.includes('related data')) {
        // open force-delete dialog instead
        openForceDelete(f.ui.deleteDialog.item);
        f.closeDeleteDialog();
      } else {
        f.showSnackbar(msg, 'error');
      }
    }
  };

  return ( ... );
}
```

Real examples: `UsersManagement` (seats check, force-delete, reset password), `TenantsManagement` (status change action).

---

## Type D — Read-only / Reports

No `useAdminFeature`. Use `useQuery` / `useAuxData` directly. No form dialog, no delete.

```tsx
export default function ReportsPage() {
  const { data: tickets = [], isLoading } = useAuxData(
    ticketsKeys.all,
    () => ticketsApi.getTickets({}),
  );

  const rows = useMemo(() => buildRows(tickets), [tickets]);

  return (
    <Box>
      <MyGridHeader title="Reports" rightActions={<Toolbar />} icon={ReportsIcon} />
      <AdminDataGrid rows={rows} columns={columns} loading={isLoading} />
    </Box>
  );
}
```

---

## Type E — Settings / Config

No entity list, no table. Local state + direct API call on save. Use `useEffect` to load current config on mount.

```tsx
export default function FeatureSettings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>
    ({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    configApi.get().then(setConfig).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await configApi.update(config);
      setSnackbar({ open: true, message: 'Settings saved', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to save', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {/* form fields bound to config state */}
      <Button onClick={handleSave} disabled={saving}>Save</Button>
      <Snackbar open={snackbar.open} ...>...</Snackbar>
    </Box>
  );
}
```

---

## `useAdminFeature` API Reference

| Property | Type | Description |
|---|---|---|
| `f.entities` | `T[]` | List from React Query |
| `f.loading` | `boolean` | Query loading state |
| `f.refetch()` | fn | Force refetch from server |
| `f.create(data)` | async fn | Raw create mutation |
| `f.update(id, data)` | async fn | Raw update mutation |
| `f.remove(id)` | async fn | Raw delete mutation |
| `f.ui.editingItem` | `T \| null` | Typed — no `as Entity` cast needed |
| `f.ui.dialogOpen` | `boolean` | Form dialog open state |
| `f.ui.deleteDialog` | `{ open, item: T \| null }` | Delete dialog state |
| `f.ui.submitting` | `boolean` | Form submit in-flight |
| `f.ui.snackbar` | `{ open, message, severity }` | Snackbar state |
| `f.openDialog(item?)` | fn | Opens form dialog, optionally with item to edit |
| `f.closeDialog()` | fn | Closes form dialog, clears editingItem |
| `f.openDeleteDialog(item)` | fn | Opens delete confirm dialog |
| `f.closeDeleteDialog()` | fn | Closes delete dialog |
| `f.setSubmitting(bool)` | fn | Manually control submitting state |
| `f.handleSubmit(values)` | async fn | Create or update + snackbar + closeDialog |
| `f.handleDeleteConfirm(getId)` | async fn | Delete + snackbar + closeDeleteDialog |
| `f.showSnackbar(msg, severity)` | fn | Manual snackbar trigger |
| `f.closeSnackbar()` | fn | Close snackbar |
| `f.handleError(err, fallback)` | fn | Extracts message from unknown error |
| `f.logError(op, err)` | fn | console.error with operation label |
| `f.messages` | `MessagesConfig` | The messages config passed in |

---

## Registration

After creating the feature:

1. Add the API singleton to `web/src/services/api/index.ts`:
   ```ts
   export { entityApi } from '../../components/admin/entityManagement/api/entity';
   ```

2. Mount the page in `web/src/components/admin/AdminPanel.tsx`:
   ```tsx
   case 'entities': return <EntityManagement />;
   ```

3. Add a menu item in `AdminPanel.tsx` `menuItems` array.

---

## Checklist — Standard CRUD (Type A/B/C)

- [ ] `api/queryKeys.ts` — typed key factory
- [ ] `api/<feature>.ts` — `BaseApiService` subclass + singleton
- [ ] `utils/toFormValues.ts` — pure entity → form values mapper
- [ ] `types/types.ts` — re-exports API types + feature-local UI types only
- [ ] `schemas/<feature>Schema.ts` — zod schema + exported inferred type
- [ ] `components/<Entity>FormDialog.tsx` — uses `ReusableFormDialog` + zod schema
- [ ] `components/<Entity>Table.tsx` — wraps `AdminDataGrid`, exports `<Entity>TableProps`
- [ ] `components/<Entity>Columns.tsx` — pure `getEntityColumns` function
- [ ] `index.ts` — barrel exports components + types, nothing else
- [ ] Page uses `useAdminFeature` — no HOCs
- [ ] Aux data uses `useAuxData` — no `useState + useEffect`
- [ ] Register singleton in `services/api/index.ts`
- [ ] Mount page + add menu item in `AdminPanel.tsx`
