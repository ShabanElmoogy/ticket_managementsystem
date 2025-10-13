# Admin Feature Module Guide (Foldered Pattern Reference)

This document defines the conventions used by Applications Management and how to apply the same pattern to build other admin features (e.g., Users, Tickets, Tasks). Follow this checklist to keep all feature modules consistent, reusable, and type-safe.

## Goals
- Single, consistent structure for each admin feature module
- Reuse shared components and cells (common look & feel)
- Clear separation of concerns (columns, table, dialog, validation, hook)
- Barrel exports for convenient imports while avoiding circular dependencies

## Directory Structure (per feature)
Use a foldered layout per feature. Example for `applicationsManagement`:

- components/
  - FeatureColumns.tsx — Column factory and small presentational cells (feature-specific)
  - FeatureTable.tsx — Thin table wrapper using AdminDataGrid + columns
  - FeatureFormDialog.tsx — Create/Edit dialog UI
- hooks/
  - useFeatureForm.ts — react-hook-form + zod integration and helpers
  - useFeatureManagement.ts — screen-level controller hook (fetch, CRUD, dialogs, snackbar)
- utils/
  - validation.ts — Zod schema and derived types
- types/
  - types.ts — Form values and props types
- index.ts — Barrel exports

Concrete example (Applications Management):
- components/
  - ApplicationsColumns.tsx
  - ApplicationsTable.tsx
  - ApplicationFormDialog.tsx
- hooks/
  - useApplicationForm.ts
  - useApplicationsManagement.ts
- utils/
  - validation.ts
- types/
  - types.ts
- index.ts

## Shared Components (import from components/common)
- AdminDataGrid (DataGrid wrapper)
  - buildActionsColumn<T>() helper to render consistent action buttons
  - Actions column is centered and non-flexing by default
  - Automatically ensures at least one content column flexes to remove the filler space
- GridCells (reusable small cells)
  - VersionCell, CustomersCell, CountChip, StatusCell
  - If a cell becomes useful across multiple features, move it here

## Step-by-step Checklist

1) Define Columns
- Create `FeatureColumns.tsx` in `components/` with a factory `export const getFeatureColumns = (handlers) => GridColDef[]`.
- Use shared cells from `components/common` (e.g., `StatusCell`, `CountChip`).
- For feature-only display needs, define small presentational cells locally. If reused later, move to `common/GridCells`.
- Add the actions column via `buildActionsColumn<RowType>({ onEdit, onDelete, ... })`.
- Prefer fixed widths (`width`) and let AdminDataGrid assign flex to one content column when none is present (do NOT flex the actions column).
- Align numeric/status columns: `align: "center", headerAlign: "center"`.
- Provide robust fallbacks (e.g., `params.value || "-"`).

2) Build the Table Wrapper
- Create `FeatureTable.tsx` in `components/` that:
  - Accepts rows, loading, and handlers props
  - Builds columns via `getFeatureColumns({ onEdit, onDelete })`
  - Renders `<AdminDataGrid rows={rows} columns={columns} loading={loading} />`

3) Create the Form Module
- `types/types.ts`: define `FeatureFormValues`, dialog props, and hook args types.
- `utils/validation.ts`: implement `featureFormSchema` using zod and export types.
- `hooks/useFeatureForm.ts`: integrate `react-hook-form` with zod (`zodResolver`), expose `register`, `submit`, `errors`, `isValid`, and when needed `watch`, `setValue` for controlled components.
- `components/FeatureFormDialog.tsx`: UI that uses the hook, `TextField`s, `MySelect` (controlled using `watch`/`setValue`) and validation errors.
- Reset form when dialog opens or when `initialValues` ref changes.

## Screen Controller Hook (Management Orchestrator)
- Purpose: A screen-level controller hook that orchestrates data fetching, CRUD operations, dialog open/close, delete confirmation, snackbar notifications, and a `refetch()` method.
- Location: `hooks/useFeatureManagement.ts` per feature.
  - Applications example: `hooks/useApplicationsManagement.ts`.
- Typical return shape (example):
  - Data: `items` (e.g., applications), `loading`
  - Dialog state: `dialogOpen`, `editingItem`, `formData`
  - Delete dialog state: `{ open, item, loading }`
  - Snackbar state: `{ open, message, severity }`
  - Handlers: `handleOpenDialog`, `handleCloseDialog`, `handleSubmit`, `handleDeleteClick`, `handleDeleteConfirm`, `handleDeleteCancel`, `handleSnackbarClose`, `refetch`
