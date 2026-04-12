# Admin Codebase — Improvement Backlog

Grounded in actual code review. Ordered by impact vs effort.
Each item has a concrete implementation path, not just a description.

---

## 🔴 Priority 1 — High impact, low effort

---

### 1. `staleTime` on main entity queries

**Problem:** `useEntityData` has no `staleTime`. Every tab switch or navigation re-fetches all entity lists from the server even if data is seconds old.

**File:** `web/src/shared/hooks/useEntityData.ts`

**Fix:**
```ts
const { data: entities = [], isLoading: loading, refetch } = useQuery({
  queryKey: resolvedKey,
  queryFn: config.api.getAll,
  enabled: !!token,
  staleTime: 30 * 1000,  // ← add this
});
```

---

### 2. Migrate `UserFormDialog` to `ReusableFormDialog`

**Problem:** `UserFormDialog` is 180 lines of manual `useForm` + `TextField` + `Controller` boilerplate. `ReusableFormDialog` already supports every field type it needs (`text`, `email`, `password`, `select`). It's the biggest inconsistency — two dialogs follow the pattern, two don't.

**File:** `web/src/components/admin/usersManagement/components/UserFormDialog.tsx`

**Fields mapping:**
```ts
const fields: FormField<UserFormValues>[] = [
  { name: 'name',     label: 'Name',     required: true, autoFocus: true, width: 2 },
  { name: 'email',    label: 'Email',    type: 'email',  required: true, width: 2 },
  { name: 'password', label: 'Password', type: 'password', width: 2 },
  { name: 'role',     label: 'Role',     type: 'select', options: ROLE_OPTIONS, width: 2 },
  // tenantSlug: type: 'customSelect', options: tenantOptions (loaded via useAuxData)
  { name: 'phone',    label: 'Phone',    width: 2 },
];
```

The tenant dropdown loads async — pass `isLoading` from `useAuxData(tenantsKeys.all, tenantsApi.list)` and disable the field while loading.

---

### 3. Migrate `TenantFormDialog` to `ReusableFormDialog`

**Problem:** Same as above — 120 lines of manual form code. All fields are standard types already supported by `ReusableFormDialog`.

**File:** `web/src/components/admin/tenantsManagement/components/TenantFormDialog.tsx`

**Fields mapping:**
```ts
const fields: FormField<TenantFormValues>[] = [
  { name: 'name',               label: 'Name',                required: true, autoFocus: true, width: 2 },
  { name: 'slug',               label: 'Slug',                width: 2 },
  { name: 'subscriptionPlan',   label: 'Plan',                type: 'select', options: PLAN_OPTIONS,   width: 2 },
  { name: 'subscriptionStatus', label: 'Status',              type: 'select', options: STATUS_OPTIONS, width: 2 },
  { name: 'subscriptionSeats',  label: 'Seats',               type: 'number', min: 0, width: 2 },
  { name: 'subscriptionStart',  label: 'Subscription Start',  type: 'date',   width: 2 },
  { name: 'subscriptionEnd',    label: 'Subscription End',    type: 'date',   width: 2 },
  { name: 'supportEmail',       label: 'Support Email',       type: 'email',  width: 1 },
];
```

---

### 4. Aux data loading state in dialogs

**Problem:** When `CustomerFormDialog` opens, the applications `multiSelect` is empty until `useAuxData` resolves. No spinner, no disabled state — user sees a blank dropdown and doesn't know if it's loading or just empty.

**File:** `web/src/components/admin/02components/CustomersManagement.tsx`

**Fix:** Pass `isLoading` into the dialog and disable the field:
```tsx
const { data: applications = [], isLoading: appsLoading } = useAuxData(...);

// In CustomerFormDialog, add to the applicationIds field:
{ name: 'applicationIds', ..., disabled: () => appsLoading }
// Or show a CircularProgress adornment on the field while loading
```

Same applies to `UserFormDialog` tenant dropdown.

---

### 5. `ReportsManagement` — migrate to `useAuxData`

**Problem:** The only page still using `useState + useEffect + useCallback` for data fetching. Inconsistent with everything else, no caching, no deduplication.

**File:** `web/src/components/admin/02components/ReportsManagement.tsx`

**Fix:**
```ts
const { data: tickets = [],   isLoading: ticketsLoading }   = useAuxData(['reports-tickets'],   () => ticketsApi.getTickets({}));
const { data: customers = [], isLoading: customersLoading } = useAuxData(['reports-customers'], customersApi.getCustomers.bind(customersApi));

const loading = ticketsLoading || customersLoading;
// Remove all useState/useEffect/useCallback for data fetching
// Keep reportType state and the useMemo row builders
```

---

## 🟡 Priority 2 — Medium impact, medium effort

---

### 6. `useCustomAction` hook

**Problem:** `TenantsManagement` and `UsersManagement` both have the same pattern repeated multiple times: call API → show snackbar on success → show error snackbar on failure → refetch. Currently copy-pasted.

**File to create:** `web/src/shared/hooks/useCustomAction.ts`

