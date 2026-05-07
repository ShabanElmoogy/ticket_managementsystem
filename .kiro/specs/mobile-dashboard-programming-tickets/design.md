# Design Document — Mobile Dashboard, Tickets & Programming Page

## Overview

This document describes the technical design for three interconnected mobile screens in the React Native / Expo app: the **Dashboard** (social-post ticket feed with real-time activity), the **Tickets** screen (full CRUD with detail view), and the **Programming Page** (dedicated screen for programmer/admin roles). Together they replicate the web's ticket management capabilities while following the established mobile architecture patterns.

The three features share a common data layer (`ticketsApi`), a set of new shared components (`TicketCard`, `ActivityFeedItem`, `SlaTimerBadge`, `MentionTextInput`, `ChecklistItem`, `FileAttachmentList`), and the existing Socket.IO infrastructure (`socketService.ts`).

---

## Architecture

### Feature Folder Layout

```
mobile/src/features/
├── dashboard/
│   ├── api/
│   │   └── dashboard.ts              ← DashboardApiService (stats + activities)
│   ├── components/
│   │   ├── StatsCards.tsx            ← Stats row with skeleton loading
│   │   ├── TicketFeedFilter.tsx      ← Filter bar (search, selectors, chips)
│   │   ├── TicketFeed.tsx            ← FlatList of TicketCard (Feed/Grid/Compact)
│   │   ├── BulkActionBar.tsx         ← Bulk status update bar (admin only)
│   │   ├── ActivityFeedPanel.tsx     ← Collapsible activity feed panel
│   │   ├── CreateTicketButton.tsx    ← FAB / inline create entry (admin only)
│   │   └── activityFeed/
│   │       ├── ActivityFeedHeader.tsx
│   │       ├── ActivityTypeFilter.tsx
│   │       └── useActivitySocket.ts  ← Socket.IO hook for activity feed
│   ├── hooks/
│   │   ├── useDashboard.ts           ← Stats + ticket list + filter state
│   │   └── useActivityFeed.ts        ← Activity items, read/unread, socket
│   ├── schemas/
│   │   └── createTicketSchema.ts     ← Zod schema for quick-create form
│   ├── utils/
│   │   ├── computeStats.ts           ← Pure: Ticket[] → DashboardStats
│   │   └── activityConfig.ts         ← Type → color/icon/label config map
│   └── DashboardScreen.tsx           ← Screen entry point
│
├── tickets/
│   ├── api/
│   │   └── tickets.ts                ← TicketsApiService (full CRUD + sub-resources)
│   ├── components/
│   │   ├── TicketForm.tsx            ← Create/edit form (page + modal modes)
│   │   ├── TicketDetailScreen.tsx    ← Full-screen 4-tab detail view
│   │   ├── tabs/
│   │   │   ├── OverviewTab.tsx
│   │   │   ├── CommentsTab.tsx
│   │   │   ├── AttachmentsTab.tsx
│   │   │   └── ActivityTab.tsx
│   │   ├── AssignProgrammerSheet.tsx ← Bottom sheet programmer picker
│   │   └── ticketColumns.tsx         ← ColDef[] for AdminCrudScreen table view
│   ├── hooks/
│   │   ├── useTickets.ts             ← useAdminFeature wrapper
│   │   └── useTicketDetail.ts        ← Detail data + tab state + actions
│   ├── schemas/
│   │   └── ticketSchema.ts           ← Zod schema for TicketForm
│   ├── utils/
│   │   ├── slaUtils.ts               ← Pure: computeSlaState(ticket, now)
│   │   ├── mentionUtils.ts           ← Pure: extractMentions / formatMentions
│   │   └── exportTicketPdf.ts        ← PDF export
│   └── TicketsScreen.tsx             ← 3-state orchestration (list/detail/edit)
│
└── programming/
    ├── api/
    │   └── programming.ts            ← ProgrammingApiService
    ├── components/
    │   ├── ProgrammingTicketList.tsx  ← Left panel: ticket list
    │   ├── ProgrammingDetailPanel.tsx ← Right panel: 3-tab detail
    │   ├── ProgrammingPanel.tsx       ← 3-sub-tab panel (Technical/Steps/Snippets)
    │   ├── TechnicalInfoSection.tsx
    │   ├── SolutionChecklistSection.tsx
    │   └── CodeSnippetsSection.tsx
    ├── hooks/
    │   ├── useProgrammingTickets.ts   ← Ticket list + filter + selection
    │   └── useProgrammingDetails.ts  ← Fetch/save ProgrammingDetails
    ├── schemas/
    │   └── programmingSchema.ts      ← Zod for TechnicalInfo fields
    └── ProgrammingScreen.tsx         ← Master-detail layout
```

