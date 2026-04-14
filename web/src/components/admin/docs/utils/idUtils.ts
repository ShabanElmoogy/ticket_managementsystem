/** Generate a short random ID suitable for block/node identifiers. */
export const newId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
