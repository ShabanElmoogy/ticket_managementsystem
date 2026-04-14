# Mobile Replication Plan — Full Audit

Complete step-by-step guide based on thorough investigation of every web folder, hook, store, and component.

---

## What already exists in mobile/src/

```
✅ src/services/api/base.ts          — BaseApiService (copy of web)
✅ src/services/api/httpClient.ts    — Axios + AsyncStorage token
✅ src/services/socketService.ts     — Socket.IO with websocket transport
✅ src/stores/authStore.ts           — Zustand + AsyncStorage (simplified)
✅ src/stores/uiStore.ts             — direction + colorScheme
✅ src/i18n/index.ts                 — i18next + AsyncStorage + RTL
✅ src/i18n/locales/en.json          — copied from web
✅ src/i18n/locales/ar.json          — copied from web
✅ src/shared/hooks/useAuxData.ts    — React Query wrapper (5min stale)
✅ app/_layout.tsx                   — QueryClient + i18n init
✅ app/(tabs)/_layout.tsx            — Tab navigator (1 tab placeholder)
✅ app/(tabs)/index.tsx              — Dashboard placeholder
```

---

## Web stores inventory (what each one does)

| Store | State | Mobile action |
|---|---|---|
| `authStore` | token, refreshToken, user, tenantSuspended, tenantStatus, isAuthenticated | Rewrite with full web logic + AsyncStorage |
| `tenantStore` | dateFormat (dd/MM/yyyy etc.) | Copy + replace localStorage with AsyncStorage |
| `themeStore` | mode (light/dark), direction (ltr/rtl) | Merge into existing `uiStore` — no `document.dir` |
| `uiStore` | ticketView (list/grid/compact) | Add ticketView to existing uiStore |
| `kanbanStore` | boards, currentBoard, labels, notifications, analytics | Copy as-is — no platform code |

## Web hooks inventory (what each one does)

| Hook | Location | What it does | Mobile action |
|---|---|---|---|
| `useAdminFeature` | shared/hooks | CRUD state machine: dialog, snackbar, delete confirm, optimistic mutations | Copy as-is — zero platform code |
| `useEntityData` | shared/hooks | React Query getAll + create/update/delete with optimistic updates | Copy as-is |
| `useAuxData` | shared/hooks | React Query wrapper, 5min stale | ✅ Already done |
| `useDashboard` | dashboard/hooks | Tickets query + filters + stats + mutations + socket | Adapt: remove `useMediaQuery`, `useTheme` |
| `useTicketsQuery` | dashboard/hooks | All React Query hooks for tickets, users, customers, apps | Copy as-is |
| `useSocketQuery` | src/hooks | Invalidates React Query on socket notification | Copy + adapt getSocket call |
| `useNotifications` | src/hooks | Local notification state (mostly stub) | Copy as-is |
| `useActivitySocket` | activityFeed/hooks | Socket listener → ActivityItem state | Copy + remove Audio API |
| `useAdminDashboard` | adminDashboard/hooks | useAuxData for customers/apps/tickets → stats | Copy as-is |
| `useProfileSettings` | profile/hooks | Load/save profile + reminder settings | Copy as-is |
| `useEpicDetail` | epics/hooks | Epic detail data + comments + contributors | Copy as-is |
| `useEpicComments` | epics/hooks | Epic comments CRUD | Copy as-is |
| `useProgrammingDetails` | programming/hooks | Programming panel data | Copy as-is |

## Web shared utils inventory

| Util | What it does | Mobile action |
|---|---|---|
| `dateUtils.ts` | formatDate, formatDateTime, formatRelativeDuration using date-fns + tenantStore | Replace `date-fns` with `dayjs` (already installed) |
| `httpUtils.ts` | getErrorMessage, isNetworkError, retryRequest | Copy as-is |
| `notificationUtils.ts` | formatNotificationTime, createNotificationFromSocketData | Copy as-is — remove `playNotificationSound` (uses Audio API) |
| `activityUtils.ts` | getActivityMessage, getTypePalette, formatTime | Copy as-is — remove `useTheme` dependency |

---

## Phase 1 — Copy API types (5 min, zero changes)

Copy these files verbatim from `web/src/services/api/types/` → `mobile/src/services/api/types/`:

- `primitives.ts`
- `auth.ts`
- `user.ts`
- `ticket.ts`
- `customer.ts`
- `application.ts`
- `attachment.ts`
- `template.ts`
- `programming.ts`
- `epic.ts`
- `feature.ts`
- `notification.ts`
- `dashboard.ts`
- `index.ts`

