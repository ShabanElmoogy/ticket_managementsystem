# Implementation Plan: Customer Map Location

## Overview

Add geographic location support (`latitude` / `longitude`) to the customer entity. The API gains two new nullable `double precision` columns, extended Zod validation with cross-field rules, and updated Swagger docs. The mobile app gains a `LocationPicker` component in the customer form and a `CustomerLocationMap` component in the customer detail screen, backed by `react-native-maps` and `expo-location`.

Tasks are ordered so each one unblocks the next: API schema → API validation → API repository → API service → API docs → mobile types → mobile schema → mobile components → mobile form integration → mobile detail integration → mobile i18n/config → property-based tests.

## Tasks

- [x] 1. API — Drizzle schema change and migration
  - Add `latitude: doublePrecision('latitude')` and `longitude: doublePrecision('longitude')` (both nullable by default) to the `customers` table in `api/src/modules/customers/customers.schema.js`
  - Import `doublePrecision` from `drizzle-orm/pg-core` alongside the existing imports
  - Run `npm run db:generate` in the `api/` directory to generate the migration SQL file
  - Run `npm run db:migrate` in the `api/` directory to apply the migration to the database
  - Verify the generated migration file appears in `api/drizzle/migrations/` with the correct `ALTER TABLE customers ADD COLUMN latitude double precision; ALTER TABLE customers ADD COLUMN longitude double precision;` statements
  - _Requirements: 1.1, 1.2_

- [x] 2. API — Validation update (Zod schemas + cross-field rule)
  - In `api/src/modules/customers/customers.validation.js`, add `latitude: z.number().min(-90).max(90).nullable().optional()` and `longitude: z.number().min(-180).max(180).nullable().optional()` to both `createCustomerSchema` and `updateCustomerSchema`
  - Append a `.superRefine()` call to both schemas that checks `hasLat !== hasLng` and adds a `z.ZodIssueCode.custom` issue on the missing field with the message `"${missing} is required when the other coordinate is provided"`
  - _Requirements: 1.7, 1.8, 1.9, 2.5_

- [x] 3. API — Repository update (`CUSTOMER_COLUMNS`)
  - In `api/src/modules/customers/customers.repository.js`, add `latitude: customers.latitude` and `longitude: customers.longitude` to the `CUSTOMER_COLUMNS` constant
  - No other repository changes are needed — `insertCustomer`, `updateCustomerById`, and all query functions already use `CUSTOMER_COLUMNS` and pass `data` through generically
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.1, 2.2_

- [x] 4. API — Service update (`createCustomer` and `updateCustomer`)
  - In `api/src/modules/customers/customers.service.js`, destructure `latitude` and `longitude` from `body` in both `createCustomer` and `updateCustomer`
  - In `createCustomer`, add `latitude: latitude ?? null` and `longitude: longitude ?? null` to the `repo.insertCustomer({...})` call
  - In `updateCustomer`, add the partial-update guards: `if (latitude !== undefined) data.latitude = latitude ?? null;` and `if (longitude !== undefined) data.longitude = longitude ?? null;`
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.3, 2.4_

- [x] 5. API — Swagger documentation update
  - In `api/src/config/swagger.components.js`, add `latitude` and `longitude` to the `Customer` schema under `schemas`: `latitude: { type: 'number', format: 'double', nullable: true, example: 24.7136 }` and `longitude: { type: 'number', format: 'double', nullable: true, example: 46.6753 }`
  - Add `latitude` and `longitude` to the `CreateCustomer` request body under `requestBodies`: `latitude: { type: 'number', format: 'double', nullable: true, minimum: -90, maximum: 90 }` and `longitude: { type: 'number', format: 'double', nullable: true, minimum: -180, maximum: 180 }`
  - Add the same two fields to the `UpdateCustomer` request body
  - _Requirements: 2.6_

