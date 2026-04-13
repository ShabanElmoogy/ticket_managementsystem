# Project Architecture — Frontend (web/src)

Senior Architect review of the current structure with canonical patterns, identified issues, and the target design to follow for all new and refactored work.

---

## Current Structure Assessment

### What works well
- Feature-based folders under `components/admin/*Management` with `api/`, `components/`, `schemas/`, `types/`, `utils/` sub-folders
- Shared hooks in `shared/hooks/` (`useAdminFeature`, `useAuxData`, `useEntityData`)
- Centralised type definitions in `services/api/types/`
- Zustand stores isolated in `stores/`
- `common/` for reusable UI primitives

### Critical issues

| Issue | Location | Impact |
|---|---|---|
| **Numeric folder prefixes** (`01layout`, `02components`) | `admin/01layout`, `admin/02components` | Breaks alphabetical tooling, signals missing abstraction |
| **Flat dump folder** (`02components`) | `admin/02components/*.tsx` | 9 page-level components in one flat folder with no sub-structure |
| **Duplicate API entry points** | `services/api.ts` + `services/api/index.ts` | Two files exporting the same things — import confusion |
| **Feature pages inside `components/`** | `epics/EpicsPage.tsx`, `features/FeaturesPage.tsx` | Pages belong in `pages/`, not `components/` |
| **Types duplicated per feature** | `kanban/types/types.ts`, `epics/detail/types.ts` | Should live in `services/api/types/` or feature `types/` only |
| **Settings scattered** | `adminSettings/` flat folder, no sub-structure | Will grow unbounded; needs same feature-folder pattern |
| **`config/statItems.ts` calls `useMediaQuery`** | `config/statItems.ts` | Config files must be pure data — hooks belong in components |
| **`components/AppRouter.tsx`** | Root of `components/` | Router is infrastructure, not a component — belongs in `src/` |
| **`webUsageStats.js`** | `src/webUsageStats.js` | Untyped JS in a TS project, no clear ownership |

---

## Target Architecture

```
web/src/
├── app/                          # App bootstrap (was scattered in src/)
│   ├── App.tsx
│   ├── AppRouter.tsx             # ← moved from components/
│   ├── AuthInitializer.tsx
│   └── ThemeProvider.tsx
│
├── pages/                        # Route-level entry points only — thin wrappers
│   ├── DashboardPage.tsx
│   ├── AdminPage.tsx
│   ├── KanbanPage.tsx
│   ├── TicketDetailPage.tsx
│   ├── EpicsPage.tsx             # ← moved from components/epics/
│   ├── EpicDetailPage.tsx
│   ├── FeaturesPage.tsx          # ← moved from components/features/
│   └── ...
│
├── features/                     # Feature modules — self-contained vertical slices
│   ├── admin/
│   │   ├── layout/               # ← was 01layout/
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── AdminTopBar.tsx
│   │   ├── dashboard/            # ← was 02components/AdminDashboard.tsx
│   │   ├── settings/             # ← was adminSettings/ + 02components/AdminSettings.tsx
│   │   │   ├── general/
│   │   │   ├── tickets/
│   │   │   └── AdminSettings.tsx
│   │   ├── customers/            # ← was customersManagement/
│   │   ├── applications/
│   │   ├── tickets/
│   │   ├── users/
│   │   ├── tenants/
│   │   ├── tasks/
│   │   ├── reports/
│   │   ├── docs/
│   │   └── templates/
│   ├── dashboard/
│   ├── kanban/
│   ├── epics/
│   ├── features/                 # (feature-requests domain)
│   ├── tickets/
│   ├── auth/
│   ├── profile/
│   └── programming/
│
├── shared/                       # Cross-feature reusables
│   ├── components/               # ← was components/common/
│   │   ├── DataGrid/
│   │   ├── dialogs/
│   │   ├── forms/
│   │   └── ...
│   ├── hooks/                    # ← was shared/hooks/
│   └── utils/                    # ← was utils/
│
├── services/                     # Infrastructure — API, sockets, HTTP
│   ├── api/
│   │   ├── base.ts
│   │   ├── httpClient.ts
│   │   ├── retryLogic.ts
│   │   └── types/
│   └── socket/
│       └── socketService.ts
│
├── stores/                       # Global state (Zustand)
├── types/                        # App-wide TS types (roles, primitives)
├── config/                       # Pure data/constants only — NO hooks
├── i18n/
└── styles/
```

