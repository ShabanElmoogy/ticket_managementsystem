/**
 * controllerHelpers.js — shared utilities for service layers.
 *
 * Note: `handleError` lives in `api/src/errors/index.js` — import from there.
 */

// ── Error factory ─────────────────────────────────────────────────────────────

/**
 * Create an error with an HTTP status attached.
 * Used by service functions to signal HTTP-aware errors to controllers.
 *
 * @param {string} message
 * @param {number} [status=400]
 * @returns {Error}
 *
 * @example
 * throw fail('Customer not found', 404);
 * throw fail('Seat limit reached', 403);
 */
export function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── FK existence check ────────────────────────────────────────────────────────

/**
 * Verify a foreign key exists by calling a finder function.
 * Throws a 404 error if the record is not found.
 *
 * Use this in service functions before insert/update to validate FK references.
 *
 * @param {Function} finderFn   — async function that returns the record or null/undefined
 * @param {string}   entityName — human-readable name for the error message (e.g. 'Customer')
 * @param {...any}   args       — arguments forwarded to finderFn
 * @returns {Promise<any>}      — the found record
 *
 * @example
 * // Validate customerId before creating a ticket
 * const customer = await requireEntity(findCustomerById, 'Customer', customerId);
 *
 * // Validate with tenant scope
 * const app = await requireEntity(findApplicationInTenant, 'Application', appId, tenantId);
 *
 * // Replaces the common pattern:
 * //   const customer = await findCustomerById(customerId);
 * //   if (!customer) throw fail('Customer not found', 404);
 */
export async function requireEntity(finderFn, entityName, ...args) {
  const record = await finderFn(...args);
  if (!record) throw fail(`${entityName} not found`, 404);
  return record;
}

/**
 * Validate multiple FK references in parallel.
 * Throws a 404 error for the first missing entity.
 *
 * @param {Array<{ finderFn: Function, entityName: string, args?: any[] }>} checks
 * @returns {Promise<any[]>} — array of found records in the same order
 *
 * @example
 * // Before creating a ticket, validate both customer and application exist
 * const [customer, application] = await requireEntities([
 *   { finderFn: findCustomerById,    entityName: 'Customer',    args: [customerId] },
 *   { finderFn: findApplicationById, entityName: 'Application', args: [appId]      },
 * ]);
 *
 * // With tenant scope
 * const [customer, app] = await requireEntities([
 *   { finderFn: findCustomerInTenant,    entityName: 'Customer',    args: [customerId, tenantId] },
 *   { finderFn: findApplicationInTenant, entityName: 'Application', args: [appId, tenantId]      },
 * ]);
 */
export async function requireEntities(checks) {
  return Promise.all(
    checks.map(({ finderFn, entityName, args = [] }) =>
      requireEntity(finderFn, entityName, ...args)
    )
  );
}
