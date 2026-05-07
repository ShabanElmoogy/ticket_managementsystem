# Requirements Document

## Introduction

This feature delivers three interconnected mobile screens for the React Native / Expo mobile app, replicating the web implementations of the **Dashboard**, **Tickets**, and **Programming Panel** features. The mobile app already has a partial tickets list (`TicketsScreen`) and an admin statistics dashboard (`AdminDashboardScreen`). This spec extends those foundations into fully-featured screens that match the web's capabilities while following the mobile architecture patterns (`AdminCrudScreen`, `useAdminFeature`, `mobile-form-pattern.md`, `mobile-theme-system.md`, `mobile-error-toast-pattern.md`).

The three features are tightly coupled: the Dashboard is the primary entry point for ticket management, the Tickets screen provides full CRUD and detail views, and the Programming Panel is a sub-panel inside the ticket detail screen for developer-specific workflow data.

---

## Glossary

- **Dashboard**: The main ticket-management screen accessible to all authenticated users. Shows ticket statistics, filters, a create-ticket form (admin only), and a scrollable ticket feed.
- **Ticket_Feed**: The scrollable list of tickets rendered inside the Dashboard and Tickets screens.
- **Ticket_Detail**: A full-screen view of a single ticket with four tabs — Overview, Comments, Attachments, and Activity — plus the Programming Panel when applicable. Tapping a ticket card always navigates directly to this full-screen view (no intermediate dialog or bottom sheet).
- **Programming_Page**: A dedicated full-screen page accessible only to `PROGRAMMER` and `TENANT_ADMIN` roles. Shows a master-detail layout: a scrollable list of programming-phase tickets on one side, and the selected ticket's details (Ticket Info, Programming Panel, Comments) on the other. This is a separate navigation destination, not a sub-section of the Tickets screen.
- **Programming_Panel**: A tabbed sub-panel showing Technical Info, Solution Checklist, and Code Snippets for a selected ticket. Appears both inside the Programming_Page and inside the Ticket_Detail screen when the ticket is in a programming-phase status.
- **Activity_Feed**: A real-time sidebar/panel showing recent ticket events and notifications, driven by Socket.IO.
- **Stats_Cards**: A row of metric cards at the top of the Dashboard showing counts of tickets by status.
- **Ticket_Status**: One of `OPEN`, `IN_PROGRESS`, `PROGRAMMING`, `UNDER_DEVELOPMENT`, `CODE_REVIEW`, `TESTING`, `RESOLVED`, `CLOSED`.
- **Ticket_Priority**: One of `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- **Programming_Phase_Status**: Any of `PROGRAMMING`, `UNDER_DEVELOPMENT`, `CODE_REVIEW`, `TESTING`, `RESOLVED`.
- **SLA_Timer**: A countdown/elapsed-time indicator derived from `slaDeadline` on a ticket.
- **Programmer**: A user with role `PROGRAMMER` who can be assigned to a ticket for development work.
- **Tenant_Admin**: A user with role `TENANT_ADMIN` who has full CRUD access to all tickets.
- **Employee**: A user with role `EMPLOYEE` who can take unassigned tickets and update status on their own tickets.
- **AdminCrudScreen**: The shared mobile component that provides list, search, pagination, add/edit/delete, and row-press navigation.
- **useAdminFeature**: The shared mobile hook that wraps React Query for CRUD operations.
- **ProgrammingDetails**: The data model for the Programming Panel, containing `technicalDescription`, `rootCause`, `stepsToReproduce`, `solutionSteps`, `codeSnippets`, `estimatedHours`, `actualHours`.
- **SolutionStep**: An item in the solution checklist with `order`, `text`, and `done` fields.
- **CodeSnippet**: A code block with `language`, `code`, and optional `label` fields.

---

## Requirements

### Requirement 1: Dashboard — Ticket Statistics Cards

**User Story:** As a user, I want to see a summary of ticket counts by status at the top of the dashboard, so that I can quickly assess the current workload.

#### Acceptance Criteria

1. WHEN the Dashboard screen loads, THE Dashboard SHALL display a Stats_Cards row showing counts for: total tickets, open tickets, in-progress tickets, resolved tickets, and closed tickets.
2. WHEN filters are active, THE Stats_Cards SHALL reflect counts from the currently filtered ticket set, not the global total.
3. THE Stats_Cards SHALL use `Palette.*` color constants for each status — no hardcoded hex values.
4. WHEN the ticket list is loading, THE Stats_Cards SHALL display skeleton placeholders instead of zero values.
5. FOR ALL ticket lists, THE Dashboard SHALL compute stats such that `openTickets + inProgressTickets + resolvedTickets + closedTickets + programmingPhaseTickets = totalTickets` (invariant: status counts sum to total).

---

### Requirement 2: Dashboard — Search Bar & Filters

**User Story:** As a user, I want a search bar and filter controls above the ticket feed, so that I can quickly find the tickets I need.

#### Acceptance Criteria

1. THE Dashboard SHALL display a **filter bar** above the ticket feed containing:
   - A **search input** (`AppSearchInput`) with a search icon, placeholder "Search tickets, users, customers...", and a clear (✕) button that appears when text is entered.
   - A **Status** selector: All / Open / In Progress / Resolved / Closed (with colored dot per status).
   - A **Priority** selector: All / Low / Medium / High / Urgent (with colored dot per priority).
   - A **User** selector: All Users / New Tickets (unassigned) / individual users — each user option shows their initials avatar and a ticket-count badge (red if ≥ 5, blue otherwise). Visible to `TENANT_ADMIN` only.
   - A **Customer** selector: All Customers / individual customers with initials avatar. Visible to `TENANT_ADMIN` only.
   - An **Application** selector: All Applications / individual applications with initials avatar. Visible to `TENANT_ADMIN` only.
   - An **Overdue** toggle button — styled red when active (gradient background), outlined when inactive.
   - A **Deleted** toggle (Active / Deleted) — visible to `TENANT_ADMIN` only.
2. WHEN no filters are active, THE filter bar SHALL display **quick status filter chips** below the selectors: Open, In Progress, Resolved, Closed, Overdue — tapping one applies that filter instantly.
3. WHEN one or more filters are active, THE filter bar SHALL replace the quick chips with a **results summary bar** showing "{N} tickets found" and a "Clear all" button that resets all filters.
4. WHEN a search query is entered, THE Dashboard SHALL debounce the query by 400ms before filtering the Ticket_Feed.
5. THE filter bar header SHALL show the title "📋 Ticket Feed" on the left, and a **view toggle** (Feed / Grid / Compact) + **Refresh** button on the right.
6. WHEN filters are cleared, THE Ticket_Feed SHALL return to showing all tickets.
7. FOR ALL filter combinations, THE filtered ticket count SHALL be ≤ the unfiltered count (metamorphic property).
8. FOR ALL tickets in a status-filtered result, EACH ticket's status SHALL match the selected value (invariant).
9. WHERE the user role is `EMPLOYEE`, THE filter bar SHALL show only the search input, priority selector, and overdue toggle — user/customer/application selectors are hidden.

---

### Requirement 3: Dashboard — Create Ticket (Admin Only)

**User Story:** As a Tenant_Admin, I want to create new tickets directly from the dashboard, so that I can quickly log issues without navigating away.

#### Acceptance Criteria

1. WHERE the user role is `TENANT_ADMIN`, THE Dashboard SHALL display a "Create Ticket" button or form entry point.
2. WHEN the create ticket form is submitted with a valid title, description, and priority, THE Dashboard SHALL create the ticket via `POST /tickets` and add it to the Ticket_Feed.
3. THE create ticket form SHALL include fields for: title (required), description (required), priority (required, default `MEDIUM`), assigned employee (optional), customer (optional), application (optional), due date (optional), estimated hours (optional).
4. THE create ticket form SHALL support applying a ticket template to pre-fill title, description, priority, and estimated hours.
5. IF the create ticket form is submitted with an empty title or description, THEN THE Dashboard SHALL display a validation error and prevent submission.
6. WHEN a ticket is created successfully, THE Dashboard SHALL display a success toast and reset the form.

---

### Requirement 4: Dashboard — Ticket Feed (Social Post Style)

**User Story:** As a user, I want to see tickets in a modern social-media-style feed (like Facebook or X/Twitter), so that scanning and interacting with tickets feels natural and engaging on mobile.

#### Acceptance Criteria

1. EACH ticket card SHALL follow a social post layout:
   - **Header row**: creator avatar (initials-based, colored by priority), creator name, relative timestamp (e.g. "2h ago"), and a three-dot overflow menu on the right.
   - **Badge row**: status chip, priority chip, overdue badge (if applicable), SLA timer (if applicable), email badge (if applicable), customer chip, application chip — displayed as a horizontal scrollable chip row below the header.
   - **Content area**: ticket title in bold, description text truncated to 200 characters with an inline "See more" toggle.
   - **Meta row**: due date (if set), assigned-to name with small avatar (if assigned), estimated hours (if set) — displayed as a compact info row.
   - **Action bar**: full-width row of action buttons at the bottom of the card — 💬 Comments (count), 📤 Share, ✅ Take (if applicable), 🔄 Status, and a three-dot menu for admin actions (delete, restore).
2. THE action bar SHALL use Ionicons icon + label buttons styled like social post reactions.
3. WHEN the **Comments** button is pressed, THE card SHALL expand inline to show the comment thread and a comment input field — without navigating away from the feed (like Facebook inline comments).
4. THE inline comment section SHALL show the **3 most recent comments** on mount. Each comment shows: author avatar (initials), author name, content (with @mention highlighting), relative timestamp, and a delete button (own comments or admin only).
5. WHEN `ticket._count.comments > 0` on mount, THE card SHALL automatically fetch and show comments without requiring the user to press the Comment button.
6. WHEN there are more than 3 comments, THE card SHALL show a **"See X more comments"** button that loads 3 more at a time with a spinner while loading.
7. THE comment input SHALL support `@name` mention syntax — showing a suggestion list as the user types `@`. Pressing **Enter** (without Shift) SHALL submit the comment. A send icon button SHALL also be available.
8. WHEN a comment is submitted, THE card SHALL call `POST /tickets/:id/comments`, prepend the new comment, and reset the input.
9. WHEN a comment is deleted, THE card SHALL call `DELETE /tickets/:id/comments/:commentId` and remove it from the inline list.
10. WHEN `tenantSuspended` is true, THE comment input SHALL be disabled and show placeholder "Subscription ended — read only".
6. WHEN the **Share** button is pressed, THE card SHALL call `Sharing.shareAsync()` from `expo-sharing` with a formatted text containing: ticket title, status, priority, description (truncated to 100 chars), and a deep-link URL in the format `ticketapp://tickets/:id`.
7. IF `Sharing.isAvailableAsync()` returns false, THE Share button SHALL be hidden.
8. WHEN a ticket's `dueDate` is in the past and status is not `RESOLVED` or `CLOSED`, THE card SHALL display an animated pulsing "OVERDUE" badge in the badge row.
9. WHEN a ticket has an `slaDeadline`, THE card SHALL display an SLA_Timer chip in the badge row.
10. WHEN a ticket was created from an email (`emailFrom` is set), THE card SHALL display an "Email" chip in the badge row.
11. WHEN the card content area (title/description) is pressed, THE Dashboard SHALL navigate to the Ticket_Detail screen for that ticket.
12. THE Ticket_Feed SHALL support three view modes switchable via a toggle: **Feed** (social post cards, default), **Grid** (2-column compact cards), and **Compact** (dense single-line rows). The Share and inline comments are only available in Feed mode.
13. WHEN the Ticket_Feed is empty, THE Dashboard SHALL display an empty state with an appropriate Ionicons icon and message.
14. THE card SHALL use `c.*` theme color tokens for all colors — no hardcoded hex values.
15. THE card background SHALL use `c.surface.card`, header text `c.text.primary`, secondary text `c.text.secondary`, and the action bar background `c.surface.elevated`.

