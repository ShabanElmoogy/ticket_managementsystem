export const docsKeys = {
  all:    ['docs']                       as const,
  tree:   ['docs', 'tree']               as const,
  detail: (id: string) => ['docs', id]   as const,
};