- [x] 6. API — Install test framework and write property-based tests
  - Install `vitest` and `fast-check` as dev dependencies in `api/`: `npm install --save-dev vitest@latest fast-check@latest`
  - Add a `"test": "vitest run"` script to `api/package.json`
  - Create `api/src/modules/customers/__tests__/customers.location.test.js` with the following property-based tests using `fast-check` (minimum 100 runs each):
    - [x] 6.1 Write property test for Property 1 (location round-trip)
      - **Property 1: Location round-trip through the API**
      - Use `fc.float({ min: -90, max: 90, noNaN: true })` × `fc.float({ min: -180, max: 180, noNaN: true })` → call `createCustomer` service → call `getCustomerById` → assert `latitude` and `longitude` equal the inputs
      - Tag: `// Feature: customer-map-location, Property 1: location round-trip`
      - **Validates: Requirements 1.4, 2.2, 2.3**
    - [x] 6.2 Write property test for Property 2 (location update replaces previous values)
      - **Property 2: Location update replaces previous values**
      - Generate two valid coordinate pairs → create with first → update with second → assert second pair is returned
      - Tag: `// Feature: customer-map-location, Property 2: location update replaces previous values`
      - **Validates: Requirements 1.5, 2.4**
    - [x] 6.3 Write property test for Property 3 (out-of-range latitude rejected)
      - **Property 3: Out-of-range latitude is rejected**
      - Use `fc.oneof(fc.float({ max: -90.001, noNaN: true }), fc.float({ min: 90.001, noNaN: true }))` → call `createCustomerSchema.safeParse` → assert `success === false`
      - Tag: `// Feature: customer-map-location, Property 3: out-of-range latitude rejected`
      - **Validates: Requirements 1.7**
    - [x] 6.4 Write property test for Property 4 (out-of-range longitude rejected)
      - **Property 4: Out-of-range longitude is rejected**
      - Use `fc.oneof(fc.float({ max: -180.001, noNaN: true }), fc.float({ min: 180.001, noNaN: true }))` → call `createCustomerSchema.safeParse` → assert `success === false`
      - Tag: `// Feature: customer-map-location, Property 4: out-of-range longitude rejected`
      - **Validates: Requirements 1.8**
    - [x] 6.5 Write property test for Property 5 (partial coordinate pair rejected)
      - **Property 5: Partial coordinate pair is rejected**
      - Generate a valid latitude with no longitude (and vice versa) → call `createCustomerSchema.safeParse` → assert `success === false`
      - Tag: `// Feature: customer-map-location, Property 5: partial coordinate pair rejected`
      - **Validates: Requirements 1.9**
    - [x] 6.6 Write property test for Property 6 (all customers in list include location fields)
      - **Property 6: All customers in list response include location fields**
      - Generate N customers (mix of with/without location) → call `listCustomers` service → assert every object has both `latitude` and `longitude` keys
      - Tag: `// Feature: customer-map-location, Property 6: all customers in list include location fields`
      - **Validates: Requirements 2.1**
  - _Requirements: 1.4, 1.5, 1.7, 1.8, 1.9, 2.1, 2.3, 2.4_

- [x] 7. API checkpoint — Ensure all tests pass
  - Run `npm test` in `api/` and confirm all property-based tests pass
  - Verify the API server starts without errors: `node server.js` (or `npm run dev`)
  - Ask the user if any questions arise before proceeding to mobile work

- [x] 8. Mobile — Install dependencies and configure `app.json`
  - Run `npx expo install react-native-maps expo-location` in the `mobile/` directory
  - In `mobile/app.json`, add the `expo-location` plugin entry to the `plugins` array:
    ```json
    ["expo-location", {
      "locationWhenInUsePermission": "This app uses your location to record the customer's address."
    }]
    ```
  - Add `"ACCESS_FINE_LOCATION"` to `expo.android.permissions` array (create the array if it does not exist)
  - Add `"NSLocationWhenInUseUsageDescription": "This app uses your location to record the customer's address."` to `expo.ios.infoPlist` (create the object if it does not exist)
  - _Requirements: 6.1, 6.4, 6.5_

- [x] 9. Mobile — TypeScript types update
  - In `mobile/src/services/api/types.ts`, add `latitude: number | null` and `longitude: number | null` to the `Customer` interface (or the equivalent customer type used by the mobile API client)
  - Add `latitude?: number | null` and `longitude?: number | null` to the `CreateCustomerData` interface (or equivalent)
  - _Requirements: 5.1, 5.2_

