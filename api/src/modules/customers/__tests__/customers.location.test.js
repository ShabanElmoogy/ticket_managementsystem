/**
 * Property-based tests for customer location feature.
 * Feature: customer-map-location
 *
 * Properties 1, 2, 6 test service-level behavior — repository is mocked.
 * Properties 3, 4, 5 test Zod validation only — no mocking needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ── Mock the repository before importing the service ─────────────────────────
vi.mock('../customers.repository.js', () => ({
  findCustomerByEmail:    vi.fn(),
  insertCustomer:         vi.fn(),
  findCustomerApplications: vi.fn(),
  findCustomerById:       vi.fn(),
  updateCustomerById:     vi.fn(),
  findAllCustomers:       vi.fn(),
  getBatchCustomerDetails: vi.fn(),
  countAllCustomers:      vi.fn(),
  insertAssignment:       vi.fn(),
  deleteCustomerAssignments: vi.fn(),
}));

import * as repo from '../customers.repository.js';
import { createCustomer, updateCustomer, listCustomers } from '../customers.service.js';
import { createCustomerSchema } from '../customers.validation.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal customer DB row with the given lat/lng. */
function makeCustomerRow({ id = 'test-id', lat, lng } = {}) {
  return {
    id,
    tenantId: 'tenant-id',
    name: 'Test Customer',
    email: 'test@test.com',
    phone: null,
    address: null,
    company: null,
    latitude: lat ?? null,
    longitude: lng ?? null,
    maintenanceType: null,
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Reset mocks before each test ──────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 1: Location round-trip through the API
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 1: location round-trip', () => {
  // Feature: customer-map-location, Property 1: location round-trip
  it('createCustomer returns the same latitude and longitude that were passed in', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true }),
        async (lat, lng) => {
          const row = makeCustomerRow({ lat, lng });

          vi.mocked(repo.findCustomerByEmail).mockResolvedValue(null);
          vi.mocked(repo.insertCustomer).mockResolvedValue(row);
          vi.mocked(repo.findCustomerApplications).mockResolvedValue([]);

          const result = await createCustomer('tenant-id', {
            name: 'Test',
            email: 'test@test.com',
            latitude: lat,
            longitude: lng,
          });

          expect(result.latitude).toBe(lat);
          expect(result.longitude).toBe(lng);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 2: Location update replaces previous values
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 2: location update replaces previous values', () => {
  // Feature: customer-map-location, Property 2: location update replaces previous values
  it('updateCustomer returns the new latitude and longitude, not the old ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true }),
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true }),
        async (lat1, lng1, lat2, lng2) => {
          const existingRow = makeCustomerRow({ id: 'cust-1', lat: lat1, lng: lng1 });
          const updatedRow  = makeCustomerRow({ id: 'cust-1', lat: lat2, lng: lng2 });

          vi.mocked(repo.findCustomerById).mockResolvedValue(existingRow);
          vi.mocked(repo.updateCustomerById).mockResolvedValue(updatedRow);
          vi.mocked(repo.findCustomerApplications).mockResolvedValue([]);

          const result = await updateCustomer('cust-1', 'tenant-id', {
            latitude: lat2,
            longitude: lng2,
          });

          expect(result.latitude).toBe(lat2);
          expect(result.longitude).toBe(lng2);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 3: Out-of-range latitude is rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 3: out-of-range latitude rejected', () => {
  // Feature: customer-map-location, Property 3: out-of-range latitude rejected
  it('createCustomerSchema rejects latitude values outside [-90, 90]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.float({ max: Math.fround(-90.001), noNaN: true }),
          fc.float({ min: Math.fround(90.001), noNaN: true }),
        ),
        (lat) => {
          const result = createCustomerSchema.safeParse({
            name: 'Test',
            email: 'test@test.com',
            latitude: lat,
            longitude: 0,
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 4: Out-of-range longitude is rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 4: out-of-range longitude rejected', () => {
  // Feature: customer-map-location, Property 4: out-of-range longitude rejected
  it('createCustomerSchema rejects longitude values outside [-180, 180]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.float({ max: Math.fround(-180.001), noNaN: true }),
          fc.float({ min: Math.fround(180.001), noNaN: true }),
        ),
        (lng) => {
          const result = createCustomerSchema.safeParse({
            name: 'Test',
            email: 'test@test.com',
            latitude: 0,
            longitude: lng,
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 5: Partial coordinate pair is rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 5: partial coordinate pair rejected', () => {
  // Feature: customer-map-location, Property 5: partial coordinate pair rejected
  it('createCustomerSchema rejects a payload with latitude but no longitude', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -90, max: 90, noNaN: true }),
        (lat) => {
          const result = createCustomerSchema.safeParse({
            name: 'Test',
            email: 'test@test.com',
            latitude: lat,
            // longitude intentionally omitted
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('createCustomerSchema rejects a payload with longitude but no latitude', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -180, max: 180, noNaN: true }),
        (lng) => {
          const result = createCustomerSchema.safeParse({
            name: 'Test',
            email: 'test@test.com',
            longitude: lng,
            // latitude intentionally omitted
          });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 6: All customers in list response include location fields
// ─────────────────────────────────────────────────────────────────────────────
describe('Property 6: all customers in list include location fields', () => {
  // Feature: customer-map-location, Property 6: all customers in list include location fields
  it('every customer object returned by listCustomers has latitude and longitude keys', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            lat: fc.float({ min: -90, max: 90, noNaN: true }),
            lng: fc.float({ min: -180, max: 180, noNaN: true }),
            withLocation: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async (entries) => {
          const customerRows = entries.map((entry, i) =>
            makeCustomerRow({
              id: `cust-${i}`,
              lat: entry.withLocation ? entry.lat : null,
              lng: entry.withLocation ? entry.lng : null,
            }),
          );

          // Build a details map keyed by customer id
          const detailsMap = {};
          for (const row of customerRows) {
            detailsMap[row.id] = { applications: [], ticketCount: 0 };
          }

          vi.mocked(repo.findAllCustomers).mockResolvedValue(customerRows);
          vi.mocked(repo.getBatchCustomerDetails).mockResolvedValue(detailsMap);
          vi.mocked(repo.countAllCustomers).mockResolvedValue(customerRows.length);

          const result = await listCustomers(null, {});

          // result is an array (no pagination params passed)
          expect(Array.isArray(result)).toBe(true);
          for (const customer of result) {
            expect(customer).toHaveProperty('latitude');
            expect(customer).toHaveProperty('longitude');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