### New Shared Components

Six new components are extracted to `mobile/src/shared/components/`:

```
shared/components/
├── display/
│   ├── TicketCard.tsx          ← Social-post card (header/badges/content/actions)
│   ├── ActivityFeedItem.tsx    ← Single activity item (avatar/accent/text/chips)
│   ├── SlaTimerBadge.tsx       ← SLA countdown/elapsed chip
│   └── ChecklistItem.tsx       ← Solution step row (checkbox/text/delete)
└── forms/
    ├── MentionTextInput.tsx    ← @mention-aware text input with suggestion list
    └── FileAttachmentList.tsx  ← File list panel (upload zone + file rows)
```

All six new shared components are **Modal-safe**: they receive `resolvedColors` as a prop and do not call `useThemeColors()` internally.

### State Management

| State | Location |
|---|---|
| Ticket list + filters | `useDashboard` (React Query + local filter state) |
| Activity feed items | `useActivityFeed` (local state, Socket.IO updates) |
| Ticket detail | `useTicketDetail` (React Query, `QUERY_KEYS.TICKETS.detail(id)`) |
| Programming details | `useProgrammingDetails` (React Query, `QUERY_KEYS.PROGRAMMING.detail(id)`) |
| Selected programming ticket | `useProgrammingTickets` (local `useState`) |
| Auth / role / tenant | `useAuthStore` (Zustand, existing) |
| Theme colors | `useThemeColors()` (existing) |
| Direction (RTL) | `useDirection()` (existing) |

---

## Components and Interfaces

### API Services

#### `DashboardApiService` (`features/dashboard/api/dashboard.ts`)

```typescript
class DashboardApiService extends BaseApiService {
  getStats      = ()          => this.get<DashboardStats>(API.DASHBOARD.STATS);
  getActivities = (limit = 20) => this.get<ActivityItem[]>(`/dashboard/activities?limit=${limit}`);
}
export const dashboardApi  = new DashboardApiService();
export const dashboardKeys = QUERY_KEYS.DASHBOARD;
```

#### `TicketsApiService` (`features/tickets/api/tickets.ts`)

