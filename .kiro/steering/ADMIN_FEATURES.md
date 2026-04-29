# Admin Features — Mobile Reference

Complete documentation of all implemented admin features in `mobile/src/features/admin/`.

---

## Constants — Use `@/src/constants/api`

All API endpoint paths, query keys, socket events, HTTP status codes, and pagination defaults are centralized in `mobile/src/constants/api.ts`. **Never hardcode these values.**

### API endpoint paths

```ts
import { API } from '@/src/constants/api';

// ✅ Correct
this.get<Customer[]>(API.CUSTOMERS.LIST)
this.get<Customer>(API.CUSTOMERS.BY_ID(id))
this.post(API.CUSTOMERS.ASSIGN_APPLICATION, { customerId, applicationId })
this.delete(API.TICKETS.COMMENT_BY_ID(ticketId, commentId))

// ❌ Wrong — hardcoded strings
this.get<Customer[]>('/customers')
this.get<Customer>(`/customers/${id}`)
```

### React Query cache keys

```ts
import { QUERY_KEYS } from '@/src/constants/api';

// ✅ Correct
queryKey: QUERY_KEYS.CUSTOMERS.all
queryKey: QUERY_KEYS.CUSTOMERS.detail(id)
queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMERS.all })

// ❌ Wrong — duplicated per file
export const customersKeys = { all: ['customers'] as const, ... }
```

### Socket event names

```ts
import { SOCKET } from '@/src/constants/api';

// ✅ Correct
socket.on(SOCKET.EVENTS.NOTIFICATION, handler)
socket.emit(SOCKET.EMIT.JOIN, `user_${userId}`)
if (type === SOCKET.NOTIFICATION_TYPES.TICKET_ASSIGNED) { ... }

// ❌ Wrong
socket.on('notification', handler)
socket.emit('join', ...)
```

### HTTP status codes

```ts
import { HTTP_STATUS } from '@/src/constants/api';

// ✅ Correct
if (error.status === HTTP_STATUS.UNAUTHORIZED) { ... }
if (error.status === HTTP_STATUS.NOT_FOUND) { ... }

// ❌ Wrong
if (error.status === 401) { ... }
if (error.status === 404) { ... }
```

### Pagination & stale time

```ts
import { PAGINATION } from '@/src/constants/api';

// ✅ Correct — stale times only (ADMIN_PAGE_SIZE is no longer used directly)
staleTime: PAGINATION.DETAIL_STALE_TIME         // 2 * 60 * 1000
staleTime: PAGINATION.LIST_STALE_TIME           // 30 * 1000

// ❌ Wrong
staleTime: 2 * 60_000
```

**`AdminCrudScreen` uses tenant-aware pagination** — page size and mode come from `usePaginationStore`, not `PAGINATION.ADMIN_PAGE_SIZE`. Do not pass a hardcoded page size to `AdminCrudScreen`.

```ts
// AdminCrudScreen reads these automatically — no prop needed
const paginationMode = usePaginationStore((s) => s.paginationMode);
const pageSize       = usePaginationStore((s) => s.getEffectivePageSize());
const maxClientRecs  = usePaginationStore((s) => s.maxClientRecords);
```

**Pagination modes:**
- `CLIENT` — all entities fetched upfront, capped at `maxClientRecords`, then paginated locally with `pageSize`
- `SERVER` — entities already paged by the API; pass `apiTotal` + `onPageChange` to `AdminCrudScreen` for correct page count and re-fetch on navigation

### Ticket query builder

```ts
import { buildTicketQuery, type TicketFilters } from '@/src/constants/api';

const url = buildTicketQuery({ status: 'OPEN', priority: 'HIGH', assignedTo: userId });
// → '/tickets?status=OPEN&priority=HIGH&assignedTo=uuid'
```

---

---

## Import Alias

All imports use the `@/src/` alias (configured in `tsconfig.json`). Never use relative `../../../` paths from feature files.

```ts
// ✅ Correct — alias
import { useThemeColors } from '@/src/constants/theme';
import { customersApi }   from '@/src/features/admin/customers/api/customers';

// ❌ Wrong — relative from a feature file
import { useThemeColors } from '../../../constants/theme';
```

**Exception:** shared components inside `mobile/src/shared/components/` use relative `../../../constants/theme` because they are not feature files.

---

## Theme Colors — Rules

### The only correct pattern

```ts
// 1. Call once at the top of the component
const c = useThemeColors();

// 2. Use semantic tokens everywhere
backgroundColor: c.surface.primary
color:           c.text.primary
borderColor:     c.border.primary
```

### Never use `Palette` directly in components

```ts
// ❌ Wrong — hardcoded, ignores dark mode
color: Palette.slate800

// ✅ Correct — semantic, auto-switches
color: c.text.primary
```

### `Palette` is allowed ONLY in two places

1. **Module-level constant maps** (outside components/functions) — e.g. `STATUS_COLORS`, `DARKEN` maps. These are safe because `Palette` is a plain object with no imports.
2. **`theme.ts` itself** — where `Colors.light` and `Colors.dark` are defined.

```ts
// ✅ OK — module-level constant, Palette is a plain object
const DARKEN: Record<string, string> = {
  [Palette.red500]: Palette.red600,
};

// ❌ Wrong — inside a component render
<View style={{ backgroundColor: Palette.slate800 }} />
```

### Never use `Colors.dark.x` or `Colors.light.x` at module level

`Colors` is exported from `theme.ts` which imports `uiStore` which creates a circular dependency. Using `Colors.x` as computed object keys at module level will crash at runtime.

```ts
// ❌ Crashes — circular dep, Colors may be undefined at module init
const MAP = { [Colors.light.intent.error]: Colors.light.interactive.errorPressed };

// ✅ Safe — Palette has no imports
const MAP = { [Palette.red500]: Palette.red600 };
```

### `useThemeColors()` token reference

```
c.surface.primary      // main card/dialog bg
c.surface.secondary    // subtle tinted bg (inputs, code blocks)
c.surface.tertiary     // panel headers, table headers
c.surface.elevated     // pressed/hover state

c.text.primary         // main text
c.text.secondary       // secondary/label text
c.text.muted           // placeholder, disabled, captions
c.text.inverse         // white text on colored buttons

c.border.primary       // main border
c.border.secondary     // secondary border
c.border.focus         // focus ring (blue)

c.intent.success / .successSurface
c.intent.error   / .errorSurface
c.intent.warning / .warningSurface
c.intent.info    / .infoSurface

c.interactive.primary        // blue button bg
c.interactive.primaryPressed // blue button pressed
c.interactive.success        // green button bg
c.interactive.successPressed // green button pressed
c.interactive.error          // red button bg
c.interactive.errorPressed   // red button pressed
c.interactive.pressed        // generic pressed surface

c.shadow   // iOS shadowColor / Android elevation tint (adapts to dark mode)
```