- [x] 10. Mobile — Zod form schema update
  - In `mobile/src/features/admin/customers/schemas/customerSchema.ts`, add `latitude` and `longitude` fields to the `z.object({...})` inside `createCustomerFormSchema`:
    ```ts
    latitude:  z.coerce.number().min(-90,  t('customers.location.latRange')).max(90,  t('customers.location.latRange')).nullable().optional(),
    longitude: z.coerce.number().min(-180, t('customers.location.lngRange')).max(180, t('customers.location.lngRange')).nullable().optional(),
    ```
  - Append a cross-field `.refine()` after the existing date refines that checks `hasLat === hasLng` (where `hasLat = d.latitude != null && d.latitude !== ''` and similarly for longitude), with `message: t('customers.location.bothOrNeither')` and `path: ['longitude']`
  - _Requirements: 5.3_

- [x] 11. Mobile — `LocationPicker` component
  - Create `mobile/src/features/admin/customers/components/LocationPicker.tsx`
  - Define the props interface: `value: { latitude: number; longitude: number } | null`, `onChange: (coords: { latitude: number; longitude: number } | null) => void`, `disabled?: boolean`
  - Implement internal state: `mapAvailable: boolean` (default `true`), `fetchingLocation: boolean`, `permissionDenied: boolean`, `locationError: string | null`
  - **Map mode** (when `mapAvailable === true`):
    - Render a `<MapView>` from `react-native-maps` with `scrollEnabled={true}`, `zoomEnabled={true}`, fixed `height: 220`
    - When `value` is non-null, render a `<Marker draggable coordinate={value} onDragEnd={(e) => onChange(e.nativeEvent.coordinate)} />`
    - Handle `onPress` on the `MapView` to place/move the pin: `onChange(e.nativeEvent.coordinate)`
    - Handle `onMapLoadError` to set `mapAvailable = false`
    - Render an `AppButton` labeled `t('customers.location.useMyLocation')` below the map; show `ActivityIndicator` and disable it while `fetchingLocation === true`
    - Render a `Pressable` "Clear Location" link (only when `value !== null`) that calls `onChange(null)`
  - **Fallback mode** (when `mapAvailable === false`):
    - Render two `AppTextInput` fields: Latitude (keyboardType `decimal-pad`, placeholder `t('customers.location.latPlaceholder')`) and Longitude (placeholder `t('customers.location.lngPlaceholder')`)
    - Show inline error text when values are out of range (validated on blur)
    - Show `t('customers.location.mapUnavailable')` message above the inputs
    - "Use My Location" button still works in fallback mode
  - **"Use My Location" flow**:
    1. Set `fetchingLocation = true`, disable the button
    2. Call `Location.getForegroundPermissionsAsync()` from `expo-location`
    3. If `status !== 'granted'`, call `Location.requestForegroundPermissionsAsync()`
    4. If still not granted: set `permissionDenied = true`, show inline message with `t('customers.location.permissionDenied')` and a `Pressable` "Open Settings" link that calls `Linking.openSettings()`
    5. If granted: call `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeoutInterval: 10000 })`
    6. On success: call `onChange({ latitude, longitude })`, center map via a `MapView` ref
    7. On error/timeout: set `locationError = t('customers.location.gpsError')`
    8. Always set `fetchingLocation = false` in a `finally` block
  - Use `useThemeColors()` for colors (this component is used only in `CustomerForm` page mode, never inside a `<Modal>`)
  - Use `useTranslation()` for all user-visible strings
  - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15, 3.16, 6.2, 6.3, 6.4, 6.5_