```typescript
class TicketsApiService extends BaseApiService {
  getTickets         = (filters?: TicketFilters)                    => this.get<Ticket[]>(buildTicketQuery(filters ?? {}));
  getTicket          = (id: string)                                 => this.get<TicketWithComments>(API.TICKETS.BY_ID(id));
  createTicket       = (data: CreateTicketData)                     => this.post<Ticket>(API.TICKETS.LIST, data);
  updateTicket       = (id: string, data: Partial<CreateTicketData>) => this.put<Ticket>(API.TICKETS.BY_ID(id), data);
  deleteTicket       = (id: string)                                 => this.delete<{ message: string }>(API.TICKETS.BY_ID(id));
  bulkUpdate         = (ids: string[], status: TicketStatus)        => this.patch<{ updated: number }>(API.TICKETS.BULK, { ids, status });
  takeTicket         = (id: string)                                 => this.post<Ticket>(API.TICKETS.TAKE(id), {});
  reassignTicket     = (id: string, assignedToId: string)           => this.put<Ticket>(API.TICKETS.REASSIGN(id), { assignedToId });
  restoreTicket      = (id: string)                                 => this.post<Ticket>(API.TICKETS.RESTORE(id), {});
  addComment         = (id: string, content: string)                => this.post<Comment>(API.TICKETS.COMMENTS(id), { content });
  deleteComment      = (id: string, commentId: string)              => this.delete<{ message: string }>(API.TICKETS.COMMENT_BY_ID(id, commentId));
  getComments        = (id: string)                                 => this.get<Comment[]>(API.TICKETS.COMMENTS(id));
  getAttachments     = (id: string)                                 => this.get<Attachment[]>(API.TICKETS.ATTACHMENTS(id));
  uploadAttachment   = (id: string, file: FormData)                 => this.post<Attachment>(API.TICKETS.ATTACHMENTS(id), file);
  deleteAttachment   = (id: string, attachmentId: string)           => this.delete<{ message: string }>(API.TICKETS.ATTACHMENT_BY_ID(id, attachmentId));
  getActivities      = (id: string)                                 => this.get<TicketActivity[]>(`${API.TICKETS.BY_ID(id)}/activities`);
  watchTicket        = (id: string)                                 => this.post<{ watching: boolean }>(API.TICKETS.WATCH(id), {});
  getWatchers        = (id: string)                                 => this.get<User[]>(API.TICKETS.WATCHERS(id));
  assignProgrammer   = (id: string, programmerId: string)           => this.post<Ticket>(API.TICKETS.ASSIGN_PROGRAMMER(id), { programmerId });
  getProgramming     = (id: string)                                 => this.get<ProgrammingDetails>(API.TICKETS.PROGRAMMING(id));
  saveProgramming    = (id: string, data: Partial<ProgrammingDetails>) => this.put<ProgrammingDetails>(API.TICKETS.PROGRAMMING(id), data);
}
export const ticketsApi  = new TicketsApiService();
export const ticketsKeys = QUERY_KEYS.TICKETS;
```

### New Shared Component Interfaces

#### `TicketCard` (`shared/components/display/TicketCard.tsx`)

```typescript
interface TicketCardProps {
  ticket:           Ticket;
  resolvedColors:   ThemeColors;
  viewMode:         'feed' | 'grid' | 'compact';
  isSelected?:      boolean;           // bulk selection
  onSelect?:        (id: string) => void;
  onPress:          (ticket: Ticket) => void;
  onShare?:         (ticket: Ticket) => void;
  onTake?:          (id: string) => void;
  onStatusChange?:  (id: string, status: TicketStatus) => void;
  onDelete?:        (id: string) => void;
  onRestore?:       (id: string) => void;
  onReassign?:      (id: string) => void;
  onEditDueDate?:   (id: string, date: string) => void;
  onAssignProgrammer?: (id: string) => void;
  onActivityPress?: (id: string) => void;
  canUpdateStatus:  boolean;
  isAdmin:          boolean;
  currentUserId:    string;
  tenantSuspended:  boolean;
  showCheckbox?:    boolean;
}
```

#### `ActivityFeedItem` (`shared/components/display/ActivityFeedItem.tsx`)

```typescript
interface ActivityFeedItemProps {
  activity:       ActivityItem;
  resolvedColors: ThemeColors;
  onPress:        (activity: ActivityItem) => void;
  onMarkRead:     (id: string) => void;
  onMarkUnread:   (id: string) => void;
  isLoading?:     boolean;
}
```

#### `SlaTimerBadge` (`shared/components/display/SlaTimerBadge.tsx`)

```typescript
interface SlaTimerBadgeProps {
  slaDeadline:    string;
  status:         TicketStatus;
  resolvedColors: ThemeColors;
  size?:          'sm' | 'md';
}
```

#### `MentionTextInput` (`shared/components/forms/MentionTextInput.tsx`)