```ts
export function useCustomAction(
  showSnackbar: (msg: string, sev: 'success' | 'error') => void,
  handleError:  (err: unknown, fallback: string) => string,
  refetch:      () => void,
) {
  return useCallback(async (
    action:       () => Promise<void>,
    successMsg:   string,
    errorFallback: string,
    options?: { skipRefetch?: boolean },
  ) => {
    try {
      await action();
      showSnackbar(successMsg, 'success');
      if (!options?.skipRefetch) refetch();
    } catch (e) {
      showSnackbar(handleError(e, errorFallback), 'error');
    }
  }, [showSnackbar, handleError, refetch]);
}
```

**Usage in TenantsManagement:**
```ts
const customAction = useCustomAction(f.showSnackbar, f.handleError, f.refetch);

const handleStatusChange = (tenant: Tenant, status: string) =>
  customAction(
    () => status === 'ACTIVE' ? tenantsApi.activate(tenant.id) : tenantsApi.update(tenant.id, { subscriptionStatus: status }),
    `"${tenant.name}" status changed to ${status}`,
    'Error updating tenant status',
  );
```

---

### 7. `EmptyState` component

**Problem:** Every table shows a blank grid when empty. No message, no call-to-action. Users don't know if data is loading, empty, or an error occurred.

**File to create:** `web/src/components/common/EmptyState.tsx`

```tsx
interface EmptyStateProps {
  icon?:    React.ElementType;
  message:  string;
  subtitle?: string;
  action?:  { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, message, subtitle, action }) => (
  <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
    {Icon && <Icon sx={{ fontSize: 48, mb: 2, opacity: 0.4 }} />}
    <Typography variant="h6">{message}</Typography>
    {subtitle && <Typography variant="body2" sx={{ mt: 1 }}>{subtitle}</Typography>}
    {action && <Button variant="outlined" sx={{ mt: 2 }} onClick={action.onClick}>{action.label}</Button>}
  </Box>
);
```

**Usage in AdminDataGrid:**
```tsx
// Pass as `slots.noRowsOverlay` to MUI DataGrid
<AdminDataGrid
  slots={{ noRowsOverlay: () => <EmptyState message="No customers yet" action={{ label: 'Add Customer', onClick: onAdd }} /> }}
/>
```

---

### 8. Query key namespacing

**Problem:** Query keys are flat — `['customers']`, `['users']`, `['tasks']`. Collision-prone as the app grows. React Query DevTools also becomes hard to read.

**Convention to adopt:** `['admin', 'entity']` namespace.

**Files to update:** All `api/queryKeys.ts` files.

```ts
// Before
export const customersKeys = {
  all:    ['customers']                     as const,
  detail: (id: string) => ['customers', id] as const,
};

// After
export const customersKeys = {
  all:    ['admin', 'customers']                     as const,
  detail: (id: string) => ['admin', 'customers', id] as const,
};
```

Do this in one pass across all 5 feature `queryKeys.ts` files + `useEntityData.ts`.

---

## 🟢 Priority 3 — Good to have, do when needed

---

### 9. Server-side pagination in `useEntityData`

**Problem:** All tables load the full dataset. Fine now, will break at scale.

**When to do:** When any entity list exceeds ~500 rows in production.

**Approach:** Add optional `params` to `EntityConfig.api.getAll`:
```ts
getAll: (params?: { page: number; pageSize: number; search?: string }) => Promise<{ data: T[]; total: number }>;
```

`useEntityData` would then accept `params` state and pass it to the query key + query fn.

---

### 10. `useTableFilters` hook

**Problem:** No search or filtering in any admin table. Users scroll through full lists.

**When to do:** When users start complaining about finding items.

**Approach:**
```ts
export function useTableFilters<T>(entities: T[], searchFields: (keyof T)[]) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    search
      ? entities.filter(e => searchFields.some(f => String(e[f]).toLowerCase().includes(search.toLowerCase())))
      : entities,
    [entities, search, searchFields]
  );
  return { filtered, search, setSearch };
}
```

---

### 11. Soft delete / undo toast

**Problem:** Deletes are permanent with no undo. Accidental deletes are unrecoverable.

**When to do:** When users request it or after a data loss incident.

**Approach:** Requires backend `deletedAt` column + restore endpoint. Frontend shows a timed "Undo" snackbar after delete that calls the restore endpoint before the snackbar closes.

---

## What NOT to do

| Idea | Why not |
|---|---|
| Skeleton loaders for tables | MUI DataGrid's built-in loading overlay is sufficient |
| Bulk actions | Not requested, adds significant complexity |
| Audit trail | Backend concern — needs DB schema changes first |
| Breadcrumbs | Single-level admin panel, no nesting |
| Custom error boundary per dialog | ErrorBoundary on the page level is sufficient |
| Undo/redo | Needs soft delete backend support first |

---

## Implementation order

```
Week 1 (quick wins):
  ✅ 1. staleTime in useEntityData
  ✅ 2. Migrate UserFormDialog → ReusableFormDialog
  ✅ 3. Migrate TenantFormDialog → ReusableFormDialog
  ✅ 4. Aux data loading state in dialogs
  ✅ 5. ReportsManagement → useAuxData

Week 2 (abstractions):
  ✅ 6. useCustomAction hook
  ✅ 7. EmptyState component
  ✅ 8. Query key namespacing

When needed:
  ⏳ 9. Server-side pagination
  ⏳ 10. useTableFilters
  ⏳ 11. Soft delete / undo
```