- [x] 12. Mobile — `CustomerLocationMap` component (read-only)
  - Create `mobile/src/features/admin/customers/components/CustomerLocationMap.tsx`
  - Define the props interface: `latitude: number`, `longitude: number`, `customerName?: string`, `style?: ViewStyle`
  - Render a `<Pressable>` wrapping a `<MapView>` with `scrollEnabled={false}`, `zoomEnabled={false}`, fixed `height: 200`, `pointerEvents="none"` on the inner `MapView`
  - Render a single non-draggable `<Marker coordinate={{ latitude, longitude }} />` inside the `MapView`
  - On `Pressable` press, call `Linking.openURL(mapsUrl)` where:
    - iOS: `maps://0,0?q=${latitude},${longitude}` (fall back to `https://maps.apple.com/?q=${latitude},${longitude}` if the URL cannot be opened)
    - Android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(customerName ?? '')})`
    - Wrap in `try/catch` and show a toast error if the URL cannot be opened
  - This component does **not** call `useThemeColors()` — it is Modal-safe; colors are passed via the `style` prop from the parent
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 13. Mobile — `CustomerForm` integration (Location `FormSection`)
  - In `mobile/src/features/admin/customers/components/CustomerForm.tsx`, add `latitude` and `longitude` to the `useForm` `defaultValues`:
    ```ts
    latitude:  item?.latitude  ?? null,
    longitude: item?.longitude ?? null,
    ```
  - Insert a new `<FormSection>` between the "Company" section and the "Subscription" section:
    - `title={t('customers.sections.location')}`, `icon="📍"`, `collapsible`, `defaultCollapsed={!item?.latitude}`, `hasError={!!(errors.latitude || errors.longitude)}`
  - Inside the section, add a `<Controller name="latitude" control={control}>` that renders `<LocationPicker>`:
    - `value` prop: when both `value` (latitude) and `form.getValues('longitude')` are non-null, pass `{ latitude: Number(value), longitude: Number(form.getValues('longitude')) }`, otherwise `null`
    - `onChange` prop: call `onChange(coords?.latitude ?? null)` and `form.setValue('longitude', coords?.longitude ?? null)`
  - In the `doSave` handler, convert form strings to numbers before calling `onSave`:
    ```ts
    const lat = data.latitude  != null && data.latitude  !== '' ? Number(data.latitude)  : null;
    const lng = data.longitude != null && data.longitude !== '' ? Number(data.longitude) : null;
    ```
    Include `latitude: lat` and `longitude: lng` in the `onSave({...})` call
  - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 5.4_

- [x] 14. Mobile — `CustomerDetailScreen` integration (Location map section)
  - In `mobile/src/features/admin/customers/components/CustomerDetailScreen.tsx`, import `CustomerLocationMap`
  - Insert the location section between the contact info card and the subscription card:
    ```tsx
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
  - Add `noLocationCard` and `noLocationText` to the `StyleSheet.create` at the bottom of the file
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 15. Mobile — i18n keys (en.json and ar.json)
  - In `mobile/src/i18n/locales/en.json`, add the following keys under `customers`:
    - Under `customers.sections`: `"location": "Location"`
    - New `customers.location` object:
      ```json
      "location": {
        "title":            "Location",
        "noLocation":       "No location set",
        "useMyLocation":    "Use My Location",
        "clearLocation":    "Clear Location",
        "latitude":         "Latitude",
        "longitude":        "Longitude",
        "latPlaceholder":   "e.g. 24.7136",
        "lngPlaceholder":   "e.g. 46.6753",
        "latRange":         "Latitude must be between -90 and 90",
        "lngRange":         "Longitude must be between -180 and 180",
        "bothOrNeither":    "Both latitude and longitude must be provided together",
        "permissionDenied": "Location permission denied. Open Settings to grant access.",
        "openSettings":     "Open Settings",
        "gpsError":         "Could not get current location. Please try again.",
        "mapUnavailable":   "Map unavailable. Enter coordinates manually.",
        "openInMaps":       "Open in Maps"
      }
      ```
  - Mirror the exact same structure in `mobile/src/i18n/locales/ar.json` with Arabic translations for all keys
  - _Requirements: 5.5_

- [ ] 16. Mobile checkpoint — Verify TypeScript compiles and app runs
  - Run `npx tsc --noEmit` in `mobile/` to confirm zero TypeScript errors across all changed files
  - Verify the app starts without errors: `npx expo start` (run manually in terminal)
  - Ask the user if any questions arise before proceeding to property-based tests

