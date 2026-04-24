/**
 * constants/index.js
 * Barrel export for all application constants.
 *
 * Role strings are the only constants defined here — they have no Drizzle or
 * Zod equivalent at the module level and are imported in 8+ files.
 *
 * Ticket status / priority strings are enforced by:
 *   - Drizzle enums  → tickets.schema.js  (ticketStatusEnum, ticketPriorityEnum)
 *   - Zod enums      → tickets.validation.js
 *
 * Notification type strings are socket payload values enforced by the
 * frontend ActivityFeed handler — no backend constant needed.
 */

export { Role, TENANT_SCOPED_ROLES, ADMIN_ROLES } from './roles.js';
