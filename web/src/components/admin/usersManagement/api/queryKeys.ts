export const usersKeys = {
  all:    ['users']                                          as const,
  tenant: ['users', 'tenant']                               as const,
  detail: (id: string) => ['users', id]                     as const,
  tenantScoped: (slug: string) => ['users', 'tenant', slug] as const,
};
