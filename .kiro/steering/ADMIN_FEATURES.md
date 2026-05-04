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

### Visits Sub-Feature

Customer visits are managed via a dedicated API service and hook, scoped to a `customerId`.

**API service** (`api/visits.ts`):

```ts
getVisits(customerId)                             // GET /customers/:id/visits
getVisit(customerId, visitId)                     // GET /customers/:id/visits/:visitId
createVisit(customerId, data)                     // POST /customers/:id/visits
updateVisit(customerId, visitId, data)            // PUT /customers/:id/visits/:visitId
deleteVisit(customerId, visitId)                  // DELETE /customers/:id/visits/:visitId
```

Query key: `QUERY_KEYS.CUSTOMERS.visits(customerId)` → `['customers', id, 'visits']`

**Hook** (`hooks/useCustomerVisits.ts`):

```ts
const { visits, isLoading, refetch, createVisit, updateVisit, deleteVisit,
        isCreating, isUpdating, isDeleting } = useCustomerVisits(customerId);
```

- `createVisit(data, successMsg)` / `updateVisit(visitId, data, successMsg)` / `deleteVisit(visitId, successMsg)` — each accepts a pre-translated success message string and returns `true` on success, `false` on failure (API errors are handled by the global `NetworkErrorDialog`)
- `createVisit` also invalidates `QUERY_KEYS.CUSTOMERS.detail(customerId)` so the detail screen refreshes its visit count
- Used by `CustomerVisitsScreen` and `VisitHistoryCard`

**Visit Map shortcut bar** — `CustomersScreen` renders a sticky bar above `AdminCrudScreen` in the list view with a single "🗺️ Map" button that sets `showVisits(true)` and renders `CustomerVisitsScreen` as a fourth view state. Locale key: `t('visits.mapButton')`.

```tsx
// Pattern — shortcut bar above AdminCrudScreen
<View style={{ backgroundColor: c.surface.primary, borderBottomWidth: 1, borderBottomColor: c.border.primary, paddingHorizontal: 12, paddingVertical: 8 }}>
  <Pressable
    onPress={() => setShowVisits(true)}
    style={({ pressed }) => ({
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 10, borderWidth: 1,
      backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
      borderColor: '#1d4ed8',
      alignSelf: 'flex-start',
    })}
    accessibilityRole="button"
  >
    <Text style={{ fontSize: 16 }}>🗺️</Text>
    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{t('visits.mapButton')}</Text>
  </Pressable>
</View>
<AdminCrudScreen ... />
```

**Types** (`services/api/types/visit.ts`):

```ts
type VisitStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface CustomerVisit {
  id; customerId; userId; status: VisitStatus;
  visitedAt; notes; latitude; longitude; createdAt; updatedAt;
  user?: { id; name } | null;
}

interface CreateVisitData { status?; visitedAt?; notes?; latitude?; longitude? }
type UpdateVisitData = Partial<CreateVisitData>;
```

**`visits/` subfolder structure** — `CustomerVisitsScreen` is decomposed into a dedicated subfolder:

```
components/visits/
├── visits.types.ts       ← shared types, config maps (SUB_CFG, VISIT_CFG, STATUS_FILTERS), pure helpers (getSubStatus, getVisitCfg), VisitRowProps interface, VisitStats interface
├── visits.styles.ts      ← single StyleSheet exported as default `s` — all sub-components import from here
├── CustomerInfoCard.tsx  ← selected customer avatar, name, status badge, distance chip, contact meta, Log Visit button
├── VisitBadge.tsx        ← colored status pill (PLANNED / COMPLETED / CANCELLED / NO_SHOW)
├── VisitTableRow.tsx     ← table view row
├── VisitGridCard.tsx     ← grid view card
├── VisitCompactRow.tsx   ← compact single-line row
└── VisitMapPanel.tsx     ← collapsible map with customer pins
```

