export const customersKeys = {
  all:    ['customers']                    as const,
  detail: (id: string) => ['customers', id] as const,
};
