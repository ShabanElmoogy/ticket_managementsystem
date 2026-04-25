# Advanced Module Pattern — 5-Layer Architecture

Reference implementation: `api/src/modules/users/`

Used when a module has complex business logic, role-based access, or related-data counts that
justify separating the data layer from the business layer.

---

## When to Use This Pattern

| Pattern | Files | Use when |
|---|---|---|
| Basic (4-file) | schema, validation, controller, routes | Simple CRUD, no complex rules |
| **Advanced (5-file)** | schema, validation, **repository**, **service**, controller, routes | Role-scoped access, seat limits, cascading deletes, batch counts, password hashing |

---

## File Structure

```
modules/<name>/
├── <name>.schema.js       — Drizzle table + enum definitions
├── <name>.validation.js   — Zod schemas (one per operation)
├── <name>.repository.js   — All DB queries, no business logic
├── <name>.service.js      — Business logic, orchestrates repository calls
├── <name>.controller.js   — HTTP layer only, calls service
└── <name>.routes.js       — Express router + middleware + Swagger docs
```

---

## Layer Responsibilities

### `schema.js` — Data shape

- Drizzle table definition + any `pgEnum` values
- Foreign keys with `{ onDelete: 'cascade' }` where appropriate
- Always include `id`, `createdAt`, `updatedAt`
- Export the table and any enums

```js
import { pgTable, text, timestamp, pgEnum, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { tenants } from '../tenants/tenants.schema.js';

export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'TENANT_ADMIN', 'EMPLOYEE', 'PROGRAMMER']);

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tenantId:  uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email:     text('email').notNull(),
  name:      text('name').notNull(),
  password:  text('password').notNull(),
  role:      userRoleEnum('role').notNull().default('EMPLOYEE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

---

### `validation.js` — Input contracts

- One Zod schema per operation (`createXSchema`, `updateXSchema`, `updateOwnXSchema`)
- `update` schemas use `.optional()` on every field — only validate what's present
- Password on update: allow empty string (= no change), validate min length only when non-empty
- Import enums from `constants/` not from schema to avoid circular deps

```js
import { z } from 'zod';
import { Role } from '../../constants/roles.js';

const userRole = z.enum(Object.values(Role));

export const createUserSchema = z.object({
  email:    z.string().email(),
  name:     z.string().min(1),
  password: z.string().min(6),
  role:     userRole.optional(),
  phone:    z.string().optional(),
});

export const updateUserSchema = z.object({
  email:    z.string().email().optional(),
  name:     z.string().min(1).optional(),
  // Empty string = "no change" — only validate min(6) when a non-empty value is provided
  password: z.string().refine((v) => !v || v.length >= 6, {
    message: 'Password must be at least 6 characters',
  }).optional(),
  role:     userRole.optional(),
  phone:    z.string().nullable().optional(),
});

export const updateOwnProfileSchema = z.object({
  name:  z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
});
```

---

### `repository.js` — Data access only

**Rules:**
- No business logic — only queries
- Never throw HTTP errors — return `null` / empty array for not-found
- Define a `COLUMNS` constant to exclude sensitive fields (e.g. `password`) from all responses
- Batch count queries to avoid N+1 — use `inArray` + `groupBy` for list endpoints
- Transactions for cascading deletes

```js
import { db } from '../../config/database.js';
import { users } from './users.schema.js';
import { eq, count, and, inArray } from 'drizzle-orm';

// ── Shared column selection — never return password ───────────────────────────

const USER_COLUMNS = {
  id:        users.id,
  email:     users.email,
  name:      users.name,
  role:      users.role,
  createdAt: users.createdAt,
};

// ── Batch counts — avoids N+1 on list endpoints ───────────────────────────────

