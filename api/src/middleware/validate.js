/**
 * Express middleware factory for Zod schema validation.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const flat = result.error.flatten();
    return res.status(400).json({
      error:   'Validation failed',
      details: flat.fieldErrors,
      // Include cross-field refine() errors when present
      ...(flat.formErrors.length ? { formErrors: flat.formErrors } : {}),
    });
  }
  req[source] = result.data;
  next();
};
