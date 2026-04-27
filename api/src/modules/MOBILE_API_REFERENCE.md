# Mobile API Reference

Complete reference of all available data and endpoints for the mobile app.
Base URL: `EXPO_PUBLIC_API_URL` (set in `.env`)
All authenticated requests require: `Authorization: Bearer <token>` + `X-Tenant-Slug: <slug>`

---

## Authentication

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login → returns `token`, `refreshToken`, `user` |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | Public | Revoke refresh token |
| GET | `/tenants/public` | Public | List tenants for login screen dropdown |
| GET | `/tenants/by-slug/:slug` | Public | Resolve tenant by slug |

### Login response
```json
{
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "TENANT_ADMIN | EMPLOYEE | PROGRAMMER | SUPER_ADMIN",
    "tenantId": "uuid",
    "phone": "string | null",
    "reminderEnabled": false,
    "reminderInterval": 30
  }
}
```

---

## Roles & Permissions

| Role | Access |
|---|---|
| `SUPER_ADMIN` | All tenants, all users, all data |
| `TENANT_ADMIN` | Full CRUD within own tenant |
| `EMPLOYEE` | View/update assigned tickets, create comments |
| `PROGRAMMER` | View/update programming details on assigned tickets |

---

## Users

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/users/profile` | Any | Own profile |
| PUT | `/users/profile` | Any | Update own profile (name, phone, reminderEnabled, reminderInterval) |
| GET | `/users/profile/tenant-status` | Any | Tenant suspension status |
| GET | `/users/tenant` | TENANT_ADMIN | List all users in tenant |
| POST | `/users/tenant` | TENANT_ADMIN | Create user in tenant |
| GET | `/users/tenant/seats` | TENANT_ADMIN | Seat usage (used / total) |
| POST | `/users/tenant/:id/reset-password` | TENANT_ADMIN | Reset user password |
| GET | `/users/employees` | Any | List employees (for assignee dropdowns) |
| GET | `/users/programmers` | ADMIN | List programmers |
| GET | `/users/stats` | TENANT_ADMIN | User count by role |
| GET | `/users` | SUPER_ADMIN | List all users across tenants |
| GET | `/users/:id` | SUPER_ADMIN | Get user by ID |
| PUT | `/users/:id` | SUPER_ADMIN | Update user |
| DELETE | `/users/:id` | SUPER_ADMIN | Delete user (`?force=true` to cascade) |

### User object
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "role": "SUPER_ADMIN | TENANT_ADMIN | EMPLOYEE | PROGRAMMER",
  "phone": "string | null",
  "tenantId": "uuid | null",
  "whatsappNotifications": false,
  "reminderEnabled": false,
  "reminderInterval": 30,
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "_count": { "assignedTickets": 0, "createdTickets": 0, "comments": 0 }
}
```

---