### `isDark` prop is deprecated

Components that previously accepted `isDark: boolean` and used `isDark ? Colors.dark.x : Colors.light.x` should be migrated to `useThemeColors()`. The `isDark` prop may still exist for backward compat but should not be used for color decisions.

```ts
// ❌ Old pattern — manual, error-prone
const bg = isDark ? Colors.dark.surface.primary : Colors.light.surface.primary;

// ✅ New pattern — automatic
const c  = useThemeColors();
const bg = c.surface.primary;
```

---

---

## Feature Status

| Feature | List | Detail | Form | Export | Status |
|---|---|---|---|---|---|
| Applications | ✅ | ✅ | ✅ | ✅ | Complete |
| Customers | ✅ | ✅ | ✅ | ✅ | Complete |
| Users | ✅ | ✅ | ✅ | ✅ | Complete |
| Tenants | ✅ | ✅ | ✅ | ✅ | Complete |
| Templates | ✅ | ✅ | ✅ | ✅ | Complete |
| Tasks | ✅ | ⏳ | ✅ | ✅ | In progress |
| Tickets | ✅ | ⏳ | ⏳ | ✅ | In progress |
| Reports | ✅ | — | — | ✅ | Complete |
| Settings | ✅ | — | ✅ | — | Complete |
| Docs | ✅ | ✅ | ✅ | — | Complete |
| Dashboard | ✅ | — | — | — | Complete |

---

## Folder Structure (per feature)

```
features/admin/<feature>/
├── api/
│   └── <feature>.ts              ← BaseApiService subclass + singleton + query keys
├── components/
│   ├── <feature>Columns.tsx      ← ColDef[] factory get<Feature>Columns(t)
│   ├── <Entity>Form.tsx          ← Dual-mode form (page + modal)
│   └── <Entity>DetailScreen.tsx  ← Read-only detail view
├── hooks/
│   ├── use<Feature>.ts           ← useAdminFeature wrapper + selectedId + export
│   └── use<Feature>Form.ts       ← Form state, validation, submit logic
├── schemas/
│   └── <feature>Schema.ts        ← Zod factory createXSchema(t)
└── <Feature>Screen.tsx           ← Orchestration: list / detail / edit views
```

---

## Customers Feature

### Improvements applied

1. **Typed `TYPES` array** — `MaintenanceTypeSelector` uses a `TYPES` array (not `MAINTENANCE_LABELS`) with per-option `{ type, label, icon, color, bg, border }` — no `isDark` needed; active state uses the option's own color tokens
2. **Safe date normalization** — `useCustomerForm.getInitial()` converts API `Date` objects or ISO strings to `YYYY-MM-DD` via `toISOString().split('T')[0]`
3. **No "Inactive" option** — removed from selector; inactive is computed automatically from dates
4. **PAY_AS_YOU_GO hides dates** — date pickers only shown for `MONTHLY_SUBSCRIPTION` and `FREE_TRIAL`

### `MaintenanceTypeSelector` chip pattern

Each option in the selector carries its own color tokens. Active state applies the option color directly — no `isDark` or `useIsDark()` needed:

```ts
const TYPES = [
  { type: 'MONTHLY_SUBSCRIPTION', label: t('...'), icon: '📅', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { type: 'FREE_TRIAL',           label: t('...'), icon: '🎁', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { type: 'PAY_AS_YOU_GO',        label: t('...'), icon: '💳', color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
];
// Active chip: bg from option, borderColor from option (width 2), colored shadow, bold label
// Inactive chip: c.surface.secondary bg, c.border.primary border (width 1)
```

### API Service

```ts
getCustomers()                                    // GET /customers
getCustomer(id)                                   // GET /customers/:id
createCustomer(data)                              // POST /customers
updateCustomer(id, data)                          // PUT /customers/:id
deleteCustomer(id)                                // DELETE /customers/:id
assignApplication(customerId, applicationId)      // POST /customers/assign-application
removeApplication(customerId, applicationId)      // DELETE /customers/:id/applications/:id
```

### Subscription Status Logic

Mirrors `api/src/modules/customers/customers.controller.js` exactly:

```ts
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'INACTIVE' | 'PAY_AS_YOU_GO';

// null maintenanceType          → INACTIVE
// PAY_AS_YOU_GO                 → PAY_AS_YOU_GO (no dates needed)
// FREE_TRIAL + valid dates      → TRIAL
// FREE_TRIAL + expired/no dates → EXPIRED / INACTIVE
// MONTHLY_SUBSCRIPTION + valid  → ACTIVE
// MONTHLY_SUBSCRIPTION + expired→ EXPIRED / INACTIVE
```

Status colors:

| Status | Color | Background |
|---|---|---|
| ACTIVE | `#16a34a` green | `#f0fdf4` |
| TRIAL | `#7c3aed` purple | `#f5f3ff` |
| EXPIRED | `#dc2626` red | `#fef2f2` |
| INACTIVE | `#6b7280` gray | `#f9fafb` |
| PAY_AS_YOU_GO | `#0284c7` blue | `#f0f9ff` |

### Columns

| Column | Field | Width | Notes |
|---|---|---|---|
| Name | `name` | flex 1 | Primary |
| Company | `company` | 130 | Shows `—` if empty |
| Status | `subscriptionStatus` | 120 | Colored badge, computed client-side |
| Type | `maintenanceType` | 130 | Monthly / Trial / Pay/Go |
| End Date | `subscriptionEndDate` | 110 | 3-state color: green / amber / red |
| Tickets | `_count.tickets` | 70 | Blue count badge |

#### End date color logic (3 states)

```ts
const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
const color = daysLeft < 0    ? '#dc2626'  // expired — red
            : daysLeft <= 30  ? '#d97706'  // expiring soon — amber
            :                   '#16a34a'; // active — green
```

### Form Fields

**Required:** Name · Email

**Optional contact:** Phone · Company · Address (multiline)

