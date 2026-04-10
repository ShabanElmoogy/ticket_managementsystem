# Notification Cycle Rule

## Full Flow: Backend → Socket → Frontend

```
Controller
  └─ createNotification({ userId, type, title, message, ticketId? }, req)
       ├─ INSERT into notifications table (persists to DB)
       └─ req.emitNotification(userId, payload)          ← injected by socketMiddleware
            └─ io.to(`user_${userId}`).emit('notification', payload)
                 └─ ActivityFeed.tsx useActivitySocket handler
                      └─ renders in ActivityItem.tsx
```

---

## Step 1 — Trigger (Backend Controller)

Call `createNotification` from any controller that needs to notify a user.

```js
import { createNotification } from '../../utils/notificationUtils.js';

await createNotification({
  userId,       // UUID — who receives it
  ticketId,     // UUID or null — links notification to a ticket
  type,         // Must be a valid NotificationType string (see Step 2)
  title,        // Short label shown in the feed header
  message,      // Full human-readable description shown as secondary text
}, req);        // Always pass req — required for real-time socket emit
```

**Default pattern — notify both owner AND actor:**
```js
const actorId = req.user?.userId ?? req.user?.id;
const notifyIds = [...new Set([ownerId, actorId].filter(Boolean))];
for (const userId of notifyIds) {
  await createNotification({ userId, type, title, message, ticketId: null }, req);
}
```

- If owner ≠ actor → both get notified
- If owner === actor → deduplicated to one notification
- If no owner → only the actor is notified

**NEVER skip `req`** — without it the notification is only persisted to DB, not emitted in real-time.

**Scheduler context** — when calling from a cron job (no `req`), use `_emitNotification` directly:
```js
const [notification] = await db.insert(notifications).values(n).returning();
if (_emitNotification) {
  _emitNotification(userId, {
    id: notification.id,
    type: n.type,
    title: n.title,
    message: n.message,
    data: { ticket: { id: n.ticketId, title: n.message } },
    timestamp: notification.createdAt,
  });
}
```

---

## Step 2 — Notification Types (Single Source of Truth)

All valid types are defined in ONE place:

```
web/src/services/api/types.ts  →  export type NotificationType
```

```ts
export type NotificationType =
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED'
  | 'COMMENT_MENTION'
  | 'TICKET_DUE_SOON'
  | 'TICKET_OVERDUE'
  | 'STATUS_CHANGED'
  | 'PRIORITY_ESCALATED'
  | 'EPIC_FEATURE_STATUS_CHANGED';
```

Both `Notification` and `ActivityItem` interfaces use `type: NotificationType`.

`ActivityTypeFilter` in `ActivityFeed.tsx` is derived from it — never define it as a separate union:
```ts
type ActivityTypeFilter = "ALL" | "TICKET_DELETED" | "TICKET_RESTORED" | NotificationType;
```

**When adding a new notification type:**
1. Add the string to `NotificationType` in `web/src/services/api/types.ts` — only here
2. Follow Steps 4–6 below to wire it into the frontend

---

## Step 3 — Socket Payload Shape

`createNotification` emits this exact shape via Socket.IO:

```js
{
  id:        string,   // notification UUID from DB
  type:      string,   // NotificationType value
  title:     string,   // short label  ← TOP LEVEL, not inside data
  message:   string,   // full description  ← TOP LEVEL, not inside data
  data: {
    ticket:     { id, title } | undefined,   // only if ticketId was provided
    assignedTo: string | undefined,          // only if assigneeName was provided
  },
  timestamp: Date,     // notification.createdAt from DB
}
```

**CRITICAL:** `title` and `message` are at the **top level** of the payload, NOT inside `data`.
- ✅ `raw.message` — correct
- ❌ `raw.data.message` — always undefined, will show fallback text

`data.ticket` is only present when `ticketId` was passed to `createNotification`. For non-ticket notifications (epic events, due-date, etc.), `data.ticket` is `undefined` — read `raw.title` and `raw.message` directly.

---

## Step 4 — Socket Listener (ActivityFeed.tsx)

`ActivityFeed.tsx` has a local `useActivitySocket` hook that receives every `notification` event.

**Pattern — single `inlineTypes` array typed as `NotificationType[]`:**