---

### Requirement 5: Dashboard — Ticket Card Actions

**User Story:** As a user, I want to take, update, and manage tickets directly from the feed card, so that I can act on tickets without opening the full detail view.

#### Acceptance Criteria

**Action Bar (bottom of card):**
1. THE card action bar SHALL contain these buttons in order: **💬 Comment** (with count badge), **📊 Activity**, **📤 Share**, and a **three-dot overflow menu** on the right.
2. WHEN the user role is `EMPLOYEE` and the ticket has no assignee, THE action bar SHALL additionally show a **✅ Take Ticket** button.
3. WHEN the **Comment** button is pressed, THE card SHALL expand inline to show the comment thread and input (see Requirement 4 inline comments).
4. WHEN the **Activity** button is pressed, THE card SHALL open a bottom sheet showing the ticket's activity log as a timeline — actor avatar, action chip, description, and relative timestamp per event. The sheet header SHALL show "Activity Log" + ticket title + event count chip.
5. WHEN the **Share** button is pressed, THE card SHALL call `Sharing.shareAsync()` from `expo-sharing` with ticket title, status, priority, description (truncated to 100 chars), and a deep-link URL `ticketapp://tickets/:id`. IF `Sharing.isAvailableAsync()` returns false, the Share button SHALL be hidden.