**Why this structure:** the `StyleSheet` must be defined before any sub-component that references it. Extracting to `visits.styles.ts` eliminates "used before defined" issues when components are split across files. All sub-components import the same `s` object — no duplication.

**`CustomerInfoCard`** — renders the selected customer's info at the top of the visits list. Displays avatar (initials), name, company, subscription status badge, and a distance chip when GPS permission is already granted. Contact meta row shows email, phone, address, and coordinates (5 decimal places) when present. The distance chip uses `useCurrentDistance()` — the same passive GPS hook documented in the detail screen section — and appears inline next to the status badge. Distance chip styling: `Palette.slate900` background (`#0f172a`), `Palette.slate700` border (`#334155`), `Palette.slate50` text (`#f8fafc`). The Log Visit button (`AppButton variant="primary" size="small"`) always renders and receives `resolvedColors={c}` for Modal safety.

**`VisitMapPanel` props:**

```tsx
<VisitMapPanel
  customers={filteredCustomers}       // only customers with lat/lng
  selectedId={selectedId}
  mapHeight={MAP_H}                   // Math.round(height * 0.30)
  collapsed={mapCollapsed}
  loading={customersLoading}
  mapRef={mapRef}
  initialRegion={initialRegion}
  onSelectCustomer={handleSelectCustomer}
  onToggleCollapse={setMapCollapsed}
/>
```

- Collapsed state renders a pressable bar with customer count and ▼ chevron
- Expanded state renders the full `MapView` with subscription-colored pins, a count badge (top-end), and a "▲ Hide map" button (bottom-start)
- Web platform renders a fallback placeholder (no `react-native-maps` on web)
- Pin color: selected → `cfg.color` bg + white text + scale 1.15; unselected → `cfg.bg` bg + `cfg.color` text

**`VisitRowProps` interface** (shared by all three row components):

```ts
interface VisitRowProps {
  visit:    CustomerVisit;
  userId:   string;
  isAdmin:  boolean;
  onEdit:   (v: CustomerVisit) => void;
  onDelete: (id: string) => void;
  c:        ReturnType<typeof useThemeColors>;  // theme colors resolved by parent
}
```

The parent (`CustomerVisitsScreen`) resolves `useThemeColors()` once and passes `c` down — row components do not call `useThemeColors()` themselves.

**`SaveVisitModal`** — bottom-sheet modal for logging or editing a visit. Key features:

- **Distance pill in header** — same dark slate styling (`#0f172a` bg, `#f8fafc` text) as `CustomerInfoCard`'s distance chip. Fetched once on open via `getForegroundPermissionsAsync()` (never prompts). Guarded by a `useRef(false)` flag so it only runs once per mount.
- **Customer location mini-map** — 160dp tall, shown when `customer.latitude/longitude` are non-null and `Platform.OS !== 'web'`. Uses `react-native-maps` via lazy `require()` (same native-only pattern as other map components). Non-interactive (`scrollEnabled={false}`, `zoomEnabled={false}`, `pointerEvents="none"`). Shows two pins:
  - Blue pin (`#2563eb`) — customer location
  - Green pin (`#16a34a`) — current GPS position (only when `gpsCoords` is available from `useVisitForm`)
- **Map region** — centered on the customer; `latitudeDelta`/`longitudeDelta` expand to fit both pins when GPS is available: `Math.abs(gpsCoords.lat - customer.lat) * 2.5 + 0.01`
- **Legend overlay** — `position: 'absolute'`, `bottom: 8, start: 8` (RTL-safe), semi-transparent background (`c.surface.primary + 'ee'`). Shows customer name, "You" label (when GPS available), and distance.
- **Date row** — inline layout: date value text + "🕐 Use current time" button in a single bordered row (replaces the previous stacked layout).
- **GPS coordinates** — displayed to 5 decimal places (was 4).