**Maintenance type selector** (3 options, no "Inactive"):
- Monthly Subscription → shows Start + End date pickers
- Free Trial → shows Start + End date pickers
- Pay As You Go → no date pickers

**Date pickers** use `AppDatePicker` (native OS picker, stores `YYYY-MM-DD`):
- End date `minDate` = selected start date

**Edit mode:** linked stats (tickets + applications)

### Detail Screen Layout

1. **Hero card** — status-colored accent bar, initials avatar, name, company, status badge, quick contact row
2. **Stats row** — ticket count (blue) + linked applications (green)
3. **Contact card** — email, phone, company, address, created (with emoji icons)
4. **Subscription card** — type, start date, end date (3-state color: green/amber/red)
5. **Linked applications card** — app name + version badge

### Locale Keys

```json
"customers.sections.basicInfo"     → "Basic Info"
"customers.sections.company"       → "Company"
"customers.sections.subscription"  → "Subscription"
"customers.maintenance.monthly"    → "Monthly Subscription"
"customers.maintenance.trial"      → "Free Trial"
"customers.maintenance.payAsYouGo" → "Pay As You Go"
"customers.detail.contact"         → "Contact"
"customers.form.datePlaceholder"   → "Select date"
"customers.notFound"               → "Customer not found"
"customers.pdf.totalCustomers"     → "Total Customers"
"customers.pdf.activeCustomers"    → "Active / Trial"
"customers.pdf.expiredCustomers"   → "Expired"
"customers.pdf.activeRate"         → "Active Rate"
```

---

## Applications Feature

### API Service

```ts
getApplications()                                 // GET /applications
getApplication(id)                                // GET /applications/:id
createApplication(data)                           // POST /applications
updateApplication(id, data)                       // PUT /applications/:id
deleteApplication(id)                             // DELETE /applications/:id
assignCustomer(applicationId, customerId)         // POST /applications/assign-customer
removeCustomer(applicationId, customerId)         // DELETE /applications/:id/customers/:id
```

### Columns

| Column | Field | Width | Notes |
|---|---|---|---|
| Name | `name` | flex 1 | Primary |
| Version | `version` | 90 | Blue monospace badge |
| Tickets | `_count.tickets` | 70 | Blue count badge |
| Customers | `_count.customers` | 80 | Green count badge |
| Created | `createdAt` | 100 | Formatted date |

### Form Fields

- Name (required, max 100)
- Version (optional, max 50)
- Description (optional, multiline, max 500)
- Edit mode: linked stats (tickets + customers)

### Detail Screen Layout

1. **Hero card** — blue accent bar, initials avatar, name, version badge, created date
2. **Stats row** — tickets (blue) + customers (green)
3. **Details card** — name, version, created
4. **Description card** — shown when present
5. **Linked customers card** — customer name + email

---

## Tickets Feature

### API Service

All endpoint paths use constants from `@/src/constants/api` (`API.TICKETS.*`). `TicketFilters` is re-exported from that same module — never redefine it locally.

```ts
import { API, QUERY_KEYS, buildTicketQuery } from '@/src/constants/api';
export type { TicketFilters } from '@/src/constants/api';
```

**Note:** `getTickets()` always returns `Promise<Ticket[]>`. Normalization is handled internally — the method accepts both a plain `Ticket[]` and a paginated `{ data: Ticket[], total: number }` response from the server and always resolves to a flat array. Callers do not need to normalize the result.

```ts
getTickets(filters?)                              // GET /tickets (limit: 50, timeout: 30s)
getTicket(id)                                     // GET /tickets/:id
createTicket(data)                                // POST /tickets
updateTicket(id, data)                            // PUT /tickets/:id
deleteTicket(id)                                  // DELETE /tickets/:id
restoreTicket(id)                                 // PATCH /tickets/:id/restore
takeTicket(id)                                    // POST /tickets/:id/take
reassignTicket(id, assignedToId)                  // PATCH /tickets/:id/reassign
bulkUpdateStatus(ids, status)                     // PATCH /tickets/bulk
addComment(ticketId, content)                     // POST /tickets/:id/comments
deleteComment(ticketId, commentId)                // DELETE /tickets/:id/comments/:commentId
watchTicket(id)                                   // POST /tickets/:id/watch
unwatchTicket(id)                                 // DELETE /tickets/:id/watch
getWatchers(id)                                   // GET /tickets/:id/watchers
getAttachments(id)                                // GET /tickets/:id/attachments
deleteAttachment(id, attachmentId)                // DELETE /tickets/:id/attachments/:attachmentId
getProgramming(id)                                // GET /tickets/:id/programming
saveProgramming(id, data)                         // PUT /tickets/:id/programming
assignProgrammer(id, programmerId)                // POST /tickets/:id/assign-programmer
```

---

## Users Feature

### Form Fields

**Required:** Name · Email · Role

**Optional:** Phone

**Password:** Required on create (min 6 chars), optional on edit (leave blank to keep existing)

### Schema Pattern

The Users schema uses an `isEdit` flag to conditionally require password:

```ts
export const createUserFormSchema = (t: TFunction, isEdit: boolean) =>
  z.object({
    name:     z.string().trim().min(2).max(100),
    email:    z.string().trim().check(z.email(...)),   // Zod v4 syntax
    password: isEdit
      ? z.string().max(100).optional().or(z.literal(''))
      : z.string().min(6).max(100),
    phone:    z.string().trim().max(30).optional().or(z.literal('')),
    role:     z.enum(USER_ROLES),
  });
```

**Note:** Email validation uses Zod v4 `.check(z.email())` syntax — not `.email()` directly on the string chain.

### Role Options

```ts
export const USER_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER'] as const;
export type UserRoleOption = typeof USER_ROLES[number];
```

`ROLE_CONFIG` (from `userColumns.tsx`) maps each role to `{ color, bg, label }` and is reused in the detail screen hero card. `RoleBadge` is a standalone component exported from `userColumns.tsx` — use it wherever a role chip is needed.

### Detail Screen Layout

1. **Hero card** — role-colored accent bar, initials avatar, name + email, `RoleBadge`, quick info row (phone + tenant name)
2. **Stats row** — assigned tickets (blue) · created tickets (green) · comments (purple) — all from `_count`
3. **Account info card** — email, phone, tenant name, role (`RoleBadge` via `render`), created date
4. **Notification settings card** — shown only when `reminderEnabled` or `whatsappNotifications` is present; includes reminder interval when enabled

