# Refactor Steps — Component Review Guide

A repeatable, ordered process for refactoring any component or feature to meet the architecture standards.
Work through each step in order — each one unblocks the next.

---

## Step 1 — Read and understand the file

Before touching anything:
- Read the full file
- Identify: what does it render, what data does it fetch, what state does it manage
- Note every violation (use the Feature Review Checklist in `architecture.md`)

---

## Step 2 — Extract API calls into a dedicated file

**Why first:** everything else depends on knowing where data comes from.

- Create `api/<feature>.ts` with a `BaseApiService` subclass
- Create `api/queryKeys.ts` with typed React Query key factory
- Replace every `fetch`, `axios.get`, `api.get` inline call with a method on the service class
- Export a singleton: `export const featureApi = new FeatureApiService()`
- Export from the feature barrel `index.ts`

```ts
// api/customers.ts
import { BaseApiService } from '../../../../services/api/base';
import type { Customer } from '../../../../services/api/types';

class CustomersApiService extends BaseApiService {
  getAll  = ()                    => this.get<Customer[]>('/customers');
  create  = (data: CreateData)    => this.post<Customer>('/customers', data);
  update  = (id: string, data: Partial<CreateData>) => this.put<Customer>(`/customers/${id}`, data);
  remove  = (id: string)          => this.delete<{ message: string }>(`/customers/${id}`);
}

export const customersApi = new CustomersApiService();
```

---

## Step 3 — Extract hooks into dedicated files

**Why:** hooks contain business logic that should be testable and reusable independently of JSX.

- Create `hooks/use<Feature>.ts` for each logical concern
- Move all `useState`, `useEffect`, `useQuery`, `useMutation` out of the component
- The hook returns only what the component needs (state + handlers)
- Keep local UI state (`dialogOpen`, `snackbar`) in the component unless shared

```ts
// hooks/useCustomers.ts
export function useCustomers() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: customersKeys.all,
    queryFn: customersApi.getAll,
  });
  // ... mutations, handlers
  return { customers, isLoading, handleCreate, handleDelete };
}
```

---

## Step 4 — Extract types into a types file

- Create `types/types.ts`
- Move all interfaces, types, enums out of component files
- Re-export shared types from `services/api/types` — never redefine them
- Only define UI-specific types here (`FormValues`, `DialogProps`, `TableProps`)

```ts
// types/types.ts
export type { Customer, CreateCustomerData } from '../../../../services/api/types';

export interface CustomerFormValues { ... }
export interface CustomerFormDialogProps { ... }
```

---

## Step 5 — Extract Zod schemas

- Create `schemas/<feature>Schema.ts`
- Move all `z.object(...)` definitions out of components/hooks
- Export the schema and its inferred type

```ts
// schemas/customerSchema.ts
export const customerFormSchema = z.object({ name: z.string().min(1), ... });
export type CustomerFormSchema = typeof customerFormSchema;
```

### Zod validation patterns used in this project

#### Basic field types
```ts
import { z } from 'zod';

export const ticketFormSchema = z.object({
  // Required string
  title: z.string().trim().min(1, 'Title is required').max(120),

  // Optional string (empty string allowed)
  description: z.string().trim().max(500).optional().or(z.literal('')),

  // Required enum
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),

  // Optional enum
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),

  // Required number
  estimatedHours: z.number().min(0).max(999),

  // Optional number (null allowed)
  actualHours: z.number().min(0).nullable().optional(),

  // Optional string (null allowed)
  assignedToId: z.string().uuid().nullable().optional(),

  // Email
  email: z.string().trim().email('Invalid email'),

  // URL
  url: z.string().url('Invalid URL').optional().or(z.literal('')),

  // Date string (ISO)
  dueDate: z.string().datetime().nullable().optional(),

  // Boolean
  isActive: z.boolean().default(true),

  // Array
  tags: z.array(z.string()).default([]),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>;
```

#### Cross-field validation (refine)
```ts
export const subscriptionSchema = z.object({
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
}).refine(
  (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);
```

#### Conditional required fields
```ts
export const customerSchema = z.object({
  maintenanceType: z.enum(['MONTHLY_SUBSCRIPTION', 'FREE_TRIAL', 'PAY_AS_YOU_GO']).nullable(),
  subscriptionStartDate: z.any().optional(),
  subscriptionEndDate:   z.any().optional(),
}).refine(
  (d) => {
    const needsDates = d.maintenanceType === 'MONTHLY_SUBSCRIPTION' || d.maintenanceType === 'FREE_TRIAL';
    return !needsDates || (d.subscriptionStartDate && d.subscriptionEndDate);
  },
  { message: 'Start and end dates are required for this maintenance type', path: ['subscriptionStartDate'] }
);
```

