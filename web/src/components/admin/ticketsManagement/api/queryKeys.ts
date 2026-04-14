export const ticketsKeys = {
  all:    ['admin-tickets']                       as const,
  detail: (id: string) => ['admin-tickets', id]   as const,
};