```typescript
interface MentionTextInputProps {
  value:          string;
  onChange:       (text: string) => void;
  onSubmit:       () => void;
  users:          { id: string; name: string }[];
  placeholder?:   string;
  disabled?:      boolean;
  resolvedColors: ThemeColors;
  style?:         ViewStyle;
}
```

#### `ChecklistItem` (`shared/components/display/ChecklistItem.tsx`)

```typescript
interface ChecklistItemProps {
  step:           SolutionStep;
  canEdit:        boolean;
  onToggle:       (order: number) => void;
  onDelete?:      (order: number) => void;
  resolvedColors: ThemeColors;
}
```

#### `FileAttachmentList` (`shared/components/display/FileAttachmentList.tsx`)

```typescript
interface FileAttachmentListProps {
  attachments:    Attachment[];
  onUpload?:      (files: DocumentPickerAsset[]) => Promise<void>;
  onDelete?:      (attachmentId: string) => void;
  onSelect:       (attachment: Attachment) => void;
  selectedId?:    string;
  readonly:       boolean;
  uploading?:     boolean;
  uploadProgress?: number;
  resolvedColors: ThemeColors;
}
```

### Screen Component Interfaces

#### `DashboardScreen`

Renders the full dashboard. Composes `StatsCards`, `TicketFeedFilter`, `TicketFeed`, `BulkActionBar`, and `ActivityFeedPanel`. Manages filter state via `useDashboard`. Navigates to `TicketDetailScreen` on card press.

#### `TicketsScreen`

3-state orchestration (list → detail → edit) following the `CustomersScreen` pattern exactly. Uses `AdminCrudScreen` for the list view with `TicketCard` as the row renderer in Feed mode and `DataCard` in Grid/Compact modes.

#### `TicketDetailScreen`

Full-screen view with 4 tabs. Receives `ticketId` prop. Uses `useTicketDetail` for data. Renders `OverviewTab`, `CommentsTab`, `AttachmentsTab`, `ActivityTab`. Shows `ProgrammingPanel` inside `OverviewTab` when ticket is in a programming-phase status.

#### `ProgrammingScreen`

Master-detail layout. Left panel: `ProgrammingTicketList`. Right panel: `ProgrammingDetailPanel` (3 tabs: Ticket Info, Programming, Comments). On narrow screens (< 768px), shows list first; selecting a ticket slides in the detail panel.

---

## Data Models

### Extended Types (additions to `mobile/src/services/api/types/`)

#### `ticket.ts` additions

```typescript
// Already exists — no changes needed to Ticket, Comment, TicketActivity, TicketWithComments
// Add to CreateTicketData:
export interface CreateTicketData {
  title:           string;
  description:     string;
  priority:        'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?:         TicketStatus;          // edit mode only
  assignedToId?:   string;
  customerId?:     string;
  applicationId?:  string;
  dueDate?:        string;
  estimatedHours?: number;
  templateId?:     string;               // for template pre-fill
}

export interface BulkUpdateData {
  ids:    string[];
  status: TicketStatus;
}
```

#### `attachment.ts` (new or extend existing)

```typescript
export interface Attachment {
  id:          string;
  filename:    string;
  url:         string;
  size:        number;
  mimeType:    string;
  createdAt:   string;
  uploadedBy:  { id: string; name: string };
}
```

#### `dashboard.ts` additions

```typescript
// Extend existing DashboardStats:
export interface DashboardStats {
  totalTickets:            number;
  openTickets:             number;
  inProgressTickets:       number;
  resolvedTickets:         number;
  closedTickets:           number;
  programmingPhaseTickets: number;   // ADD: sum of PROGRAMMING+UNDER_DEV+CODE_REVIEW+TESTING
  avgEstimationAccuracy?:  number | null;
  avgResolutionHours?:     number | null;
}
```

### Utility Types (feature-local)