```tsx
// Map region pattern — fits both pins
const mapRegion = hasCustomerLocation ? {
  latitude:       customer.latitude!,
  longitude:      customer.longitude!,
  latitudeDelta:  gpsCoords
    ? Math.abs(gpsCoords.latitude  - customer.latitude!)  * 2.5 + 0.01
    : 0.01,
  longitudeDelta: gpsCoords
    ? Math.abs(gpsCoords.longitude - customer.longitude!) * 2.5 + 0.01
    : 0.01,
} : null;
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

**Location** (collapsible, starts collapsed when no location set):
- `LocationPicker` component — map-based coordinate picker
- Controlled via a single `<Controller name="latitude">` that also drives `longitude` via `form.setValue`
- `doSave` converts form values to `number | null` before sending: `Number(data.latitude)` / `Number(data.longitude)`
- Sends `null` for both when no pin is placed
- Includes an **address search bar** (map mode only) — uses Nominatim/OpenStreetMap (`https://nominatim.openstreetmap.org/search`) with no API key required; `expo-location`'s `geocodeAsync` is **not** used for forward geocoding (it requires a paid Google Maps key on Android)
- Includes **reverse geocoding** via `expo-location`'s `reverseGeocodeAsync` — called after pin placement, drag, GPS fix, or address search; result is passed to the parent via `onAddressSuggested(address)` prop; suppressed when `hasExistingAddress={true}`
- Includes **near-me suggestions** — when the map loads with no pin set and location permission is already granted, `LocationPicker` silently fetches up to 4 nearby landmarks from Nominatim using a bounding-box query and renders them as tappable chips above the map; selecting a chip places the pin, triggers reverse geocoding, and animates the map to that location; chips are hidden after selection or once a pin is placed; errors are silently swallowed (suggestions are optional UI)

**Maintenance type selector** (3 options, no "Inactive"):
- Monthly Subscription → shows Start + End date pickers
- Free Trial → shows Start + End date pickers
- Pay As You Go → no date pickers

**Date pickers** use `AppDatePicker` (native OS picker, stores `YYYY-MM-DD`):
- End date `minDate` = selected start date

**Edit mode:** linked stats (tickets + applications)

#### Location field wiring pattern

`LocationPicker` exposes a single `value / onChange` interface. In `CustomerForm`, a single `Controller` on `latitude` drives both fields:

```tsx
<Controller
  name="latitude"
  control={control}
  render={({ field: { value, onChange } }) => {
    const lngValue = form.getValues('longitude');
    const pickerValue =
      value != null && lngValue != null
        ? { latitude: Number(value), longitude: Number(lngValue) }
        : null;
    return (
      <LocationPicker
        value={pickerValue}
        onChange={(coords) => {
          onChange(coords?.latitude ?? null);
          form.setValue('longitude', coords?.longitude ?? null);
        }}
      />
    );
  }}
/>
```

Coordinate serialization in `doSave`:
```ts
const lat = data.latitude  != null && data.latitude  !== '' ? Number(data.latitude)  : null;
const lng = data.longitude != null && data.longitude !== '' ? Number(data.longitude) : null;
```

#### Address search — Nominatim (no API key)

`LocationPicker` includes an address search bar that calls Nominatim/OpenStreetMap directly. **Do not use `expo-location`'s `geocodeAsync`** for forward geocoding — it delegates to the platform's geocoder (Google Maps on Android) which requires a paid API key in production.

```ts
const url =
  `https://nominatim.openstreetmap.org/search` +
  `?q=${encodeURIComponent(query)}&format=json&limit=1`;

const res  = await fetch(url, {
  headers: { 'Accept-Language': 'en', 'User-Agent': 'TicketFlowApp/1.0' },
});
const data: Array<{ lat: string; lon: string }> = await res.json();