export async function getBatchUserCounts(userIds) {
  if (!userIds.length) return {};

  const [assignedRows, createdRows] = await Promise.all([
    db.select({ userId: tickets.assignedToId, count: count() })
      .from(tickets)
      .where(inArray(tickets.assignedToId, userIds))
      .groupBy(tickets.assignedToId),
    db.select({ userId: tickets.createdById, count: count() })
      .from(tickets)
      .where(inArray(tickets.createdById, userIds))
      .groupBy(tickets.createdById),
  ]);

  const result = {};
  for (const id of userIds) {
    result[id] = {
      assignedTickets: Number(assignedRows.find((r) => r.userId === id)?.count ?? 0),
      createdTickets:  Number(createdRows.find((r)  => r.userId === id)?.count ?? 0),
    };
  }
  return result;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findUserById(id) {
  const rows = await db
    .select(USER_COLUMNS)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;   // ← return null, never throw
}

export async function findUserByEmailInTenant(email, tenantId) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertUser(values) {
  const [user] = await db
    .insert(users)
    .values(values)
    .returning(USER_COLUMNS);   // ← never return password
  return user;
}

export async function updateUserById(id, data) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(USER_COLUMNS);
  return user;
}

// ── Cascading delete — use a transaction ─────────────────────────────────────

export async function forceDeleteUser(id) {
  await db.transaction(async (tx) => {
    // 1. Delete dependent rows first (activities, comments)
    await tx.delete(ticketActivities).where(eq(ticketActivities.userId, id));
    await tx.delete(comments).where(eq(comments.userId, id));

    // 2. Unassign (don't delete) tickets assigned to this user
    await tx.update(tickets).set({ assignedToId: null }).where(eq(tickets.assignedToId, id));

    // 3. Delete tickets created by this user (and their children)
    const created = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.createdById, id));
    if (created.length > 0) {
      const ids = created.map((t) => t.id);
      await tx.delete(comments).where(inArray(comments.ticketId, ids));
      await tx.delete(ticketActivities).where(inArray(ticketActivities.ticketId, ids));
      await tx.delete(tickets).where(inArray(tickets.id, ids));
    }

    // 4. Delete the user last
    await tx.delete(users).where(eq(users.id, id));
  });
}
```

---

### `service.js` — Business logic

**Rules:**
- Import only from `repository.js` — never call `db` directly
- Throw errors with `.status` attached for HTTP-aware error handling in the controller
- Hash passwords here, never in the controller or repository
- Attach `_count` to responses using a helper — keeps the shape consistent
- Separate functions for super-admin vs tenant-admin operations

```js
import bcrypt from 'bcryptjs';
import * as repo from './users.repository.js';

// ── Error helper ──────────────────────────────────────────────────────────────

// Attach HTTP status to errors so the controller can forward them
function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

// ── Response shaping ──────────────────────────────────────────────────────────

function attachCounts(user, counts) {
  return { ...user, _count: counts };
}

// ── Business rules ────────────────────────────────────────────────────────────

export async function createTenantUser(tenantId, { email, name, password, role = 'EMPLOYEE', phone }) {
  if (!email || !name || !password) throw fail('Email, name, and password are required');
  if (role === 'SUPER_ADMIN')       throw fail('Not allowed to create SUPER_ADMIN', 403);

  // Enforce seat limit
  const seats = await repo.findTenantSeats(tenantId);
  if (seats > 0) {
    const used = await repo.countUsersInTenant(tenantId);
    if (used >= seats) throw fail(`Seat limit reached. Your plan allows ${seats} user(s).`, 403);
  }

  const duplicate = await repo.findUserByEmailInTenant(email, tenantId);
  if (duplicate) throw fail('User with this email already exists');

  const hashed = await bcrypt.hash(password, 10);
  return repo.insertUser({ tenantId, email, name, password: hashed, role, phone });
}

