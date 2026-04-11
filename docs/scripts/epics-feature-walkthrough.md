# Epics Feature — Walkthrough Script

---

## What is an Epic?

An Epic is a large goal that groups multiple feature requests and tickets under one umbrella. Think of it as a project within your project — it has an owner, a timeline, a priority, and tracks progress across everything linked to it.

---

## The Epics List Page

### Five Views

Use the toggle in the top right to switch between views. Your last choice is remembered across sessions.

- **List** — card grid with status, priority, feature breakdown, and a color-coded progress bar
- **Board** — Kanban columns (Draft, Active, Completed, Cancelled) — drag cards between columns to change status
- **Roadmap** — horizontal timeline showing epics plotted by start → target date
- **Dashboard** — aggregated stats, health overview, priority breakdown
- **Network** — relationship graph showing how epics connect and block each other

### Filtering & Search

- Real-time search by title
- Status filter — click the stat cards at the top to filter by that status, or use the dropdown
- Tag filter with autocomplete — click any tag chip on a card to instantly filter by it
- Sort by: Date Created, Target Date, Feature Count, Progress, Priority — with ascending/descending toggle
- All filters combine and update instantly

### Epic Cards

Each card shows:
- Health score dot (green/yellow/red)
- Priority and status chips
- Lock icon if blocked, with a tooltip listing the blocking epics
- Application, customer, and owner chips
- Target date chip — red if overdue, yellow if due today, with exact "X days overdue" or "Due in X days" label
- Tags as clickable chips — click to filter
- Feature status breakdown bar — stacked segments for Under Review, Planned, In Progress, Shipped, Declined
- Step progress (X/Y steps · Z%)
- Description preview (2 lines, truncated)
- Admin action buttons: View, Edit, Delete

### Bulk Actions

Check the boxes on cards to select multiple epics. A collapsible action bar appears showing the count. Pick a new status from the dropdown and click Apply to update all selected epics at once. Clear deselects everything.

### Export (Admin Only)

- **Export CSV** — exports all currently filtered epics
- **Export PDF** — generates a formatted report including the active filters

---

## Epic Health Score

Every epic card and detail page shows a small colored health indicator. It is automatically calculated from:

- Percentage of features shipped
- Days remaining vs the estimated duration
- Number of active blockers
- Whether the epic is overdue

Hover over it to see the score breakdown. Green means on track, yellow means at risk, red means needs attention.

---

## Creating an Epic

Click "New Epic" (admin only). The form includes:

- Title (required, auto-focused)
- Description
- Priority (Low, Medium, High, Critical)
- Owner — searchable employee list
- Application — filters the customer dropdown
- Customer — filtered by the selected application
- Target date — date picker in DD/MM/YYYY format
- Estimated days — how long the epic is expected to take
- Parent epic — searchable autocomplete; cycles are prevented (you cannot select the epic itself or any of its ancestors)
- Tags — type a tag and press Enter or comma to add it; Backspace removes the last one
- Status — only shown when editing an existing epic

Before filling anything in, expand **"Start from a Template"**. Pick a template and the title and description pre-fill automatically. When you save, all the template's features and steps are created and linked to the epic instantly.

---

## The Epic Detail Page

### Header

- Back button returns to the epics list
- Title, priority chip, status chip, health score
- **Watch / Watching button** — subscribe to notifications without being the owner; shows the current watcher count
- Edit, PDF export, CSV export (admin only)
- Description with collapsible "Show more / Show less" for long text
- Meta chips: Application, Customer, Owner, Target Date, Tags — with created and last-updated timestamps (hover for full datetime)
- Stats row: feature count, steps total, steps done, completion %, and an effort tracker showing actual days elapsed vs estimated days — turns red when overrun
- Feature status breakdown bar with a legend below it

If the epic is overdue, a warning banner appears at the top showing exactly how many days past the target date it is, and what the original target was.

### Blockers & Contributors

These two sections sit side by side below the stats.

**Blockers** — epics that must be resolved before this one can complete. Click `+` to open a menu and pick from available epics. Resolved blockers show in green, active ones in red. Click a blocker chip to navigate to that epic. Changes appear instantly via optimistic updates.

**Contributors** — people assigned to this epic beyond the owner, each with a role: PM, Tech Lead, Designer, Developer, QA, DevOps, Analyst, Stakeholder, Other. Each role has its own color. Click a chip to change the role, click `×` to remove. Admins can add contributors from the employee list.

---

## Burndown Chart

Below the header, the burndown chart shows feature completion over time as a blue area chart. If a target date is set, a dashed green ideal line shows the expected pace. Vertical reference lines mark today and the target date. Chips show:

- Current shipped vs total features
- Velocity in features per day (based on last 7 days)
- Projected completion date extrapolated from that velocity
- "All shipped ✓" when complete

The chart only appears once there is at least one data point — brand new epics stay clean.

---

## Features List

All feature requests linked to this epic appear here. Admins can drag to reorder them — the order is saved immediately.

Each feature card has two sides:

**Front** — title, status chip (admin can click to open a status change menu), description preview, and action buttons: open, edit, unlink.

**Back** (click the flip icon) — application, customer, submitted by, vote count, and created date.