const latitude  = parseFloat(data[0].lat);
const longitude = parseFloat(data[0].lon);
```

**Rules:**
- Always include `User-Agent` header — Nominatim's usage policy requires it
- `Accept-Language: en` returns English place names regardless of device locale
- `limit=1` — only the top result is used; the picker places the pin and animates the map to it
- Reverse geocoding (pin → address) still uses `expo-location`'s `reverseGeocodeAsync` — this is fine because it uses the device's on-device geocoder, not a network API key

#### Near-me suggestions — Nominatim bounding-box query

When `LocationPicker` mounts with no pin set and location permission is already granted, it silently fetches up to 4 nearby landmarks using a Nominatim bounding-box search. This runs **once** (guarded by a `useRef` flag) and is entirely passive — it never requests permission.

```ts
const url =
  `https://nominatim.openstreetmap.org/search` +
  `?q=landmark&format=json&limit=5` +
  `&viewbox=${longitude - 0.05},${latitude + 0.05},${longitude + 0.05},${latitude - 0.05}` +
  `&bounded=1`;

const res = await fetch(url, {
  headers: { 'Accept-Language': 'en', 'User-Agent': 'TicketFlowApp/1.0' },
});
const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();

const places = data.slice(0, 4).map((p) => ({
  name: p.display_name.split(',')[0].trim(),  // first segment only
  lat:  parseFloat(p.lat),
  lon:  parseFloat(p.lon),
}));
```

**Rules:**
- Guard with a `useRef(false)` flag — fetch runs at most once per component mount
- Only runs when `mapAvailable && !value && !disabled` — never when a pin is already set
- Call `getForegroundPermissionsAsync()` — never `requestForegroundPermissionsAsync()` — so no permission dialog is triggered
- Errors are silently swallowed — suggestions are optional UI
- After selection: call `onChange(coords)`, trigger `reverseGeocode`, animate map, and clear the chips array (`setNearMePlaces([])`)
- Chips use `c.surface.secondary` background + `c.border.primary` border; pressed state uses `c.interactive.primaryPressed + '22'`



1. **Hero card** — status-colored accent bar, initials avatar, name, company, status badge, quick contact row
2. **Stats row** — ticket count (blue) + linked applications (green)
3. **Contact card** — email, phone, company, address, created (with emoji icons)
4. **Location section** — positioned between contact card and subscription card:
   - When `latitude`/`longitude` are non-null: renders `CustomerLocationMap` (collapsed thumbnail, 200dp height), then optionally a **distance chip**, then a three-button row:
     - 🗺️ **"Open in Maps"** (blue) — calls `openInMaps()` helper; uses `Linking.canOpenURL` → native maps app (iOS: `maps://`, Android: `geo:`) with fallback to web maps
     - 📋 **"Copy Coordinates"** (slate) — copies `"lat, lng"` (6 decimal places) to clipboard via `Clipboard.setString()`; button turns green with a ✅ checkmark for 1.5 s after copying (`useState` + `setTimeout`)
     - 📤 **"Share"** (cyan) — calls `Share.share({ message, url })` with a Google Maps URL; includes customer name in the message when available
   - **Distance chip** — shown between the map and the button row when the device's GPS position is already known (permission previously granted). Displays `"📍  ~X.X km away"` or `"📍  ~XXX m away"`. Uses `useCurrentDistance()` hook — silently skipped if permission not granted or GPS fails.
   - When no location: renders a "No location set" placeholder card
5. **Subscription card** — type, start date, end date (3-state color: green/amber/red)
6. **Linked applications card** — app name + version badge

#### `CustomerLocationMap` — collapsed / expanded pattern

`CustomerLocationMap` renders in two modes controlled by internal `useState`:

