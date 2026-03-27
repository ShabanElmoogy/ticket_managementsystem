/**
 * Single source of truth for all role strings in the frontend.
 * Import from here — never use raw string literals for roles.
 */

export const Role = {
  SUPER_ADMIN:  'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  EMPLOYEE:     'EMPLOYEE',
  PROGRAMMER:   'PROGRAMMER',
} as const;

export type UserRole = typeof Role[keyof typeof Role];

/**
 * Roles scoped to a single tenant (cannot manage tenants).
 * SUPER_ADMIN is intentionally excluded — it manages tenants & tenant users only.
 */
export const TENANT_SCOPED_ROLES: UserRole[] = [Role.TENANT_ADMIN, Role.EMPLOYEE, Role.PROGRAMMER];

/** Returns true if the role is TENANT_ADMIN. */
export const isTenantAdmin = (role?: string | null): role is typeof Role.TENANT_ADMIN =>
  role === Role.TENANT_ADMIN;

/** Returns true if the role is SUPER_ADMIN. */
export const isSuperAdmin = (role?: string | null): role is typeof Role.SUPER_ADMIN =>
  role === Role.SUPER_ADMIN;

/** Returns true if the role is PROGRAMMER. */
export const isProgrammerRole = (role?: string | null): role is typeof Role.PROGRAMMER =>
  role === Role.PROGRAMMER;
