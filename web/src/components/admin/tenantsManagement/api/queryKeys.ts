export const tenantsKeys = {
  all:    ['tenants']                      as const,
  detail: (id: string) => ['tenants', id]  as const,
};