## Tickets

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/tickets` | Any | List tickets (filterable) |
| GET | `/tickets/delayed` | Any | Overdue tickets |
| GET | `/tickets/:id` | Any | Ticket detail (full) |
| POST | `/tickets` | TENANT_ADMIN | Create ticket |
| PUT | `/tickets/:id` | Any | Update ticket |
| DELETE | `/tickets/:id` | TENANT_ADMIN | Soft delete |
| PATCH | `/tickets/:id/restore` | TENANT_ADMIN | Restore deleted |
| PATCH | `/tickets/:id/reassign` | TENANT_ADMIN | Reassign to user |
| POST | `/tickets/:id/take` | Any | Self-assign |
| PATCH | `/tickets/bulk` | ADMIN | Bulk update status |
| GET | `/tickets/:id/watchers` | Any | List watchers |
| POST | `/tickets/:id/watch` | Any | Watch ticket |
| DELETE | `/tickets/:id/watch` | Any | Unwatch ticket |
| GET | `/tickets/:id/attachments` | Any | List attachments |
| POST | `/tickets/:id/attachments` | Any | Upload files (max 5, multipart) |
| DELETE | `/tickets/:id/attachments/:attachmentId` | Any | Delete attachment |

### Query filters (`GET /tickets`)
```
?status=OPEN|IN_PROGRESS|PROGRAMMING|UNDER_DEVELOPMENT|CODE_REVIEW|TESTING|RESOLVED|CLOSED
?priority=LOW|MEDIUM|HIGH|URGENT
?assignedTo=uuid
?customerId=uuid
?applicationId=uuid
?userId=uuid
?search=string
?deleted=true
```

### Ticket object (full)
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "OPEN | IN_PROGRESS | PROGRAMMING | UNDER_DEVELOPMENT | CODE_REVIEW | TESTING | RESOLVED | CLOSED",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "dueDate": "ISO date | null",
  "estimatedHours": 0,
  "actualHours": 0,
  "slaDeadline": "ISO date | null",
  "resolvedAt": "ISO date | null",
  "deletedAt": "ISO date | null",
  "emailFrom": "string | null",
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "customerId": "uuid | null",
  "applicationId": "uuid | null",
  "createdById": "uuid",
  "assignedToId": "uuid | null",
  "programmerId": "uuid | null",
  "boardId": "uuid | null",
  "epicId": "uuid | null",
  "assignedTo": { "id": "uuid", "name": "string", "email": "string" },
  "createdBy": { "id": "uuid", "name": "string" },
  "programmer": { "id": "uuid", "name": "string" },
  "customer": { "id": "uuid", "name": "string", "subscriptionStatus": "string" },
  "application": { "id": "uuid", "name": "string", "version": "string" },
  "labels": [{ "id": "uuid", "name": "string", "color": "#hex" }],
  "comments": [{ "id": "uuid", "content": "string", "createdAt": "ISO", "user": { "name": "string" } }],
  "activities": [{ "id": "uuid", "action": "string", "description": "string", "createdAt": "ISO", "user": { "name": "string" } }]
}
```

### Create/Update ticket body
```json
{
  "title": "string (required on create)",
  "description": "string",
  "status": "OPEN | IN_PROGRESS | ...",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "dueDate": "ISO date",
  "estimatedHours": 0,
  "actualHours": 0,
  "customerId": "uuid",
  "applicationId": "uuid",
  "assignedToId": "uuid",
  "programmerId": "uuid",
  "boardId": "uuid",
  "epicId": "uuid"
}
```

---

## Comments

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/tickets/:id/comments` | Any | Add comment |
| DELETE | `/tickets/:id/comments/:commentId` | Any | Delete own comment |

```json
{ "content": "string (required)" }
```

---

## Customers

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/customers` | Any | List customers (tenant-scoped) |
| POST | `/customers` | TENANT_ADMIN | Create customer |
| GET | `/customers/:id` | Any | Customer detail (full) |
| PUT | `/customers/:id` | TENANT_ADMIN | Update customer |
| DELETE | `/customers/:id` | TENANT_ADMIN | Delete (fails if has tickets) |
| POST | `/customers/assign-application` | TENANT_ADMIN | Link application to customer |
| DELETE | `/customers/:customerId/applications/:applicationId` | TENANT_ADMIN | Unlink application |

### Customer object (full)
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string | null",
  "company": "string | null",
  "address": "string | null",
  "maintenanceType": "MONTHLY_SUBSCRIPTION | FREE_TRIAL | PAY_AS_YOU_GO | null",
  "subscriptionStartDate": "ISO date | null",
  "subscriptionEndDate": "ISO date | null",
  "subscriptionStatus": "ACTIVE | EXPIRED | TRIAL | null",
  "isActive": true,
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "applications": [{ "id": "uuid", "application": { "id": "uuid", "name": "string", "version": "string" } }],
  "_count": { "tickets": 0 }
}
```

### Create/Update customer body
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string",
  "company": "string",
  "address": "string",
  "maintenanceType": "MONTHLY_SUBSCRIPTION | FREE_TRIAL | PAY_AS_YOU_GO",
  "subscriptionStartDate": "ISO date",
  "subscriptionEndDate": "ISO date"
}
```

---