---

## Feature Folder Contract

Every feature under `features/<domain>/` follows this exact layout:

```
features/<domain>/
├── index.ts                  # Public barrel — only export from here
├── api/
│   ├── <domain>.ts           # BaseApiService subclass + singleton
│   └── queryKeys.ts          # Typed React Query key factory
├── components/               # UI components private to this feature
├── hooks/                    # Custom hooks (useQuery wrappers, form logic)
├── schemas/                  # Zod validation schemas
├── types/                    # Feature-local types + re-exports from services/api/types
└── utils/                    # Pure functions (mappers, formatters)
```

**Rules:**
- Never import from another feature's internals — only from its `index.ts`
- Never import from `features/` inside `shared/` — shared must stay generic
- Page components in `pages/` import from `features/<domain>/index.ts` only
- API singletons live in `features/<domain>/api/<domain>.ts`, not in `services/`

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Feature folder | `camelCase` | `customersManagement` → `customers` |
| Component file | `PascalCase.tsx` | `CustomerFormDialog.tsx` |
| Hook file | `camelCase.ts`, prefix `use` | `useCustomerForm.ts` |
| API service file | `camelCase.ts` | `customers.ts` |
| Query key file | `queryKeys.ts` | always this name |
| Schema file | `<feature>Schema.ts` | `customerSchema.ts` |
| Types file | `types.ts` | always this name |
| Barrel | `index.ts` | always this name |
| Page component | `<Name>Page.tsx` | `CustomersPage.tsx` |

**Never use:**
- Numeric prefixes (`01layout`, `02components`)
- Generic dump names (`components`, `utils`) at the top level of a feature
- `index.tsx` for page-level components (reserve `index.ts` for barrels only)

---

## Import Rules

```ts
// ✅ Feature imports its own internals directly
import { customerSchema } from '../schemas/customerSchema';

// ✅ Cross-feature: always via barrel
import { customersApi } from '../../customers';

// ✅ Shared utilities
import { formatDate } from '@/shared/utils/dateUtils';

// ❌ Never reach into another feature's internals
import { CustomerFormDialog } from '../../customers/components/CustomerFormDialog';

// ❌ Never import hooks from config files
import { useMediaQuery } from '@mui/material'; // in config/statItems.ts — WRONG
```

---

## State Management Rules

| State type | Where |
|---|---|
| Server state (API data) | React Query (`useQuery`, `useMutation`) |
| Global UI state (theme, auth, tenant) | Zustand store in `stores/` |
| Local UI state (dialog open, form values) | `useState` / `useReducer` in component |
| Cross-feature shared state | Zustand store — never prop-drill across features |

---

## Page vs Component Rule

A file belongs in `pages/` if:
- It maps 1:1 to a route
- It is the top-level entry point rendered by the router
- It only composes feature components — contains no business logic itself

Everything else belongs in `features/<domain>/components/`.

---

## Settings Pattern

Settings panels follow the same feature-folder contract. Each settings group is a self-contained feature:

```
features/admin/settings/
├── AdminSettings.tsx         # Tab shell only
├── general/
│   ├── GeneralSettings.tsx   # Vertical-tab shell
│   └── DateFormatSettings.tsx
├── tickets/
│   ├── TicketsSettings.tsx   # Vertical-tab shell
│   ├── SchedulerSettings.tsx
│   └── SlaSettings.tsx
└── epics/
    └── EpicAutoCloseSettings.tsx
```

