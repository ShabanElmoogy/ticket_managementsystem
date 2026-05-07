# Implementation Tasks

## Task List

- [x] 1. Foundation — API constants, types, and query keys
  - [x] 1.1 Add `API.TICKETS.*` endpoint paths to `mobile/src/constants/api.ts` (LIST, BY_ID, BULK, TAKE, REASSIGN, RESTORE, COMMENTS, COMMENT_BY_ID, ATTACHMENTS, ATTACHMENT_BY_ID, WATCH, WATCHERS, ASSIGN_PROGRAMMER, PROGRAMMING)
  - [x] 1.2 Add `QUERY_KEYS.TICKETS`, `QUERY_KEYS.PROGRAMMING`, `QUERY_KEYS.ACTIVITIES` to `mobile/src/constants/api.ts`
  - [x] 1.3 Add `API.DASHBOARD.STATS` and `API.DASHBOARD.ACTIVITIES` to `mobile/src/constants/api.ts`
  - [x] 1.4 Extend `CreateTicketData`, add `BulkUpdateData`, `Attachment` interfaces in `mobile/src/services/api/types/`
  - [x] 1.5 Extend `DashboardStats` with `programmingPhaseTickets` field in types

- [x] 2. API Services
  - [x] 2.1 Create `mobile/src/features/tickets/api/tickets.ts` — `TicketsApiService` with all CRUD + sub-resource methods (getTickets, getTicket, createTicket, updateTicket, deleteTicket, bulkUpdate, takeTicket, reassignTicket, restoreTicket, addComment, deleteComment, getComments, getAttachments, uploadAttachment, deleteAttachment, getActivities, watchTicket, getWatchers, assignProgrammer, getProgramming, saveProgramming)
  - [x] 2.2 Create `mobile/src/features/dashboard/api/dashboard.ts` — `DashboardApiService` with `getStats` and `getActivities`
  - [x] 2.3 Create `mobile/src/features/programming/api/programming.ts` — `ProgrammingApiService` wrapping ticket programming endpoints

- [x] 3. Pure utility functions + property-based tests
  - [x] 3.1 Create `mobile/src/features/dashboard/utils/computeStats.ts` — `computeStats(tickets)` and `filterTickets(tickets, filters)` pure functions
  - [x] 3.2 Create `mobile/src/features/dashboard/utils/activityConfig.ts` — `ACTIVITY_TYPE_CONFIG` map (type → label, icon, color, filterKey, width)
  - [x] 3.3 Create `mobile/src/features/tickets/utils/slaUtils.ts` — `computeSlaState(ticket, now)` and `isProgrammingPhase(status)` pure functions
  - [x] 3.4 Create `mobile/src/features/tickets/utils/mentionUtils.ts` — `extractMentions(text)` and `formatMentions(users)` pure functions
  - [x] 3.5 Create `mobile/src/features/programming/utils/stepUtils.ts` — `addStep(steps, text)` and `removeStep(steps, index)` pure functions
  - [x] 3.6 Install `fast-check` dev dependency and create `__tests__/arbitraries/ticketArbitraries.ts` with shared arbitraries
  - [x] 3.7 Write property-based tests for P1 (stats sum invariant), P2 (filter reduces count), P3 (status filter correctness) in `computeStats.test.ts`
  - [x] 3.8 Write property-based tests for P5 (mention round-trip) in `mentionUtils.test.ts`
  - [x] 3.9 Write property-based tests for P6 (SLA overdue logic invariant) in `slaUtils.test.ts`
  - [x] 3.10 Write property-based tests for P7 (programming phase filter invariant) in `stepUtils.test.ts`
  - [x] 3.11 Write property-based tests for P9 (add step length) and P10 (remove step re-index) in `stepUtils.test.ts`

