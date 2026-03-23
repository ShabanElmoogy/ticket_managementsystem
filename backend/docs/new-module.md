# How to Add a New Module

Follow these steps every time you add a new feature module (e.g. `invoices`, `reports`, `assets`).

Replace every occurrence of `widget` / `Widget` / `widgets` with your module name.

---

## 1. Create the folder

```
backend/src/modules/widgets/
├── widgets.schema.js
├── widgets.validation.js
├── widgets.controller.js
└── widgets.routes.js
```

---

## 2. Schema — `widgets.schema.js`

Defines the Drizzle ORM table. Always include `id`, `tenantId`, `createdAt`, `updatedAt`.

```js
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

export const widgets = pgTable('widgets', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  description: text('description'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow(),
});
```

> Add more columns as needed (`boolean`, `integer`, `jsonb`, FK references, etc.).

---

## 3. Validation — `widgets.validation.js`

One Zod schema per operation. Use `.optional()` on all fields for update schemas.

```js
import { z } from 'zod';

export const createWidgetSchema = z.object({
  name:        z.string().min(1),
  description: z.string().nullable().optional(),
});

export const updateWidgetSchema = z.object({
  name:        z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});
```

> For query params (GET filters), add a query schema and pass `'query'` as the second arg to `validate()`.
> ```js
> export const widgetQuerySchema = z.object({
>   name: z.string().optional(),
> });
> ```

---

## 4. Controller — `widgets.controller.js`

Use `getTenantScope` for reads (SUPER_ADMIN sees all), `requireTenantScope` for writes (always needs a tenant).

```js
import { db } from '../../config/database.js';
import { widgets } from './widgets.schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';

export const getAll = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const rows = await db
      .select()
      .from(widgets)
      .where(tenantId ? eq(widgets.tenantId, tenantId) : undefined)
      .orderBy(desc(widgets.createdAt));

    res.json(rows);
  } catch (error) { next(error); }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

    const [row] = await db
      .select()
      .from(widgets)
      .where(tenantId ? and(eq(widgets.id, id), eq(widgets.tenantId, tenantId)) : eq(widgets.id, id))
      .limit(1);

    if (!row) return res.status(404).json({ error: 'Widget not found' });
    res.json(row);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const tenantId = requireTenantScope(req);
    const { name, description } = req.body;

    const [row] = await db
      .insert(widgets)
      .values({ tenantId, name, description })
      .returning();

    res.status(201).json(row);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const where = tenantId
      ? and(eq(widgets.id, id), eq(widgets.tenantId, tenantId))
      : eq(widgets.id, id);

    const [existing] = await db.select({ id: widgets.id }).from(widgets).where(where).limit(1);
    if (!existing) return res.status(404).json({ error: 'Widget not found' });

    const [row] = await db
      .update(widgets)
      .set({ ...req.body, updatedAt: new Date() })
      .where(where)
      .returning();

    res.json(row);
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = getTenantScope(req);
    const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
    const where = tenantId
      ? and(eq(widgets.id, id), eq(widgets.tenantId, tenantId))
      : eq(widgets.id, id);

    const [existing] = await db.select({ id: widgets.id }).from(widgets).where(where).limit(1);
    if (!existing) return res.status(404).json({ error: 'Widget not found' });

    await db.delete(widgets).where(where);
    res.json({ message: 'Widget deleted successfully' });
  } catch (error) { next(error); }
};
```

---

## 5. Routes — `widgets.routes.js`

Wire auth middleware, role guards, and `validate()` before each controller.

```js
import express from 'express';
import * as widgetsController from './widgets.controller.js';
import { authenticateToken, requireTenantAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createWidgetSchema, updateWidgetSchema } from './widgets.validation.js';

const router = express.Router();

router.get('/',    authenticateToken,                                                    widgetsController.getAll);
router.get('/:id', authenticateToken,                                                    widgetsController.getById);
router.post('/',   authenticateToken, requireTenantAdmin, validate(createWidgetSchema),  widgetsController.create);
router.put('/:id', authenticateToken, requireTenantAdmin, validate(updateWidgetSchema),  widgetsController.update);
router.delete('/:id', authenticateToken, requireTenantAdmin,                             widgetsController.remove);

export default router;
```

---

## 6. Register in `modules/routes.js`

Add two lines — the import and the `router.use()`:

```js
// existing imports ...
import widgetRoutes from './widgets/widgets.routes.js';   // ← add

// existing router.use() calls ...
router.use('/widgets', widgetRoutes);                     // ← add
```

---

## 7. Add a Drizzle migration

After defining the schema, generate and run the migration:

```bash
# from backend/
npx drizzle-kit generate
node drizzle/migrate.js
```

---

## Role & Auth Reference

| Middleware          | Who passes                        | Use on                        |
|---------------------|-----------------------------------|-------------------------------|
| `authenticateToken` | Any valid JWT                     | All routes                    |
| `requireTenantAdmin`| `TENANT_ADMIN` only               | Create / update / delete      |
| `requireSuperAdmin` | `SUPER_ADMIN` only                | Cross-tenant admin operations |
| `requireAdmin`      | `SUPER_ADMIN` or `TENANT_ADMIN`   | Shared admin operations       |

| Utility                  | Returns                  | Use for                              |
|--------------------------|--------------------------|--------------------------------------|
| `getTenantScope(req)`    | `{ type, tenantId? }`    | Reads — SUPER_ADMIN sees all tenants |
| `requireTenantScope(req)`| `tenantId` string        | Writes — always requires a tenant    |

---

## Validate Reference

```js
validate(schema)            // validates req.body (default)
validate(schema, 'query')   // validates req.query (GET filters)
validate(schema, 'params')  // validates req.params (path variables)
```

On failure returns:
```json
{
  "error": "Validation failed",
  "details": { "fieldName": ["error message"] }
}
```

---

## Checklist

- [ ] `widgets.schema.js` — table with `id`, `tenantId`, `createdAt`, `updatedAt`
- [ ] `widgets.validation.js` — create / update (/ query) Zod schemas
- [ ] `widgets.controller.js` — getAll, getById, create, update, remove
- [ ] `widgets.routes.js` — auth + role guards + `validate()` on every write route
- [ ] `modules/routes.js` — import + `router.use()`
- [ ] Drizzle migration generated and applied