export async function deleteUser(id, force = false) {
  const existing = await repo.findUserById(id);
  if (!existing) throw fail('User not found', 404);

  const counts     = await repo.getUserCounts(id);
  const hasRelated = counts.assignedTickets > 0 || counts.createdTickets > 0 || counts.comments > 0;

  if (!force && hasRelated) {
    throw fail('Cannot delete user with associated data. Use ?force=true to cascade.', 400);
  }

  if (force) {
    await repo.forceDeleteUser(id);
    return { message: 'User and related data deleted successfully' };
  }

  await repo.deleteUserById(id);
  return { message: 'User deleted successfully' };
}
```

---

### `controller.js` — HTTP layer only

**Rules:**
- No business logic, no DB calls — only call service functions
- Extract `tenantId` using `getTenantScope` / `requireTenantScope` helpers
- Extract `userId` from `req.user?.userId ?? req.user?.id`
- Import `handleError` from `../../utils/controllerHelpers.js` — never define it locally
- Respond immediately — no side effects in the controller

```js
import { getTenantScope, requireTenantScope } from '../../utils/tenantUtils.js';
import { handleError } from '../../utils/controllerHelpers.js';
import * as usersService from './users.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

export const createTenantUser = async (req, res) => {
  try {
    const tenantId = requireTenantScope(req);   // throws 403 if no tenant
    const user     = await usersService.createTenantUser(tenantId, req.body);
    res.status(201).json(user);
  } catch (e) { handleError(res, e, 'Create tenant user'); }
};

export const deleteUser = async (req, res) => {
  try {
    const force = req.query?.force === 'true';  // ?force=true for cascade
    res.json(await usersService.deleteUser(req.params.id, force));
  } catch (e) { handleError(res, e, 'Delete user'); }
};

export const getCurrentProfile = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    res.json(await usersService.getCurrentProfile(userId));
  } catch (e) { handleError(res, e, 'Get current profile'); }
};
```

---

### `routes.js` — Router + middleware + Swagger

**Rules:**
- Middleware order: `authenticateToken` → `resolveTenant` → role guard → `validate(schema)` → handler
- `resolveTenant` must come before role guards that need `tenantId`
- Static routes (`/stats`, `/tenant`, `/profile`) must be declared **before** parameterised routes (`/:id`)
- Add `@swagger` JSDoc on every route group

```js
import express from 'express';
import * as usersController from './users.controller.js';
import { authenticateToken, requireSuperAdmin, requireTenantAdmin } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { createUserSchema, updateUserSchema } from './users.validation.js';

const router = express.Router();

// Static routes first — before /:id
router.get('/stats',   authenticateToken, requireTenantAdmin, usersController.getUserStats);
router.get('/profile', authenticateToken, usersController.getCurrentProfile);
router.put('/profile', authenticateToken, validate(updateUserSchema), usersController.updateOwnProfile);

// Tenant-scoped routes
router.get('/tenant',  authenticateToken, resolveTenant, requireTenantAdmin, usersController.getTenantUsers);
router.post('/tenant', authenticateToken, resolveTenant, requireTenantAdmin, validate(createUserSchema), usersController.createTenantUser);

// Parameterised routes last
router.get('/:id',    authenticateToken, requireSuperAdmin, usersController.getUserById);
router.put('/:id',    authenticateToken, requireSuperAdmin, validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, usersController.deleteUser);

export default router;
```

---

## Tenant Scoping Utilities

Two helpers from `utils/tenantUtils.js` used in every controller:

| Helper | Behaviour |
|---|---|
| `getTenantScope(req)` | Returns `{ type: 'TENANT', tenantId }` or `{ type: 'GLOBAL' }`. Never throws. |
| `requireTenantScope(req)` | Returns `tenantId` or throws `403` if no tenant header present. |

```js
// Use getTenantScope when the operation is valid with or without a tenant
const scope    = getTenantScope(req);
const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;