- [-] 4. New shared components
  - [x] 4.1 Create `mobile/src/shared/components/display/SlaTimerBadge.tsx` — SLA countdown/elapsed chip, Modal-safe (receives `resolvedColors`), uses `computeSlaState` internally with `setInterval` for live countdown
  - [x] 4.2 Create `mobile/src/shared/components/forms/MentionTextInput.tsx` — `@name` mention-aware text input with suggestion list overlay, Modal-safe (receives `resolvedColors`)
  - [x] 4.3 Create `mobile/src/shared/components/display/ChecklistItem.tsx` — solution step row (checkbox + strikethrough text + optional delete button), Modal-safe
  - [x] 4.4 Create `mobile/src/shared/components/display/FileAttachmentList.tsx` — file list panel (upload zone + file rows with thumbnail/name/size/delete), Modal-safe, uses `expo-document-picker` for file selection
  - [x] 4.5 Create `mobile/src/shared/components/display/ActivityFeedItem.tsx` — single activity item (colored avatar, 4px accent bar, primary/secondary text, chips row, pulsing unread dot), Modal-safe
  - [-] 4.6 Create `mobile/src/shared/components/display/TicketCard/` folder with split sub-components, Modal-safe throughout
    - [x] 4.6.1 Create `TicketCard/TicketCardHeader.tsx` — creator avatar (initials, colored by priority), creator name, relative timestamp, three-dot overflow menu trigger; receives `resolvedColors`
    - [x] 4.6.2 Create `TicketCard/TicketCardBadgeRow.tsx` — horizontal `ScrollView` of chips: status, priority, overdue (animated pulsing), SLA timer (`SlaTimerBadge`), email badge, customer chip, application chip; receives `resolvedColors`
    - [x] 4.6.3 Create `TicketCard/TicketCardContent.tsx` — bold title + description truncated to 200 chars with inline "See more" toggle; pressing the content area calls `onPress`; receives `resolvedColors`
    - [x] 4.6.4 Create `TicketCard/TicketCardMeta.tsx` — compact info row: due date, assigned-to avatar + name, estimated hours; receives `resolvedColors`
    - [x] 4.6.5 Create `TicketCard/TicketCardActionBar.tsx` — full-width row: 💬 Comment (count badge), 📊 Activity, 📤 Share (hidden when unavailable), ✅ Take (employee + unassigned only), three-dot overflow menu (View Details / status updates / Edit Due Date / Reassign / Send to Programmer / Delete / Restore — all role-gated); receives `resolvedColors`
    - [x] 4.6.6 Create `TicketCard/TicketCardComments.tsx` — inline expandable comment section: 3 most-recent comments on mount (auto-fetched when `_count.comments > 0`), "See X more" pagination (3 at a time), `MentionTextInput` at bottom, each comment shows avatar/name/timestamp/content with @mention highlighting/delete button; receives `resolvedColors`
    - [x] 4.6.7 Create `TicketCard/TicketCardOverflowMenu.tsx` — bottom-sheet style action menu rendered via `Modal`, lists all three-dot actions with role/state guards, dividers between groups; receives `resolvedColors`
    - [x] 4.6.8 Create `TicketCard/index.tsx` — root `TicketCard` component that composes all sub-components, manages `commentsExpanded` + `seeMoreExpanded` + `overflowMenuOpen` local state, supports `viewMode: 'feed' | 'grid' | 'compact'` (Share and inline comments only in feed mode), exports `TicketCardProps` interface
  - [x] 4.7 Update `mobile-component-pattern.md` catalogue to document all 6 new shared components

- [-] 5. Ticket form and schema
  - [x] 5.1 Create `mobile/src/features/tickets/schemas/ticketSchema.ts` — `createTicketFormSchema(t)` Zod factory with all fields (title, description, priority, status, assignedToId, customerId, applicationId, dueDate, estimatedHours)
  - [x] 5.2 Create `mobile/src/features/tickets/components/TicketForm.tsx` — dual-mode form (page + modal) following `mobile-form-pattern.md` exactly, with `FormSection` grouping, `AppFormField` for text inputs, `Controller` for `ChipSelector`/`AppDatePicker`, `doSave` pattern with duplicate detection
  - [x] 5.3 Create `mobile/src/features/tickets/utils/exportTicketPdf.ts` — PDF export using `expo-print` + `expo-sharing`

- [x] 6. Ticket detail screen — 4 tabs
  - [x] 6.1 Create `mobile/src/features/tickets/hooks/useTicketDetail.ts` — React Query hook fetching ticket by ID, tab state, watch toggle, comment add/delete, attachment upload/delete, status update
  - [x] 6.2 Create `mobile/src/features/tickets/components/tabs/OverviewTab.tsx` — DESCRIPTION card, TICKET DETAILS panel (PEOPLE + DATES & TIME sections), LINKED TO section, status-update panel, actual-hours input
  - [x] 6.3 Create `mobile/src/features/tickets/components/tabs/CommentsTab.tsx` — `MentionTextInput` at top + `Comment →` button, comment list with author avatar/name/timestamp/content/@mention highlighting/delete button, empty state
  - [x] 6.4 Create `mobile/src/features/tickets/components/tabs/AttachmentsTab.tsx` — `FileAttachmentList` (stacked layout on mobile), file preview panel (image with zoom, PDF via WebView, video, text, download fallback), prev/next navigation, delete confirmation
  - [x] 6.5 Create `mobile/src/features/tickets/components/tabs/ActivityTab.tsx` — timeline list using `ActivityFeedItem`, empty state
  - [x] 6.6 Create `mobile/src/features/tickets/components/TicketDetailScreen.tsx` — full-screen view with `AppScreenHeader` (Back + title + STATUS/PRIORITY chips + ticket ID + Watch button), `TabBar` with counts (Overview, Comments N, Attachments N, Activity N), renders 4 tab components, shows `ProgrammingPanel` in Overview when ticket is in programming-phase status
  - [x] 6.7 Create `mobile/src/features/tickets/components/AssignProgrammerSheet.tsx` — bottom sheet showing list of PROGRAMMER-role users, confirm button calls `ticketsApi.assignProgrammer`