#### Password confirmation
```ts
export const resetPasswordSchema = z.object({
  password:        z.string().min(6, 'Minimum 6 characters').max(32),
  confirmPassword: z.string(),
}).refine(
  (d) => d.password === d.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);
```

#### Using schema with `ReusableFormDialog`
```tsx
// The schema is passed directly — validation runs on every change
<ReusableFormDialog
  schema={customerFormSchema}
  fields={fields}
  initialValues={initialValues}
  onSubmit={handleSubmit}
/>
```

#### Using schema with `react-hook-form` manually
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors } } = useForm<TicketFormValues>({
  resolver: zodResolver(ticketFormSchema),
  defaultValues: { priority: 'MEDIUM', tags: [] },
});
```

#### Rules
- Always `trim()` string fields before `min()`/`max()` — prevents whitespace-only values passing
- Use `.nullable()` for DB fields that can be NULL, `.optional()` for fields that may be absent from the payload
- Export both the schema constant AND the inferred type from the same file
- Never define schemas inline in components — always in `schemas/<feature>Schema.ts`
- Never duplicate validation logic between frontend schema and backend — the schema is the source of truth for the form

---

## Step 6 — Separate into small components

**Rule:** if a JSX block has its own state, or is used in more than one place, extract it.

- Each component does ONE thing
- Props interface defined above the component
- No component longer than ~150 lines
- Inline component definitions (defined inside another component's render) → move to own file
- Repeated JSX patterns → extract to a component driven by a data array

```
Before: one 400-line component
After:
  FeaturePage.tsx          ← orchestration only (~60 lines)
  components/
    FeatureTable.tsx
    FeatureFormDialog.tsx
    FeatureColumns.tsx
```

---

## Step 7 — Move shared components to common

A component belongs in `components/common/` if:
- It has no domain-specific logic (no API calls, no feature-specific types)
- It could be used in 2+ different features without modification
- It is purely presentational or a generic UI pattern

Examples that belong in common:
- `MetricCard` (title + value + icon + color)
- `EmptyState` (icon + message + optional action)
- `SectionLabel` (uppercase caption heading)
- `ConfirmDialog` (generic yes/no)

After moving, export from `components/common/index.ts` and update all imports.

---

## Step 8 — Create the feature barrel (index.ts)

- Export every public symbol from `index.ts`
- Never export internals — only what other features need
- Other features import ONLY from this barrel, never from internal paths

```ts
// index.ts
export { default as CustomersTable } from './components/CustomersTable';
export { default as CustomerFormDialog } from './components/CustomerFormDialog';
export { customersApi } from './api/customers';
export { customersKeys } from './api/queryKeys';
export type { CustomerFormValues } from './types/types';
```

---

## Step 9 — Create utility functions

- Create `utils/toFormValues.ts` — entity → form values mapper (pure function, no side effects)
- Any other pure transformation functions go in `utils/`
- No hooks, no API calls, no imports from MUI inside utils

```ts
// utils/toFormValues.ts
export function customerToFormValues(c: Customer): CustomerFormValues {
  return { name: c.name, email: c.email ?? '' };
}
```

### Step 9b — Extract inline config arrays to utils

Inline arrays built inside a component (e.g. `statCards`, `menuItems`, `columns`) that depend only on data and theme tokens should be extracted to a config file in `utils/`.

**Rule:** if the array is a constant shape (same keys every render) and only the *values* change based on props/state, extract it.

- Store the shape as a config array with `getValue` functions instead of resolved values
- Use component references (`Icon: SvgIconComponent`) instead of JSX (`icon: <Icon />`)
- Resolve dynamic values (theme colors, computed values) at render time in the component
- Use a `resolvePalette` helper for dot-path palette access instead of `lodash`

```ts
// utils/statCardsConfig.ts
export interface StatCardConfig {
  title: string;
  getValue: (s: Stats) => number;
  Icon: SvgIconComponent;
  paletteKey: 'primary.main' | 'success.main' | 'error.main';
}

export const STAT_CARDS_CONFIG: StatCardConfig[] = [
  { title: 'Total',  getValue: (s) => s.total,  Icon: TicketIcon, paletteKey: 'primary.main' },
  { title: 'Open',   getValue: (s) => s.open,   Icon: TicketIcon, paletteKey: 'error.main'   },
];
```

```tsx
// In the component — resolve at render time
const resolvePalette = (palette: Record<string, unknown>, path: string): string =>
  path.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], palette) as string;

