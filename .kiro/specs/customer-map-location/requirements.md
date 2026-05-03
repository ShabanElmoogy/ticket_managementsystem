# Requirements Document

## Introduction

This feature adds geographic location support to the customer entity in the ticket management system. Each customer can have a latitude/longitude coordinate pair stored in the database. The mobile app gains two new capabilities: a map-based location picker in the customer form (so operators can pin a customer's location on a map), and a map view in the customer detail screen (so operators can see where a customer is located). The API backend must persist and expose the new coordinate fields. No changes are required to the web frontend.

## Glossary

- **Customer**: An entity stored in the `customers` table, identified by a UUID, scoped to a tenant.
- **Location**: A geographic point represented by a decimal latitude and a decimal longitude.
- **Latitude**: A decimal number in the range −90 to +90 representing north/south position.
- **Longitude**: A decimal number in the range −180 to +180 representing east/west position.
- **Location_Picker**: The interactive map component in the mobile customer form that allows an operator to select a geographic point by tapping or dragging a pin.
- **Location_Map**: The read-only map component in the mobile customer detail screen that displays the customer's stored geographic point.
- **Current_Location**: The device's GPS-determined geographic position obtained via the Expo Location API.
- **API**: The Node.js/Express backend service.
- **Mobile_App**: The React Native (Expo) mobile application.
- **Operator**: An authenticated user of the Mobile_App with at least EMPLOYEE role.
- **Tenant**: The organisational unit that scopes all customer data.

---

## Requirements

### Requirement 1: Store Customer Location in the Database

**User Story:** As a system administrator, I want latitude and longitude to be stored for each customer, so that location data is persisted and available to all clients.

#### Acceptance Criteria

1. THE API SHALL add a `latitude` column of type `double precision` (nullable) to the `customers` table via a Drizzle ORM schema change and a generated migration.
2. THE API SHALL add a `longitude` column of type `double precision` (nullable) to the `customers` table via a Drizzle ORM schema change and a generated migration.
3. WHEN a customer record is created without location data, THE API SHALL store `null` for both `latitude` and `longitude`.
4. WHEN a customer record is created with location data, THE API SHALL store the provided `latitude` and `longitude` values.
5. WHEN a customer record is updated with location data, THE API SHALL replace the stored `latitude` and `longitude` with the provided values.
6. WHEN a customer record is updated with `null` location data, THE API SHALL store `null` for both `latitude` and `longitude`, clearing any previously stored location.
7. IF a `latitude` value outside the range −90 to +90 is provided, THEN THE API SHALL return HTTP 400 with a descriptive validation error.
8. IF a `longitude` value outside the range −180 to +180 is provided, THEN THE API SHALL return HTTP 400 with a descriptive validation error.
9. IF only one of `latitude` or `longitude` is provided (without the other), THEN THE API SHALL return HTTP 400 with a descriptive validation error.

---

### Requirement 2: Expose Location Fields in the API

**User Story:** As a mobile app developer, I want the customer API endpoints to include latitude and longitude in their responses, so that the mobile app can display and update location data.

#### Acceptance Criteria

1. WHEN the `GET /api/v1/customers` endpoint returns a customer list, THE API SHALL include `latitude` and `longitude` fields in each customer object (values may be `null`).
2. WHEN the `GET /api/v1/customers/:id` endpoint returns a customer, THE API SHALL include `latitude` and `longitude` fields in the response (values may be `null`).
3. WHEN the `POST /api/v1/customers` endpoint receives a request body containing `latitude` and `longitude`, THE API SHALL persist and return those values in the response.
4. WHEN the `PUT /api/v1/customers/:id` endpoint receives a request body containing `latitude` and `longitude`, THE API SHALL update and return those values in the response.
5. THE API SHALL accept `latitude` and `longitude` as optional fields in both the create and update Zod validation schemas.
6. THE API SHALL include `latitude` and `longitude` in the Swagger documentation for the customer create and update request bodies and all customer response schemas.

---

### Requirement 3: Location Picker in the Mobile Customer Form

**User Story:** As an operator, I want to pick a customer's location on a map when creating or editing a customer, so that I can accurately record where the customer is located.

#### Acceptance Criteria

1. WHEN the customer form is opened in create mode, THE Mobile_App SHALL display a "Location" section in the form that contains a map picker control.
2. WHEN the customer form is opened in edit mode and the customer has a stored location, THE Mobile_App SHALL display the Location_Picker with a pin placed at the stored coordinates.
3. WHEN the customer form is opened in edit mode and the customer has no stored location, THE Mobile_App SHALL display the Location_Picker with no pin placed.
4. WHEN an Operator taps a point on the Location_Picker map, THE Mobile_App SHALL place a draggable pin at the tapped coordinates and display the resulting latitude and longitude values.
5. WHEN an Operator drags the pin on the Location_Picker, THE Mobile_App SHALL update the displayed latitude and longitude values in real time.
6. WHEN an Operator taps a "Clear Location" control, THE Mobile_App SHALL remove the pin and set the location fields to `null`.
7. WHEN the customer form is submitted with a pin placed on the Location_Picker, THE Mobile_App SHALL include the selected `latitude` and `longitude` in the API request payload.
8. WHEN the customer form is submitted without a pin placed on the Location_Picker, THE Mobile_App SHALL send `null` for both `latitude` and `longitude` in the API request payload.
9. THE Mobile_App SHALL implement the Location_Picker using `react-native-maps` (already available in the Expo ecosystem) without introducing additional map library dependencies.
10. WHERE the device does not have network access to load map tiles, THE Mobile_App SHALL display a fallback message indicating that the map is unavailable and SHALL allow the Operator to enter latitude and longitude as numeric text inputs.
11. THE Mobile_App SHALL display a "Use My Location" button inside the Location_Picker section.
12. WHEN an Operator taps the "Use My Location" button, THE Mobile_App SHALL request foreground location permission from the device using `expo-location`.
13. WHEN foreground location permission is granted, THE Mobile_App SHALL obtain the device's current GPS coordinates and place the pin at those coordinates, centering the map on that position.
14. WHEN foreground location permission is denied, THE Mobile_App SHALL display an inline message explaining that location permission is required and SHALL NOT place a pin.
15. WHEN the device GPS is unavailable or times out, THE Mobile_App SHALL display an inline error message and SHALL NOT place a pin.
16. WHILE the device location is being fetched, THE Mobile_App SHALL show a loading indicator on the "Use My Location" button and disable it to prevent duplicate requests.

---

### Requirement 4: Location Map in the Mobile Customer Detail Screen

**User Story:** As an operator, I want to see a customer's location on a map in the customer detail screen, so that I can quickly understand where the customer is situated.

#### Acceptance Criteria

1. WHEN the customer detail screen is opened and the customer has a stored location, THE Mobile_App SHALL display a Location_Map showing the customer's coordinates with a non-interactive pin.
2. WHEN the customer detail screen is opened and the customer has no stored location, THE Mobile_App SHALL display a placeholder message (e.g. "No location set") instead of the Location_Map.
3. THE Mobile_App SHALL render the Location_Map as a non-interactive view (panning and zooming disabled) with a fixed height of 200 dp.
4. WHEN the Location_Map is tapped, THE Mobile_App SHALL open the device's default maps application (e.g. Google Maps or Apple Maps) centred on the customer's coordinates.
5. THE Mobile_App SHALL position the Location_Map section below the contact information card and above the subscription card in the customer detail screen layout.

---

### Requirement 5: Location Data in the Mobile Customer Schema and API Client

**User Story:** As a mobile developer, I want the TypeScript types and API client to include location fields, so that the compiler enforces correct usage throughout the mobile app.

#### Acceptance Criteria

1. THE Mobile_App SHALL add `latitude: number | null` and `longitude: number | null` fields to the `Customer` TypeScript type in `mobile/src/services/api/types`.
2. THE Mobile_App SHALL add `latitude?: number | null` and `longitude?: number | null` fields to the `CreateCustomerData` TypeScript type.
3. THE Mobile_App SHALL add `latitude` and `longitude` as optional nullable fields to the customer Zod form schema in `mobile/src/features/admin/customers/schemas/customerSchema.ts`.
4. WHEN the customer form hook serialises form values for the API payload, THE Mobile_App SHALL convert the latitude and longitude form values to `number | null` (not strings) before sending.
5. THE Mobile_App SHALL add `latitude` and `longitude` to the `en.json` and `ar.json` locale files under the `customers` namespace.

---

### Requirement 6: Device Location Permission Handling

**User Story:** As an operator, I want the app to handle location permission gracefully, so that I understand why location access is needed and can choose to grant or deny it.

#### Acceptance Criteria

1. THE Mobile_App SHALL declare the `ACCESS_FINE_LOCATION` permission in `app.json` (Android) and the `NSLocationWhenInUseUsageDescription` key in the iOS plist (via Expo config) before requesting location access.
2. WHEN the Operator taps "Use My Location" for the first time, THE Mobile_App SHALL present the system permission dialog with a clear usage description explaining that location is used to record the customer's address.
3. WHEN the Operator has previously denied location permission, THE Mobile_App SHALL display an inline message with a link to the device Settings app so the Operator can manually grant permission.
4. THE Mobile_App SHALL request only foreground (`whenInUse`) location permission — background location SHALL NOT be requested.
5. THE Mobile_App SHALL use `expo-location` (already in the Expo ecosystem) for all location and permission APIs — no additional native location libraries shall be introduced.
