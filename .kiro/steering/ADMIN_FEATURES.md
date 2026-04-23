# Admin Features — Mobile Reference

Complete documentation of all implemented admin features in `mobile/src/features/admin/`.

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

1. **`isDark` wired** — `MaintenanceTypeSelector` now reads `useIsDark()` instead of hardcoded `false`
2. **Translated maintenance labels** — `MAINTENANCE_LABELS` uses `t('customers.maintenance.*')` — RTL-safe
3. **Safe date normalization** — `useCustomerForm.getInitial()` converts API `Date` objects or ISO strings to `YYYY-MM-DD` via `toISOString().split('T')[0]`
4. **No "Inactive" option** — removed from selector; inactive is computed automatically from dates
5. **PAY_AS_YOU_GO hides dates** — date pickers only shown for `MONTHLY_SUBSCRIPTION` and `FREE_TRIAL`

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
```

---

## Shared Infrastructure

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
| `isDirty?` | boolean | `false` = gray "Fill required fields" |
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

### CSS classes available in `PDF_CSS`

Status: `.open` `.in_progress` `.resolved` `.closed`  
Priority: `.low` `.medium` `.high` `.urgent`  
Misc: `.badge` `.overdue` `.ontime` `.pct-open` `.pct-res` `.total`

Use `class="badge"` with inline `style` for custom colors (status, subscription type).

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

## Checklist — New Admin Feature

### Files
- [ ] `api/<feature>.ts` — service + singleton + query keys + `getOne`
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