## Applications

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/applications` | Any | List applications (tenant-scoped) |
| POST | `/applications` | TENANT_ADMIN | Create application |
| GET | `/applications/:id` | Any | Application detail (full) |
| PUT | `/applications/:id` | TENANT_ADMIN | Update application |
| DELETE | `/applications/:id` | TENANT_ADMIN | Delete (fails if has tickets) |
| POST | `/applications/assign-customer` | TENANT_ADMIN | Link customer to application |
| DELETE | `/applications/:applicationId/customers/:customerId` | TENANT_ADMIN | Unlink customer |

### Application object (full)
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "version": "string | null",
  "tenantId": "uuid",
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "customers": [{ "id": "uuid", "customer": { "id": "uuid", "name": "string" } }],
  "_count": { "tickets": 0, "customers": 0 }
}
```

---

## Labels

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/labels` | Any | List labels |
| POST | `/labels` | TENANT_ADMIN | Create label |
| PUT | `/labels/:id` | TENANT_ADMIN | Update label |
| DELETE | `/labels/:id` | TENANT_ADMIN | Delete label |
| POST | `/labels/assign` | Any | Assign label to ticket `{ labelId, ticketId }` |
| DELETE | `/labels/:labelId/tickets/:ticketId` | Any | Remove label from ticket |

```json
{ "id": "uuid", "name": "string", "color": "#3B82F6", "description": "string | null" }
```

---

## Notifications

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/notifications` | Any | List own notifications |
| GET | `/notifications/count` | Any | Unread count `{ count: 0 }` |
| PUT | `/notifications/read-all` | Any | Mark all as read |
| PUT | `/notifications/:id/read` | Any | Mark one as read |
| DELETE | `/notifications/:id` | Any | Delete notification |

```json
{
  "id": "uuid",
  "title": "string",
  "message": "string",
  "type": "TICKET_CREATED | TICKET_UPDATED | TICKET_ASSIGNED | COMMENT_ADDED | STATUS_CHANGED | PRIORITY_ESCALATED | ...",
  "isRead": false,
  "createdAt": "ISO date",
  "ticketId": "uuid | null"
}
```

---

## Kanban

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/kanban/boards` | Any | List boards (with columns, tickets, tasks) |
| POST | `/kanban/boards` | Any | Create board |
| GET | `/kanban/boards/:id` | Any | Board detail |
| PUT | `/kanban/boards/:id` | TENANT_ADMIN | Update board |
| DELETE | `/kanban/boards/:id` | TENANT_ADMIN | Delete board |
| GET | `/kanban/boards/:boardId/analytics` | Any | Board analytics |
| POST | `/kanban/boards/:boardId/columns` | TENANT_ADMIN | Add column |
| PUT | `/kanban/columns/:columnId` | TENANT_ADMIN | Update column |
| DELETE | `/kanban/columns/:columnId` | TENANT_ADMIN | Delete column |
| PUT | `/kanban/tickets/:ticketId/move` | Any | Move ticket `{ newStatus, newPosition, boardId }` |
| PUT | `/kanban/tasks/:taskId/move` | Any | Move task `{ columnId, position }` |

### Board object (full)
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "type": "TICKETS | TASKS",
  "isDefault": false,
  "isActive": true,
  "createdAt": "ISO date",
  "columns": [
    {
      "id": "uuid", "name": "string", "color": "#hex",
      "position": 0, "wipLimit": null,
      "tickets": [{ "id": "uuid", "title": "string", "status": "string", "priority": "string", "assignedTo": { "name": "string" }, "customer": { "name": "string" } }],
      "tasks": [{ "id": "uuid", "title": "string", "status": "string", "assignee": { "name": "string" } }]
    }
  ],
  "permissions": [{ "role": "ADMIN | MEMBER | VIEWER", "user": { "id": "uuid", "name": "string" } }]
}
```

---