### Role-based detail fetching

`UserDetailScreen` accepts two props to handle the fact that `GET /users/:id` is only accessible to super admins:

```tsx
<UserDetailScreen
  userId={id}
  isSuperAdmin={isSuperAdmin}   // true → calls GET /users/:id
  initialData={userFromList}    // pre-loaded User from the list query
/>
```

**Pattern:**
- `isSuperAdmin = true` → `queryFn` calls `usersApi.getUser(userId)` for full detail
- `isSuperAdmin = false` → cache is seeded with `initialData` via `queryClient.setQueryData()` in a `useEffect`, and `queryFn` resolves to `initialData` directly (no network call)

```ts
// Seed cache for tenant admins so the screen shows instantly
React.useEffect(() => {
  if (!isSuperAdmin && initialData) {
    queryClient.setQueryData(usersKeys.detail(userId), initialData);
  }
}, [isSuperAdmin, initialData, userId, queryClient]);

const { data: user } = useQuery({
  queryKey: usersKeys.detail(userId),
  queryFn:  isSuperAdmin
    ? () => usersApi.getUser(userId)
    : () => Promise.resolve(initialData ?? null),
  staleTime: 2 * 60_000,
  enabled:  queryEnabled,
});
```

Use this pattern for any detail screen where the full-detail endpoint is role-restricted.

### Locale Keys

```json
"users.itemType"                   → "user"
"users.messages.validationError"   → "Please fix the errors below"
"users.messages.created"           → "User created"
"users.messages.updated"           → "User updated"
"users.messages.errorCreate"       → "Error creating user"
"users.messages.errorUpdate"       → "Error updating user"
"users.messages.deleted"           → "User deleted"
"users.messages.errorDelete"       → "Error deleting user"
"users.notFound"                   → "User not found"
"users.columns.email"              → "Email"
"users.columns.phone"              → "Phone"
"users.columns.role"               → "Role"
"users.columns.created"            → "Created"
"users.detail.accountInfo"         → "Account Info"
"users.detail.tenant"              → "Tenant"
"users.detail.assignedTickets"     → "Assigned Tickets"
"users.detail.createdTickets"      → "Created Tickets"
"users.detail.comments"            → "Comments"
"users.detail.notifications"       → "Notifications"
"users.detail.reminders"           → "Reminders"
"users.detail.reminderInterval"    → "Reminder Interval"
"users.detail.whatsapp"            → "WhatsApp"
"users.messages.forceDeleted"      → "User and all related data deleted"
"users.forceDelete.title"          → "Force Delete User"
"users.forceDelete.message"        → "This will permanently delete {{name}} and all associated tickets, comments, and activities."
"users.forceDelete.confirmLabel"   → "Delete Everything"
```

### Force-delete flow

When a user has associated data (tickets, comments, activities), a normal delete returns a 400 with "associated" in the error message. `UsersScreen` escalates to a type-to-confirm force-delete dialog.

**`hasRelatedData` helper** — detects the escalation condition:

```ts
function hasRelatedData(error: unknown): boolean {
  const msg = (error as any)?.response?.data?.error ?? (error as any)?.message ?? '';
  return msg.toLowerCase().includes('associated');
}
```

**Two escalation paths:**

1. **From list view** — `AdminCrudScreen` calls `onDeleteFailed(item, error)` when `onDelete` throws; the screen checks `hasRelatedData` and opens the force-delete dialog.
2. **From detail view** — the screen catches the error from `handleDeleteFromDetail`, closes the normal confirm dialog, and opens the force-delete dialog.

**Role-aware force-delete API calls:**

```ts
if (isSuperAdmin) {
  await usersApi.forceDeleteUser(id);          // DELETE /users/:id?force=true
} else {
  await usersApi.forceTenantDeleteUser(id);    // DELETE /users/tenant/:id?force=true
}
```

**Force-delete dialog** uses `AppConfirmDialog` with `confirmWord="DELETE"`:

```tsx
<AppConfirmDialog
  open={!!forceTarget}
  onClose={() => setForceTarget(null)}
  onConfirm={handleForceDelete}
  title={t('users.forceDelete.title')}
  message={t('users.forceDelete.message', { name: forceTarget?.name ?? '' })}
  confirmWord="DELETE"
  loading={forceDeleting}
  confirmLabel={t('users.forceDelete.confirmLabel')}
  confirmColor="error"
/>
```

After force-delete: call `queryClient.removeQueries` for the detail cache key, call `f.refetch()` to refresh the list, and clear `selectedId` if the deleted user was open.

---

## Shared Infrastructure

### Native-only libraries — Platform split + lazy require

Some libraries (e.g. `react-native-pell-rich-editor`) access `window` at module load time and crash when the Metro bundler targets web. The fix is a **Platform split with a lazy `require()`** inside the native branch — the import never executes on web.

```tsx
import { Platform } from 'react-native';

// ── Web fallback — no window dependency ──────────────────────────────────────
const MyEditorWeb: React.FC<Props> = ({ ... }) => (
  <View>
    <Text>Feature not available on web.</Text>
  </View>
);

// ── Native — lazy require avoids window at module level ──────────────────────
const MyEditorNative: React.FC<Props> = ({ ... }) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { NativeOnlyComponent } = require('native-only-library');
  // ...
};

// ── Export — web gets fallback, native gets full component ───────────────────
const MyEditor: React.FC<Props> = (props) =>
  Platform.OS === 'web'
    ? <MyEditorWeb {...props} />
    : <MyEditorNative {...props} />;

export default MyEditor;
```

**Rules:**
- Never `import` a native-only library at the top of the file — it runs on all platforms at module init
- Use `require()` inside the native component function body so it only executes on native
- Always provide a meaningful web fallback (plain text, stripped HTML, or a "not available" message)
- The `eslint-disable` comment for `@typescript-eslint/no-var-requires` is expected and correct here

**Reference implementation:** `mobile/src/features/admin/docs/components/blockEditors/TextBlockEditor.tsx`

---

### `AdminFormModal` — RTL in Modals

`AdminFormModal` (and any component that renders a `<Modal>`) sits **outside the `DirectionProvider` tree**, so the `direction` CSS property is not inherited automatically. These components must read `direction` directly from `useUiStore` and apply it to the sheet's root `View`:

