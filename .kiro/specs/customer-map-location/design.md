# Design Document — Customer Map Location

## Overview

This feature adds geographic location support to the customer entity. Each customer gains two nullable `double precision` columns (`latitude`, `longitude`) in the PostgreSQL database. The mobile app gains a map-based location picker in the customer form and a read-only map view in the customer detail screen. The API backend persists and exposes the new fields. No changes are required to the web frontend.

### Key design decisions

1. **Nullable coordinate pair** — both columns are always `null` together or both have values. The API enforces this with a cross-field Zod validation rule (partial pair → 400).
2. **`react-native-maps`** for the interactive picker and the read-only detail map — already available in the Expo ecosystem, no new native dependencies.
3. **`expo-location`** for GPS / permission APIs — already in the Expo ecosystem, no new native dependencies.
4. **Offline fallback** — when map tiles cannot load, the picker degrades to two numeric `TextInput` fields so the operator can still record coordinates manually.
5. **Foreground-only permissions** — `ACCESS_FINE_LOCATION` (Android) and `NSLocationWhenInUseUsageDescription` (iOS) only; background location is never requested.
6. **Form values stored as strings, serialized as numbers** — react-hook-form stores all field values as strings; the `doSave` handler converts lat/lng to `number | null` before sending to the API.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  API (Node.js / Express / Drizzle ORM / PostgreSQL)             │
│                                                                 │
│  customers table                                                │
│  ├── latitude   DOUBLE PRECISION  NULL                          │
│  └── longitude  DOUBLE PRECISION  NULL                          │
│                                                                 │
│  customers.schema.js  ──►  migration SQL (generated)            │
│  customers.validation.js  (Zod — lat/lng optional, cross-field) │
│  customers.repository.js  (CUSTOMER_COLUMNS extended)           │
│  customers.service.js     (pass-through, no new logic)          │
│  customers.docs.js        (Swagger schema + request bodies)     │
└─────────────────────────────────────────────────────────────────┘
                          │  REST  (JSON)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mobile (React Native / Expo / TypeScript)                      │
│                                                                 │
│  services/api/types.ts                                          │
│  ├── Customer.latitude:  number | null                          │
│  └── Customer.longitude: number | null                          │
│  └── CreateCustomerData.latitude?: number | null                │
│  └── CreateCustomerData.longitude?: number | null               │
│                                                                 │
│  features/admin/customers/                                      │
│  ├── schemas/customerSchema.ts  (Zod — lat/lng optional)        │
│  ├── components/                                                │
│  │   ├── CustomerForm.tsx       (new Location FormSection)      │
│  │   ├── LocationPicker.tsx     (new — react-native-maps)       │
│  │   └── CustomerDetailScreen.tsx (new CustomerLocationMap)     │
│  └── components/CustomerLocationMap.tsx  (new — read-only map)  │
│                                                                 │
│  i18n/locales/en.json + ar.json  (new customers.location.* keys)│
│  app.json  (location permissions)                               │
└─────────────────────────────────────────────────────────────────┘
```

### Data flow — form submission

```
LocationPicker (react-native-maps / TextInput fallback)
  │  onCoordinateChange({ latitude: number, longitude: number } | null)
  ▼
CustomerForm (react-hook-form)
  │  fields: { latitude: string, longitude: string }
  │  doSave() converts → { latitude: number | null, longitude: number | null }
  ▼
customersApi.createCustomer / updateCustomer (Axios)
  ▼
POST /api/v1/customers  or  PUT /api/v1/customers/:id
  ▼
Zod validation → customers.service → customers.repository → PostgreSQL
```

### Data flow — detail screen

```
GET /api/v1/customers/:id
  ▼
Customer { latitude: number | null, longitude: number | null }
  ▼
CustomerDetailScreen
  ├── customer.latitude !== null  →  <CustomerLocationMap />
  └── customer.latitude === null  →  placeholder text