## Tasks

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/tasks` | Any | List tasks (`?boardId=uuid`) |
| POST | `/tasks` | TENANT_ADMIN | Create task |
| GET | `/tasks/:id` | Any | Get task |
| PUT | `/tasks/:id` | TENANT_ADMIN | Update task |
| DELETE | `/tasks/:id` | TENANT_ADMIN | Delete task |

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "TODO | IN_PROGRESS | DONE",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "position": 0,
  "dueDate": "ISO date | null",
  "boardId": "uuid",
  "columnId": "uuid | null",
  "assigneeId": "uuid | null",
  "assignee": { "id": "uuid", "name": "string" }
}
```

---

## Epics

### Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/epics` | Any | List epics (with progress, hierarchy) |
| GET | `/epics/:id` | Any | Epic detail (full — see below) |
| POST | `/epics` | TENANT_ADMIN | Create epic |
| PUT | `/epics/:id` | TENANT_ADMIN | Update epic |
| DELETE | `/epics/:id` | TENANT_ADMIN | Delete epic |
| PATCH | `/epics/bulk-status` | TENANT_ADMIN | Bulk update status |
| GET | `/epics/:id/comments` | Any | List comments |
| POST | `/epics/:id/comments` | Any | Add comment |
| DELETE | `/epics/:id/comments/:commentId` | Any | Delete comment |
| GET | `/epics/:id/activity` | Any | Activity log |
| GET | `/epics/:id/watchers` | Any | List watchers |
| POST | `/epics/:id/watch` | Any | Watch epic |
| DELETE | `/epics/:id/watch` | Any | Unwatch epic |
| GET | `/epics/:id/tickets` | Any | Linked tickets |
| POST | `/epics/:id/tickets` | TENANT_ADMIN | Link ticket |
| DELETE | `/epics/:id/tickets/:ticketId` | TENANT_ADMIN | Unlink ticket |
| GET | `/epics/:id/sub-epics` | Any | Sub-epics |
| GET | `/epics/:id/contributors` | Any | Contributors |
| POST | `/epics/:id/contributors` | TENANT_ADMIN | Add contributor |
| PUT | `/epics/:id/contributors/:contributorId` | TENANT_ADMIN | Update contributor role |
| DELETE | `/epics/:id/contributors/:contributorId` | TENANT_ADMIN | Remove contributor |
| POST | `/epics/:id/features` | TENANT_ADMIN | Link feature |
| DELETE | `/epics/:id/features/:featureId` | TENANT_ADMIN | Unlink feature |
| PUT | `/epics/:id/features/reorder` | TENANT_ADMIN | Reorder features |
| POST | `/epics/:id/blockers` | TENANT_ADMIN | Add blocker |
| DELETE | `/epics/:id/blockers/:blockerId` | TENANT_ADMIN | Remove blocker |
| GET | `/epics/:id/relations` | TENANT_ADMIN | List relations |
| POST | `/epics/:id/relations` | TENANT_ADMIN | Add relation |
| DELETE | `/epics/:id/relations/:relationId` | TENANT_ADMIN | Remove relation |
| GET | `/epics/network/graph` | Any | Network graph |
| GET | `/epics/:id/burndown` | Any | Burndown chart data |
| GET | `/epics/:id/auto-close` | Any | Auto-close eligibility |