Also copy:
- `web/src/types/roles.ts` → `mobile/src/types/roles.ts`
- `web/src/types/header.ts` → `mobile/src/types/header.ts` (remove React import — not needed)

**Verify:** getDiagnostics on `mobile/src/services/api/types/index.ts` → zero errors.

---

## Phase 2 — Stores (30 min)

### 2a — Rewrite authStore (full web version)

Rewrite `mobile/src/stores/authStore.ts` to match web exactly:
- Same `decodeToken()` / `isTokenExpired()` / `getTokenExpiresIn()` helpers
- Same `AuthState` interface (token, refreshToken, user, tenantSuspended, tenantStatus, isLoading, isAuthenticated)
- Same `login()`, `logout()`, `initializeAuth()`, `updateUser()`, `setToken()`, `setRefreshToken()`
- Replace ALL `localStorage.*` → `await AsyncStorage.*`
- Replace `import.meta.env.DEV` → `__DEV__`
- `initializeAuth` is async — call it in `app/_layout.tsx` on mount
- Keep `persist` with `createJSONStorage(() => AsyncStorage)`

### 2b — Add tenantStore

Create `mobile/src/stores/tenantStore.ts`:
- Copy web version exactly
- Remove `localStorage` (Zustand persist handles it via AsyncStorage)
- Keep `DATE_FORMATS`, `DateFormatValue`, `getDateFormat()`, `getPickerDateFormat()`

### 2c — Expand uiStore

Update `mobile/src/stores/uiStore.ts`:
- Add `ticketView: 'list' | 'grid' | 'compact'` (from web uiStore)
- Add `mode: 'light' | 'dark' | 'system'` (from web themeStore)
- Add `direction: 'ltr' | 'rtl'` (from web themeStore)
- Add `toggleTheme()`, `setMode()`, `setDirection()` actions
- Replace `document.documentElement.dir` with `I18nManager.forceRTL()`

---

## Phase 3 — Shared hooks (15 min, copy as-is)

Copy these files verbatim — zero platform-specific code:

- `web/src/shared/hooks/useEntityData.ts` → `mobile/src/shared/hooks/useEntityData.ts`
- `web/src/shared/hooks/useAdminFeature.ts` → `mobile/src/shared/hooks/useAdminFeature.ts`

---

## Phase 4 — Shared utils (20 min)

### 4a — dateUtils

Create `mobile/src/shared/utils/dateUtils.ts`:
- Same functions: `formatDate`, `formatDateTime`, `formatRelativeDuration`
- Replace `date-fns` with `dayjs` (already installed):
  ```ts
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  dayjs.extend(relativeTime);
  export const formatDate = (date: string | Date) =>
    dayjs(date).format(getPickerDateFormat()); // uses tenantStore
  export const formatRelativeDuration = (date: string | Date | number) =>
    dayjs(date).fromNow();
  ```

### 4b — httpUtils

Copy `web/src/shared/utils/httpUtils.ts` → `mobile/src/shared/utils/httpUtils.ts` verbatim.

### 4c — notificationUtils

Copy `web/src/shared/utils/notificationUtils.ts` → `mobile/src/shared/utils/notificationUtils.ts`:
- Remove `playNotificationSound()` function (uses `new Audio()` — not available in RN)
- Keep everything else

### 4d — activityUtils

Create `mobile/src/shared/utils/activityUtils.ts`:
- Copy `getActivityMessage()` and `formatTime()` from `activityUtils.ts`
- Remove `useTheme()` dependency — replace color palette with static color constants
- Export as plain functions (not a hook)

---

## Phase 5 — Shared RN components (2–3 hrs)

Build RN equivalents. No MUI. Use `View`, `Text`, `Pressable`, `TextInput`, `Modal`, `FlatList`.

