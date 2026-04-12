export const tasksKeys = {
  all:    ['tasks']                      as const,
  detail: (id: string) => ['tasks', id]  as const,
};
