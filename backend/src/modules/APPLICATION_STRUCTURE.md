# Backend Modules – Application Structure

This document describes the structure under `backend/src/modules` and how feature modules are wired into the backend.

## Overview

`backend/src/modules` follows a **feature-module** layout. Each feature lives in its own folder and typically contains:

- `*.routes.js` – Express router for the module (HTTP endpoints)
- `*.controller.js` – Request handlers / orchestration
- `*.schema.js` – Database schema exports (Drizzle) and/or validation schema (depending on module)

At the root of `modules/` there are two important aggregators:

- `routes.js` – mounts each module router under a base path
- `schema.js` – re-exports all module schemas from a single entry point

## Directory layout

```
backend/src/modules/
  applications/
    applications.controller.js
    applications.routes.js
    applications.schema.js

  auth/
    auth.controller.js
    auth.routes.js
    auth.schema.js

  comments/
    comments.controller.js
    comments.routes.js
    comments.schema.js

  customers/
    customers.controller.js
    customers.routes.js
    customers.schema.js

  dashboard/
    dashboard.controller.js
    dashboard.routes.js

  docs/
    docs.controller.js
    docs.routes.js
    docs.schema.js

  kanban/
    kanban.controller.js
    kanban.routes.js
    kanban.schema.js

  labels/
    labels.controller.js
    labels.routes.js
    labels.schema.js

  notifications/
    notifications.controller.js
    notifications.routes.js
    notifications.schema.js

  reminders/
    reminders.controller.js
    reminders.routes.js

  tasks/
    tasks.controller.js
    tasks.routes.js
    tasks.schema.js

  tenants/
    tenants.controller.js
    tenants.routes.js
    tenants.schema.js

  tickets/
    tickets.controller.js
    tickets.routes.js
    tickets.schema.js

  users/
    users.controller.js
    users.routes.js
    users.schema.js

  routes.js
  schema.js
```

## Route composition (`modules/routes.js`)

`backend/src/modules/routes.js` creates an Express router and mounts each module router.

### Base paths

| Base path | Module router |
|---|---|
| `/auth` | `auth/auth.routes.js` |
| `/tickets` | `tickets/tickets.routes.js` |
| `/applications` | `applications/applications.routes.js` |
| `/customers` | `customers/customers.routes.js` |
| `/dashboard` | `dashboard/dashboard.routes.js` |
| `/kanban` | `kanban/kanban.routes.js` |
| `/labels` | `labels/labels.routes.js` |
| `/notifications` | `notifications/notifications.routes.js` |
| `/tasks` | `tasks/tasks.routes.js` |
| `/users` | `users/users.routes.js` |
| `/reminders` | `reminders/reminders.routes.js` |
| `/tenants` | `tenants/tenants.routes.js` |
| `/docs` | `docs/docs.routes.js` |
| `/docsbuilder` | `docs/docs.routes.js` (alias) |

### Notes / quirks

- **Comments are mounted under `/tickets`**:
  - `modules/routes.js` includes `router.use('/tickets', commentRoutes)`.
  - `comments.routes.js` defines `POST '/:id/comments'`.
  - Combined, the effective endpoint becomes: `POST /tickets/:id/comments`.

## Schema aggregation (`modules/schema.js`)

`backend/src/modules/schema.js` re-exports schemas from modules so the rest of the backend can import from a single place.

Currently exported:

- `auth`, `tickets`, `customers`, `applications`, `labels`, `comments`, `kanban`, `notifications`, `tasks`, `users`, `docs`, `tenants`

Notably **not exported** (no schema file present in modules):

- `dashboard`
- `reminders`

## Typical request flow

1. A request hits the main app router (outside this folder) and is forwarded to `modules/routes.js`.
2. The module router matches the path and runs any middleware (commonly `authenticateToken` from `backend/src/middleware/auth.js`).
3. The route handler calls into the module controller.
4. Controllers typically interact with the database via the module’s schema (and shared utilities).

## Adding a new module (convention)

1. Create `backend/src/modules/<moduleName>/`.
2. Add:
   - `<moduleName>.routes.js`
   - `<moduleName>.controller.js`
   - `<moduleName>.schema.js` (if the module has DB tables)
3. Mount it in `backend/src/modules/routes.js`:
   - `import <module>Routes from './<moduleName>/<moduleName>.routes.js';`
   - `router.use('/<basePath>', <module>Routes);`
4. Export its schema in `backend/src/modules/schema.js` (if applicable).
