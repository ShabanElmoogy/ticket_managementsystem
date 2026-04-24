# Tenant Scoping Standardization

**Date:** 2026-04-24  
**Status:** ✅ Complete

---

## Problem

Three different tenant scoping patterns exist across modules:

| Pattern | Where | Issues |
|---|---|---|
| **A: `getTenantScope()` in controller** | applications, customers | Repeated boilerplate in every handler |
| **B: `resolveTenant` middleware** | tickets, tasks, users, notifications | Sets `req.tenantId` from header, but `getTenantScope()` reads from JWT — two sources of truth |
| **C: Mixed** | users | Some routes use `resolveTenant`, some use `getTenantScope()` |

This creates confusion, inconsistency, and potential bugs when the header and JWT disagree.

---

## Solution

**Use middleware everywhere.** Declare tenant scoping intent at the route level, not inside handlers.

### Two middleware functions (already exist in `tenantUtils.js`):

```js
// 1. enforceTenantScope — allows GLOBAL scope (super-admin reads)
router.get('/', authenticateToken, enforceTenantScope, controller.getAll);
// Sets: req.tenantScope = { type: 'GLOBAL' } | { type: 'TENANT', tenantId }

// 2. requireTenantScopeMiddleware — requires TENANT scope (all writes)
router.post('/', authenticateToken, requireTenantScopeMiddleware, controller.create);
// Sets: req.tenantScope = { type: 'TENANT', tenantId }
// Throws 403 if SUPER_ADMIN without tenant header
```

### Controller pattern:

```js
// Read handler — extract tenantId or null
export const getAll = async (req, res) => {
  try {
    const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
    res.json(await service.listAll(tenantId));
  } catch (e) { handleError(res, e, 'Get all'); }
};

// Write handler — tenantId is always present
export const create = async (req, res) => {
  try {
    const tenantId = req.tenantScope.tenantId;  // guaranteed by middleware
    res.json(await service.create(tenantId, req.body));
  } catch (e) { handleError(res, e, 'Create'); }
};
```

---

## Why `resolveTenant` is the wrong abstraction

`resolveTenant` (from `middleware/tenant.js`) reads the `X-Tenant-Slug` or `X-Tenant-Id` **header** and sets `req.tenant` + `req.tenantId`. But:

1. **For non-SUPER_ADMIN users**, the tenant comes from the **JWT** (`req.user.tenantId`), not the header. The header is ignored for security.
2. **`getTenantScope()`** (the function controllers currently use) reads from the JWT, not from `req.tenantId`.
3. Having both creates two sources of truth that can diverge.

`enforceTenantScope` / `requireTenantScopeMiddleware` read from the JWT (via `getTenantScope()` internally) and set `req.tenantScope` — one source of truth.

---

## Migration per module

### Applications ✅

**Before:**
```js
// routes.js
router.get('/', authenticateToken, controller.getAllApplications);

// controller.js
export const getAllApplications = async (req, res) => {
  const scope = getTenantScope(req);
  const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
  // ...
};
```

**After:**
```js
// routes.js
router.get('/', authenticateToken, enforceTenantScope, controller.getAllApplications);
router.post('/', authenticateToken, requireTenantScopeMiddleware, requireTenantAdmin, validate(schema), controller.createApplication);

// controller.js
export const getAllApplications = async (req, res) => {
  const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
  // ...
};

export const createApplication = async (req, res) => {
  const tenantId = req.tenantScope.tenantId;  // guaranteed
  // ...
};
```

### Customers ✅

Same pattern as applications — already done in Phase 1.

### Tickets ⚠️

**Before:**
```js
// routes.js
router.use(authenticateToken, resolveTenant);  // sets req.tenantId from header

// controller.js
const scope = getTenantScope(req);  // reads from JWT
const tenantId = scope.type === 'TENANT' ? scope.tenantId : null;
```

**After:**
```js
// routes.js
router.use(authenticateToken);  // remove resolveTenant
router.get('/', enforceTenantScope, validate(schema, 'query'), controller.getAllTickets);
router.post('/', requireTenantScopeMiddleware, requireTenantAdmin, validate(schema), controller.createTicket);

// controller.js — same as applications
const tenantId = req.tenantScope.type === 'TENANT' ? req.tenantScope.tenantId : null;
```

### Tasks ⚠️

Same as tickets — uses `resolveTenant` middleware, needs to switch to `enforceTenantScope`.

### Users ⚠️

Mixed — some routes use `resolveTenant`, some use `getTenantScope()` in the controller. Standardize to middleware.

### Notifications ⚠️

Uses `resolveTenant` + reads `req.tenantId ?? req.user?.tenantId` — two fallbacks. Should use `req.tenantScope` only.

### Kanban, Labels ✅

No tenant scoping (global resources) — no changes needed.

---

## Checklist

- [x] applications — routes + controller
- [x] customers — routes + controller
- [x] tickets — routes + controller
- [x] tasks — routes + controller
- [x] users — routes + controller
- [x] notifications — routes + controller

---

## Benefits

1. **Authorization is visible** — you can audit tenant scoping by reading the routes file alone
2. **One source of truth** — `req.tenantScope` is set by middleware, controllers just read it
3. **Fail-fast** — tenant violations are caught before the controller runs
4. **Consistent** — every module follows the same pattern
5. **Testable** — middleware can be tested in isolation, controllers don't need to mock `getTenantScope()`

---

## Breaking changes

None — this is an internal refactor. The API surface (headers, responses) is unchanged.