**Three-dot overflow menu:**
6. THE three-dot menu SHALL contain these items (role-gated):
   - **View Details** — navigates to Ticket_Detail screen (all roles)
   - ─── divider ───
   - **🔵 Mark as Open** — updates status (shown when user `canUpdateStatus`)
   - **🟡 Mark as In Progress** — updates status
   - **🟢 Mark as Resolved** — updates status
   - **⚫ Mark as Closed** — updates status
   - ─── divider ───
   - **⏰ Edit Due Date** — opens a date picker dialog (`TENANT_ADMIN` only)
   - **👤 Reassign Ticket** — opens a user picker to reassign the assignee (`TENANT_ADMIN` only)
   - **💻 Send to Programmer** — opens `AssignProgrammerDialog` to assign/reassign a programmer (`TENANT_ADMIN` only); label changes to "Reassign Programmer" if already assigned
   - ─── divider ───
   - **🗑 Delete Ticket** — shows a confirmation dialog before deleting (`TENANT_ADMIN`, active tickets only)
   - **♻️ Restore Ticket** — restores a soft-deleted ticket (`TENANT_ADMIN`, deleted tickets only)
7. `canUpdateStatus` is true when: user is `TENANT_ADMIN` OR (user is the assignee AND ticket status is NOT in `PROGRAMMING_STATUSES`).
8. WHEN "Edit Due Date" is confirmed, THE card SHALL call `PUT /tickets/:id` with the new `dueDate` and refresh the ticket.
9. WHEN "Reassign Ticket" is confirmed with a selected user, THE card SHALL call the reassign API and refresh the ticket.
10. WHEN "Send to Programmer" is confirmed, THE card SHALL call `POST /tickets/:id/assign-programmer` and refresh the ticket.
11. WHEN "Delete Ticket" is confirmed, THE card SHALL call `DELETE /tickets/:id` and remove the card from the feed.
12. WHEN "Restore Ticket" is pressed, THE card SHALL call `POST /tickets/:id/restore` and refresh the feed.
13. WHEN the tenant subscription is suspended (`tenantSuspended = true`), ALL write actions (Take, Status update, Comment, Delete, Reassign, Edit Due Date, Send to Programmer) SHALL be disabled and the comment input SHALL show "Subscription ended — read only".

---

### Requirement 6: Dashboard — Bulk Status Update (Admin Only)

**User Story:** As a Tenant_Admin, I want to select multiple tickets and update their status at once, so that I can efficiently manage large volumes of tickets.

#### Acceptance Criteria

1. WHERE the user role is `TENANT_ADMIN`, THE Ticket_Feed SHALL display checkboxes on each ticket card for multi-selection.
2. WHEN one or more tickets are selected, THE Dashboard SHALL display a bulk action bar showing the count of selected tickets and a status-update control.
3. WHEN a bulk status is applied, THE Dashboard SHALL call `PATCH /tickets/bulk` with the selected ticket IDs and new status.
4. WHEN the bulk update completes successfully, THE Dashboard SHALL deselect all tickets and refresh the feed.
5. FOR ALL tickets selected in a bulk update, AFTER the update completes, THE Ticket_Feed SHALL display each selected ticket with the new status (invariant: all selected tickets reflect the applied status).

---

### Requirement 7: Dashboard — Activity Feed (Real-Time, Foreground Only)

**User Story:** As a user, I want to see a real-time activity feed matching the web's design — collapsible panel, type filter chips with counts, search, read/unread state, and per-type colored icons — so that I can stay informed about ticket changes while the app is open.

#### Acceptance Criteria

**Panel structure:**
1. THE Activity_Feed SHALL be a collapsible panel on the Dashboard, fetching the 20 most recent activities via `GET /dashboard/activities`.
2. THE panel header SHALL contain (left to right):
   - 🔔 Bell icon with a **pulsing count badge** (animates scale 1→1.2→1 when unread > 0)
   - Title **"Activity Feed"** (bold)
   - Subtitle **"{N} new activities"** in primary color (only shown when unread > 0)
   - **✓✓ Mark All Read** icon button (turns green on hover)
   - **○ Mark All Unread** icon button (turns amber on hover)
   - **× Clear All** icon button (turns red on hover)
   - **∧/∨ Collapse toggle** chevron (rotates 180° when expanded)
