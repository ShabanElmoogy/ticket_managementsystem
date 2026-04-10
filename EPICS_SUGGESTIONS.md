# Epics — Real-World Enhancement Suggestions

## Workflow

### Epic Status Automation
- Auto-set epic to `COMPLETED` when all linked features are `SHIPPED`
- Auto-set to `ACTIVE` when the first feature is linked
- Show a confirmation prompt instead of a silent auto-transition

### Due Date Warnings
- "X days overdue" or "Due in X days" label on each card in EpicsPage
- Warning banner at the top of EpicDetailPage when overdue and not COMPLETED

### Activity Log
- Track who changed what and when (status changes, feature links/unlinks, reorders)
- New `epic_activity` table: `epicId`, `userId`, `action`, `meta`, `createdAt`
- Timeline in the detail page sidebar alongside comments

---

## Collaboration

### @Mentions in Epic Comments
- The ticket comments module already supports @mentions
- Wire the same mention system into `EpicComments`

### Watchers / Subscribers
- Let users "watch" an epic to receive notifications without being the owner
- New `epic_watchers` join table: `epicId`, `userId`
- Watch/unwatch button in EpicDetailPage header

---

## Reporting / Visibility

### Epic Health Score
- Composite score based on: % features shipped + days to deadline + blocked count
- Small colored dot indicator (green / yellow / red) on each list card
- Tooltip explaining the score breakdown

### Roadmap Enhancements
- Add a "today" vertical line marker
- Milestone markers on the timeline
- Drag-to-reschedule target date directly on the roadmap

### Export to PDF
- Export epic details + feature list to PDF
- Reuse the existing `jspdf` + `jspdf-autotable` already installed in `package.json`
- Button in EpicDetailPage header (admin only)

---

## Data Model

### Epic ↔ Ticket Direct Link
- Allow linking a ticket directly to an epic (for hotfixes / unplanned work)
- New `epic_tickets` join table or a nullable `epicId` column on `tickets`
- Shown as a separate "Linked Tickets" section in EpicDetailPage

### Effort Estimation
- Add `estimatedDays` field to the epics schema
- Show estimated vs actual progress ratio in the stats row
- Flag epics where actual duration has exceeded the estimate

---

## Implementation Notes
- All DB changes should follow the Drizzle schema-first workflow defined in `.amazonq/rules/database-schema.md`
- All new dialogs should follow the auto-focus rule in `.amazonq/rules/dialog-focus.md`
- Date display should use `formatDate` / `formatDateTime` from `web/src/utils/dateUtils.ts`
