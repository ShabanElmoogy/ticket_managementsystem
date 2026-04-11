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

---

## Advanced Features

### Epic Health Score
- Auto-calculated from % complete, days remaining vs estimate, blocker count, and overdue features
- Single number that tells you at a glance if an epic is on track
- Color-coded indicator (green/yellow/red) on epic cards and detail header

### Milestone Markers
- Named checkpoints within an epic (e.g. "Alpha", "Beta", "Launch") with their own target dates
- Mini timeline view showing progress through milestones
- New `epic_milestones` table: `epicId`, `name`, `targetDate`, `completed`, `order`

### Sub-Epics / Hierarchical Structure
- Parent-child epic relationships for large initiatives
- Breadcrumb navigation in detail pages
- Roll-up progress from child epics to parent

### Epic Relationships
- "Relates to" links between epics (softer than "blocked by")
- Network view showing epic dependencies and relationships
- New `epic_relations` table with relation types

### Burndown Chart
- Features/steps completed over time, rendered inline in detail page
- Use lightweight chart library (Chart.js or similar)
- Shows velocity and projected completion date

### Epic Board View
- Kanban-style columns by status across all epics
- Drag-and-drop to change epic status
- Similar to existing ticket kanban but for epics

### Roadmap Timeline View
- Horizontal timeline showing epics plotted by `createdAt` → `targetDate`
- Swimlanes by team/application/customer
- Drag to reschedule target dates

### Epic Templates
- Pre-fill new epics with standard feature sets for recurring project types
- Template library with common patterns
- New `epic_templates` table with JSON feature definitions

### Auto-Close Logic
- Auto-close epic when all features are SHIPPED and all linked tickets are RESOLVED/CLOSED
- Configurable rules per tenant
- Confirmation dialog before auto-transition

### Recurring Epics
- Clone an epic on a schedule (useful for quarterly initiatives)
- Cron-based scheduling with date adjustments
- Template-based cloning with variable substitution

### Epic Changelog
- Dedicated tab showing every field change with before/after values
- Rich UI for the existing `epicActivity` data
- Filter by change type and date range

### CSV Export
- Export linked tickets and features as spreadsheet
- Include all epic metadata and progress stats
- Bulk export for multiple epics

### @Mention Support
- @mention users in epic descriptions and comments
- Same notification system as ticket comments
- Auto-complete dropdown for user selection

### Multi-Contributor Assignment
- Assign multiple contributors beyond just the owner
- Role-based assignments (PM, Tech Lead, Designer, etc.)
- New `epic_contributors` table with role field

---

## Quick Wins (No Schema Changes)

These features reuse existing data and require minimal backend changes:

1. **Epic Health Score** — calculated from existing progress/blocker/date fields
2. **Burndown Chart** — uses existing activity log timestamps
3. **Epic Board View** — reuses epic list with different UI layout
4. **Auto-Close Logic** — checks existing feature/ticket statuses
5. **CSV Export** — formats existing epic/feature/ticket data