- **Collapsed** (default) — a static 200dp thumbnail with `scrollEnabled={false}`, `zoomEnabled={false}`, `pointerEvents="none"` on the `MapView`, and a semi-transparent `"🔍 Tap to expand"` pill overlay at the bottom. Tapping anywhere on the thumbnail opens the expanded modal.
- **Expanded** — a full-screen `<Modal animationType="slide" statusBarTranslucent>` with `scrollEnabled`, `zoomEnabled`, `rotateEnabled`, `pitchEnabled` all enabled. A floating "✕ Done" button (`position: absolute`, `end: 16`, RTL-safe) dismisses the modal. A customer name label floats at the bottom when `customerName` is provided.

The component does **not** handle "Open in Maps" — that responsibility stays in the parent detail screen's button row (see `openInMaps` helper below).

#### Map type toggle

`CustomerLocationMap` includes a **map type toggle button** (top-left corner, both collapsed and expanded modes). Tapping it cycles through `standard → satellite → hybrid` using a simple cycle helper:

```ts
type MapType = 'standard' | 'satellite' | 'hybrid';

const MAP_TYPE_CYCLE: MapType[] = ['standard', 'satellite', 'hybrid'];
const MAP_TYPE_ICON: Record<MapType, string> = {
  standard:  '🗺️',
  satellite: '🛰️',
  hybrid:    '🌍',
};

function nextMapType(current: MapType): MapType {
  const idx = MAP_TYPE_CYCLE.indexOf(current);
  return MAP_TYPE_CYCLE[(idx + 1) % MAP_TYPE_CYCLE.length];
}
```

The `mapType` state is shared between collapsed and expanded views — changing it in one mode persists when switching modes. The button uses `start: 8` (collapsed) / `start: 16` (expanded) for RTL-safe positioning.

```tsx
// Collapsed thumbnail — tap to expand
<CustomerLocationMap
  latitude={customer.latitude}
  longitude={customer.longitude}
  customerName={customer.name}
  subscriptionStatus={customer.subscriptionStatus}  // optional — shown in marker callout
/>
// No onPress prop needed — expand/collapse and map type are internal state
```

**`subscriptionStatus` prop** — optional. When provided, the marker renders a `<Callout tooltip>` bubble (from `react-native-maps`) that shows the customer name and a colored subscription status badge when the pin is tapped. The callout uses the same `STATUS_CFG` color tokens as the rest of the customers feature:

```ts
const STATUS_CFG: Record<SubscriptionStatus, { color: string; bg: string; icon: string; label: string }> = {
  ACTIVE:        { color: '#16a34a', bg: '#f0fdf4', icon: '✅', label: 'Active'        },
  TRIAL:         { color: '#7c3aed', bg: '#f5f3ff', icon: '🔬', label: 'Trial'         },
  EXPIRED:       { color: '#dc2626', bg: '#fef2f2', icon: '⚠️', label: 'Expired'       },
  INACTIVE:      { color: '#6b7280', bg: '#f9fafb', icon: '⏸️', label: 'Inactive'      },
  PAY_AS_YOU_GO: { color: '#0284c7', bg: '#f0f9ff', icon: '💳', label: 'Pay As You Go' },
};
```

The `pinColor` on the `<Marker>` is also driven by `cfg.color` — so the pin color matches the subscription status. When `subscriptionStatus` is omitted, it defaults to `'INACTIVE'` (gray pin, no callout rendered if `customerName` is also absent).

**Modal-safety note:** `CustomerLocationMap` calls `useTranslation()` internally (for the expand hint, Done button, and map type toggle labels). This is safe because `useTranslation()` reads from the i18next context which is available inside `<Modal>` trees (unlike Zustand/React context providers). Colors remain hardcoded (`rgba(0,0,0,0.55)` etc.) — no `useThemeColors()` call.

#### `openInMaps` helper pattern

`openInMaps` lives in the **parent detail screen**, not inside `CustomerLocationMap`. It is called from the "Open in Maps" button in the three-button row below the map thumbnail.