// Use requireTenantScope when a tenant is mandatory
const tenantId = requireTenantScope(req);  // throws 403 if missing
```

---

## Role-Based Access Pattern

Three tiers of access, each with its own set of service functions:

| Tier | Middleware | Scope | Service functions |
|---|---|---|---|
| Super-admin | `requireSuperAdmin` | Global — all tenants | `listAllUsers`, `getUserById`, `updateUser`, `deleteUser` |
| Tenant-admin | `requireTenantAdmin` | Scoped to `tenantId` | `listTenantUsers`, `createTenantUser`, `updateTenantUser`, `deleteTenantUser` |
| Any user | `authenticateToken` only | Own record | `getCurrentProfile`, `updateOwnProfile` |

Service functions are **duplicated by tier** (e.g. `deleteUser` vs `deleteTenantUser`) — they share the same repository calls but enforce different scoping rules.

---

## `_count` Pattern

Related-data counts are attached to entity responses as a `_count` object — never as top-level fields.

```js
// Single entity — two queries
const user   = await repo.findUserById(id);
const counts = await repo.getUserCounts(id);
return { ...user, _count: counts };

// List — batch query to avoid N+1
const users  = await repo.findAllUsers();
const ids    = users.map((u) => u.id);
const counts = await repo.getBatchUserCounts(ids);
return users.map((u) => ({ ...u, _count: counts[u.id] }));
```

Response shape:
```json
{
  "id": "uuid",
  "name": "Alice",
  "_count": {
    "assignedTickets": 3,
    "createdTickets": 12,
    "comments": 7
  }
}
```

---

## Force-Delete Pattern

When an entity has related data, a soft refusal + `?force=true` override is the standard pattern:

```
DELETE /users/:id          → 400 if user has tickets/comments
DELETE /users/:id?force=true → cascades all related data in a transaction
```

Service logic:
```js
export async function deleteUser(id, force = false) {
  const counts     = await repo.getUserCounts(id);
  const hasRelated = counts.assignedTickets > 0 || counts.createdTickets > 0;

  if (!force && hasRelated) throw fail('Cannot delete user with associated data. Use ?force=true.', 400);
  if (force)                { await repo.forceDeleteUser(id); return { message: '...' }; }

  await repo.deleteUserById(id);
  return { message: 'User deleted successfully' };
}
```

---

## Checklist — New Advanced Module

### Files
- [ ] `schema.js` — table + enums, registered in `modules/schema.js`
- [ ] `validation.js` — `createXSchema`, `updateXSchema`, optional `updateOwnXSchema`
- [ ] `repository.js` — `COLUMNS` constant (no password), `find*`, `insert*`, `update*`, `delete*`, batch counts
- [ ] `service.js` — business rules, `fail()` helper, `attachCounts()`, tier-split functions
- [ ] `controller.js` — `handleError()` helper, `getTenantScope`/`requireTenantScope`, no logic
- [ ] `routes.js` — static routes before `/:id`, middleware order correct

### Repository rules
- [ ] `COLUMNS` constant excludes sensitive fields (password, tokens)
- [ ] All `find*` return `null` / `[]` — never throw
- [ ] List endpoints use batch count queries (`inArray` + `groupBy`) — no N+1
- [ ] Cascading deletes use `db.transaction()`
- [ ] All `update*` set `updatedAt: new Date()`

### Service rules
- [ ] `fail(message, status)` helper used for all thrown errors
- [ ] Passwords hashed with `bcrypt.hash(plain, 10)` — never stored plain
- [ ] Duplicate email check before insert
- [ ] Seat limit check before tenant user creation
- [ ] `_count` attached via `attachCounts()` helper
- [ ] Separate functions per role tier (super-admin vs tenant-admin vs own)

### Controller rules
- [ ] `handleError` imported from `../../utils/controllerHelpers.js` — never defined locally
- [ ] `userId` extracted as `req.user?.userId ?? req.user?.id`
- [ ] `tenantId` extracted via `getTenantScope` or `requireTenantScope`
- [ ] No `db` imports — only service imports
- [ ] `res.status(201)` on create, `res.json()` on read/update/delete

### Routes rules
- [ ] Middleware order: `authenticateToken` → `resolveTenant` → role guard → `validate` → handler
- [ ] Static paths (`/stats`, `/profile`, `/tenant`) declared before `/:id`
- [ ] `@swagger` JSDoc on every route group
- [ ] Router exported as default