```

---

## Components and Interfaces

### API layer

#### `customers.schema.js` — two new columns

```js
import { doublePrecision } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  // ... existing columns ...
  latitude:  doublePrecision('latitude'),   // nullable by default
  longitude: doublePrecision('longitude'),  // nullable by default
});
```

A single Drizzle migration is generated with `npm run db:generate` and applied with `npm run db:migrate`.

#### `customers.validation.js` — extended Zod schemas

Both `createCustomerSchema` and `updateCustomerSchema` gain:

```js
latitude:  z.number().min(-90).max(90).nullable().optional(),
longitude: z.number().min(-180).max(180).nullable().optional(),
```

Plus a cross-field `.superRefine()` rule on both schemas:

```js
.superRefine((data, ctx) => {
  const hasLat = data.latitude  != null;
  const hasLng = data.longitude != null;
  if (hasLat !== hasLng) {
    const missing = hasLat ? 'longitude' : 'latitude';
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${missing} is required when the other coordinate is provided`,
      path: [missing],
    });
  }
})
```

#### `customers.repository.js` — `CUSTOMER_COLUMNS` extended

```js
const CUSTOMER_COLUMNS = {
  // ... existing columns ...
  latitude:  customers.latitude,
  longitude: customers.longitude,
};
```

No other repository changes are needed — `insertCustomer`, `updateCustomerById`, and all query functions already use `CUSTOMER_COLUMNS` and pass `data` through generically.

#### `customers.service.js` — `createCustomer` and `updateCustomer`

Both functions already destructure `body` and pass fields to the repository. Add `latitude` and `longitude` to the destructuring and the `data` object:

```js
// createCustomer
const customer = await repo.insertCustomer({
  // ... existing fields ...
  latitude:  latitude  ?? null,
  longitude: longitude ?? null,
});

// updateCustomer — partial update block
if (latitude  !== undefined) data.latitude  = latitude  ?? null;
if (longitude !== undefined) data.longitude = longitude ?? null;
```

#### `customers.docs.js` — Swagger

Add `latitude` and `longitude` to:
- `CreateCustomer` request body
- `UpdateCustomer` request body
- `Customer` response schema (in `swagger.components.js`)

```js
// swagger.components.js — Customer schema
latitude:  { type: 'number', format: 'double', nullable: true, example: 24.7136 },
longitude: { type: 'number', format: 'double', nullable: true, example: 46.6753 },

// CreateCustomer / UpdateCustomer request bodies
latitude:  { type: 'number', format: 'double', nullable: true, minimum: -90,  maximum: 90  },
longitude: { type: 'number', format: 'double', nullable: true, minimum: -180, maximum: 180 },
```

---

### Mobile layer

#### `services/api/types.ts` — `Customer` and `CreateCustomerData`

```ts
export interface Customer {
  // ... existing fields ...
  latitude:  number | null;
  longitude: number | null;
}

export interface CreateCustomerData {
  // ... existing fields ...
  latitude?:  number | null;
  longitude?: number | null;
}
```

#### `schemas/customerSchema.ts` — Zod form schema

Add to the `z.object({...})`:

```ts
latitude:  z.coerce.number().min(-90).max(90).nullable().optional(),
longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
```

Add a cross-field `.refine()`:

```ts
.refine(
  (d) => {
    const hasLat = d.latitude  != null && d.latitude  !== '';
    const hasLng = d.longitude != null && d.longitude !== '';
    return hasLat === hasLng;
  },
  {
    message: t('customers.location.bothOrNeither'),
    path: ['longitude'],
  },
)
```

#### `components/LocationPicker.tsx` — new component

The location picker is a self-contained component that manages its own map/fallback state. It is **not** Modal-safe (calls `useThemeColors`) and is used only in `CustomerForm` (page mode).

```ts
interface LocationPickerProps {
  value:    { latitude: number; longitude: number } | null;
  onChange: (coords: { latitude: number; longitude: number } | null) => void;
  disabled?: boolean;
}
```

**Internal state:**
- `mapAvailable: boolean` — set to `false` in `MapView`'s `onMapLoadError` callback; triggers fallback UI
- `fetchingLocation: boolean` — true while `expo-location` is running
- `permissionDenied: boolean` — true after a denied permission response
- `locationError: string | null` — GPS timeout or other error message

**Map mode (default):**
- Renders a `<MapView>` from `react-native-maps` with `scrollEnabled={true}`, `zoomEnabled={true}`, `height: 220`
- If `value` is non-null, renders a `<Marker draggable coordinate={value} onDragEnd={...} />`
- `onPress` on the `MapView` places/moves the pin
- "Use My Location" `AppButton` below the map
- "Clear Location" `Pressable` link shown only when a pin is placed

**Fallback mode (offline / map load error):**
- Two `AppTextInput` fields: Latitude (−90 to 90) and Longitude (−180 to 180)
- Validated on blur; invalid values show inline error text
- "Use My Location" button still works (GPS does not require map tiles)

**"Use My Location" flow:**
1. Check `expo-location.getForegroundPermissionsAsync()`
2. If `status !== 'granted'` → call `requestForegroundPermissionsAsync()`
3. If still not granted → set `permissionDenied = true`, show inline message with link to Settings
4. If granted → call `getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 10000 })`
5. On success → call `onChange({ latitude, longitude })`, center map
6. On timeout/error → set `locationError`, show inline message
7. `fetchingLocation` guards the button (disabled + spinner) throughout steps 4–6

**Design rationale:** Keeping map/fallback state inside `LocationPicker` isolates the complexity from `CustomerForm`. `CustomerForm` only sees a `value` / `onChange` interface.

#### `components/CustomerLocationMap.tsx` — new component (read-only)

Used in `CustomerDetailScreen`. Modal-safe: no hooks (colors passed via `style` prop from parent).

```ts
interface CustomerLocationMapProps {
  latitude:   number;
  longitude:  number;
  customerName?: string;
  style?:     ViewStyle;
}
```

- Renders a `<MapView>` with `scrollEnabled={false}`, `zoomEnabled={false}`, `height: 200`
- A single non-draggable `<Marker>` at the coordinates
- Wrapped in a `<Pressable>` that calls `Linking.openURL(mapsUrl)` on press
  - iOS: `maps://0,0?q=${lat},${lng}` (falls back to `https://maps.apple.com/?q=...`)
  - Android: `geo:${lat},${lng}?q=${lat},${lng}(${customerName})`
- `pointerEvents="none"` on the inner `MapView` so the `Pressable` captures the tap

#### `components/CustomerForm.tsx` — new "Location" `FormSection`

Insert a new `FormSection` between the "Company" section and the "Subscription" section:

```tsx
<FormSection
  title={t('customers.sections.location')}
  icon="📍"
  collapsible
  defaultCollapsed={!item?.latitude}
  hasError={!!(errors.latitude || errors.longitude)}
>
  <Controller
    name="latitude"
    control={control}
    render={({ field: { value, onChange } }) => (
      <LocationPicker
        value={
          value != null && form.getValues('longitude') != null
            ? { latitude: Number(value), longitude: Number(form.getValues('longitude')) }
            : null
        }
        onChange={(coords) => {
          onChange(coords?.latitude ?? null);
          form.setValue('longitude', coords?.longitude ?? null);
        }}
      />
    )}
  />
</FormSection>
```

The `doSave` handler converts form strings to numbers:

```ts
const doSave = async (data: any) => {
  const lat = data.latitude  != null && data.latitude  !== '' ? Number(data.latitude)  : null;
  const lng = data.longitude != null && data.longitude !== '' ? Number(data.longitude) : null;
  await onSave({
    // ... existing fields ...
    latitude:  lat,
    longitude: lng,
  } as CreateCustomerData);
};
```

Default values in `useForm`:

```ts
defaultValues: {
  // ... existing ...
  latitude:  item?.latitude  ?? null,
  longitude: item?.longitude ?? null,
}
```

#### `components/CustomerDetailScreen.tsx` — new map section

Insert between the contact card and the subscription card:

```tsx
{/* ── Location map ── */}
{customer.latitude != null && customer.longitude != null ? (
  <CustomerLocationMap
    latitude={customer.latitude}
    longitude={customer.longitude}
    customerName={customer.name}
  />
) : (
  <View style={[styles.noLocationCard, { backgroundColor: cardBg, borderColor: border }]}>
    <Text style={[styles.noLocationText, { color: textSec }]}>
      {t('customers.location.noLocation')}
    </Text>
  </View>
)}
```

---

## Data Models

### Database — `customers` table (additions)

| Column | Type | Nullable | Constraint |
|---|---|---|---|
| `latitude` | `DOUBLE PRECISION` | YES | `CHECK (latitude BETWEEN -90 AND 90)` — enforced at app layer via Zod |
| `longitude` | `DOUBLE PRECISION` | YES | `CHECK (longitude BETWEEN -180 AND 180)` — enforced at app layer via Zod |

Both columns default to `NULL`. The pair is always null together or both non-null (enforced by Zod cross-field validation, not a DB constraint, to keep the migration simple).

### TypeScript types

```ts
// services/api/types.ts
interface Customer {
  id:                    string;
  tenantId:              string;
  name:                  string;
  email:                 string;
  phone:                 string | null;
  company:               string | null;
  address:               string | null;
  latitude:              number | null;   // NEW
  longitude:             number | null;   // NEW
  maintenanceType:       MaintenanceType | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate:   string | null;
  subscriptionStatus?:   SubscriptionStatus;
  isActive?:             boolean;
  applications?:         CustomerApplication[];
  _count?:               { tickets: number };
  createdAt:             string;
  updatedAt:             string;
}

interface CreateCustomerData {
  name:                  string;
  email:                 string;
  phone?:                string | null;
  company?:              string | null;
  address?:              string | null;
  latitude?:             number | null;   // NEW
  longitude?:            number | null;   // NEW
  maintenanceType?:      MaintenanceType | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?:  string | null;
  applicationIds?:       string[];
}
```

### Zod form schema additions

```ts
// customerSchema.ts
latitude:  z.coerce.number().min(-90,  t('customers.location.latRange'))
                            .max(90,   t('customers.location.latRange'))
                            .nullable().optional(),
longitude: z.coerce.number().min(-180, t('customers.location.lngRange'))
                            .max(180,  t('customers.location.lngRange'))
                            .nullable().optional(),
```

### i18n keys (both `en.json` and `ar.json`)

```json
"customers": {
  "sections": {
    "location": "Location"
  },
  "location": {
    "title":           "Location",
    "noLocation":      "No location set",
    "useMyLocation":   "Use My Location",
    "clearLocation":   "Clear Location",
    "latitude":        "Latitude",
    "longitude":       "Longitude",
    "latPlaceholder":  "e.g. 24.7136",
    "lngPlaceholder":  "e.g. 46.6753",
    "latRange":        "Latitude must be between -90 and 90",
    "lngRange":        "Longitude must be between -180 and 180",
    "bothOrNeither":   "Both latitude and longitude must be provided together",
    "permissionDenied":"Location permission denied. Open Settings to grant access.",
    "openSettings":    "Open Settings",
    "gpsError":        "Could not get current location. Please try again.",
    "mapUnavailable":  "Map unavailable. Enter coordinates manually.",
    "openInMaps":      "Open in Maps"
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Location round-trip through the API

*For any* valid coordinate pair `(lat, lng)` where `lat ∈ [−90, 90]` and `lng ∈ [−180, 180]`, creating a customer with those coordinates and then fetching that customer by ID should return the same `latitude` and `longitude` values.

**Validates: Requirements 1.4, 2.2, 2.3**

---

### Property 2: Location update replaces previous values

*For any* two valid coordinate pairs `(lat1, lng1)` and `(lat2, lng2)`, creating a customer with the first pair and then updating it with the second pair should result in the customer having `latitude = lat2` and `longitude = lng2`.

**Validates: Requirements 1.5, 2.4**

---

### Property 3: Out-of-range latitude is rejected

*For any* latitude value `lat` where `lat < −90` or `lat > 90`, submitting it to the create or update endpoint should return HTTP 400.

**Validates: Requirements 1.7**

---

### Property 4: Out-of-range longitude is rejected

*For any* longitude value `lng` where `lng < −180` or `lng > 180`, submitting it to the create or update endpoint should return HTTP 400.

**Validates: Requirements 1.8**

---

### Property 5: Partial coordinate pair is rejected

*For any* valid latitude value sent without a longitude (or any valid longitude sent without a latitude), the API should return HTTP 400.

**Validates: Requirements 1.9**

---

### Property 6: All customers in list response include location fields

*For any* non-empty list of customers returned by `GET /api/v1/customers`, every customer object in the response should contain both a `latitude` key and a `longitude` key (values may be `null`).

**Validates: Requirements 2.1**

---

### Property 7: Location picker initializes from stored coordinates

*For any* customer with non-null `latitude` and `longitude`, opening the customer edit form should initialize the `LocationPicker` with a pin placed at those exact coordinates (i.e., the form's `latitude` and `longitude` default values match the customer's stored values).

**Validates: Requirements 3.2**

---

### Property 8: Map tap / drag updates displayed coordinates

*For any* valid coordinate tapped or dragged to on the `LocationPicker` map, the displayed latitude and longitude values should equal the tapped/dragged coordinate.

**Validates: Requirements 3.4, 3.5**

---

### Property 9: Form serializes coordinates as numbers

*For any* valid numeric string pair `(latStr, lngStr)` entered in the location picker (map or fallback text inputs), the `doSave` handler should produce an API payload where `latitude` and `longitude` are JavaScript `number` values (not strings), equal to `parseFloat(latStr)` and `parseFloat(lngStr)` respectively.

**Validates: Requirements 5.4**

---

### Property 10: Detail screen shows map for any customer with location

*For any* customer object where `latitude` and `longitude` are non-null numbers, the `CustomerDetailScreen` should render the `CustomerLocationMap` component (not the "No location set" placeholder).

**Validates: Requirements 4.1**

---

## Error Handling

### API validation errors

| Condition | HTTP status | Error message |
|---|---|---|
| `latitude` outside `[−90, 90]` | 400 | `"latitude must be between -90 and 90"` |
| `longitude` outside `[−180, 180]` | 400 | `"longitude must be between -180 and 180"` |
| Only one coordinate provided | 400 | `"longitude is required when the other coordinate is provided"` (or `latitude`) |

These are caught by the existing `validate(schema)` middleware before the controller runs. No controller changes are needed.

### Mobile — location permission errors

| State | UI response |
|---|---|
| Permission denied (first time) | System dialog shown; if denied, inline message + "Open Settings" link |
| Permission permanently denied | Inline message with `Linking.openSettings()` link |
| GPS timeout / unavailable | Inline error message; pin not placed |
| Map tiles fail to load | Fallback to two `TextInput` fields; "Use My Location" still works |

### Mobile — form validation errors

The cross-field Zod refine rule surfaces as an error on the `longitude` field. The `FormSection` `hasError` prop ensures the Location section stays open when this error is present.

### Mobile — deep link to maps app

`Linking.openURL` can fail if no maps app is installed (rare). Wrap in a `try/catch` and show a toast error if the URL cannot be opened.

---

## Testing Strategy

### API — unit tests

- **Example test**: Create a customer without location → verify `latitude: null`, `longitude: null` in response.
- **Example test**: Create a customer with location → verify values are returned.
- **Example test**: Update a customer to clear location (send `latitude: null, longitude: null`) → verify both are null.
- **Example test**: Send only `latitude` → verify 400 with descriptive error.
- **Example test**: Send only `longitude` → verify 400 with descriptive error.
- **Example test**: Fetch customer by ID → verify `latitude` and `longitude` keys are present.

### API — property-based tests

Use a property-based testing library (e.g. `fast-check` for Node.js) with minimum 100 iterations per property.

- **Property 1** — `fc.float({ min: -90, max: 90 })` × `fc.float({ min: -180, max: 180 })` → create → fetch → assert equality.
- **Property 2** — two coordinate pairs → create with first → update with second → assert second pair returned.
- **Property 3** — `fc.oneof(fc.float({ max: -90.001 }), fc.float({ min: 90.001 }))` → assert 400.
- **Property 4** — `fc.oneof(fc.float({ max: -180.001 }), fc.float({ min: 180.001 }))` → assert 400.
- **Property 5** — `fc.float({ min: -90, max: 90 })` (lat only) → assert 400; same for lng only.
- **Property 6** — generate N customers (some with location, some without) → list endpoint → assert every object has `latitude` and `longitude` keys.

Tag format: `// Feature: customer-map-location, Property N: <property_text>`

### Mobile — unit tests

- **Example test**: `CustomerForm` in create mode renders a "Location" `FormSection`.
- **Example test**: `CustomerForm` in edit mode with `item.latitude = null` → `LocationPicker` has no pin.
- **Example test**: Tapping "Clear Location" sets `latitude` and `longitude` to `null`.
- **Example test**: Submitting form without pin → payload has `latitude: null, longitude: null`.
- **Example test**: `CustomerDetailScreen` with `customer.latitude = null` → renders "No location set" placeholder.
- **Example test**: `CustomerDetailScreen` with valid coordinates → renders `CustomerLocationMap`.
- **Example test**: `LocationPicker` in offline/fallback mode → renders two `TextInput` fields.
- **Example test**: Permission denied → inline message shown, pin not placed.

### Mobile — property-based tests

Use `fast-check` with minimum 100 iterations per property.

- **Property 7** — `fc.float({ min: -90, max: 90 })` × `fc.float({ min: -180, max: 180 })` → render `CustomerForm` with `item` having those coordinates → assert form default values match.
- **Property 8** — generate valid coordinate → simulate map press → assert displayed lat/lng equal the coordinate.
- **Property 9** — `fc.float({ min: -90, max: 90 })` × `fc.float({ min: -180, max: 180 })` → set in picker → call `doSave` → assert payload `latitude` and `longitude` are `number` type and equal the input values.
- **Property 10** — `fc.float({ min: -90, max: 90 })` × `fc.float({ min: -180, max: 180 })` → render `CustomerDetailScreen` with those coordinates → assert `CustomerLocationMap` is rendered.

Tag format: `// Feature: customer-map-location, Property N: <property_text>`

### Integration tests

- End-to-end: create customer with location via API → fetch via mobile API client → verify `CustomerDetailScreen` renders map.
- Permission flow: grant permission → tap "Use My Location" → verify pin placed at device coordinates.
- Offline map: disable network → open `LocationPicker` → verify fallback text inputs appear.

### Dependencies to install

`react-native-maps` and `expo-location` are not yet in `mobile/package.json`. Install with:

```bash
npx expo install react-native-maps expo-location
```

Add to `app.json` plugins and permissions:

```json
{
  "expo": {
    "plugins": [
      ["expo-location", {
        "locationWhenInUsePermission": "This app uses your location to record the customer's address."
      }]
    ],
    "android": {
      "permissions": ["ACCESS_FINE_LOCATION"]
    },
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app uses your location to record the customer's address."
      }
    }
  }
}
```