```ts
import { useUiStore } from '@/src/stores/uiStore';

const direction = useUiStore((s) => s.direction);
const isRtl     = direction === 'rtl';

// Apply to the modal sheet root View
<View style={[styles.sheet, { direction: isRtl ? 'rtl' : 'ltr' }]}>
```

**Why `useUiStore` and not `useDirection()`?**
`useDirection()` reads from `DirectionContext` which is provided by `DirectionProvider`. Inside a `<Modal>`, that context is unavailable. Zustand stores are global singletons — they work correctly inside any React tree, including Modal trees.

**Rule:** Any component that renders a `<Modal>` must apply `direction` manually via `useUiStore(s => s.direction)`. Components rendered inside a normal screen tree should continue to use `useDirection()` from `DirectionProvider`.

---

### `AdminDetailScreen`

Shell component — handles header, loading, not-found, scrollable body.

```tsx
<AdminDetailScreen
  title={entity?.name ?? t('<feature>.title')}
  subtitle={entity?.company}     // optional — shown below title
  isLoading={isLoading}
  notFound={!isLoading && !entity}
  notFoundText={t('<feature>.notFound')}
  onClose={onClose}
  onEdit={onEdit}
  onDelete={onDelete}
>
  {/* children */}
</AdminDetailScreen>
```

Header: back ← | title + subtitle | ✏️ Edit | 🗑️ (icon-only delete)

### `DetailInfoCard`

```tsx
<DetailInfoCard
  title="Contact"
  fields={[
    { icon: '✉️', label: 'Email',   value: customer.email },
    { icon: '📅', label: 'Created', value: formatDate(entity.createdAt) },
    { icon: '🏷️', label: 'Version', render: () => <VersionBadge /> },
    { label: 'Note', value: text, valueColor: '#dc2626' },
  ]}
/>
```

- Empty fields hidden automatically
- `render` overrides value display
- `valueColor` for colored values (expired dates in red)
- `icon` emoji shown before label

### `DetailStatRow`

```tsx
<DetailStatRow stats={[
  { value: 12, label: 'Tickets',   color: '#1d4ed8', bgColor: '#eff6ff' },
  { value: 3,  label: 'Customers', color: '#065f46', bgColor: '#f0fdf4' },
]} />
```

Color palette: blue (tickets) · green (customers) · purple (applications)

### `FormSection`

Groups related form fields into a visually distinct card with a section title, optional emoji icon, and a horizontal divider. Import from `@/src/shared/components/forms/FormSection`.

```tsx
import FormSection from '@/src/shared/components/forms/FormSection';

<FormSection title={t('customers.sections.basicInfo')} icon="👤">
  <FormField fieldId="name"><AppTextInput ... /></FormField>
  <FormField fieldId="email"><AppTextInput ... /></FormField>
</FormSection>

<FormSection title={t('customers.sections.subscription')} icon="💳" last>
  {/* last=true removes the bottom margin on the final section */}
  <FormField fieldId="maintenanceType">...</FormField>
</FormSection>
```

**Props:**

| Prop | Type | Notes |
|---|---|---|
| `title` | string | Section heading (uppercase, small caps) |
| `icon?` | string | Emoji shown before the title |
| `children` | ReactNode | `FormField` wrappers |
| `last?` | boolean | `true` removes bottom margin — use on the last section before the stats row or submit button |

**When to use:** any form with 3+ fields should be split into logical sections (e.g. Basic Info / Company / Subscription). Single-section forms don't need `FormSection`.

---

### `AppDatePicker`

Native OS date picker. Stores `YYYY-MM-DD`, displays using tenant's date format.

```tsx
<AppDatePicker
  label={t('customers.detail.subscriptionStart')}
  value={fields.subscriptionStartDate}
  onChange={(iso) => handleChange('subscriptionStartDate', iso)}
  placeholder={t('customers.form.datePlaceholder')}
  error={errors.subscriptionStartDate}
  minDate={fields.subscriptionStartDate ? new Date(fields.subscriptionStartDate) : undefined}
/>
```

### Tenant Date Format

The tenant's `dateFormat` is stored in the DB as **date-fns tokens** (e.g. `dd/MM/yyyy`). The mobile app converts to **dayjs tokens** at format time.

```ts
// tenantStore.ts
import { getDayjsFormat } from '../../stores/tenantStore';

// dateUtils.ts — always use getDayjsFormat(), never getDateFormat()
export const formatDate = (date) => dayjs(date).format(getDayjsFormat());
```

**Flow:**
1. Login response includes `tenant.dateFormat` (date-fns token) → stored in `tenantStore`
2. On app boot: `useTenantStore.getState().syncDateFormat()` fetches from `GET /reminders/date-format-settings`
3. `formatDate()` / `formatDateTime()` call `getDayjsFormat()` which converts date-fns → dayjs token

**Never** use `getDateFormat()` for display — it returns the date-fns token which dayjs cannot parse correctly.

### `AdminFormPage` props

| Prop | Type | Notes |
|---|---|---|
| `title` | string | Header title |
| `onBack` | () => void | Back button |
| `onSubmit` | () => void | Submit |
| `submitting?` | boolean | Spinner on button |
| `submitDisabled?` | boolean | `submitting \|\| isSubmitting` only |
| `isDirty?` | boolean | `false` = a `t('common.fillRequired')` hint text is rendered **above** the button; button label always shows `submitLabel` (never changes to the hint text). Note: `isDirty=false` does **not** disable the button — only `submitDisabled` or `submitting` do. |
| `submitLabel?` | string | Default: `t('common.save')` |

### Form hook pattern

```ts
// Date normalization — API may return Date objects or ISO strings
const toDateStr = (v: unknown): string => {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v as string);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

// getInitial — memoize with item?.id so it resets when a different item is opened
const getInitial = useCallback((): FormFields => ({
  name: item?.name ?? '',
  // ...
}), [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

// Reset all state when item changes
useEffect(() => {
  setFields(getInitial());
  setErrors({});
  setIsDirty(false);
  setFirstErrorFieldId(null);
}, [getInitial]);

// Dirty check — compare current fields against getInitial()
const checkDirty = useCallback((next: FormFields): boolean => {
  const initial = getInitial();
  return (Object.keys(next) as Array<keyof FormFields>).some((k) => next[k] !== initial[k]);
}, [getInitial]);

// Errors: delete, never set to ''
setErrors((prev) => {
  if (!(field in prev)) return prev;  // skip re-render if field has no error
  const next = { ...prev };
  delete next[field];
  return next;
});

// firstErrorFieldId — set after failed validation so the form can scroll to it
const ORDER: Array<keyof FormFields> = ['name', 'email', 'password', 'phone', 'role'];
setFirstErrorFieldId(ORDER.find((k) => k in fieldErrors) ?? null);

// Toast BEFORE onClose — page unmounts on close
toast.success(item ? t('...updated') : t('...created'));
onClose();
```