### Epic object (full)
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "DRAFT | ACTIVE | COMPLETED | CANCELLED",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "tags": ["string"],
  "targetDate": "ISO date | null",
  "estimatedDays": 0,
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "ownerId": "uuid",
  "applicationId": "uuid | null",
  "customerId": "uuid | null",
  "parentEpicId": "uuid | null",
  "ownerName": "string",
  "applicationName": "string | null",
  "customerName": "string | null",
  "featureCount": 0,
  "stepsTotal": 0,
  "stepsDone": 0,
  "featureStatusCounts": { "UNDER_REVIEW": 0, "PLANNED": 0, "IN_PROGRESS": 0, "SHIPPED": 0, "DECLINED": 0 },
  "parentEpic": { "id": "uuid", "title": "string" },
  "subEpics": [],
  "ancestors": [{ "id": "uuid", "title": "string" }],
  "blockedBy": [{ "id": "uuid", "title": "string" }],
  "blocking": [{ "id": "uuid", "title": "string" }],
  "features": [],
  "comments": [],
  "activity": [],
  "watchers": [],
  "contributors": [{ "id": "uuid", "role": "string", "user": { "name": "string" } }]
}
```

---

## Feature Requests

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/features` | Any | List features |
| GET | `/features/:id` | Any | Feature detail |
| POST | `/features` | Any | Create feature |
| PUT | `/features/:id` | TENANT_ADMIN | Update feature |
| DELETE | `/features/:id` | TENANT_ADMIN | Delete feature |
| POST | `/features/:id/vote` | Any | Toggle vote |
| GET | `/features/:id/steps` | Any | List steps |
| POST | `/features/:id/steps` | Any | Create step |
| PUT | `/features/:id/steps/:stepId` | Any | Update step |
| DELETE | `/features/:id/steps/:stepId` | Any | Delete step |

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "UNDER_REVIEW | PLANNED | IN_PROGRESS | SHIPPED | DECLINED",
  "applicationId": "uuid | null",
  "customerId": "uuid | null",
  "epicId": "uuid | null",
  "submittedById": "uuid",
  "voteCount": 0,
  "hasVoted": false,
  "steps": []
}
```

---

## Programming Details

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/tickets/:id/programming` | PROGRAMMER / ADMIN | Get programming details |
| PUT | `/tickets/:id/programming` | PROGRAMMER / ADMIN | Create or update |
| POST | `/tickets/:id/assign-programmer` | ADMIN | Assign programmer |

```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "programmerId": "uuid",
  "technicalDescription": "string | null",
  "rootCause": "string | null",
  "stepsToReproduce": "string | null",
  "solutionSteps": ["string"],
  "codeSnippets": [{ "language": "string", "code": "string", "description": "string" }],
  "estimatedHours": 0,
  "actualHours": 0
}
```

---

## Templates

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/templates` | Any | List templates |
| POST | `/templates` | TENANT_ADMIN | Create template |
| PUT | `/templates/:id` | TENANT_ADMIN | Update template |
| DELETE | `/templates/:id` | TENANT_ADMIN | Delete template |

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "estimatedHours": 0,
  "createdById": "uuid"
}
```

---

## Documents

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/docs` | Any | List docs |
| GET | `/docs/tree` | Any | Tree structure (folders + docs) |
| GET | `/docs/:id` | Any | Get doc (with blocks) |
| POST | `/docs` | TENANT_ADMIN | Create doc |
| PUT | `/docs/:id` | TENANT_ADMIN | Update doc |
| DELETE | `/docs/:id` | TENANT_ADMIN | Delete doc |
| POST | `/docs/tree/folder` | TENANT_ADMIN | Create folder |
| POST | `/docs/tree/doc` | TENANT_ADMIN | Create doc node |
| PUT | `/docs/tree/:id/rename` | TENANT_ADMIN | Rename node |
| PUT | `/docs/tree/:id/move` | TENANT_ADMIN | Move node |
| DELETE | `/docs/tree/:id` | TENANT_ADMIN | Delete node |

---

## Tenants (SUPER_ADMIN only)

| Method | Path | Description |
|---|---|---|
| GET | `/tenants` | List all tenants |
| POST | `/tenants` | Create tenant |
| PATCH | `/tenants/:id` | Update tenant settings (SLA, escalation, dateFormat, etc.) |
| PATCH | `/tenants/:id/activate` | Activate tenant |
| PATCH | `/tenants/:id/deactivate` | Deactivate tenant |
| DELETE | `/tenants/:id` | Delete tenant |
| GET | `/tenants/:id/stats` | Tenant statistics |

### Tenant object
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "subscriptionPlan": "string",
  "subscriptionStatus": "ACTIVE | SUSPENDED | TRIAL",
  "subscriptionSeats": 10,
  "subscriptionStart": "ISO date | null",
  "subscriptionEnd": "ISO date | null",
  "supportEmail": "string | null",
  "escalationIntervalMinutes": 60,
  "slaUrgentHours": 4,
  "slaHighHours": 8,
  "slaMediumHours": 24,
  "slaLowHours": 72,
  "epicAutoClose": false,
  "dateFormat": "DD/MM/YYYY"
}
```