```typescript
// features/dashboard/utils/computeStats.ts
export interface ComputedStats {
  total:       number;
  open:        number;
  inProgress:  number;
  programming: number;
  resolved:    number;
  closed:      number;
}

// features/tickets/utils/slaUtils.ts
export interface SlaState {
  isOverdue:     boolean;
  displayText:   string;   // e.g. "2h 30m left" or "1h overdue"
  colorToken:    'warning' | 'error' | 'success';
}

// features/dashboard/utils/activityConfig.ts
export interface ActivityTypeConfig {
  label:      string;
  icon:       IoniconName;
  color:      string;       // Palette.* constant
  filterKey:  ActivityTypeFilter;
  width:      'full' | 'half';
}
```

### Query Keys (additions to `mobile/src/constants/api.ts`)

```typescript
// Add to QUERY_KEYS:
PROGRAMMING: {
  detail: (id: string) => ['programming', id] as const,
},
ACTIVITIES: {
  recent: ['activities', 'recent'] as const,
},
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Stats sum invariant

*For any* array of tickets, the sum of per-status counts computed by `computeStats(tickets)` SHALL equal the total ticket count: `open + inProgress + programming + resolved + closed === total`.

**Validates: Requirements 1.5**

---

### Property 2: Filter reduces count

*For any* ticket array and any filter combination, the count of filtered tickets SHALL be less than or equal to the count of unfiltered tickets: `filterTickets(tickets, filters).length <= tickets.length`.

**Validates: Requirements 2.7**

---

### Property 3: Status filter correctness

*For any* ticket array and any selected `TicketStatus` value, every ticket in the filtered result SHALL have that exact status: `filterTickets(tickets, { status }).every(t => t.status === status)`.

**Validates: Requirements 2.8**

---

### Property 4: Bulk update status invariant

*For any* set of selected ticket IDs and any target status, after a successful bulk update, every ticket whose ID was in the selection SHALL have the new status in the resulting state.

**Validates: Requirements 6.5**

---

### Property 5: Mention round-trip

*For any* array of user names, formatting them as `@name` tokens and then extracting the mentions SHALL produce the same set of names: `extractMentions(formatMentions(users)) deepEquals users`.

**Validates: Requirements 11.4**

---

### Property 6: SLA overdue logic invariant

*For any* ticket, `computeSlaState(ticket, now).isOverdue` SHALL be `true` if and only if `ticket.slaDeadline < now` AND `ticket.status` is not in `['RESOLVED', 'CLOSED']`.

**Validates: Requirements 12.5**

---

### Property 7: Programming phase filter invariant

*For any* ticket array, every ticket returned by `filterProgrammingTickets(tickets)` SHALL have a status in `['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED']`, and `isProgrammingPhase(status)` SHALL return `true` for exactly those status values.

**Validates: Requirements 13.5, 18.20**

---

### Property 8: Programming details round-trip

*For any* valid `ProgrammingDetails` object, saving it via `saveProgramming(id, data)` and then fetching via `getProgramming(id)` SHALL return an object equivalent to the saved data (all fields preserved).

**Validates: Requirements 14.7**

---

### Property 9: Add step increases length by 1

*For any* `SolutionStep[]` array and any non-empty step text, calling `addStep(steps, text)` SHALL return an array with length exactly `steps.length + 1`.

**Validates: Requirements 15.9**

---

### Property 10: Remove step re-indexes contiguously

*For any* `SolutionStep[]` array with at least one element and any valid index `i`, calling `removeStep(steps, i)` SHALL return an array where `result[j].order === j` for all `j` in `[0, result.length - 1]`.

**Validates: Requirements 15.10**

---

## Error Handling

All error handling follows the established `mobile-error-toast-pattern.md` rules:

### API Errors

- **Generic API errors** (4xx/5xx): `NetworkErrorDialog` shows automatically via `httpClient` interceptor. No additional `toast.error()` call.
- **Duplicate errors** (ticket title already exists): `isDuplicateError` ref + specific `toast.error()` + `networkEvents.onOkPress` to close form.
- **Associated data errors** on delete: `isAssociatedDataError()` check + `pendingForceTarget` ref pattern.

### Form Errors

- `TicketForm` uses `doSave` pattern: `toast.success()` before `onClose()`, duplicate detection in catch, no generic toast for other errors.
- `TechnicalInfoSection` save: on failure, `NetworkErrorDialog` handles display — no additional toast.

### Socket Errors

- Socket connection failures are logged but do not surface to the user (foreground-only, non-critical).
- On reconnect, `useActivityFeed` refetches the latest 20 activities.

### Empty States

All empty states use `AppEmptyState` with `ionicon` prop (no emoji):

| Screen / Tab | Icon | Message |
|---|---|---|
| Ticket Feed (no tickets) | `ticket-outline` | "No tickets found" |
| Comments (no comments) | `chatbubble-outline` | "No comments yet" |
| Attachments (no files) | `attach-outline` | "No files attached" |
| Activity tab (no events) | `time-outline` | "No activity recorded yet" |
| Activity Feed (no activities) | `notifications-outline` | "No activities yet" |
| Activity Feed (search empty) | `search-outline` | "No matching activities" |
| Solution Steps (none) | `checkmark-circle-outline` | "No solution steps added yet" |
| Code Snippets (none) | `code-slash-outline` | "No code snippets added yet" |
| Technical Info (none, read-only) | `information-circle-outline` | "No technical details added yet" |
| Programming Page (no selection) | `code-slash-outline` | "Select a ticket to view details" |

### Loading States

- `StatsCards`: skeleton placeholders (animated `Animated.Value` opacity pulse) while loading.
- `TicketFeed`: `FlatList` with `ListFooterComponent` spinner on pagination load.
- `TicketDetailScreen`: full-screen skeleton layout while initial fetch is in progress.
- `ProgrammingPanel`: inline `ActivityIndicator` in the panel header while fetching.
- `AttachmentsTab`: `LinearProgress` bar during file upload.

---

## Testing Strategy

### Unit Tests — Pure Utility Functions

These pure functions have no side effects and are directly testable:

| Function | File | What to test |
|---|---|---|
| `computeStats(tickets)` | `dashboard/utils/computeStats.ts` | Stats sum invariant (Property 1) |
| `filterTickets(tickets, filters)` | `dashboard/utils/computeStats.ts` | Filter reduces count (P2), status filter correctness (P3) |
| `computeSlaState(ticket, now)` | `tickets/utils/slaUtils.ts` | SLA overdue logic (P6) |
| `isProgrammingPhase(status)` | `tickets/utils/slaUtils.ts` | Programming phase invariant (P7) |
| `filterProgrammingTickets(tickets)` | `programming/utils/` | Programming phase filter (P7) |
| `extractMentions(text)` | `tickets/utils/mentionUtils.ts` | Mention round-trip (P5) |
| `formatMentions(users)` | `tickets/utils/mentionUtils.ts` | Mention round-trip (P5) |
| `addStep(steps, text)` | `programming/utils/stepUtils.ts` | Add step length (P9) |
| `removeStep(steps, index)` | `programming/utils/stepUtils.ts` | Remove step re-index (P10) |

### Property-Based Tests

Use **fast-check** (already available in the JS ecosystem, zero native dependencies) for property-based testing. Each property test runs a minimum of **100 iterations**.

```typescript
// Tag format: Feature: mobile-dashboard-programming-tickets, Property N: <text>
```

**P1 — Stats sum invariant:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 1: stats sum invariant
fc.assert(fc.property(
  fc.array(fc.record({ status: fc.constantFrom(...ALL_STATUSES) })),
  (tickets) => {
    const stats = computeStats(tickets as Ticket[]);
    return stats.open + stats.inProgress + stats.programming + stats.resolved + stats.closed === stats.total;
  }
), { numRuns: 100 });
```