{STAT_CARDS_CONFIG.map(({ title, getValue, Icon, paletteKey }) => (
  <MetricCard
    key={title}
    title={title}
    value={getValue(stats)}
    icon={<Icon />}
    color={resolvePalette(theme.palette as unknown as Record<string, unknown>, paletteKey)}
  />
))}
```

---

## Step 10 — Final cleanup

- [ ] Remove all unused imports
- [ ] Remove all `// TODO` comments (resolve or create a ticket)
- [ ] Replace hardcoded hex colors with `theme.palette.*` tokens
- [ ] Replace `inputProps` / `InputProps` with `slotProps.htmlInput` / `slotProps.input`
- [ ] Add `disableScrollLock` to all `<Dialog>` and `MenuProps` on all `<Select>`
- [ ] Wrap page-level component with `<ErrorBoundary>`
- [ ] Run `getDiagnostics` on all changed files — zero errors before done

---

## Quick Reference — Target Folder Structure

```
<feature>/
├── index.ts                  ← public barrel only
├── api/
│   ├── <feature>.ts          ← BaseApiService subclass + singleton
│   └── queryKeys.ts          ← typed key factory
├── components/
│   ├── <Entity>Table.tsx
│   ├── <Entity>FormDialog.tsx
│   └── <Entity>Columns.tsx
├── hooks/
│   └── use<Feature>.ts
├── schemas/
│   └── <feature>Schema.ts
├── types/
│   └── types.ts
└── utils/
    └── toFormValues.ts
```

---

## Decision Table — Where Does It Go?

| Thing | Location |
|---|---|
| API service class | `api/<feature>.ts` |
| React Query keys | `api/queryKeys.ts` |
| Data fetching + mutations | `hooks/use<Feature>.ts` |
| Form state + submit handler | `hooks/use<Feature>Form.ts` |
| Zod schema | `schemas/<feature>Schema.ts` |
| Feature-local types | `types/types.ts` |
| Entity → form mapper | `utils/toFormValues.ts` |
| Inline config array (statCards, columns) | `utils/<name>Config.ts` |
| Pure computation (stats, derived data) | `utils/compute<Name>.ts` |
| Generic UI (no domain logic) | `components/common/` |
| Feature-specific UI | `<feature>/components/` |
| Page entry point | `pages/<group>/<Name>Page.tsx` |
| Global persisted state | `stores/<name>Store.ts` |
| Cross-feature shared hooks | `shared/hooks/` |

### Common components catalogue (already in `components/common/`)

| Component | Props | Use when |
|---|---|---|
| `MetricCard` | `title, value, icon, color` | Single stat with icon badge |
| `OverviewCard` | `title, total, active, activeLabel?, metricLabel?` | Summary with active rate % |
| `DeleteConfirmDialog` | `open, onClose, onConfirm, itemName, itemType` | Any delete confirmation |
| `ErrorBoundary` | `children` | Wrap every page-level component |
| `AppTextField` | extends `TextFieldProps` + `fieldType?, showClearButton?, onClear?, startIcon?, endIcon?, rounded?, min?, max?, step?, maxLength?` | Any text input — replaces raw `<TextField>`. Variants: `search` (SearchIcon + clear), `password` (show/hide toggle), `number` (min/max/step) |
| `AppSelect` | `value, onChange, options?, placeholder?, label?, showClearButton?, loading?, multiple?, size?, fullWidth?` | Any select/dropdown — replaces `FormControl + InputLabel + Select + MenuItem`. Supports grouped options, color dots, loading state, multi-select with chips |

Always check this list before creating a new presentational component — it may already exist.

---

## Common Components — Usage Guide

### `AppTextField` — replaces all raw `<TextField>` usage

Import: `import AppTextField from '../../common/AppTextField'`  
or via barrel: `import { AppTextField } from '../../common'`

#### Search field
```tsx
// ❌ Before — boilerplate every time
<TextField
  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
  value={q} onChange={(e) => setQ(e.target.value)}
/>

// ✅ After
<AppTextField fieldType="search" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} />
```

#### Password field
```tsx
// ❌ Before — manual show/hide state + toggle button
const [show, setShow] = useState(false);
<TextField type={show ? 'text' : 'password'} slotProps={{ input: { endAdornment: ... } }} />

// ✅ After — built in
<AppTextField fieldType="password" label="Password" value={pw} onChange={...} />
```

