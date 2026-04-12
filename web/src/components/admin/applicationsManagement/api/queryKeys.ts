export const applicationsKeys = {
  all:    ['applications']                       as const,
  detail: (id: string) => ['applications', id]   as const,
};
