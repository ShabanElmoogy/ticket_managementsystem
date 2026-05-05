---
inclusion: always
---

# Admin Features — Mobile Reference

Complete documentation of all implemented admin features in `mobile/src/features/admin/`.

> **Theme colors, component patterns, form patterns, and error handling** are documented in their own steering files. This file covers only feature-specific API, columns, forms, and locale keys.

---

## Constants — Use `@/src/constants/api`

All API paths, query keys, socket events, HTTP status codes, and pagination defaults live in `mobile/src/constants/api.ts`. **Never hardcode these values.**

```ts
import { API, QUERY_KEYS, SOCKET, HTTP_STATUS, PAGINATION, buildTicketQuery } from '@/src/constants/api';

// ✅ Correct
this.get<Customer[]>(API.CUSTOMERS.LIST)
queryKey: QUERY_KEYS.CUSTOMERS.all
socket.on(SOCKET.EVENTS.NOTIFICATION, handler)
if (error.status === HTTP_STATUS.UNAUTHORIZED) { ... }
staleTime: PAGINATION.DETAIL_STALE_TIME
```

**`AdminCrudScreen` uses tenant-aware pagination** — page size and mode come from `usePaginationStore` automatically. Do not pass a hardcoded page size.

**Pagination modes:**
- `CLIENT` — all entities fetched upfront, paginated locally
- `SERVER` — pass `apiTotal` + `onPageChange` to `AdminCrudScreen`

---

## Import Alias

Always use `@/src/` alias — never relative `../../../` paths from feature files.

```ts
// ✅ Correct
import { useThemeColors } from '@/src/constants/theme';

// ❌ Wrong
import { useThemeColors } from '../../../constants/theme';
```

**Exception:** shared components inside `mobile/src/shared/components/` use relative paths.

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
│   └── use<Feature>Form.ts       ← Form state, validation, submit logic (legacy — prefer RHF)
├── schemas/
│   └── <feature>Schema.ts        ← Zod factory createXSchema(t)
├── utils/
│   └── export<Entity>Pdf.ts      ← PDF export function
└── <Feature>Screen.tsx           ← Orchestration: list / detail / edit
```

---

## Dashboard Feature

### `AdminStatCard` props

```tsx
<AdminStatCard
  title={t('adminDashboard.totalCustomers')}
  value={stats.totalCustomers}
  icon="people"            // IoniconName — NOT emoji
  color={Palette.blue500}  // Palette constant — NOT raw hex
  cardWidth={cardWidth}
/>
```

### `AdminOverviewCard` props

```tsx
<AdminOverviewCard
  title={t('customers.title')}
  icon="people"
  iconColor={Palette.blue500}
  total={stats.totalCustomers}
  active={stats.activeCustomers}
  activeLabel={t('common.active')}
/>
```

Config arrays use `Palette.*` constants and `IoniconName` — never raw hex or emoji strings.

---

## Customers Feature

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

### Subscription Status

```ts
type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'INACTIVE' | 'PAY_AS_YOU_GO';
// Use SubscriptionColors / SubscriptionSurfaces from @/src/constants/tokens
```

### Columns

| Column | Field | Width | Notes |
|---|---|---|---|
| Name | `name` | flex 1 | Primary |
| Company | `company` | 130 | Shows `—` if empty |
| Status | `subscriptionStatus` | 120 | Colored badge, computed client-side |
| Type | `maintenanceType` | 130 | Monthly / Trial / Pay/Go |
| End Date | `subscriptionEndDate` | 110 | 3-state color: green / amber / red |
| Tickets | `_count.tickets` | 70 | Blue count badge |

### End date color logic

```ts
const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
const color = daysLeft < 0 ? Palette.red600 : daysLeft <= 30 ? Palette.amber600 : Palette.emerald600;
```

### Location — Nominatim (no API key)

Forward geocoding uses Nominatim directly — **not** `expo-location.geocodeAsync` (requires paid Google key on Android).

```ts
const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
const res  = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'TicketFlowApp/1.0' } });
```

Reverse geocoding (pin → address) uses `expo-location.reverseGeocodeAsync` — this is fine (on-device, no API key).

### Visits Sub-Feature

```ts
// API
getVisits(customerId)    // GET /customers/:id/visits
createVisit(customerId, data)
updateVisit(customerId, visitId, data)
deleteVisit(customerId, visitId)