### Form hook return shape

All `use<Feature>Form` hooks return this consistent interface:

```ts
interface UseFeatureFormReturn {
  fields:            FormFields;
  errors:            Record<string, string>;
  isDirty:           boolean;
  firstErrorFieldId: string | null;   // key of first invalid field — use to scroll on submit
  isSubmitting:      boolean;
  handleChange:      (field: keyof FormFields, value: string) => void;
  handleClear:       (field: keyof FormFields) => void;  // sets field to ''
  handleSubmit:      () => Promise<void>;
}
```

- `firstErrorFieldId` — the form component uses this to scroll/focus the first invalid field after a failed submit
- `handleClear` — convenience wrapper: `(field) => handleChange(field, '')`
- `isDirty` — computed by comparing current fields against `getInitial()` on every `handleChange`

### `FormScrollContext` — `registerFieldRef`

`scrollToFirstError` now **scrolls AND focuses** the first error field. For focus to work, each `FormField` must register its `TextInput` ref via `registerFieldRef`:

```tsx
import { useFormScroll } from '@/src/features/admin/shared/FormScrollContext';

const { registerFieldY, registerFieldRef, scrollToFirstError } = useFormScroll();
const inputRef = useRef<TextInput>(null);

// In onLayout — register position
// In component mount — register ref
useEffect(() => {
  registerFieldRef(fieldId, inputRef);
}, [fieldId, registerFieldRef]);

<TextInput ref={inputRef} ... />
```

- `registerFieldY(id, y)` — called in `onLayout`, records the field's Y position for scroll targeting
- `registerFieldRef(id, ref)` — called on mount, records the `TextInput` ref so `scrollToFirstError` can call `.focus()` after scrolling (200ms delay to let scroll settle), then moves the cursor to end of existing text via `setNativeProps({ selection: { start: 9999, end: 9999 } })`
- Both registrations are required for full scroll-then-focus behavior
- In `page` mode, `scrollToField` is a no-op but `scrollToFirstError` still focuses the input

---

## PDF Export — Mobile Pattern

Mobile PDF export uses `expo-print` + `expo-sharing` (not `jspdf`). The shared template lives in `src/shared/utils/`.

### Shared utilities

| File | Purpose |
|---|---|
| `src/shared/utils/pdfTemplate.ts` | `buildPdfPage(title, body)` — wraps HTML in a full styled page |
| `src/shared/utils/htmlUtils.ts` | `esc(s)` — HTML-escape, `fmtDate(iso)` — locale date string |

### Feature export file location

```
features/admin/<feature>/utils/export<Entity>Pdf.ts
```

### Pattern

```ts
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildPdfPage } from '@/src/shared/utils/pdfTemplate';
import { esc, fmtDate } from '@/src/shared/utils/htmlUtils';

export async function exportEntityPdf(items: Entity[], t: TFunction): Promise<void> {
  const head = `<tr><th>Name</th>...</tr>`;
  const body = items.map((item) => `<tr><td>${esc(item.name)}</td>...</tr>`).join('');
  const html = buildPdfPage(t('entity.title'), `<table><thead>${head}</thead><tbody>${body}</tbody></table>`);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}
```

### Customer-specific additions

`exportCustomerPdf` adds a **summary stats row** above the table (total / active / expired / active rate) and uses:
- `statusBadge(status)` — inline HTML badge with status colors
- `endDateCell(iso)` — 3-state color (green / amber ≤30 days / red expired)
- `getCustomerStatus(c)` from `customerColumns` as fallback when `subscriptionStatus` is absent

### Application-specific additions

`exportApplicationPdf` adds a **4-card summary stats row** above the table and uses:
- `buildSummary(apps, t)` — renders 4 stat cards: total apps (blue), total tickets (amber), total customers (green), apps with version (purple)
- `countBadge(count, bg, color, border)` — reusable inline HTML badge for ticket/customer counts
- Version cell: monospace blue badge when present, gray `—` when absent
- Description column: truncated to 60 chars with `…` suffix
- `dialogTitle` passed to `Sharing.shareAsync` for a labelled share sheet

**Summary card colors:**

| Stat | Background | Text color |
|---|---|---|
| Total apps | `#eff6ff` blue | `#1d4ed8` |
| Total tickets | `#fef3c7` amber | `#b45309` |
| Total customers | `#f0fdf4` green | `#16a34a` |
| With version | `#f5f3ff` purple | `#7c3aed` |

### Application PDF locale keys

```json
"applications.pdf.totalApplications" → "Total Applications"
"applications.pdf.totalTickets"      → "Total Tickets"
"applications.pdf.totalCustomers"    → "Total Customers"
"applications.pdf.withVersion"       → "With Version"
"applications.columns.name"          → "Name"
"applications.columns.version"       → "Version"
"applications.columns.tickets"       → "Tickets"
"applications.columns.customers"     → "Customers"
"applications.columns.created"       → "Created"
```

### User-specific additions

`exportUserPdf` adds a **4-card summary stats row** above the table and uses:
- `buildSummary(users, t)` — renders 4 stat cards: total (blue), admins (amber), employees (green), programmers (purple)
- `roleBadge(role)` — inline HTML badge using `ROLE_STYLES` map (same colors as `ROLE_CONFIG` in `userColumns.tsx`)
- Ticket count column: blue badge from `u._count?.assignedTickets`
- `dialogTitle` passed to `Sharing.shareAsync` for a labelled share sheet

**Summary card colors:**

| Stat | Background | Text color |
|---|---|---|
| Total users | `#eff6ff` blue | `Palette.blue700` |
| Admins | `#fffbeb` amber | `Palette.amber600` |
| Employees | `#f0fdf4` green | `Palette.green600` |
| Programmers | `#f5f3ff` purple | `Palette.violet600` |

**Role badge styles (`ROLE_STYLES`):**

