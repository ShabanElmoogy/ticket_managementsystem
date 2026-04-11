# Module Structure Rule

When building a new module, follow the exact pattern used by `api/src/modules/comments/`.

## File Structure

Every module lives in `api/src/modules/<moduleName>/` and contains exactly 4 files:

```
<moduleName>.controller.js
<moduleName>.routes.js
<moduleName>.schema.js
<moduleName>.validation.js
```

---

## schema.js

- Use `drizzle-orm/pg-core` primitives: `pgTable`, `uuid`, `text`, `timestamp`, etc.
- Primary key: `uuid('id').primaryKey().defaultRandom()`
- Always include `createdAt` and `updatedAt` as `timestamp().defaultNow()`
- Foreign keys use `.references(() => otherTable.id, { onDelete: 'cascade' })` where appropriate
- Export the table as a named const
- Register the export in `api/src/modules/schema.js`

```js
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tickets } from '../tickets/tickets.schema.js';
import { users } from '../users/users.schema.js';

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
});
```

---

## validation.js

- Use `zod` for all input validation schemas
- Export one schema per operation (e.g. `createXSchema`, `updateXSchema`)
- Keep schemas minimal — only validate what the body sends

```js
import { z } from 'zod';

export const createItemSchema = z.object({
  content: z.string().min(1),
});
```

---

## controller.js

- All handlers are named async exports (no default export)
- Always wrap in try/catch; on error return `res.status(500).json({ error: 'Internal server error' })`
- Tenant scoping: check `req.user.role` against `['TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER']` to derive `tenantId`
- If tenant-scoped role has no `tenantId`, return `403`
- Validate resource ownership/access before mutating
- **Fire-and-forget pattern for notifications and activity logging**: respond to the client first (`res.status(201).json(...)`), then run side effects (notifications, `logActivity`) inside an async IIFE to avoid blocking the response
- Use `req.emitNotification(userId, payload)` for real-time notifications
- Notification payload shape: `{ type: 'ACTION_NAME', data: { ... } }`
- Broadcast to all tenant users when tenant-scoped; use `req.emitNotification('broadcast', payload)` otherwise

```js
import { db } from '../../config/database.js';
import { items } from './items.schema.js';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '../../utils/activityUtils.js';

export const createItem = async (req, res) => {
  try {
    // 1. Validate input
    // 2. Derive tenant scope
    // 3. Verify parent resource exists and is accessible
    // 4. Insert record
    // 5. Respond immediately
    res.status(201).json(result);

    // 6. Side effects (notifications, activity log) — fire and forget
    (async () => {
      try {
        await logActivity({ ... });
        req.emitNotification(userId, { type: 'ITEM_CREATED', data: { ... } });
      } catch (e) {
        console.error('Notification error:', e);
      }
    })();
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

## routes.js

- Use `express.Router()`
- Import controller with `import * as controller from './module.controller.js'`
- Apply `authenticateToken` to all routes
- Apply `validate(schema)` middleware for routes with a request body
- Add JSDoc `@swagger` comments for each route using `$ref` to shared components where possible
- Default export the router

```js
import express from 'express';
import * as itemsController from './items.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createItemSchema } from './items.validation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Item management
 */

router.post('/:id/items', authenticateToken, validate(createItemSchema), itemsController.createItem);
router.delete('/:id/items/:itemId', authenticateToken, itemsController.deleteItem);

export default router;
```

---

## Registration

After creating the module:
1. Add `export * from './<moduleName>/<moduleName>.schema.js';` to `api/src/modules/schema.js`
2. Mount the router in the main app bootstrap/routes file