```
mobile/src/shared/components/
├── AppText.tsx           — Text with typography variants (title/subtitle/body/caption)
├── AppButton.tsx         — Pressable + ActivityIndicator loading state
├── AppTextInput.tsx      — TextInput + label + error message + password toggle
├── AppSelect.tsx         — Modal + FlatList picker (replaces MUI Select)
├── AppCard.tsx           — View with shadow, border radius, padding
├── AppBadge.tsx          — Colored chip for status/priority (replaces MUI Chip)
├── AppDeleteDialog.tsx   — Modal with title + message + Cancel/Delete buttons
├── AppConfirmDialog.tsx  — Modal with type-to-confirm input
├── AppEmptyState.tsx     — Icon + message + optional action button
├── AppLoadingSpinner.tsx — ActivityIndicator centered in flex container
├── AppScreenHeader.tsx   — Title row + optional right action button
├── AppToast.tsx          — Snackbar equivalent (use react-native ToastAndroid or custom)
├── MetricCard.tsx        — Value + title + colored icon (replaces web MetricCard)
├── OverviewCard.tsx      — Total + active + rate % (replaces web OverviewCard)
└── index.ts              — barrel export
```

**Rules:**
- Accept `style` prop on every component
- Use `Colors` from `constants/theme.ts` for colors
- Use `useColorScheme()` for dark mode
- Use `useTranslation()` for any hardcoded strings
- `AppSelect` must support: `options[]`, `value`, `onChange`, `placeholder`, `loading`, `multiple`

---

## Phase 6 — Auth feature (1–2 hrs)

```
mobile/src/features/auth/
├── api/
│   └── auth.ts           — copy web/src/components/auth/api/auth.ts exactly
├── hooks/
│   └── useLoginForm.ts   — adapt from web
└── index.ts

mobile/app/(auth)/
├── _layout.tsx           — Stack, no header, redirect to /(app) if authenticated
└── login.tsx             — Login screen
```

### auth.ts
Copy `web/src/components/auth/api/auth.ts` exactly — only uses `BaseApiService`.

### useLoginForm.ts
Adapt from web `useLoginForm.ts`:
- Remove `useThemeStore` (not needed)
- Remove `React.FormEvent` — replace `handleSubmit(e)` with plain `handleSubmit()`
- Keep: `email`, `password`, `loading`, `error`, `tenantSlug`, `tenants`, `tenantsLoading`
- Keep: `handleTenantChange`, `handleSubmit`, `handleDemoLogin`
- After login: call `authStore.login()` + store token in AsyncStorage manually for httpClient

### login.tsx screen
- `AppTextInput` for email
- `AppTextInput` for password (fieldType password)
- `AppSelect` for tenant (loaded from `tenantsApi.listPublic()`)
- `AppButton` for submit
- Error message below form
- Language toggle (EN/AR) in top-right corner

### Auth guard in root layout
In `app/_layout.tsx`:
```tsx
const token = useAuthStore(s => s.token);
// After i18n ready: if no token → redirect to /(auth)/login
```

---

## Phase 7 — Dashboard feature (2 hrs)

```
mobile/src/features/dashboard/
├── api/
│   └── dashboard.ts      — copy web/src/components/dashboard/api/dashboard.ts
├── hooks/
│   └── useDashboard.ts   — adapt from web
└── index.ts

mobile/app/(app)/(tabs)/index.tsx  — Dashboard screen
```

### useDashboard.ts
Adapt from web `useDashboard.ts`:
- Remove `useTheme`, `useMediaQuery` — replace `isMobile` with `useWindowDimensions()`
- Keep all React Query hooks: `useTicketsQuery`, `useUsersQuery`, `useCustomersQuery`, `useApplicationsQuery`
- Keep all mutations: create, take, update, delete, addComment
- Keep `useSocketQuery()` call
- Keep all filter state, stats computation, handlers

### useTicketsQuery.ts
Copy `web/src/components/dashboard/hooks/useTicketsQuery.ts` exactly — zero platform code.
Place at `mobile/src/features/tickets/hooks/useTicketsQuery.ts`.

### useSocketQuery.ts
Copy `web/src/hooks/useSocketQuery.ts` → `mobile/src/shared/hooks/useSocketQuery.ts`:
- Adapt `getSocket(user.id, token)` call to match mobile socketService signature

### Dashboard screen
- Stats row: `ScrollView` horizontal with `MetricCard` per stat (total, open, in-progress, resolved, closed)
- Filter chips: `ScrollView` horizontal with `AppBadge` filter buttons
- Ticket list: `FlatList` with `TicketCard` component
- Pull-to-refresh: `refreshControl` prop
- FAB: "+" button to open create ticket modal

---

## Phase 8 — Tickets feature (2–3 hrs)

