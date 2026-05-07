/**
 * TicketCard.tsx — re-export shim.
 *
 * The actual implementation lives in TicketCard/index.tsx.
 * This file exists so that imports of `TicketCard` (without /index) resolve correctly.
 */
export { default } from './TicketCard/index';
export type { TicketCardProps } from './TicketCard/index';