```ts
useActivitySocket((raw?: any) => {
  const inlineTypes: NotificationType[] = [
    'COMMENT_MENTION', 'COMMENT_ADDED',
    'EPIC_FEATURE_STATUS_CHANGED',
    'TICKET_DUE_SOON', 'TICKET_OVERDUE',
    'STATUS_CHANGED', 'PRIORITY_ESCALATED',
  ];
  if (raw?.type && inlineTypes.includes(raw.type)) {
    const item: ActivityItemType = {
      id: `${raw.id || raw.type}-${Date.now()}`,
      type: raw.type,
      data: {
        ticket: raw.data?.ticket,
        commentBy: raw.data?.commentBy,
        mentionedUsers: raw.data?.mentionedUsers,
        mentionedBy: raw.data?.mentionedBy,
        comment: raw.data?.comment,
        description: raw.message,   // ← always map raw.message to data.description
      },
      timestamp: raw.timestamp ? new Date(raw.timestamp).toISOString() : new Date().toISOString(),
      read: false,
    };
    setActivities((prev) => [item, ...prev.slice(0, 19)]);
    setUnreadCount((c) => c + 1);
  } else {
    loadActivities(true);   // DB refetch for types that need fresh server data
  }
});
```

**Rules:**
- Add every new type to `inlineTypes` — typed as `NotificationType[]` so TypeScript enforces valid values
- Types NOT in `inlineTypes` (e.g. `TICKET_CREATED`, `TICKET_UPDATED`, `TICKET_ASSIGNED`) fall through to `loadActivities(true)` which refetches from DB
- Always map `raw.message` → `data.description` for display in `getActivityMessage`

---

## Step 5 — Display Message (ActivityItem.tsx)

`ActivityItem.tsx` has an inline `getActivityMessage` switch and `getTypePalette` mapping.

**Add a `case` for every new type:**
```ts
case 'MY_NEW_TYPE':
  return {
    primary: 'Short title shown in bold',
    secondary: data.description || 'Fallback text',
  };
```

**Add palette key mapping in `getTypePalette`:**
```ts
: type === 'MY_NEW_TYPE' ? 'UPDATED'
// Color buckets: CREATED | UPDATED | ASSIGNED | COMMENT | MUTED
```

**Also update the same switch and palette in `activityUtils.ts`** — it is a separate copy used by a different part of the feed.

---

## Step 6 — Icon (ActivityIcon.tsx)

Add a `case` in `ActivityIcon.tsx` for the new type:

```tsx
case 'MY_NEW_TYPE':
  return <MyIcon sx={sx} />;
```

---

## Step 7 — socket.off Rule (CRITICAL)

When registering a `socket.on('notification', handler)` listener, **always pass the handler reference to `socket.off`**:

```ts
// ✅ Correct — removes only this listener
const handler = (raw: any) => { ... };
socket.on('notification', handler);
return () => { socket.off('notification', handler); };

// ❌ Wrong — removes ALL notification listeners including other hooks
return () => { socket.off('notification'); };
```

---

## File Map

| Concern | File |
|---|---|
| Notification types (source of truth) | `web/src/services/api/types.ts` → `NotificationType` |
| DB persist + socket emit | `api/src/utils/notificationUtils.js` → `createNotification` |
| Socket server setup + rooms | `api/src/sockets/io.js` |
| Socket emit helper | `api/src/utils/socketHelpers.js` → `emitNotification` |
| Inject `req.emitNotification` | `api/src/middleware/socketMiddleware.js` |
| Scheduler emit (no req) | `api/src/utils/scheduler.js` → `_emitNotification` |
| Socket client + room join | `web/src/services/socketService.ts` → `getSocket` |
| Receive + render in feed | `web/src/components/dashboard/components/activityFeed/ActivityFeed.tsx` |
| Item display + message text | `web/src/components/dashboard/components/activityFeed/components/item/ActivityItem.tsx` |
| Icon per type | `web/src/components/dashboard/components/activityFeed/components/shared/ActivityIcon.tsx` |
| Color palette per type (shared) | `web/src/components/dashboard/components/activityFeed/components/shared/activityUtils.ts` |

---

## Checklist — Adding a New Notification Type

- [ ] Add type string to `NotificationType` in `web/src/services/api/types.ts`
- [ ] Call `createNotification({ ..., type: 'MY_NEW_TYPE' }, req)` in the backend controller
- [ ] Use the notify-both pattern: `[...new Set([ownerId, actorId].filter(Boolean))]`
- [ ] Add `'MY_NEW_TYPE'` to `inlineTypes: NotificationType[]` in `ActivityFeed.tsx`
- [ ] Add `case 'MY_NEW_TYPE'` to `getActivityMessage` in `ActivityItem.tsx`
- [ ] Add palette mapping in `getTypePalette` in `ActivityItem.tsx`
- [ ] Add `case 'MY_NEW_TYPE'` to `ActivityIcon.tsx`
- [ ] Mirror `getActivityMessage` and `getTypePalette` changes in `activityUtils.ts`
- [ ] Always pass named handler to `socket.off` — never `socket.off('notification')`
- [ ] Read `raw.message` not `raw.data.message` in the socket handler