```
mobile/src/features/tickets/
├── api/
│   └── tickets.ts        — copy web admin ticketsManagement/api/tickets.ts
├── hooks/
│   ├── useTickets.ts     — adapt useTicketsManagement
│   └── useTicketsQuery.ts — from Phase 7
├── components/
│   ├── TicketCard.tsx    — single ticket row
│   ├── TicketFilters.tsx — status/priority filter chips
│   └── CreateTicketForm.tsx — form fields
└── index.ts

mobile/app/(app)/(tabs)/tickets.tsx    — Tickets list
mobile/app/(app)/tickets/[id].tsx      — Ticket detail
```

### TicketCard.tsx
- Title (bold, 2 lines max)
- `AppBadge` for status (color-coded: OPEN=amber, IN_PROGRESS=purple, RESOLVED=green, CLOSED=gray)
- `AppBadge` for priority (LOW=green, MEDIUM=amber, HIGH/URGENT=red)
- Customer name + assignee name
- `formatRelativeDuration(createdAt)` timestamp
- `onPress` → navigate to `tickets/[id]`

### Ticket detail screen `[id].tsx`
- Header: title + status + priority badges
- Metadata section: customer, application, assignee, due date, created by
- Description text
- Comments list (`FlatList`)
- Add comment input at bottom (sticky)
- Actions: Take ticket, Update status (bottom sheet picker)

---

## Phase 9 — Profile feature (1 hr)

```
mobile/src/features/profile/
├── api/
│   └── profile.ts        — copy web/src/components/profile/api/profile.ts exactly
├── hooks/
│   └── useProfileSettings.ts — copy web version exactly
└── index.ts

mobile/app/(app)/(tabs)/profile.tsx
```

### Profile screen
- Avatar circle with user initials
- Name, email, role (read-only labels)
- Edit form: name + phone (`AppTextInput`)
- Change password section (current + new + confirm)
- Reminder settings: toggle + interval picker
- Language selector: EN / AR buttons → `changeLanguage()` + `Updates.reloadAsync()`
- Date format picker → `tenantStore.setDateFormat()`
- Logout button → `authStore.logout()` + navigate to login

---

## Phase 10 — Kanban feature (2–3 hrs)

### Additional package needed
```bash
npx expo install react-native-draggable-flatlist
```

```
mobile/src/features/kanban/
├── api/
│   └── kanban.ts         — copy web/src/components/kanban/api/kanban.ts exactly
├── hooks/
│   └── useKanban.ts      — adapt kanbanStore logic to React Query
├── components/
│   ├── KanbanColumn.tsx  — DraggableFlatList per column
│   ├── KanbanCard.tsx    — compact card
│   └── BoardSelector.tsx — board picker
└── index.ts

mobile/app/(app)/(tabs)/kanban.tsx
```

### useKanban.ts
- `useQuery` for boards list
- `useQuery` for current board detail
- `useMutation` for `moveTicket` (optimistic update)
- `useMutation` for `moveTask`
- Board selector state

### Kanban screen
- Board selector at top (horizontal scroll of board chips)
- 4 columns in horizontal `ScrollView`: OPEN, IN_PROGRESS, RESOLVED, CLOSED
- Each column: `DraggableFlatList` of `KanbanCard`
- Drag → `moveTicket` mutation
- Tap card → navigate to ticket detail

---

## Phase 11 — Activity Feed / Notifications (1–2 hrs)

```
mobile/src/features/notifications/
├── hooks/
│   └── useActivitySocket.ts  — adapt from web
├── components/
│   └── NotificationItem.tsx
└── index.ts
```

### useActivitySocket.ts
Adapt from `web/src/components/dashboard/components/activityFeed/hooks/useActivitySocket.ts`:
- Remove `new Audio()` call (not available in RN)
- Keep socket listener logic exactly
- Store activities in local state
- Expose `activities`, `unreadCount`, `markAllRead`

### Wire into root layout
In `app/(app)/_layout.tsx`:
```tsx
useEffect(() => {
  if (!user) return;
  const socket = getSocket();
  joinUserRoom(user.id);
  const handler = (raw: any) => { /* update unread count in uiStore */ };
  socket.on('notification', handler);
  return () => socket.off('notification', handler);
}, [user]);
```

### Notification badge
- Store `unreadCount` in `uiStore`
- Show badge on tab bar bell icon

---

## Phase 12 — Admin screens (3–4 hrs, TENANT_ADMIN only)