| Role | Background | Color |
|---|---|---|
| `SUPER_ADMIN` | `#fef2f2` | `#dc2626` red |
| `TENANT_ADMIN` | `#fffbeb` | `#d97706` amber |
| `EMPLOYEE` | `#f0fdf4` | `#16a34a` green |
| `PROGRAMMER` | `#f5f3ff` | `#7c3aed` purple |

> **Note:** `exportUserPdf` must import `Palette` from `@/src/constants/theme` — it uses `Palette.*` tokens directly in the HTML template strings.

### User PDF locale keys

```json
"users.pdf.totalUsers"   → "Total Users"
"users.pdf.admins"       → "Admins"
"users.pdf.employees"    → "Employees"
"users.pdf.programmers"  → "Programmers"
"users.columns.tickets"  → "Tickets"
```

### CSS classes available in `PDF_CSS`

Status: `.open` `.in_progress` `.resolved` `.closed`  
Priority: `.low` `.medium` `.high` `.urgent`  
Misc: `.badge` `.overdue` `.ontime` `.pct-open` `.pct-res` `.total`

Use `class="badge"` with inline `style` for custom colors (status, subscription type).

---

## Settings Feature

Settings panels live in `features/admin/settings/` and use `SettingsCard` + `AlertBanner` as their shell.

### `SettingsCard` + `AlertBanner`

```tsx
import SettingsCard, { AlertBanner } from '@/src/features/admin/settings/components/SettingsCard';

<SettingsCard
  icon="📄"
  title={t('settings.pagination.title')}
  description={t('settings.pagination.description')}
  loading={loading}   // shows ActivityIndicator while fetching
>
  {alert && <AlertBanner type={alert.type} msg={alert.msg} />}
  {/* panel content */}
</SettingsCard>
```

`AlertBanner` accepts `type: 'success' | 'error' | 'info'` and auto-dismisses via `setTimeout(..., 4000)`.

### Alert state pattern

```ts
type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;
const [alert, setAlert] = useState<AlertState>(null);

const showAlert = (type: AlertState['type'], msg: string) => {
  setAlert({ type, msg });
  setTimeout(() => setAlert(null), 4000);
};
```

### `NumberRow` — preset chips + custom input

Settings panels that let users pick a numeric value use a preset-chip row above a free-text `AppTextInput`:

```tsx
<NumberRow
  label={t('settings.pagination.defaultPageSize')}
  hint={t('settings.pagination.defaultPageSizeHint')}
  value={defaultPageSize}
  min={5} max={200}
  presets={[10, 20, 50, 100]}
  onChange={setDefaultPageSize}
/>
```

- Active preset chip: `Palette.blue500` background, white text
- Custom input: `AppTextInput` with `fieldType="number"`, clamped to `[min, max]`

### `Toggle` — boolean setting

Inline toggle switch for boolean settings (no external library):

```tsx
<Toggle value={allowOverride} onValueChange={setAllowOverride} />
```

- On: `Palette.blue500` track, thumb slides to `flex-end`
- Off: `Palette.slate300` track, thumb slides to `flex-start`
- Includes `accessibilityRole="switch"` + `accessibilityState`

### Sync store after save

After saving pagination settings, immediately sync `usePaginationStore` so the app respects the new values without a reload:

```ts
const setPaginationSettings = usePaginationStore((s) => s.setSettings);

const updated = await adminSettingsApi.savePaginationSettings(payload);
setPaginationSettings({
  paginationMode:    updated.paginationMode,
  defaultPageSize:   updated.defaultPageSize,
  maxPageSize:       updated.maxPageSize,
  allowUserOverride: updated.allowUserOverride,
  maxClientRecords:  updated.maxClientRecords,
});
```

### `adminSettingsApi` methods (pagination)

```ts
adminSettingsApi.getPaginationSettings()           // GET /settings/pagination
adminSettingsApi.savePaginationSettings(config)    // PUT /settings/pagination
```

### Pagination settings locale keys

```json
"settings.pagination.title"                  → "Pagination Settings"
"settings.pagination.description"            → "..."
"settings.pagination.mode"                   → "Mode"
"settings.pagination.modeServer"             → "Server Pagination"
"settings.pagination.modeServerDesc"         → "..."
"settings.pagination.modeClient"             → "Client Pagination"
"settings.pagination.modeClientDesc"         → "..."
"settings.pagination.pageSizes"              → "Page Sizes"
"settings.pagination.defaultPageSize"        → "Default Page Size"
"settings.pagination.defaultPageSizeHint"    → "..."
"settings.pagination.maxPageSize"            → "Max Page Size"
"settings.pagination.maxPageSizeHint"        → "..."
"settings.pagination.allowOverride"          → "Allow User Override"
"settings.pagination.allowOverrideHint"      → "..."
"settings.pagination.clientMode"             → "Client Mode"
"settings.pagination.maxClientRecords"       → "Max Client Records"
"settings.pagination.maxClientRecordsHint"   → "..."
"settings.pagination.clientModeWarning"      → "⚠️ warning text"
"settings.pagination.save"                   → "Save Settings"
"settings.pagination.saveSuccess"            → "Settings saved"
"settings.pagination.saveError"              → "Failed to save"
"settings.pagination.loadError"              → "Failed to load"
"settings.pagination.errorDefaultExceedsMax" → "Default page size cannot exceed max"
```

---

## Views — Table / Grid / Compact

| View | Search | Action buttons | Layout |
|---|---|---|---|
| Table | **Fixed above card** | 👁️ View · ✏️ Edit · ✕ Delete | Horizontal scroll |
| Grid | **Fixed above card** | 👁️ View · ✏️ Edit · ✕ Delete (below separator) | Cards |
| Compact | **Fixed above card** | 👁️ View · ✏️ Edit · ✕ Delete (right side) | Single-line rows |

- 👁️ View only shown when `onRowPress` is provided
- Grid: content rows → separator → action buttons
- Compact: all info on one line (`name · secondary · secondary`), buttons fixed-width

---

## Toast System

```ts
toast.success('Saved!');   // green ✅ + copy button
toast.error('Failed');     // red ❌ + copy button
toast.info('Note');        // blue ℹ️
```

Custom config in `AppToast.tsx`: left accent bar + icon badge + copy button.

---

## Network Error Dialog

- Queues failed requests → retries on reconnect
- Dialog transitions: Error → "Reconnecting…" → auto-dismiss → success toast
- Dev: raw error + copy + count badge | Production: generic message only

