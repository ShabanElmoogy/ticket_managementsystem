/**
 * User role constants — single source of truth for all role strings.
 * Import from here instead of writing literal strings anywhere in the codebase.
 */
export const Role = Object.freeze({
  SUPER_ADMIN:  'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  EMPLOYEE:     'EMPLOYEE',
  PROGRAMMER:   'PROGRAMMER',
});

/** Roles that are always scoped to a single tenant. */
export const TENANT_SCOPED_ROLES = Object.freeze([Role.TENANT_ADMIN, Role.EMPLOYEE, Role.PROGRAMMER]);

/** Roles with admin-level access. */
export const ADMIN_ROLES = Object.freeze([Role.SUPER_ADMIN, Role.TENANT_ADMIN]);