3. THE header SHALL have a **rainbow gradient line** (primary → secondary → success → warning colors) at the top edge when expanded.
4. THE header background SHALL use a subtle gradient that reverses direction on hover.

**Filter section (collapsible sub-row):**
5. WHEN expanded, THE panel SHALL show a **"Filter by Activity Type"** row with a filter icon and a collapse chevron — tapping it toggles the filter chips.
6. THE filter chips SHALL include these **9 types** with icons and count badges:
   - 📋 **All Activities** — full width — count: total
   - 👤 **Assignments** (TICKET_ASSIGNED) — half width
   - 🎫 **New Tickets** (TICKET_CREATED) — half width
   - 💬 **Comments** (COMMENT_ADDED) — full width
   - @ **Mentions** (COMMENT_MENTION) — full width
   - 🗨️ **Comment Deleted** (COMMENT_DELETED) — full width
   - ✏️ **Updated Tickets** (TICKET_UPDATED, excluding deleted/restored) — full width
   - 🗑️ **Deleted Tickets** (TICKET_UPDATED where newStatus=DELETED) — full width
   - ♻️ **Restored Tickets** (TICKET_UPDATED where newStatus=RESTORED) — full width
7. EACH filter chip SHALL show a **colored count badge** (small pill) when its count > 0. The badge color matches the type's accent color.
8. THE active filter chip SHALL have a **2px primary-color border** and a subtle primary-tinted background. Inactive chips use a type-specific gradient background.
9. WHEN expanded, THE panel SHALL show a **search input** below the filter row with placeholder "Search activities..." and a search icon.

**Activity items:**
10. EACH activity item SHALL display:
    - A **colored circular avatar** with a type-specific Ionicons icon
    - A **4px left accent bar** (colored by type) — visible for unread items, hidden for read items
    - **Primary text**: type-specific message (e.g. "New ticket: Login crash", "Ticket updated: Safari bug")
    - **Secondary text**: actor name + "•" + relative timestamp (e.g. "Created by Mohamed • 19m ago")
    - **Chips row**: priority chip + status chip (outlined, small) when ticket data is present; `@mentioned you` chip for COMMENT_MENTION
    - A **pulsing dot** (8px circle, type accent color) next to primary text for unread items
    - On hover/long-press: a **mark as unread** radio button (◉) appears on the right
11. READ items SHALL be rendered at **0.7 opacity**. Unread items at full opacity.
12. Items SHALL animate in with a **fade-in** transition (300ms).
13. On hover/press, items SHALL **slide right 4px** and show a subtle shadow.

**Activity type → color bucket** (using `Palette.*` constants):
14. `TICKET_CREATED` → `Palette.emerald500` (green)
    `TICKET_UPDATED`, `STATUS_CHANGED`, `TICKET_DUE_SOON`, `EPIC_FEATURE_STATUS_CHANGED` → `Palette.amber500` (yellow)
    `TICKET_ASSIGNED` → `Palette.blue500` (blue)
    `COMMENT_ADDED`, `COMMENT_DELETED`, `COMMENT_MENTION` → `Palette.violet500` (purple)
    `TICKET_OVERDUE`, `PRIORITY_ESCALATED` → `Palette.zinc500` (muted)

**Activity type → Ionicons icon:**
15. `TICKET_CREATED` → `ticket-outline` | `TICKET_UPDATED` → `refresh-outline` | `TICKET_ASSIGNED` → `person-outline` | `COMMENT_ADDED` → `chatbubble-outline` | `COMMENT_MENTION` → `at-outline` | `STATUS_CHANGED` → `swap-horizontal-outline` | `TICKET_DUE_SOON` → `time-outline` | `TICKET_OVERDUE` → `warning-outline` | `PRIORITY_ESCALATED` → `trending-up-outline` | `EPIC_FEATURE_STATUS_CHANGED` → `git-branch-outline`

**Real-time & navigation:**
16. WHEN the app is in the **foreground** and a Socket.IO `notification` event is received, THE Activity_Feed SHALL prepend the new item inline (for inline types: `COMMENT_MENTION`, `COMMENT_ADDED`, `EPIC_FEATURE_STATUS_CHANGED`, `TICKET_DUE_SOON`, `TICKET_OVERDUE`, `STATUS_CHANGED`, `PRIORITY_ESCALATED`) or refetch from API (for all other types).
17. WHEN the app returns to the foreground after being backgrounded, THE Activity_Feed SHALL automatically refetch the latest 20 activities.
18. WHEN an activity item is pressed, THE Dashboard SHALL navigate to the related Ticket_Detail screen. If no `ticketId` is present, the press SHALL be ignored.
19. WHEN the panel is collapsed and then re-expanded, THE Activity_Feed SHALL mark all visible items as read and clear the unread count after a 500ms delay.

**Empty states:**
20. WHEN search matches no activities → empty state: `search-outline` icon + "No matching activities" + "Try adjusting your search or filters".
21. WHEN no activities exist → empty state: `notifications-outline` icon + "No activities yet" + "Activities will appear here when tickets are updated".

**Technical:**
22. THE Activity_Feed SHALL use the existing `socketService.ts` — no separate socket instance.
23. ALL colors SHALL use `Palette.*` constants at module level or `c.*` tokens inside components — no hardcoded hex values.

---

### Requirement 8: Tickets — Full CRUD with AdminCrudScreen

**User Story:** As a Tenant_Admin, I want a dedicated Tickets screen with full create, read, update, and delete capabilities, so that I can manage all tickets in the system.

#### Acceptance Criteria