**P2 — Filter reduces count:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 2: filter reduces count
fc.assert(fc.property(
  fc.array(arbitraryTicket()),
  arbitraryTicketFilters(),
  (tickets, filters) => filterTickets(tickets, filters).length <= tickets.length
), { numRuns: 100 });
```

**P3 — Status filter correctness:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 3: status filter correctness
fc.assert(fc.property(
  fc.array(arbitraryTicket()),
  fc.constantFrom(...ALL_STATUSES),
  (tickets, status) => filterTickets(tickets, { status }).every(t => t.status === status)
), { numRuns: 100 });
```

**P5 — Mention round-trip:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 5: mention round-trip
fc.assert(fc.property(
  fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z\s]+$/.test(s))),
  (names) => {
    const formatted = formatMentions(names);
    const extracted = extractMentions(formatted);
    return JSON.stringify(extracted.sort()) === JSON.stringify(names.sort());
  }
), { numRuns: 100 });
```

**P6 — SLA overdue logic:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 6: SLA overdue logic invariant
fc.assert(fc.property(
  arbitraryTicketWithSla(),
  fc.date(),
  (ticket, now) => {
    const state = computeSlaState(ticket, now);
    const expectedOverdue = ticket.slaDeadline != null
      && new Date(ticket.slaDeadline) < now
      && !['RESOLVED', 'CLOSED'].includes(ticket.status);
    return state.isOverdue === expectedOverdue;
  }
), { numRuns: 100 });
```

