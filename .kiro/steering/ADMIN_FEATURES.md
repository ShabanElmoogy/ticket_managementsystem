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

// Errors: delete, never set to ''
setErrors((prev) => {
  const next = { ...prev };
  delete next[field];
  return next;
});

// Toast BEFORE onClose — page unmounts on close
toast.success(item ? t('...updated') : t('...created'));
onClose();
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