1. THE Tickets_Screen SHALL use `AdminCrudScreen` to display tickets. In **Feed** view mode, tickets SHALL render using the same social post card style defined in Requirement 4. In **Grid** and **Compact** modes, tickets SHALL use the respective compact layouts.
2. THE Tickets_Screen SHALL support searching tickets by title and description.
3. WHEN the add button is pressed, THE Tickets_Screen SHALL open a `TicketForm` for creating a new ticket.
4. WHEN a ticket card is pressed, THE Tickets_Screen SHALL navigate to the Ticket_Detail screen for that ticket.
5. WHEN the edit action is triggered from the detail screen, THE Tickets_Screen SHALL open the `TicketForm` pre-filled with the ticket's current data.
6. WHEN a ticket is deleted from the list, THE Tickets_Screen SHALL call `DELETE /tickets/:id` and remove the ticket from the list.
7. THE Tickets_Screen SHALL support PDF export of the ticket list via `exportTicketPdf`.
8. THE Tickets_Screen SHALL follow the 3-state orchestration pattern: list → detail → edit.

---

### Requirement 9: Tickets — Ticket Form

**User Story:** As a Tenant_Admin, I want a form to create and edit tickets with all relevant fields, so that I can capture complete ticket information.

#### Acceptance Criteria

1. THE TicketForm SHALL include fields for: title (required), description (required), priority (required), status (edit mode only), assigned employee (optional), customer (optional), application (optional), due date (optional), estimated hours (optional).
2. THE TicketForm SHALL use `AppFormField` for text inputs and `Controller` for `ChipSelector` (priority, status) and `AppDatePicker` (due date).
3. THE TicketForm SHALL validate that title is at least 2 characters and at most 120 characters.
4. THE TicketForm SHALL validate that description is at most 500 characters.
5. IF the form is submitted with an empty title, THEN THE TicketForm SHALL display a validation error and prevent submission.
6. THE TicketForm SHALL support applying a ticket template to pre-fill title, description, priority, and estimated hours.
7. WHEN the form is submitted successfully, THE TicketForm SHALL display a success toast before calling `onClose()`.
8. THE TicketForm SHALL support both `page` and `modal` render modes.

---

### Requirement 10: Tickets — Ticket Detail Screen

**User Story:** As a user, I want to view the full details of a ticket in a dedicated full-screen view with organized tabs, so that I can navigate between the overview, comments, attachments, and activity without scrolling through a single long page.

#### Acceptance Criteria

**Header bar:**
1. WHEN a ticket card is pressed anywhere in the app, THE app SHALL navigate directly to the Ticket_Detail full-screen view — no intermediate dialog or bottom sheet.
2. THE Ticket_Detail header SHALL display: `← Back` button, ticket title (truncated if long), `[STATUS]` chip, `[PRIORITY]` chip, ticket short ID (e.g. `#22bc4649`), and a **👁 Watch** button on the right.
3. THE tab bar SHALL show counts in tab labels: **Overview**, **Comments (N)**, **Attachments (N)**, **Activity (N)**.

**Overview tab:**
4. THE Overview tab SHALL display a **"DESCRIPTION"** section card with the full ticket description text.
5. THE Overview tab SHALL display a **"TICKET DETAILS"** sidebar panel with two sections:
   - **PEOPLE**: Created by (avatar + name), Assigned to (avatar + name or "Unassigned"), Programmer (avatar + name, if assigned)
   - **DATES & TIME**: Created (relative timestamp), Updated (relative timestamp), Due date (if set, red if overdue), Hours (estimated / actual with progress bar if both set)
6. THE Overview tab SHALL display a **"LINKED TO"** section (if customer or application is set) showing customer chip and application chip.
7. THE Overview tab SHALL display a **status-update panel** when `canUpdateStatus` is true — showing all allowed status buttons, with the current status highlighted.
8. `canUpdateStatus` is true when: user is `TENANT_ADMIN` OR (user is the assignee AND ticket status is NOT in `PROGRAMMING_STATUSES`).

**Comments tab:**
9. THE Comments tab SHALL display the **comment input at the TOP** of the tab (above the comment list) — user avatar + multiline text field with placeholder "Write a comment... use @ to mention someone" + `Comment →` send button.
10. THE comment input SHALL support `@name` mention syntax with a suggestion list. Pressing `Ctrl+Enter` SHALL submit the comment.
11. THE comment list SHALL display each comment as: author avatar + author name + timestamp + content (with @mention highlighting) + delete button (own comments or admin only).
12. WHEN there are no comments, THE tab SHALL display an empty state: comment icon + "No comments yet".
13. WHEN a comment is added, THE tab SHALL call `POST /tickets/:id/comments` and prepend the new comment.
14. WHEN a comment is deleted, THE tab SHALL call `DELETE /tickets/:id/comments/:commentId` and remove it.

**Attachments tab:**
15. THE Attachments tab SHALL use a **two-panel layout** on larger screens (file list left, file preview right) and a **stacked layout** on mobile (list on top, preview below).
16. THE file list panel SHALL display: "Files" header with count chip, a **"Drop or browse"** dashed upload zone (non-readonly users only), and a scrollable list of uploaded files.
17. EACH file list item SHALL show: thumbnail (image preview or type icon), file name, file size, and a delete button (own files or admin only).
18. THE upload zone SHALL support selecting multiple files (up to 5) with a max size of 10 MB each. WHEN uploading, a linear progress bar SHALL be shown.
19. THE file preview panel SHALL render: images (with zoom in/out/fit controls), PDFs (inline iframe), videos (HTML5 video player), text/JSON files (monospace pre block), and other files (download button).
20. WHEN multiple files exist, the preview panel SHALL show prev/next navigation arrows and a "{index} / {total}" counter.
21. WHEN a file is selected in the list, THE preview panel SHALL update to show that file.
22. WHEN a file is deleted, THE tab SHALL show a confirmation dialog before calling `DELETE /attachments/:ticketId/:attachmentId`.
23. WHEN there are no files, THE preview panel SHALL show: paperclip icon + "No files attached".