```
mobile/app/(app)/admin/
├── _layout.tsx           — role guard: redirect non-admins to dashboard
├── index.tsx             — Admin dashboard (MetricCard stats)
├── users.tsx
├── customers.tsx
├── applications.tsx
└── tickets.tsx

mobile/src/features/admin/
├── dashboard/
│   ├── hooks/
│   │   └── useAdminDashboard.ts  — copy web version exactly
│   └── utils/
│       └── computeStats.ts       — copy web version
├── users/
│   ├── api/users.ts              — copy web usersManagement/api/users.ts
│   └── hooks/useUsers.ts         — useAdminFeature wrapper
├── customers/
│   ├── api/customers.ts
│   └── hooks/useCustomers.ts
├── applications/
│   ├── api/applications.ts
│   └── hooks/useApplications.ts
└── tickets/
    ├── api/tickets.ts
    └── hooks/useAdminTickets.ts
```

### Each admin CRUD screen pattern
1. `AppScreenHeader` with title + "Add" button
2. `FlatList` of item cards
3. Bottom sheet (or `Modal`) for create/edit form
4. `AppDeleteDialog` for delete confirm
5. Uses `useAdminFeature` hook — same as web

### Admin tab
Add to `(app)/_layout.tsx` tab bar, only visible when `isTenantAdmin(user.role) || isSuperAdmin(user.role)`.

---

## Phase 13 — Epics & Features (2 hrs, read-only first)

```
mobile/src/features/epics/
├── api/
│   ├── epics.ts          — copy web/src/components/epics/api/epics.ts
│   └── epicTemplates.ts  — copy web version
├── hooks/
│   ├── useEpicDetail.ts  — copy web version
│   └── useEpicComments.ts — copy web version
└── index.ts

mobile/app/(app)/epics/
├── index.tsx             — Epics list
└── [id].tsx              — Epic detail

mobile/src/features/features/
├── api/
│   └── features.ts       — copy web/src/components/features/api/features.ts
└── index.ts

mobile/app/(app)/features/
├── index.tsx
└── [id].tsx
```

### Epic list screen
- `FlatList` of epic cards (title, status chip, progress bar, feature count)
- Filter by status

### Epic detail screen
- Header: title + status + priority
- Progress bar (features completed / total)
- Features list
- Linked tickets list
- Comments section
- Activity log

---

## Phase 14 — Programming panel (1 hr, PROGRAMMER role only)

```
mobile/src/features/programming/
├── api/
│   └── programming.ts    — copy web version
├── hooks/
│   └── useProgrammingDetails.ts — copy web version
└── index.ts

mobile/app/(app)/programming.tsx
```

- Role guard: only `PROGRAMMER`, `TENANT_ADMIN`, `SUPER_ADMIN`
- List of assigned tickets with technical info
- Code snippet viewer
- Solution checklist

---

## Phase 15 — RTL + i18n polish (1 hr)

### Language switching
In Profile screen:
```ts
import * as Updates from 'expo-updates';

const handleLanguageChange = async (lng: 'en' | 'ar') => {
  await changeLanguage(lng);  // updates i18n + I18nManager.forceRTL
  await Updates.reloadAsync(); // required to apply RTL layout
};
```

### RTL-safe styles
Replace all `marginLeft/Right`, `paddingLeft/Right` with `marginStart/End`, `paddingStart/End`:
```ts
// ❌ Not RTL-safe
marginLeft: 16

// ✅ RTL-safe
marginStart: 16
```

### Expand locale files
Add missing keys to `en.json` and `ar.json` as each screen is built:
- `auth.*` — login screen strings
- `tickets.*` — ticket statuses, priorities, actions
- `kanban.*` — board, column names
- `profile.*` — settings labels
- `admin.*` — CRUD labels
- `epics.*` — epic statuses
- `errors.*` — error messages

---

## Navigation structure (final)

```
app/
├── _layout.tsx                    ← Root: QueryClient + i18n + auth init
├── (auth)/
│   ├── _layout.tsx                ← Stack, redirect to /(app) if authenticated
│   └── login.tsx
└── (app)/
    ├── _layout.tsx                ← Tab navigator + socket setup + auth guard
    ├── (tabs)/
    │   ├── index.tsx              ← Dashboard
    │   ├── tickets.tsx            ← Tickets list
    │   ├── kanban.tsx             ← Kanban board
    │   ├── profile.tsx            ← Profile
    │   └── admin.tsx              ← Admin (TENANT_ADMIN only, hidden otherwise)
    ├── tickets/
    │   └── [id].tsx               ← Ticket detail
    ├── epics/
    │   ├── index.tsx
    │   └── [id].tsx
    ├── features/
    │   ├── index.tsx
    │   └── [id].tsx
    ├── programming.tsx
    └── admin/
        ├── _layout.tsx
        ├── index.tsx
        ├── users.tsx
        ├── customers.tsx
        ├── applications.tsx
        └── tickets.tsx
```