```ts
function openInMaps(latitude: number, longitude: number, name?: string): void {
  const label = encodeURIComponent(name ?? '');
  const url = Platform.OS === 'ios'
    ? `maps://0,0?q=${latitude},${longitude}`
    : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

  Linking.canOpenURL(url).then((canOpen) => {
    if (canOpen) {
      Linking.openURL(url);
    } else if (Platform.OS === 'ios') {
      Linking.openURL(`https://maps.apple.com/?q=${latitude},${longitude}`);
    } else {
      Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
    }
  });
}
```

Use `Linking.canOpenURL` before `openURL` — always provide a web fallback for devices without a native maps app installed.

#### `useCurrentDistance` hook — passive GPS distance

Shows how far the operator is from the customer without prompting for permission. Uses only the **already-granted** permission — never requests it.

```ts
function useCurrentDistance(
  targetLat: number | null | undefined,
  targetLng: number | null | undefined,
): string | null {
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (targetLat == null || targetLng == null) return;
    let cancelled = false;

    (async () => {
      try {
        // Check permission — do NOT request it here
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        } as any);
        if (cancelled) return;

        const km = haversineKm(
          pos.coords.latitude, pos.coords.longitude,
          targetLat, targetLng,
        );
        setDistance(formatDistance(km));
      } catch {
        // Silently skip — distance is optional UI
      }
    })();

    return () => { cancelled = true; };
  }, [targetLat, targetLng]);

  return distance;
}
```

**Rules:**
- Call `getForegroundPermissionsAsync()` — never `requestForegroundPermissionsAsync()` — so the detail screen never triggers a permission dialog
- Errors are silently swallowed — the distance chip is purely additive UI; its absence never breaks the screen
- Use a `cancelled` flag to prevent state updates after unmount
- `formatDistance(km)` returns `"~XXX m"` for distances under 1 km, `"~X.X km"` otherwise

```ts
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R  = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `~${Math.round(km * 1000)} m`;
  return `~${km.toFixed(1)} km`;
}
```

#### Share location pattern

```ts
const handleShareLocation = useCallback((lat: number, lng: number, name?: string) => {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const message = name ? `${name}\n${mapsUrl}` : mapsUrl;
  Share.share({ message, url: mapsUrl });
}, []);
```

Uses React Native's built-in `Share` API — no extra dependencies. `url` is iOS-only (ignored on Android); `message` carries the full content on both platforms.

### Locale Keys

```json
"customers.sections.basicInfo"     → "Basic Info"
"customers.sections.company"       → "Company"
"customers.sections.location"      → "Location"
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
"customers.location.title"         → "Location"
"customers.location.noLocation"    → "No location set"
"customers.location.useMyLocation" → "Use My Location"
"customers.location.clearLocation" → "Clear Location"
"customers.location.latitude"      → "Latitude"
"customers.location.longitude"     → "Longitude"
"customers.location.latPlaceholder"→ "e.g. 24.7136"
"customers.location.lngPlaceholder"→ "e.g. 46.6753"
"customers.location.latRange"      → "Latitude must be between -90 and 90"
"customers.location.lngRange"      → "Longitude must be between -180 and 180"
"customers.location.bothOrNeither" → "Both latitude and longitude must be provided together"
"customers.location.permissionDenied" → "Location permission denied. Open Settings to grant access."
"customers.location.openSettings"  → "Open Settings"
"customers.location.gpsError"      → "Could not get current location. Please try again."
"customers.location.mapUnavailable"→ "Map unavailable. Enter coordinates manually."
"customers.location.openInMaps"    → "Open in Maps"
"customers.location.copyCoords"    → "Copy Coordinates"
"customers.location.copied"        → "Copied!"
"customers.location.share"         → "Share"
"customers.location.away"          → "away"
"customers.location.tapToExpand"   → "Tap to expand"
"customers.location.expandMap"     → "Expand map"
"customers.location.expandMapHint" → "Opens full-screen map view"
"customers.location.done"          → "Done"
"customers.location.toggleMapType" → "Toggle map type"
"customers.location.tapToPin"      → "Tap to pin location"
"customers.location.searchPlaceholder" → "Search address…"
"customers.location.searchBtn"     → "Search"
"customers.location.searchNoResults" → "No results found for that address"
"customers.location.searchError"   → "Address search failed. Please try again."
"customers.location.geocoding"     → "Looking up address…"
"customers.location.nearMe"        → "Nearby"
"customers.duplicateEmail.title"   → "Email Already Exists"
"customers.duplicateEmail.message" → "A customer with this email address already exists"
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

