/**
 * reminders.schema.js
 *
 * The reminders module does not own its own tables.
 * It reads and writes fields on existing tables owned by other modules:
 *
 *   users.reminderEnabled      — whether reminders are active for the user
 *   users.reminderInterval     — how often (minutes) to remind
 *   tenants.escalationIntervalMinutes — priority escalation cadence
 *   tenants.slaUrgentHours / slaHighHours / slaMediumHours / slaLowHours
 *   tenants.epicAutoClose      — auto-complete epics when all features shipped
 *   tenants.dateFormat         — display date format token (date-fns)
 *
 * This file re-exports those tables so the rest of the reminders module
 * has a single, consistent import point rather than reaching across
 * module boundaries.
 */

export { users } from '../users/users.schema.js';
export { tickets } from '../tickets/tickets.schema.js';
export { tenants } from '../tenants/tenants.schema.js';
export { customers } from '../customers/customers.schema.js';
export { applications } from '../applications/applications.schema.js';