---

## Copy vs Adapt decision table

| File | Action | Reason |
|---|---|---|
| `services/api/types/*.ts` | Copy verbatim | Pure TypeScript, zero platform code |
| `types/roles.ts` | Copy verbatim | Pure constants |
| `shared/hooks/useEntityData.ts` | Copy verbatim | Pure React Query logic |
| `shared/hooks/useAdminFeature.ts` | Copy verbatim | Pure React state + callbacks |
| `shared/utils/httpUtils.ts` | Copy verbatim | Pure Axios error handling |
| `shared/utils/notificationUtils.ts` | Copy, remove `playNotificationSound` | Audio API not in RN |
| `*/api/*.ts` (all feature APIs) | Copy verbatim | Only use BaseApiService |
| `*/hooks/use*.ts` (all feature hooks) | Copy verbatim | Pure React Query, no JSX |
| `shared/utils/dateUtils.ts` | Adapt | Replace date-fns with dayjs |
| `shared/utils/activityUtils.ts` | Adapt | Remove useTheme, use static colors |
| `stores/authStore.ts` | Adapt | Replace localStorage with AsyncStorage |
| `stores/tenantStore.ts` | Adapt | Remove localStorage (Zustand handles it) |
| `stores/themeStore.ts` | Merge into uiStore | Replace document.dir with I18nManager |
| `stores/kanbanStore.ts` | Copy + adapt | Remove devtools if not needed |
| `hooks/useSocketQuery.ts` | Adapt | getSocket signature differs |
| `activityFeed/hooks/useActivitySocket.ts` | Adapt | Remove Audio API |
| All `*.tsx` components | Rewrite | Replace MUI with RN primitives |

---

## Platform substitution cheatsheet

| Web | React Native |
|---|---|
| `localStorage.getItem/setItem` | `await AsyncStorage.getItem/setItem` |
| `import.meta.env.DEV` | `__DEV__` |
| `document.documentElement.dir` | `I18nManager.forceRTL(isRtl)` |
| `useMediaQuery` | `useWindowDimensions()` |
| `window.location` | `router.push()` from expo-router |
| `new Audio()` | `expo-av` Audio (or omit) |
| `<Dialog>` | `<Modal>` |
| `<DataGrid>` | `<FlatList>` |
| `<TextField>` | `<TextInput>` |
| `<Select>` | Custom `Modal` + `FlatList` |
| `<Chip>` | Custom `View` + `Text` |
| `<Button>` | `<Pressable>` |
| `<CircularProgress>` | `<ActivityIndicator>` |
| `<Snackbar>` | Custom toast or `ToastAndroid` |
| `<Alert>` | Custom `View` with colored border |
| `<Box sx={{ display: 'flex' }}>` | `<View style={{ flexDirection: 'row' }}>` |
| `theme.palette.primary.main` | `Colors.light.tint` from constants/theme |
| `socket.io transports: auto` | `transports: ['websocket']` |
| `Updates.reloadAsync()` | Required after `I18nManager.forceRTL()` |

---

## Phase order summary

| Phase | What | Effort | Blocks |
|---|---|---|---|
| 1 | Copy API types | 5 min | Everything |
| 2 | Stores (auth, tenant, ui) | 30 min | Auth, all features |
| 3 | Copy shared hooks | 15 min | Admin, dashboard |
| 4 | Shared utils (date, http, notification) | 20 min | All features |
| 5 | Shared RN components | 2–3 hrs | All screens |
| 6 | Auth + login screen | 1–2 hrs | All protected screens |
| 7 | Dashboard screen | 2 hrs | — |
| 8 | Tickets list + detail | 2–3 hrs | Kanban, Admin |
| 9 | Profile screen | 1 hr | — |
| 10 | Kanban board | 2–3 hrs | — |
| 11 | Activity feed + notifications | 1–2 hrs | — |
| 12 | Admin screens | 3–4 hrs | — |
| 13 | Epics + Features | 2 hrs | — |
| 14 | Programming panel | 1 hr | — |
| 15 | RTL + i18n polish | 1 hr | — |