#### Number field
```tsx
// ❌ Before
<TextField type="number" slotProps={{ htmlInput: { min: 0, step: 0.5 } }} />

// ✅ After
<AppTextField fieldType="number" min={0} step={0.5} label="Hours" value={h} onChange={...} />
```

#### Character limit with counter chip
```tsx
// ✅ Shows "6/32" chip, turns red at limit, blocks typing beyond maxLength
<AppTextField maxLength={32} label="Title" value={v} onChange={...} />
```

#### Custom start icon
```tsx
// ✅ Any MUI SvgIconComponent
<AppTextField startIcon={EmailIcon} label="Email" value={email} onChange={...} />
```

#### Rounded variant
```tsx
<AppTextField fieldType="search" rounded value={q} onChange={...} />
```

---

### `AppSelect` — replaces `FormControl + InputLabel + Select + MenuItem`

Import: `import { AppSelect } from '../../common'`

#### Basic options list
```tsx
// ❌ Before — 10+ lines every time
<FormControl size="small" fullWidth>
  <InputLabel>Status</InputLabel>
  <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)} MenuProps={{ disableScrollLock: true }}>
    <MenuItem value="">All</MenuItem>
    <MenuItem value="OPEN">Open</MenuItem>
    <MenuItem value="RESOLVED">Resolved</MenuItem>
  </Select>
</FormControl>

// ✅ After — 1 component
<AppSelect
  label="Status"
  value={status}
  onChange={setStatus}
  placeholder="All"
  options={[
    { value: 'OPEN',     label: 'Open'     },
    { value: 'RESOLVED', label: 'Resolved' },
  ]}
/>
```

#### With color dots (status/priority)
```tsx
<AppSelect
  label="Priority"
  value={priority}
  onChange={setPriority}
  options={[
    { value: 'LOW',    label: 'Low',    color: '#10b981' },
    { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
    { value: 'HIGH',   label: 'High',   color: '#ef4444' },
  ]}
/>
```

#### With loading state
```tsx
<AppSelect
  label="Customer"
  value={customerId}
  onChange={setCustomerId}
  options={customers.map((c) => ({ value: c.id, label: c.name }))}
  loading={customersLoading}
  placeholder="Select customer"
/>
```

#### With clear button
```tsx
<AppSelect
  label="Assigned To"
  value={userId}
  onChange={setUserId}
  options={users.map((u) => ({ value: u.id, label: u.name }))}
  showClearButton
  onClear={() => setUserId('')}
/>
```

#### Multiple with chips
```tsx
<AppSelect
  label="Applications"
  value={appIds}
  onChange={setAppIds}
  options={apps.map((a) => ({ value: a.id, label: a.name }))}
  multiple
/>
```

#### Grouped options
```tsx
<AppSelect
  label="User"
  value={userId}
  onChange={setUserId}
  options={[
    { value: 'u1', label: 'Alice', group: 'Admins' },
    { value: 'u2', label: 'Bob',   group: 'Admins' },
    { value: 'u3', label: 'Carol', group: 'Employees' },
  ]}
/>
```

---

### `MetricCard` — single stat display

```tsx
import { MetricCard } from '../../common';

<MetricCard
  title="Open Tickets"
  value={stats.openTickets}
  icon={<TicketIcon />}
  color={theme.palette.error.main}
/>
```

---

### `OverviewCard` — summary with rate

```tsx
import { OverviewCard } from '../../common';

<OverviewCard
  title="Customer Overview"
  total={stats.totalCustomers}
  active={stats.activeCustomers}
  // optional:
  activeLabel="currently active"   // default: "active"
  metricLabel="Active Rate"        // default: "Active Rate"
/>
```

---

### `DeleteConfirmDialog` — any delete confirmation

```tsx
import { DeleteConfirmDialog } from '../../common';

<DeleteConfirmDialog
  open={deleteDialog.open}
  onClose={closeDeleteDialog}
  onConfirm={() => handleDeleteConfirm((e) => e.id)}
  itemName={deleteDialog.item?.name}
  itemType="customer"
  loading={false}
  // optional:
  warningMessage="This customer has 3 tickets."
/>
```

---

### `ErrorBoundary` — wrap every page-level component

```tsx
import { ErrorBoundary } from '../../common/ErrorBoundary';

export default function MyFeaturePage() {
  return (
    <ErrorBoundary>
      <MyFeature />
    </ErrorBoundary>
  );
}
```