**Activity tab:**
24. THE Activity tab SHALL display ticket events as a **timeline list** — each item shows: actor avatar (colored by action type), actor name, action chip (e.g. `[CREATED]`, `[STATUS_CHANGED]`), description text (e.g. "created this ticket"), and relative timestamp (right-aligned).
25. WHEN there are no activities, THE tab SHALL display an empty state: history icon + "No activity recorded yet".

**Watch button:**
26. THE Watch button SHALL toggle between watching and unwatching the ticket via the watchers API. WHEN watching, the button SHALL appear active/filled. WHEN not watching, it SHALL appear outlined.

---

### Requirement 11: Tickets — Comments with @Mention Support

**User Story:** As a user, I want to mention other users in comments using @name syntax, so that they are notified and the mention is highlighted in the comment thread.

#### Acceptance Criteria

1. THE comment input field SHALL support `@name` mention syntax, showing a suggestion list of employees as the user types `@`.
2. WHEN a comment containing `@name` mentions is submitted, THE Ticket_Detail SHALL send the raw comment content (including `@name` tokens) to `POST /tickets/:id/comments`.
3. WHEN a comment containing `@name` tokens is displayed, THE Ticket_Detail SHALL render each mention as a highlighted chip or styled span.
4. FOR ALL comment strings, parsing `@name` tokens and re-formatting them SHALL produce the same set of mentioned users (round-trip property: `extractMentions(formatMentions(users)) == users`).

---

### Requirement 12: Tickets — SLA Timer

**User Story:** As a user, I want to see an SLA countdown on tickets that have an SLA deadline, so that I can prioritize tickets at risk of breaching their SLA.

#### Acceptance Criteria

1. WHEN a ticket has a non-null `slaDeadline`, THE Ticket_Feed AND Ticket_Detail SHALL display an SLA_Timer indicator.
2. WHEN the current time is before `slaDeadline`, THE SLA_Timer SHALL display the remaining time in a neutral or warning color.
3. WHEN the current time is after `slaDeadline` and the ticket status is not `RESOLVED` or `CLOSED`, THE SLA_Timer SHALL display the elapsed overdue time in an error color.
4. WHEN the ticket status is `RESOLVED` or `CLOSED`, THE SLA_Timer SHALL not display an overdue state regardless of the deadline.
5. FOR ALL tickets, IF `slaDeadline < now` AND `status NOT IN (RESOLVED, CLOSED)`, THEN THE SLA_Timer SHALL display an overdue indicator (invariant: overdue state is determined solely by deadline and status).

---

### Requirement 13: Programming Panel — Visibility and Access Control

**User Story:** As a programmer or admin, I want the Programming Panel to appear on tickets that are in a development phase, so that I can access developer-specific workflow tools without cluttering other tickets.

#### Acceptance Criteria

1. WHEN a ticket's status is one of `PROGRAMMING`, `UNDER_DEVELOPMENT`, `CODE_REVIEW`, `TESTING`, or `RESOLVED`, THE Ticket_Detail SHALL display the Programming_Panel.
2. WHEN a ticket's status is `OPEN`, `IN_PROGRESS`, or `CLOSED`, THE Ticket_Detail SHALL NOT display the Programming_Panel.
3. WHERE the user role is `PROGRAMMER` or `TENANT_ADMIN`, THE Programming_Panel SHALL render all tabs in edit mode.
4. WHERE the user role is `EMPLOYEE`, THE Programming_Panel SHALL render all tabs in read-only mode.
5. FOR ALL ticket status values, THE Programming_Panel visibility SHALL be determined solely by whether the status is in Programming_Phase_Status (invariant: `isVisible = status IN ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED']`).

---

### Requirement 14: Programming Panel — Technical Info Tab

**User Story:** As a programmer, I want to document the technical details of a ticket's solution, so that the team has a clear record of the root cause and approach.

#### Acceptance Criteria

1. THE Technical_Info tab SHALL display these fields in order:
   - **Technical Description** — multiline text field (3 rows)
   - **Root Cause Analysis** — multiline text field (3 rows)
   - **Steps to Reproduce** — multiline text field (3 rows)
   - **Estimated Hours** + **Actual Hours Spent** — two number fields side by side (min 0, step 0.5)
2. WHEN `canEdit` is true, THE tab SHALL display a **💾 Save** button below the fields.
3. WHEN `canEdit` is false, ALL fields SHALL be rendered as disabled/read-only — no Save button shown.
4. WHEN the Programming_Panel is opened, THE Technical_Info tab SHALL fetch existing data via `GET /tickets/:id/programming` and pre-fill all fields.
5. WHEN the Save button is pressed, THE tab SHALL call `PUT /tickets/:id/programming` with the updated fields and display a success toast.
6. WHEN no technical details exist and `canEdit` is false, THE tab SHALL display "No technical details added yet."
7. FOR ALL valid `ProgrammingDetails` objects, saving then fetching SHALL return an equivalent object (round-trip property: `fetch(save(data)) ≈ data`).
8. IF the save request fails, THEN THE tab SHALL display an error via the NetworkErrorDialog pattern without showing a duplicate toast.

---

### Requirement 15: Programming Panel — Solution Checklist Tab

**User Story:** As a programmer, I want to maintain a checklist of solution steps for a ticket, so that I can track progress through the implementation.

#### Acceptance Criteria

1. THE Solution_Checklist tab SHALL display a **"{done}/{total} completed"** progress caption above the list (only when steps exist).
2. EACH step SHALL display: checkbox (toggles `done` state), step text (strikethrough + dimmed when done), and a delete button (edit mode only).
3. WHEN `canEdit` is true, THE tab SHALL display an **"Add a step..."** text input + **`+`** icon button below the list. Pressing `Enter` in the input SHALL add the step.
4. WHEN a step is added, THE tab SHALL append it with `done: false` and clear the input.
5. WHEN a step is deleted, THE tab SHALL remove it and re-index remaining steps' `order` values.
6. WHEN steps exist and `canEdit` is true, THE tab SHALL display a **💾 Save Steps** button.
7. WHEN the Save Steps button is pressed, THE tab SHALL call `PUT /tickets/:id/programming` with the updated `solutionSteps` array.
8. WHEN no steps exist, THE tab SHALL display "No solution steps added yet."
9. FOR ALL solution step lists, AFTER adding a step, the list length SHALL increase by exactly 1 (invariant).
10. FOR ALL solution step lists, AFTER removing a step, the remaining steps SHALL have contiguous `order` values starting from 0 (invariant: `steps[i].order == i`).