- [x] 7. Programming Panel — 3 sub-tabs
  - [x] 7.1 Create `mobile/src/features/programming/hooks/useProgrammingDetails.ts` — React Query hook for `GET/PUT /tickets/:id/programming`
  - [x] 7.2 Create `mobile/src/features/programming/components/TechnicalInfoSection.tsx` — 3 multiline `AppTextInput` fields (Technical Description, Root Cause Analysis, Steps to Reproduce) + 2 side-by-side number fields (Estimated Hours, Actual Hours Spent) + 💾 Save button, disabled when `canEdit=false`
  - [x] 7.3 Create `mobile/src/features/programming/components/SolutionChecklistSection.tsx` — progress caption, list of `ChecklistItem` components, "Add a step..." `AppTextInput` + `+` button (Enter to add), 💾 Save Steps button
  - [x] 7.4 Create `mobile/src/features/programming/components/CodeSnippetsSection.tsx` — list of existing snippets (language header + `CodeBlock`), inline add form (Language `AppSelect` + Label field + Code `AppTextInput` multiline + Add/Cancel buttons), 💾 Save button
  - [x] 7.5 Create `mobile/src/features/programming/components/ProgrammingPanel.tsx` — purple `<> Programming Panel` header chip, `SubTabBar` (TECHNICAL INFO / SOLUTION STEPS / CODE SNIPPETS), renders the 3 section components, fetches data via `useProgrammingDetails`

- [x] 8. Dashboard screen
  - [x] 8.1 Create `mobile/src/features/dashboard/hooks/useActivityFeed.ts` — local state for 20 activities, read/unread tracking, Socket.IO listener via existing `socketService.ts`, AppState foreground refetch, mark read/unread/clear all actions
  - [x] 8.2 Create `mobile/src/features/dashboard/hooks/useDashboard.ts` — React Query for ticket list, filter state (search debounced 400ms, status, priority, user, customer, application, overdue, deleted), `computeStats` derived from filtered list, bulk selection state
  - [x] 8.3 Create `mobile/src/features/dashboard/components/StatsCards.tsx` — horizontal scroll row of 5 stat cards (Total, Open, In Progress, Resolved, Closed) using `Palette.*` colors, skeleton placeholders while loading
  - [x] 8.4 Create `mobile/src/features/dashboard/components/TicketFeedFilter.tsx` — filter bar with `AppSearchInput`, `AppSelect` dropdowns (Status, Priority, User with count badges, Customer, Application), Overdue toggle button, Deleted toggle (admin only), quick status chips (when no filters), results summary bar (when filters active), view toggle + Refresh button in header
  - [x] 8.5 Create `mobile/src/features/dashboard/components/TicketFeed.tsx` — `FlatList` of `TicketCard` components in Feed/Grid/Compact modes, handles onPress/onShare/onTake/onStatusChange/onDelete/onRestore/onReassign/onEditDueDate/onAssignProgrammer/onActivityPress callbacks
  - [x] 8.6 Create `mobile/src/features/dashboard/components/BulkActionBar.tsx` — appears when tickets are selected (admin only), shows count + `AppSelect` for status + Apply button, calls `ticketsApi.bulkUpdate`
  - [x] 8.7 Create `mobile/src/features/dashboard/components/activityFeed/ActivityFeedHeader.tsx` — bell icon with pulsing badge, title + subtitle, 4 icon buttons (Mark All Read ✓✓, Mark All Unread ○, Clear All ×, Collapse ∧/∨), rainbow gradient line at top edge
  - [x] 8.8 Create `mobile/src/features/dashboard/components/activityFeed/ActivityTypeFilter.tsx` — collapsible "Filter by Activity Type" row with 9 filter chips (each with count badge, colored border when active, type-specific gradient background)
  - [x] 8.9 Create `mobile/src/features/dashboard/components/ActivityFeedPanel.tsx` — collapsible panel composing `ActivityFeedHeader`, `ActivityTypeFilter`, `AppSearchInput`, `FlatList` of `ActivityFeedItem`, empty states, fade-in animation on items
  - [x] 8.10 Create `mobile/src/features/dashboard/DashboardScreen.tsx` — composes `StatsCards`, `TicketFeedFilter`, `TicketFeed`, `BulkActionBar`, `ActivityFeedPanel`, navigates to `TicketDetailScreen` on card press, opens `TicketForm` for create (admin only)