`UserForm` follows the unified form pattern (`mobile-form-pattern.md`) — RHF + `zodResolver`, `AppFormField` for text inputs, `Controller` for `ChipSelector` role picker, `FormSection` grouping, and duplicate email detection. The old `useUserForm` hook is no longer used.

### Form sections

| Section | Icon | Fields | Collapsible |
|---|---|---|---|
| Account | 👤 | Name · Email · Password | No (required) |
| Contact | 📞 | Phone | Yes |
| Role | 🔑 | Role (ChipSelector) | No |

### Password omission on edit

On edit, an empty password field means "no change". The `doSave` handler conditionally omits the field:

```ts
await onSave({
  name:  data.name,
  email: data.email,
  // Omit password entirely on edit when blank — backend treats absence as "no change"
  ...(data.password ? { password: data.password } : isEdit ? {} : { password: '' }),
  phone: data.phone || undefined,
  role:  data.role,
} as CreateUserData);
```

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
"users.sections.account"           → "Account"
"users.sections.contact"           → "Contact"
"users.sections.role"              → "Role"
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
"users.duplicateError.title"       → "Email Already Exists"
"users.duplicateError.message"     → "A user with this email address already exists"
"users.messages.forceDeleted"      → "User and all related data deleted"
"users.forceDelete.title"          → "Force Delete User"
"users.forceDelete.message"        → "This will permanently delete {{name}} and all associated tickets, comments, and activities."
"users.forceDelete.confirmLabel"   → "Delete Everything"
```

### Force-delete flow

When a user has associated data (tickets, comments, activities), a normal delete returns a 400 with "associated" in the error message. `UsersScreen` escalates to a type-to-confirm force-delete dialog.

**`isAssociatedDataError` helper** — detects the escalation condition. This is the single place where the error message is inspected; the result is passed as a structured boolean flag — never re-parsed downstream.

```ts
function isAssociatedDataError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const e = error as any;
    const msg: string = e?.response?.data?.error ?? e?.message ?? '';
    return msg.toLowerCase().includes('associated');
  }
  return false;
}
```

**Two escalation paths:**

1. **From list view** — `AdminCrudScreen` calls `onDeleteFailed(item, error)` when `onDelete` throws; the screen checks `isAssociatedDataError` and opens the force-delete dialog.
2. **From detail view** — the screen catches the error from `handleDeleteFromDetail`, closes the normal confirm dialog, and opens the force-delete dialog.

**Deferred force-delete via `networkEvents.onOkPress`**

When a delete fails with "associated" data, the `NetworkErrorDialog` is shown globally. The force-delete dialog must not open until the user dismisses that dialog (presses OK). Use a `pendingForceTarget` ref to hold the target and promote it only on OK press:

```ts
import { networkEvents } from '@/src/services/api/networkEvents';

const pendingForceTarget = useRef<User | null>(null);

// Subscribe to OK press — open force-delete only after NetworkErrorDialog is dismissed
useEffect(() => {
  const unsub = networkEvents.onOkPress(() => {
    if (pendingForceTarget.current) {
      setForceTarget(pendingForceTarget.current);
      pendingForceTarget.current = null;
    }
  });
  return unsub;
}, []);