---

### Requirement 16: Programming Panel — Code Snippets Tab

**User Story:** As a programmer, I want to attach code snippets to a ticket, so that the team can reference the relevant code changes or examples.

#### Acceptance Criteria

1. EACH existing snippet SHALL be displayed as a card with:
   - A header bar showing: language label (uppercase, primary color) + optional label (e.g. `JAVASCRIPT — myFunction`) + delete button (edit mode only)
   - A **monospace code block** with dark background (`#0d1117` dark / `#f6f8fa` light)
2. WHEN `canEdit` is true and the user presses **"Add Snippet"**, THE tab SHALL show an inline add form with:
   - **Language** dropdown (javascript, typescript, python, java, csharp, sql, bash, json, xml, other)
   - **Label (optional)** text field
   - **Code** multiline textarea (5 rows, monospace font)
   - **Add** (primary) + **Cancel** buttons
3. WHEN the Add button is pressed with non-empty code, THE tab SHALL append the snippet and hide the form.
4. WHEN the Add button is pressed with empty code, THE tab SHALL prevent the addition.
5. WHEN snippets exist and `canEdit` is true, THE tab SHALL display a **💾 Save** button.
6. WHEN the Save button is pressed, THE tab SHALL call `PUT /tickets/:id/programming` with the updated `codeSnippets` array.
7. WHEN no snippets exist and the add form is not open, THE tab SHALL display "No code snippets added yet."

---

### Requirement 17: Programming Panel — Assign Programmer

**User Story:** As a Tenant_Admin, I want to assign a programmer to a ticket, so that the right developer is responsible for the implementation.

#### Acceptance Criteria

1. WHERE the user role is `TENANT_ADMIN`, THE Ticket_Detail SHALL display an "Assign Programmer" button when the ticket is in a Programming_Phase_Status.
2. WHEN the "Assign Programmer" button is pressed, THE Ticket_Detail SHALL display a picker showing all users with the `PROGRAMMER` role.
3. WHEN a programmer is selected and confirmed, THE Ticket_Detail SHALL call `POST /tickets/:id/assign-programmer` with the selected programmer's ID.
4. WHEN the assignment succeeds, THE Ticket_Detail SHALL display the assigned programmer's name and a success toast.
5. IF the assignment request fails, THEN THE Ticket_Detail SHALL display an error via the NetworkErrorDialog pattern.

---

### Requirement 18: Programming Page — Dedicated Screen for Programmers

**User Story:** As a Programmer or Tenant_Admin, I want a dedicated Programming screen that shows only programming-phase tickets in a master-detail layout, so that I can focus on my development work without the noise of the full ticket list.

#### Acceptance Criteria

**Left panel — ticket list:**
1. THE Programming_Page SHALL be accessible only to users with role `PROGRAMMER` or `TENANT_ADMIN` — all other roles SHALL be redirected.
2. THE left panel header SHALL display: "Programming Tickets" title + a **blue count badge** (number of visible tickets) + a **refresh** icon button.
3. THE left panel SHALL display a **search input** with placeholder "Search tickets..." and a **"All Statuses"** dropdown filter for programming-phase statuses.
4. EACH ticket list item SHALL show: initials avatar (colored by priority), ticket title (truncated), status chip (colored), and "prog" label below the status.
5. WHERE the user role is `PROGRAMMER`, THE list SHALL show only tickets where `ticket.programmerId === currentUser.id`.
6. WHERE the user role is `TENANT_ADMIN`, THE list SHALL show all programming-phase tickets.
7. WHEN a ticket is selected, THE list item SHALL be highlighted with a left accent border (purple/violet).

**Right panel — selected ticket:**
8. THE right panel header SHALL display: ticket title, status chip, priority chip, and (for `TENANT_ADMIN`) an **"Assign/Reassign Programmer"** button.
9. THE right panel SHALL have **3 tabs**: `ℹ TICKET INFO` | `<> PROGRAMMING` | `💬 COMMENTS`.

**Ticket Info tab:**
10. THE Ticket Info tab SHALL display a **DESCRIPTION** section with the full ticket description text.
11. THE Ticket Info tab SHALL display a **DETAILS** section as a 2-column grid with: Created By (avatar + name), Assigned To (avatar + name or "Unassigned"), Programmer (avatar + name, violet color), Customer (name or "—"), Application (name or "—"), Due Date (red if overdue, "—" if not set).
12. THE Ticket Info tab SHALL display a **status-update panel** with buttons for allowed statuses:
    - `TENANT_ADMIN`: all statuses
    - `PROGRAMMER`: `PROGRAMMING`, `UNDER_DEVELOPMENT`, `CODE_REVIEW`, `TESTING`, `RESOLVED` only
    - The current status button SHALL be highlighted (filled/colored).

**Programming tab:**
13. THE Programming tab SHALL render the **Programming_Panel** with a purple `<> Programming Panel` header chip and 3 sub-tabs: `TECHNICAL INFO` | `SOLUTION STEPS` | `CODE SNIPPETS`.
14. `canEdit` for the Programming_Panel SHALL be: `true` for `TENANT_ADMIN`; `true` for `PROGRAMMER` only when `ticket.programmerId === currentUser.id`; `false` otherwise.