**P7 — Programming phase filter:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 7: programming phase filter invariant
fc.assert(fc.property(
  fc.array(arbitraryTicket()),
  (tickets) => {
    const result = filterProgrammingTickets(tickets);
    return result.every(t => PROGRAMMING_STATUSES.includes(t.status));
  }
), { numRuns: 100 });
```

**P9 — Add step increases length:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 9: add step increases length by 1
fc.assert(fc.property(
  fc.array(arbitrarySolutionStep()),
  fc.string({ minLength: 1 }),
  (steps, text) => addStep(steps, text).length === steps.length + 1
), { numRuns: 100 });
```

**P10 — Remove step re-indexes:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property 10: remove step re-indexes contiguously
fc.assert(fc.property(
  fc.array(arbitrarySolutionStep(), { minLength: 1 }),
  fc.nat(),
  (steps, rawIndex) => {
    const index = rawIndex % steps.length;
    const result = removeStep(steps, index);
    return result.every((s, i) => s.order === i);
  }
), { numRuns: 100 });
```

### Integration Tests (Example-Based)

These tests verify wiring between components and the API layer using mocked API responses:

- `TicketForm` submit → `ticketsApi.createTicket` called with correct payload
- `TicketDetailScreen` loads → `ticketsApi.getTicket(id)` called, tabs render correctly
- `ActivityFeedPanel` socket event → new item prepended to list
- `ProgrammingPanel` save → `ticketsApi.saveProgramming(id, data)` called
- `AssignProgrammerSheet` confirm → `ticketsApi.assignProgrammer(id, programmerId)` called

### Snapshot / Smoke Tests

- `TicketCard` renders in Feed, Grid, and Compact modes without crashing
- `SlaTimerBadge` renders for overdue and non-overdue states
- `ActivityFeedItem` renders for each of the 9 activity types
- `ProgrammingScreen` redirects non-programmer/non-admin users

### Property-Based Testing Library

**Library:** `fast-check` (`npm install --save-dev fast-check`)

**Configuration:** Each property test uses `{ numRuns: 100 }` minimum. Arbitraries for domain types (`arbitraryTicket`, `arbitrarySolutionStep`, etc.) are defined in `__tests__/arbitraries/` and shared across test files.

**Tag format for each test:**
```typescript
// Feature: mobile-dashboard-programming-tickets, Property N: <property text>
```