Admins can also:
- Click "New Feature" to create a feature and link it to this epic in one step
- Click "Link Existing" to search and attach a feature that already exists

**Status automation:**
- When the first feature is linked to a Draft epic, a dialog asks if you want to set it to Active
- When all features reach Shipped, the auto-close logic runs — if auto-close is enabled in settings and there are no open linked tickets, the epic closes automatically. If there are open tickets, a dialog shows exactly how many are still open and lets you close anyway or wait.

---

## Sub-Epics

Sub-epics are child epics nested under this one. Each shows its own progress bar and percentage. A roll-up "Overall X%" chip shows the combined completion across all children. Click any sub-epic to navigate to it. Breadcrumb navigation at the top of the page keeps you oriented in deep hierarchies.

Admins can add sub-epics via an autocomplete dialog. Cycles are prevented — you cannot set an epic as its own child or create circular parent chains.

---

## Linked Tickets

Support tickets connected to this epic appear here with their status, priority, customer, and assigned user. Click to navigate to the ticket. Admins can link tickets via a search dialog and unlink them with the remove button.

---

## Relations

Soft links between epics — not blocking, just informational. Four types:

- **Relates to** — general connection
- **Duplicates** — this epic covers the same work
- **Depends on** — this epic needs the other to be done first
- **Split from** — this epic was broken off from another

Relations are shown bidirectionally — if Epic A "Depends on" Epic B, then Epic B shows "Required by" Epic A. Click any related epic to navigate to it. All relation types are also visible in the Network graph view.

---

## Sidebar — Comments and Changelog

The right sidebar is sticky on desktop and has two tabs.

**Comments** — threaded discussion. Type a comment and press Ctrl+Enter or click Send. You can delete your own comments.

**Changelog** — every field change recorded with before/after values. Covers:
- Status changes — colored before → after pills
- Priority changes — colored before → after pills
- Title updates
- Features linked and unlinked
- Feature status changes — shows feature name and before → after status
- Tickets linked and unlinked

Filter by change type (populated from actual data in this epic) or by date range: Today, Last 7 days, Last 30 days, or a custom date range. Active filters show as chips with one-click clear. Each entry shows who made the change and when.

---

## Board View

Four columns: Draft, Active, Completed, Cancelled. Each column has a description subtitle and a badge showing the epic count.

Drag a card from one column to another to change its status (admin only). The card rotates slightly while dragging and the target column highlights. Invalid transitions are blocked — a Completed epic can only go back to Active, a Cancelled epic can only go back to Draft.

Each card shows the health score, priority, blocker indicator, description preview, application/customer/owner chips, feature count, progress %, target date, and estimated days.

---

## Roadmap View

A horizontal scrollable timeline. Four grouping strategies selectable from a toggle:

- **Status** — rows grouped by Draft, Active, Completed, Cancelled
- **Owner** — rows grouped by assigned owner
- **Application** — rows grouped by application
- **Timeline** — all epics sorted by target date

Each epic appears as a colored bar spanning from its creation date to its target date. A progress fill inside the bar shows completion. Hover over a bar for a full tooltip with all details.

**Drag to reschedule** — grab the right edge of any bar and drag to move the target date. A preview date shows while dragging. The change saves on release with a confirmation snackbar.

**Milestone markers** — completed epics with a target date appear as a diamond marker with a flag icon. Hover to see the milestone details.

**Today line** — a red vertical line with a flag marks the current date.

**Zoom** — four zoom levels (1× to 4×) adjust how many pixels represent a day, letting you zoom in for detail or out for a full overview.

Epics without a target date are listed at the bottom with a note.

---

## Network View

An SVG graph showing all epics as nodes and their relationships as directed arrows. Edge colors indicate the relationship type:

- Red — blocks
- Blue — relates to
- Purple — duplicates
- Orange — depends on
- Cyan — split from
- Dashed gray — parent of

Click any node to navigate to that epic. A legend in the corner explains all edge types.

---

## Epic Templates (Admin)

In the Admin Panel under **Templates → Epic Templates**, admins can create reusable templates grouped by category (e.g. Web App, Mobile, Infrastructure). Each template defines a list of features, and each feature can have its own steps with titles and descriptions.

When creating a new epic, expand "Start from a Template", pick one, and the title and description pre-fill. On save, all features and steps are created automatically — no manual setup needed.

---

## Export Options

From the epic detail page header:

- **PDF Export** — full epic report including metadata, feature list, and linked tickets, formatted for A4
- **CSV Export** — spreadsheet with all epic metadata, features, and progress stats

From the epics list page, export all currently visible (filtered) epics to CSV or PDF.

---

## Settings (Admin)

Under **Admin → Settings**:

- **Scheduler** — controls how often overdue tickets are auto-escalated in priority (tenant admins only)
- **SLA Timers** — sets response time limits per priority level: Urgent, High, Medium, Low (tenant admins only)
- **Epic Auto-Close** — toggle whether epics close automatically when all features are Shipped and all linked tickets are Resolved/Closed, or always show a confirmation dialog first (tenant admins only)
- **Email Ingest** — server-wide IMAP configuration for email-to-ticket (super admin only)