---

## Error Handling Pattern

All admin feature screens should implement comprehensive error handling using `FeatureErrorBoundary` and `useErrorHandler`.

### Required imports

```ts
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useErrorHandler }      from '@/src/shared/hooks/useErrorHandler';
```

### Feature-level error boundary

Wrap all three view states (list, detail, edit) with `FeatureErrorBoundary`:

```ts
const { handleError } = useErrorHandler();

// Feature-level error handler
const handleFeatureError = (error: Error, errorInfo: any, errorId: string) => {
  handleError(error, { 
    feature: '<feature-name>', 
    operation: 'feature-boundary',
    metadata: { errorId, componentStack: errorInfo.componentStack }
  });
};

// Wrap each view state
return (
  <FeatureErrorBoundary featureName="<FeatureName>" onError={handleFeatureError}>
    {/* view content */}
  </FeatureErrorBoundary>
);
```

### Structured error handling in async operations

Replace generic `toast.error()` calls with structured error handling:

```ts
// ❌ Old pattern — generic error toast
try {
  await f.remove(id);
} catch {
  toast.error(t('feature.messages.errorDelete'));
}

// ✅ New pattern — structured error handling
try {
  await f.remove(id);
} catch (error) {
  handleError(error, { feature: 'customers', operation: 'delete' });
}
```

### Error context metadata

Use descriptive `operation` values for different actions:

| Operation | When to use |
|---|---|
| `'create'` | Creating new entities |
| `'update'` | Updating existing entities |
| `'delete'` | Deleting entities |
| `'feature-boundary'` | React error boundary catches |
| `'export'` | PDF export operations |
| `'fetch'` | Data loading errors |

### Form save operations

Wrap form save logic with try/catch and structured error handling:

```ts
onSave={async (data: CreateEntityData) => {
  try {
    if (item) await f.update(item.id, data);
    else      await f.create(data);
    onClose();
  } catch (error) {
    handleError(error, { 
      feature: 'customers', 
      operation: item ? 'update' : 'create' 
    });
  }
}}
```

---

## Checklist — New Admin Feature

### Error Handling
- [ ] Import `FeatureErrorBoundary` and `useErrorHandler`
- [ ] Wrap all view states with `FeatureErrorBoundary`
- [ ] Implement `handleFeatureError` for boundary errors
- [ ] Use structured `handleError(error, { feature, operation })` in async operations
- [ ] Replace generic `toast.error()` with structured error handling
- [ ] Wrap form save operations with try/catch and structured error handling

### Files
- [ ] `api/<feature>.ts` — service + singleton + query keys + `getOne`
- [ ] All endpoint paths use `API.*` from `@/src/constants/api` — no hardcoded strings
- [ ] Query keys use `QUERY_KEYS.*` — no local key definitions
- [ ] `components/<feature>Columns.tsx` — `get<Feature>Columns(t)` function
- [ ] `components/<Entity>Form.tsx` — dual-mode, `isDirty` to `AdminFormPage`
- [ ] `components/<Entity>DetailScreen.tsx` — `AdminDetailScreen` + `DetailInfoCard` + `DetailStatRow`
- [ ] `hooks/use<Feature>Form.ts` — state, validation, submit, toast before `onClose`
- [ ] `hooks/use<Feature>.ts` — `useAdminFeature` + columns + export + `selectedId`
- [ ] `schemas/<feature>Schema.ts` — `createXSchema(t)` factory
- [ ] `<Feature>Screen.tsx` — three view states: list / detail / edit-from-detail

### Form UX
- [ ] `useFocusInput` on first field (`delay: 100` for page mode)
- [ ] `nextRef` chain for return-key navigation
- [ ] `FormField` wrapping each input with stable `fieldId`
- [ ] `submitDisabled={submitting || isSubmitting}` — NOT `!isDirty`
- [ ] `isDirty` passed to `AdminFormPage`
- [ ] `scrollToFirstError` after failed submit
- [ ] Toast before `onClose()`
- [ ] Linked stats in edit mode
- [ ] Date fields: `AppDatePicker`, normalize to `YYYY-MM-DD` in `getInitial`
- [ ] Selector labels via `t()` — never hardcoded English

### Detail screen
- [ ] `subtitle` prop for secondary info (company, version)
- [ ] Hero card with accent bar + initials avatar + status badge
- [ ] Stats row for `_count` relations
- [ ] `DetailInfoCard` fields with emoji `icon` props
- [ ] `valueColor` on expired/warning values — use 3-state: green (active) / amber (≤30 days) / red (expired)
- [ ] `queryEnabled={!deletingFromDetail}`
- [ ] `staleTime: 2 * 60_000`
- [ ] `queryClient.removeQueries` after delete
- [ ] `t('<feature>.notFound')` in both locales

### Translation
- [ ] All keys in `en.json` + `ar.json`
- [ ] `messages.validationError`
- [ ] `common.fillRequired`
- [ ] `deleteSuccessMessage={t('<feature>.messages.deleted')}` to `AdminCrudScreen`
- [ ] Selector/enum labels via `t()` — never hardcoded

### AdminCrudScreen props
- [ ] `onRowPress={(item) => setSelectedId(item.id)}`
- [ ] All button labels via `t()`
- [ ] `searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage`, `deleteSuccessMessage`
- [ ] SERVER mode: pass `apiTotal` (total record count from API) and `onPageChange` (callback to re-fetch when page changes)
- [ ] If the entity supports force-delete: pass `onDeleteFailed={(item, error) => { if (hasRelatedData(error)) setForceTarget(item); }}`

**SERVER mode pagination props:**

```tsx
// When paginationMode === 'SERVER', pass these two props so AdminCrudScreen
// can compute correct totalPages and trigger re-fetches on page change.
<AdminCrudScreen
  entities={pageOfEntities}          // current page slice from API
  apiTotal={totalFromApiResponse}    // total count for correct page count
  onPageChange={(page, limit) => {   // called when user navigates pages
    fetchPage(page, limit);
  }}
  // ... other props
/>
```

- `apiTotal` — overrides the local `entities.length` count for `totalPages` calculation in SERVER mode
- `onPageChange` — called with `(page, limit)` so the parent can re-fetch the correct page from the API
- Both props are optional — omit them in CLIENT mode (default behavior unchanged)