// In the delete error handler — store pending instead of opening immediately
if (isAssociatedDataError(error)) {
  pendingForceTarget.current = targetItem;
  // NetworkErrorDialog will show; force-delete opens only after user presses OK
} else {
  handleError(error, { feature: 'users', operation: 'delete' });
}
```

This prevents two dialogs from stacking on top of each other. Apply this pattern in any screen where a delete failure can trigger both the `NetworkErrorDialog` and a secondary confirmation dialog.

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

<FormSection title={t('customers.sections.subscription')} icon="💳" collapsible>
  {/* collapsible=true makes the section expandable/collapsible */}
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
| `collapsible?` | boolean | `true` makes the section expandable/collapsible (default: `false`) |
| `defaultCollapsed?` | boolean | Start in collapsed state — only applies when `collapsible=true` (default: `false`) |
| `hasError?` | boolean | Force the section open when a field inside has a validation error — pass `!!(errors.field1 \|\| errors.field2)` |

**When to use:** any form with 3+ fields should be split into logical sections (e.g. Basic Info / Company / Subscription). Single-section forms don't need `FormSection`. Use `collapsible` when a section has many fields that can be hidden by default to reduce visual clutter.

**`hasError` rule:** always pass `hasError` on collapsible sections so validation errors are never hidden from the user:

```tsx
<FormSection
  title={t('customers.sections.company')}
  icon="🏢"
  collapsible
  hasError={!!(errors.company || errors.address)}
>
```

When `hasError` is `true`, the section ignores its collapsed state and renders its children — the user can see and fix the error even if they had previously collapsed the section.

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

The `httpClient` interceptor automatically surfaces all API errors via the global `NetworkErrorDialog`. Form `doSave` handlers should keep their catch block minimal — do not re-handle generic API errors with `toast.error()` or custom dialogs, as the interceptor already handles them.

**Exception:** when a specific, actionable error needs a user-friendly toast (e.g. duplicate email), call `toast.error()` for that case only and let all other errors fall through to `NetworkErrorDialog`.

```ts
const doSave = async (data: any) => {
  try {
    await onSave({ ...data } as CreateEntityData);
    // ✅ Toast BEFORE onClose — component unmounts on close
    toast.success(item ? t('feature.messages.updated') : t('feature.messages.created'));
    onClose();
  } catch (err: any) {
    // NetworkErrorDialog handles all API errors automatically via httpClient interceptor.
    // Only add a toast here for specific, actionable errors the user needs to act on.
    const serverMsg: string =
      err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';
    if (serverMsg.toLowerCase().includes('already exists')) {
      // ✅ Specific toast for duplicate so the user knows what happened
      toast.error(t('feature.duplicateEmail.title'), t('feature.duplicateEmail.message'));
    }
    // All other errors are shown by NetworkErrorDialog — do not toast here
  }
};
```

**Rules:**
- The success toast and `onClose()` are only called when `onSave` resolves without throwing
- Do NOT add a generic `toast.error()` in the catch — the interceptor already shows the error
- DO add a `toast.error()` for specific, user-actionable errors (e.g. duplicate email) — inspect the server message and only toast for that case
- All other errors fall through silently to `NetworkErrorDialog`
- `FeatureErrorBoundary` + `useErrorHandler` are still used for non-form async operations (fetch, export, delete)

---

## Checklist — New Admin Feature

### Error Handling
- [ ] Import `FeatureErrorBoundary` and `useErrorHandler`
- [ ] Wrap all view states with `FeatureErrorBoundary`
- [ ] Implement `handleFeatureError` for boundary errors
- [ ] Use structured `handleError(error, { feature, operation })` in non-form async operations (fetch, export, delete)
- [ ] Form `doSave` uses minimal catch — `NetworkErrorDialog` handles generic API errors automatically
- [ ] `toast.error()` in catch only for specific actionable errors (e.g. duplicate email) — not for generic failures

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
- [ ] If the entity supports force-delete: pass `onDeleteFailed={(item, error) => { if (isAssociatedDataError(error)) setForceTarget(item); }}`

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