---

## Real-time (Socket.IO)

Connect to the same base URL with `transports: ['websocket']`.

### Events emitted by server

| Event | Payload | When |
|---|---|---|
| `notification` | `{ id, type, title, message, data: { ticket? }, timestamp }` | Any notification for the user |
| `ticket:updated` | `{ ticketId, changes }` | Ticket updated in tenant |
| `ticket:created` | `{ ticket }` | New ticket created |
| `ticket:deleted` | `{ ticketId }` | Ticket deleted |

### Notification types
```
TICKET_CREATED | TICKET_UPDATED | TICKET_ASSIGNED | COMMENT_ADDED | COMMENT_DELETED |
COMMENT_MENTION | TICKET_DUE_SOON | TICKET_OVERDUE | STATUS_CHANGED |
PRIORITY_ESCALATED | EPIC_FEATURE_STATUS_CHANGED
```

### Client setup
```ts
import { io } from 'socket.io-client';

const socket = io(BASE_URL, {
  transports: ['websocket'],
  auth: { token },
});

// Join user room to receive personal notifications
socket.emit('join', { userId });

// Join tenant room to receive tenant-wide events
socket.emit('joinTenant', { tenantId });
```

---

## Dashboard / Stats

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/dashboard` | Any | Ticket stats + recent activity |
| GET | `/users/stats` | TENANT_ADMIN | User count by role |
| GET | `/tenants/:id/stats` | SUPER_ADMIN | Tenant-level stats |
| GET | `/kanban/boards/:boardId/analytics` | Any | Board analytics |
| GET | `/epics/:id/burndown` | Any | Epic burndown chart |

### Dashboard response
```json
{
  "stats": {
    "total": 0,
    "open": 0,
    "inProgress": 0,
    "resolved": 0,
    "closed": 0,
    "overdue": 0
  },
  "recentTickets": [],
  "recentActivity": []
}
```

---

## Common Patterns

### Tenant scoping
All tenant-scoped endpoints require the `X-Tenant-Slug` header:
```
X-Tenant-Slug: my-company
```
This is set automatically by `httpClient.ts` via `tokenManager.getTenantSlug()`.

### Pagination
Most list endpoints return arrays (no pagination by default). The mobile app handles pagination via `AdminCrudScreen` using tenant-configurable settings from `usePaginationStore` — page size and mode (client/server) are set in the admin Settings panel and applied automatically.

### Error responses
```json
{ "error": "Human-readable error message" }
```
HTTP status codes: `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `500` Internal Server Error.

### Date formats
All dates are ISO 8601 strings (`2024-01-15T10:30:00.000Z`). Use `formatDate()` from `@/src/shared/utils/dateUtils` to display them using the tenant's preferred format.

---

## Mobile Implementation Status

| Module | API Service | List Screen | Detail Screen | Form | Status |
|---|---|---|---|---|---|
| Applications | ✅ | ✅ | ✅ | ✅ | Complete |
| Customers | ✅ | ✅ | ✅ | ✅ | Complete |
| Users | ✅ | ✅ | ✅ | ✅ | Complete |
| Tenants | ✅ | ✅ | ✅ | ✅ | Complete |
| Templates | ✅ | ✅ | ✅ | ✅ | Complete |
| Tickets | ✅ | ✅ | ⏳ | ⏳ | In progress |
| Kanban | ✅ | ⏳ | — | ⏳ | Planned |
| Epics | ✅ | ⏳ | ⏳ | ⏳ | Planned |
| Features | ✅ | ⏳ | ⏳ | ⏳ | Planned |
| Notifications | ✅ | ⏳ | — | — | Planned |
| Programming | ✅ | ⏳ | ⏳ | ⏳ | Planned |
| Docs | ✅ | ⏳ | ⏳ | ⏳ | Planned |
| Dashboard | ✅ | ✅ | — | — | Complete |