Adding a new settings group = add a folder, add a tab entry. No changes to `AdminSettings.tsx` internals.

---

## Migration Priority

```
Phase 1 — Quick wins (rename, no logic change)
  ✅ Remove numeric prefixes from admin layout folders
  ✅ Move 02components/* into their own feature folders
  ✅ Delete duplicate services/api.ts entry point

Phase 2 — Page/component separation
  ✅ Move EpicsPage, FeaturesPage, EpicDetailPage → pages/
  ✅ Move AppRouter → src/
  ✅ Group pages/ into subfolders (admin/, epics/, features/)

Phase 3 — Feature consolidation
  ✅ Merge adminSettings/ into features/admin/settings/
  ✅ Fix config/statItems.ts — extract hook usage into component
  ✅ Move ThemeProvider → providers/
  ✅ Extract ticketView from themeStore → uiStore

Phase 4 — Shared layer cleanup
  ⏳ Consolidate components/common/ → shared/components/
  ⏳ Consolidate utils/ → shared/utils/
```

---

## Feature Review Checklist

Use this checklist when reviewing any feature folder against the architecture.

### Location
- [ ] Feature lives in `components/admin/<feature>/` (or `features/<domain>/` in Phase 4)
- [ ] No numeric prefixes in folder names
- [ ] Page-level components live in `pages/`, not inside `components/`
- [ ] Proxy re-export files (`export { default } from '...'`) do not exist

### Folder contract
- [ ] `index.ts` barrel exists and is the only public export surface
- [ ] `api/<feature>.ts` — `BaseApiService` subclass + singleton
- [ ] `api/queryKeys.ts` — typed React Query key factory
- [ ] `components/` — UI components private to this feature
- [ ] `hooks/` — custom hooks (if any logic extracted)
- [ ] `schemas/` — Zod validation schemas (if forms exist)
- [ ] `types/types.ts` — re-exports from `services/api/types` + feature-local UI types only
- [ ] `utils/` — pure functions (mappers, formatters)

### Imports
- [ ] Cross-feature imports go through the barrel (`index.ts`), never internal paths
- [ ] API singletons imported from feature barrel, not from `services/api` directly
- [ ] No hooks called inside config files (`config/`)
- [ ] `services/api/types` imported as folder (resolves to `index.ts`), not flat file

### Data fetching
- [ ] Server state uses React Query (`useQuery` / `useMutation`)
- [ ] List data uses `useAuxData` or `useEntityData` — no `useState + useEffect + fetch`
- [ ] No raw `Promise.all` in components for data loading

### Components
- [ ] Generic/reusable UI components live in `components/common/`, not inside a feature
- [ ] No inline component definitions that are used in more than one place
- [ ] Repeated JSX patterns extracted to a component or driven by a data array
- [ ] `ErrorBoundary` wraps page-level components

### State
- [ ] Global UI state (theme, auth, tenant, ui prefs) in Zustand stores
- [ ] Unrelated concerns not mixed in the same store (e.g. `ticketView` ≠ theme)
- [ ] Local UI state (dialog open, form values) stays in `useState`

### MUI patterns (see mui-patterns.md)
- [ ] No `inputProps` / `InputProps` — use `slotProps.htmlInput` / `slotProps.input`
- [ ] All `<Select>` have `MenuProps={{ disableScrollLock: true }}`
- [ ] All `<Dialog>` have `disableScrollLock`
- [ ] No hardcoded hex colors — use `theme.palette.*` tokens
- [ ] `createTheme` wrapped in `useMemo` if called inside a component

### Naming
- [ ] Feature folder: `camelCase` (e.g. `customersManagement`)
- [ ] Component files: `PascalCase.tsx`
- [ ] Hook files: `camelCase.ts` with `use` prefix
- [ ] Barrel: always `index.ts`
- [ ] Page components: `<Name>Page.tsx`
- [ ] No `index.tsx` for page-level components