- [ ] 17. Mobile — Install test framework and write property-based tests
  - Install `vitest` and `fast-check` as dev dependencies in `mobile/`: `npm install --save-dev vitest@latest fast-check@latest @testing-library/react-native@latest`
  - Add a `"test": "vitest run"` script to `mobile/package.json`
  - Create `mobile/src/features/admin/customers/__tests__/customerLocation.test.tsx` with the following property-based tests using `fast-check` (minimum 100 runs each):
    - [ ] 17.1 Write property test for Property 7 (location picker initializes from stored coordinates)
      - **Property 7: Location picker initializes from stored coordinates**
      - Use `fc.float({ min: -90, max: 90, noNaN: true })` × `fc.float({ min: -180, max: 180, noNaN: true })` → render `CustomerForm` with `item` having those coordinates → assert `form.getValues('latitude')` and `form.getValues('longitude')` match the input values
      - Tag: `// Feature: customer-map-location, Property 7: location picker initializes from stored coordinates`
      - **Validates: Requirements 3.2**
    - [ ] 17.2 Write property test for Property 8 (map tap/drag updates displayed coordinates)
      - **Property 8: Map tap / drag updates displayed coordinates**
      - Use `fc.float({ min: -90, max: 90, noNaN: true })` × `fc.float({ min: -180, max: 180, noNaN: true })` → render `LocationPicker` with `value={null}` → simulate `onPress` event with the generated coordinate → assert the `onChange` callback was called with the same coordinate
      - Tag: `// Feature: customer-map-location, Property 8: map tap/drag updates displayed coordinates`
      - **Validates: Requirements 3.4, 3.5**
    - [ ] 17.3 Write property test for Property 9 (form serializes coordinates as numbers)
      - **Property 9: Form serializes coordinates as numbers**
      - Use `fc.float({ min: -90, max: 90, noNaN: true })` × `fc.float({ min: -180, max: 180, noNaN: true })` → set latitude and longitude in the form → call `doSave` → assert the `onSave` callback received `latitude` and `longitude` as JavaScript `number` values equal to the inputs
      - Tag: `// Feature: customer-map-location, Property 9: form serializes coordinates as numbers`
      - **Validates: Requirements 5.4**
    - [ ] 17.4 Write property test for Property 10 (detail screen shows map for any customer with location)
      - **Property 10: Detail screen shows map for any customer with location**
      - Use `fc.float({ min: -90, max: 90, noNaN: true })` × `fc.float({ min: -180, max: 180, noNaN: true })` → render `CustomerDetailScreen` with a mock customer having those coordinates → assert `CustomerLocationMap` is rendered (not the "No location set" placeholder)
      - Tag: `// Feature: customer-map-location, Property 10: detail screen shows map for any customer with location`
      - **Validates: Requirements 4.1**
  - _Requirements: 3.2, 3.4, 3.5, 4.1, 5.4_

- [ ] 18. Final checkpoint — Ensure all tests pass
  - Run `npm test` in `api/` and confirm all API property-based tests pass
  - Run `npm test` in `mobile/` and confirm all mobile property-based tests pass
  - Run `npx tsc --noEmit` in `mobile/` to confirm zero TypeScript errors
  - Ensure all tests pass; ask the user if any questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The API tasks (1–7) must be completed before mobile tasks (8–18) because the mobile app depends on the API returning `latitude` and `longitude` fields
- `react-native-maps` and `expo-location` are not yet in `mobile/package.json` — Task 8 installs them
- Neither `api/` nor `mobile/` currently has a test framework — Tasks 6 and 17 install `vitest` + `fast-check`
- `CustomerLocationMap` is intentionally Modal-safe (no `useThemeColors()` hook) — colors are passed via the `style` prop
- `LocationPicker` uses `useThemeColors()` and is only used in `CustomerForm` page mode, never inside a `<Modal>`
- The cross-field Zod rule surfaces as an error on the `longitude` field; the `FormSection` `hasError` prop keeps the Location section open when this error is present
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
