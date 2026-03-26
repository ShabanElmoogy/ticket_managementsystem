import { useTenantSuspended } from '../../stores';

/**
 * Single source of truth for "readonly due to suspended tenant".
 * Reads directly from the auth store — no React context needed.
 * Import useAdminReadonly anywhere in the app to get the suspended flag.
 */
export const useAdminReadonly = () => useTenantSuspended();
