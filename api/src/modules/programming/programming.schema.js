/**
 * programming.schema.js
 *
 * The programming module does not own its own tables — programmingDetails
 * is defined in tickets/tickets.schema.js as a one-to-one extension of the
 * tickets table (ticketId FK with onDelete: cascade).
 *
 * This file re-exports the relevant tables so the rest of the programming
 * module has a single, consistent import point.
 */

export { programmingDetails } from '../tickets/tickets.schema.js';