- Usage: The parent management screen uses this hook and passes its handlers to the table and dialog components.
- Export strategy:
  - You can keep it internal (import via `./hooks/useFeatureManagement`) to avoid any risk of circular deps.
  - Or, optionally export it from the feature barrel for consumer convenience: `export { default as useFeatureManagement } from "./hooks/useFeatureManagement";`
  - Regardless, feature-internal files must not import from the barrel.

4) Barrel Exports (index.ts)
- Export defaults and named items. Example (Applications Management):
  - default `ApplicationsTable` and `ApplicationsTableProps` type
  - default `ApplicationsColumns` and named `getApplicationsColumns`
  - default `ApplicationFormDialog`
  - default `useApplicationForm`
  - optional default `useApplicationsManagement` (or `useFeatureManagement` for other features)
  - named `applicationFormSchema` and derived types (e.g., `ApplicationFormSchema`, `ApplicationFormSchemaValues`)
  - named types (`ApplicationFormValues`, `ApplicationFormDialogProps`, `UseApplicationFormArgs`)

5) Import Strategy in Parent "Management" Screen
- Import from the feature barrel for the table and dialog:
  - `import { FeatureTable, FeatureFormDialog } from "./featureManagement";`
  - e.g., `import { ApplicationsTable, ApplicationFormDialog } from "./applicationsManagement";`
- The screen-level controller hook may be imported either from the barrel (if exported) or directly:
  - `import useApplicationsManagement from "./applicationsManagement/hooks/useApplicationsManagement";`
- Inside feature files, avoid importing from the local index (barrel) to prevent circular dependencies.
  - Example: `ApplicationsTable` should import columns directly from `"./components/ApplicationsColumns"` (not from `"."`).
  - Example: `ApplicationFormDialog` should import the form hook from `"./hooks/useApplicationForm"`.

6) UX, Styling, and Behavior
- Actions column is centered; content alignment consistent across columns.
- `AdminDataGrid` ensures one content column flexes if none specify `flex` (removes empty filler column on the right).
- Do not assign `flex` to the actions column.
- Chips are `size="small"`, compact layout, with `variant="outlined"` where appropriate.
- Dates rendered with `.toLocaleDateString()`.

7) Type Safety
- Use precise row types (e.g., `Application`, `Customer`) and pass them to `buildActionsColumn<RowType>()`.
- `AdminDataGrid` helpers require row types to extend MUI's `GridValidRowModel` — API types typically satisfy this.
- Keep `FormValues` in sync with zod schema and form defaults.

8) Common Pitfalls
- Circular imports: do not import from `"."` within the same feature for items that are re-exported by `index.ts`.
- Chip colors: `CountChip` only accepts `"primary" | "success"` — do not pass `"secondary"`.
- Uncontrolled selects: ensure `MySelect` is controlled via `watch`/`setValue` for arrays (e.g., multiple selections).
- Forgetting to reset the form when reopening dialogs.

## Minimal Template (outline)

- components/FeatureColumns.tsx:
  - `export const getFeatureColumns = (handlers) => GridColDef[]`
  - Use `buildActionsColumn<RowType>()`

- components/FeatureTable.tsx:
  - `const FeatureTable: React.FC<Props> = ({ rows, loading, onEdit, onDelete }) => { const columns = getFeatureColumns({ onEdit, onDelete }); return <AdminDataGrid rows={rows} columns={columns} loading={loading} />; }`

- types/types.ts:
  - `export type FeatureFormValues = CreateFeatureData;`
  - Props for dialog and hook args

- utils/validation.ts:
  - `export const featureFormSchema = z.object({ ... })`

- hooks/useFeatureForm.ts:
  - `useForm({ resolver: zodResolver(featureFormSchema), mode: "onChange", defaultValues })`
  - expose `register`, `submit`, `errors`, `isValid` (+ `watch`, `setValue` if needed)

- components/FeatureFormDialog.tsx:
  - Render fields with validation errors
  - Controlled selects with `watch`/`setValue`

- hooks/useFeatureManagement.ts (screen controller):
  - Orchestrate fetch/CRUD, dialog and snackbar state, delete confirmation, and `refetch()`

- index.ts (barrel):
  - Re-export the above defaults and named items for consumer usage

## Verification Checklist
- [ ] Table renders with no filler column (one content column flexes automatically)
- [ ] Actions column/buttons centered and non-flexing
- [ ] Validation errors appear correctly in the dialog
- [ ] Dialog resets fields when reopened
- [ ] Parent screen uses barrel imports (no deep imports needed in consumer)
- [ ] No circular dependency warnings
- [ ] Types compile under strict settings

By following this guide, new admin features will be consistent, maintainable, and easier to extend.