- [x] 9. Tickets screen — 3-state orchestration
  - [x] 9.1 Create `mobile/src/features/tickets/hooks/useTickets.ts` — `useAdminFeature` wrapper with `ticketsApi` CRUD methods, messages, column definitions
  - [x] 9.2 Create `mobile/src/features/tickets/components/ticketColumns.tsx` — `getTicketColumns(t)` factory returning `ColDef<Ticket>[]` for Grid/Compact view modes (title, status badge, priority badge, customer, assigned-to, created date)
  - [x] 9.3 Create `mobile/src/features/tickets/TicketsScreen.tsx` — 3-state orchestration (list → detail → edit) using `FeatureErrorBoundary` on each state, `AdminCrudScreen` with `TicketCard` in Feed mode and `DataCard` in Grid/Compact, PDF export button

- [x] 10. Programming screen — master-detail
  - [x] 10.1 Create `mobile/src/features/programming/hooks/useProgrammingTickets.ts` — React Query for programming-phase tickets (filtered by programmer ID for PROGRAMMER role, all for TENANT_ADMIN), search + status filter state, selected ticket state
  - [x] 10.2 Create `mobile/src/features/programming/components/ProgrammingTicketList.tsx` — left panel with "Programming Tickets" header + blue count badge + refresh icon, `AppSearchInput`, `AppSelect` status filter, `FlatList` of ticket items (initials avatar + title + status chip + "prog" label), selected item highlighted with left accent border
  - [x] 10.3 Create `mobile/src/features/programming/components/ProgrammingDetailPanel.tsx` — right panel with ticket title + status/priority chips + Assign/Reassign Programmer button (admin only), `TabBar` (TICKET INFO / PROGRAMMING / COMMENTS), renders `TicketInfoTab`, `ProgrammingPanel`, `CommentsTab`
  - [x] 10.4 Create `mobile/src/features/programming/ProgrammingScreen.tsx` — master-detail layout (list + detail side by side on wide screens, list → detail navigation on narrow screens), role guard (redirect non-PROGRAMMER/non-TENANT_ADMIN), empty state when no ticket selected (`code-slash-outline` + "Select a ticket to view details")

- [x] 11. i18n keys
  - [x] 11.1 Add all `tickets.*` keys to `mobile/src/i18n/locales/en.json` (title, itemType, addTitle, editTitle, notFound, searchPlaceholder, emptyMessage, emptyFilteredMessage, columns.*, form.*, sections.*, messages.*, duplicateError.*)
  - [x] 11.2 Add all `tickets.*` keys to `mobile/src/i18n/locales/ar.json` with Arabic translations
  - [x] 11.3 Add all `dashboard.*` keys to both locale files (title, filters.*, stats.*, activityFeed.*, bulkActions.*)
  - [x] 11.4 Add all `programming.*` keys to both locale files (title, panel.*, tabs.*, technicalInfo.*, solutionSteps.*, codeSnippets.*, messages.*)

- [x] 12. Navigation wiring
  - [x] 12.1 Wire `DashboardScreen` into the app's main navigation (replace or extend existing dashboard entry point)
  - [x] 12.2 Wire `TicketsScreen` into the admin drawer navigation with `ticket-outline` icon, visible to all authenticated roles
  - [x] 12.3 Wire `ProgrammingScreen` into the admin drawer navigation with `code-slash-outline` icon, visible only to `PROGRAMMER` and `TENANT_ADMIN` roles
  - [x] 12.4 Add `TicketDetailScreen` as a navigable destination (stack navigator or modal) reachable from Dashboard, Tickets, and Programming screens

- [-] 13. Final integration and diagnostics
  - [x] 13.1 Run `getDiagnostics` on all new and modified files — resolve all TypeScript errors to zero
  - [x] 13.2 Verify `TicketCard` renders correctly in Feed, Grid, and Compact modes
  - [x] 13.3 Verify `ActivityFeedPanel` receives Socket.IO events and prepends items in foreground
  - [x] 13.4 Verify `ProgrammingScreen` redirects users without PROGRAMMER or TENANT_ADMIN role
  - [x] 13.5 Verify all property-based tests pass with 100 iterations each
  - [x] 13.6 Verify all i18n keys exist in both `en.json` and `ar.json` with no missing keys
  - [ ] 13.7 Verify RTL layout — all spacing uses `marginStart`/`marginEnd`, text alignment uses `useDirection()`
  - [ ] 13.8 Verify all new shared components are documented in `mobile-component-pattern.md`