**Comments tab:**
15. THE Comments tab SHALL display a comment input at the top (avatar + "Write a comment..." + `▶ Send` button) and the comment list below.
16. WHEN no comments exist, THE tab SHALL show: comment icon + "No comments yet".
17. WHEN a comment is submitted, THE tab SHALL call `POST /tickets/:id/comments` and refresh the list.
18. WHEN a comment is deleted by its author, THE tab SHALL call `DELETE /tickets/:id/comments/:commentId` and remove it.

**Empty state:**
19. WHEN no ticket is selected, THE right panel SHALL display: `code-slash-outline` icon + "Select a ticket to view details".

**Invariants:**
20. FOR ALL tickets shown in the Programming_Page list, EACH ticket's status SHALL be in `['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED']` (invariant).
21. THE Programming_Page SHALL be wired as a navigation destination in the app's drawer, visible only to `PROGRAMMER` and `TENANT_ADMIN` roles.

### Requirement 19: Mobile Architecture Compliance & Shared Components

**User Story:** As a developer, I want all three features to follow the established mobile architecture patterns and maximize reuse of existing shared components — extracting new ones where the feature introduces reusable UI — so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

**Existing shared components to use (do NOT recreate):**

1. `AppBadge` (variant `status` / `priority`) — use for ALL status and priority chips throughout ticket cards, detail screen, and programming page list items.
2. `TabBar` / `SubTabBar` — use for the Ticket_Detail 4-tab bar and the Programming_Panel 3-sub-tab bar respectively.
3. `CodeBlock` — use for rendering code snippets in the Programming Panel Code Snippets tab (read-only display).
4. `InitialAvatar` — use for all user/creator avatars in ticket cards, comments, activity items, and programming page list.
5. `AppEmptyState` — use for ALL empty states (no tickets, no comments, no activities, no files, no steps, no snippets, no ticket selected).
6. `AppSearchInput` — use for the ticket feed search bar and the programming page ticket list search.
7. `AppBadge` — use for the activity type chips in the Activity Feed items.
8. `FilterChipGroup` — use for the Activity Feed type filter chips.
9. `AppScreenHeader` + `HeaderIconButton` — use for the Ticket_Detail screen header (Back, Watch, edit/delete actions).
10. `ConfirmDeleteDialog` — use for ticket delete confirmation and attachment delete confirmation.
11. `AppButton` — use for all async action buttons (Save, Send, Take Ticket, etc.).
12. `AppFormField` + `AppTextInput` — use for all text inputs in TicketForm and TechnicalInfoSection.
13. `ChipSelector` — use for priority and status selectors in TicketForm.
14. `AppDatePicker` — use for due date field in TicketForm.
15. `FormSection` — use to group TicketForm fields into collapsible sections.
16. `DataCard` — use for the ticket list in the Tickets screen (non-feed view modes).
17. `SectionHeader` — use for section headers in Ticket_Detail Overview tab (DESCRIPTION, TICKET DETAILS, PEOPLE, DATES & TIME).
18. `PanelCard` — use for expandable panels in the Activity Feed (filter section).

**New shared components to extract from this feature:**

19. `TicketCard` — the social-post-style ticket card (header, badge row, content, meta row, action bar, inline comments). Extract to `shared/components/display/TicketCard.tsx`. Used by Dashboard feed, Tickets screen, and Programming page.
20. `ActivityFeedItem` — a single activity feed item (colored avatar, accent bar, primary/secondary text, chips row, read/unread dot). Extract to `shared/components/display/ActivityFeedItem.tsx`. Used by Dashboard Activity Feed and Ticket_Detail Activity tab.
21. `SlaTimerBadge` — the SLA countdown/elapsed chip. Extract to `shared/components/display/SlaTimerBadge.tsx`. Used by ticket cards and Ticket_Detail header.
22. `MentionTextInput` — a text input that shows `@name` suggestion list as the user types `@`. Extract to `shared/components/forms/MentionTextInput.tsx`. Used by inline card comments, Ticket_Detail Comments tab, and Programming page Comments tab.
23. `ChecklistItem` — a single solution step row (checkbox + text + optional delete button). Extract to `shared/components/display/ChecklistItem.tsx`. Used by Programming Panel Solution Checklist tab.
24. `FileAttachmentList` — the file list panel (header, upload zone, file rows with thumbnail/name/size/delete). Extract to `shared/components/display/FileAttachmentList.tsx`. Used by Ticket_Detail Attachments tab.

**Architecture rules:**
25. THE Tickets_Screen SHALL follow the 3-state orchestration pattern (list → detail → edit) using `FeatureErrorBoundary` on each view state.
26. THE TicketForm SHALL use `useForm` with `zodResolver`, `AppFormField` for text inputs, `Controller` for non-text inputs, and `FormSection` for field grouping.
27. THE TicketForm SHALL implement the `doSave` pattern: toast before `onClose`, duplicate error detection with `isDuplicateError` ref, and no generic `toast.error` for non-specific API errors.
28. ALL screens SHALL use `useThemeColors()` for colors — no hardcoded hex values.
29. ALL icons SHALL use `<Ionicons>` from `@expo/vector-icons` — no emoji in UI components.
30. ALL new shared components used inside `<Modal>` SHALL follow the Modal-safety rule (no `useThemeColors()` internally — receive `resolvedColors` as prop or call hook before Modal renders).
31. ALL layout SHALL use `marginStart`/`marginEnd` instead of `marginLeft`/`marginRight` for RTL compatibility.
32. THE Dashboard SHALL use `useDirection()` from `DirectionProvider` for text alignment — never hardcode `textAlign: 'left'`.
33. ALL new i18n keys SHALL be added to both `en.json` and `ar.json` with matching structure.
34. ALL API paths SHALL use `API.TICKETS.*` from `mobile/src/constants/api.ts` — no hardcoded URL strings.
35. THE `mobile-component-pattern.md` catalogue SHALL be updated to document every new shared component extracted by this feature.