// Query key
QUERY_KEYS.CUSTOMERS.visits(customerId)  // ['customers', id, 'visits']
```

---

## Applications Feature

### API Service

```ts
getApplications()
getApplication(id)
createApplication(data)
updateApplication(id, data)
deleteApplication(id)
assignCustomer(applicationId, customerId)
removeCustomer(applicationId, customerId)
```

### Columns

| Column | Field | Width |
|---|---|---|
| Name | `name` | flex 1 |
| Version | `version` | 90 |
| Tickets | `_count.tickets` | 70 |
| Customers | `_count.customers` | 80 |
| Created | `createdAt` | 100 |

---

## Users Feature

### API Service

```ts
getUsers() / getUser(id) / createUser(data) / updateUser(id, data) / deleteUser(id)
forceDeleteUser(id)        // DELETE /users/:id?force=true
forceTenantDeleteUser(id)  // DELETE /users/tenant/:id?force=true
```

### Schema Pattern

```ts
export const createUserFormSchema = (t: TFunction, isEdit: boolean) =>
  z.object({
    name:     z.string().trim().min(2).max(100),
    email:    z.string().trim().check(z.email(...)),
    password: isEdit
      ? z.string().max(100).optional().or(z.literal(''))
      : z.string().min(6).max(100),
    phone:    z.string().trim().max(30).optional().or(z.literal('')),
    role:     z.enum(USER_ROLES),
  });
```

### Force-delete flow

Normal delete → 400 if user has associated data → `isAssociatedDataError(error)` → `pendingForceTarget` ref → `networkEvents.onOkPress` → `ForceDeleteConfirmDialog` with `confirmWord="DELETE"`.

```ts
import { isAssociatedDataError } from '@/src/services/api/errorCodes';
```

---

## Tickets Feature

### API Service

All paths use `API.TICKETS.*`. `getTickets()` always returns `Promise<Ticket[]>` (normalizes paginated responses internally).

```ts
getTickets(filters?)
getTicket(id)
createTicket(data) / updateTicket(id, data) / deleteTicket(id)
takeTicket(id) / reassignTicket(id, assignedToId)
addComment(ticketId, content) / deleteComment(ticketId, commentId)
watchTicket(id) / unwatchTicket(id) / getWatchers(id)
getProgramming(id) / saveProgramming(id, data) / assignProgrammer(id, programmerId)
```

---

## Settings Feature

Settings panels use `SettingsCard` + `AlertBanner` + `NumberRow` + `Toggle` components.

After saving pagination settings, sync `usePaginationStore` immediately:

```ts
const setPaginationSettings = usePaginationStore((s) => s.setSettings);
const updated = await adminSettingsApi.savePaginationSettings(payload);
setPaginationSettings(updated);
```

---

## Shared Infrastructure

### Native-only libraries — Platform split + lazy require

```tsx
const MyEditor: React.FC<Props> = (props) =>
  Platform.OS === 'web'
    ? <MyEditorWeb {...props} />
    : <MyEditorNative {...props} />;

// In MyEditorNative — lazy require avoids window at module level
const MyEditorNative: React.FC<Props> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { NativeOnlyComponent } = require('native-only-library');
  ...
};
```

### `AdminFormModal` — RTL in Modals

Modals sit outside `DirectionProvider`. Apply direction manually:

```ts
const direction = useUiStore((s) => s.direction);
<View style={[styles.sheet, { direction: direction === 'rtl' ? 'rtl' : 'ltr' }]}>
```

### PDF Export — Mobile Pattern

```ts
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildPdfPage } from '@/src/shared/utils/pdfTemplate';
import { esc, fmtDate } from '@/src/shared/utils/htmlUtils';

export async function exportEntityPdf(items: Entity[], t: TFunction): Promise<void> {
  const html = buildPdfPage(t('entity.title'), `<table>...</table>`);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  else await Print.printAsync({ uri });
}
```

---

## New Feature Checklist

**Files to create:**
- [ ] `api/<feature>.ts` — service + singleton + query keys (use `API.*` and `QUERY_KEYS.*`)
- [ ] `components/<feature>Columns.tsx` — `get<Feature>Columns(t)` factory
- [ ] `components/<Entity>Form.tsx` — dual-mode form (see `mobile-form-pattern.md`)
- [ ] `components/<Entity>DetailScreen.tsx` — read-only detail
- [ ] `hooks/use<Feature>.ts` — `useAdminFeature` wrapper
- [ ] `schemas/<feature>Schema.ts` — Zod factory `createXSchema(t)`
- [ ] `utils/export<Entity>Pdf.ts` — PDF export
- [ ] `<Feature>Screen.tsx` — 3-state orchestration (list → detail → edit)

**Constants to add:**
- [ ] `API.<FEATURE>.*` paths in `mobile/src/constants/api.ts`
- [ ] `QUERY_KEYS.<FEATURE>` in `mobile/src/constants/api.ts`

**i18n keys (both `en.json` and `ar.json`):**
- [ ] `<feature>.title`, `itemType`, `addTitle`, `editTitle`, `notFound`
- [ ] `<feature>.searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage`
- [ ] `<feature>.columns.*`, `form.*`, `messages.*`, `sections.*` (if FormSection used)

**Wire into AdminPanel:**
- [ ] Import screen in `mobile/src/features/admin/AdminPanel.tsx`
- [ ] Add menu item to `MENU_ITEMS` array
- [ ] Add `case` in `renderContent()` switch

**Error handling (see `mobile-error-toast-pattern.md`):**
- [ ] `FeatureErrorBoundary` wraps all view states
- [ ] Form uses `doSave` pattern with duplicate detection
- [ ] Delete uses `isAssociatedDataError` + `pendingForceTarget` pattern
