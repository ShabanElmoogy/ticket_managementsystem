# Mobile Reusable Component Pattern

> **⚠️ LIVING DOCUMENT — Always update this file when:**
> - A new shared component is added to `mobile/src/shared/components/`
> - An existing component's Modal-safety status changes
> - A component is used inside a `<Modal>` for the first time
> - A new usage location is discovered for any catalogued component

---

## Rule — Dumb components receive style, not theme

Reusable components in `mobile/src/shared/components/` that are used inside a `<Modal>` **must not** call `useThemeColors()` or any context hook internally.

**Why:** React Native `Modal` renders in a separate native view tree, outside the app's provider hierarchy. Any hook that reads from a context/store (Zustand, React context) will silently return `undefined` or stale values inside a Modal. This causes colors, theme tokens, and other context values to not apply.

**Scope:** This rule is mandatory for:
- Any component rendered inside `<Modal>` (dialogs, form modals, bottom sheets)
- Any component in `shared/components/actions/` or `shared/components/dialogs/`

Screen-level components (`AppButton`, `AppTextInput`, etc.) used only in screens/pages may call `useThemeColors()` internally — they are never inside a Modal tree.

**The pattern:**

```tsx
// ✅ Correct — dumb component, receives style as props
import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

interface Props {
  label:       string;
  onPress:     () => void;
  style?:      ViewStyle;
  labelStyle?: TextStyle;
  disabled?:   boolean;
}

const MyButton: React.FC<Props> = ({ label, onPress, style, labelStyle, disabled = false }) => (
  <Pressable style={[styles.base, style, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
    <Text style={[styles.label, labelStyle]}>{label}</Text>
  </Pressable>
);
```

```tsx
// ✅ Correct — parent resolves colors from useThemeColors() and passes via style
const MyDialog = () => {
  const c = useThemeColors();   // ← hook lives HERE, in the screen/dialog component
  return (
    <Modal>
      <MyButton
        label="Delete"
        onPress={handleDelete}
        style={{ backgroundColor: c.buttons.danger.bg }}
        labelStyle={{ color: c.buttons.danger.text }}
      />
    </Modal>
  );
};
```

```tsx
// ❌ Wrong — hook inside reusable component breaks inside Modal
const MyButton = () => {
  const c = useThemeColors();   // ← undefined inside Modal tree
  return <Pressable style={{ backgroundColor: c.buttons.danger.bg }} />;
};
```

---

## Rules

1. **No hooks in shared components.** `useThemeColors()`, `useIsDark()`, `useTranslation()`, `useDirection()` — none of these belong inside a reusable component in `shared/components/`.

2. **Accept `style` and `labelStyle` props** on every component that renders a container or text. Use `StyleSheet.create` for base/default styles only.

3. **Colors come from the caller.** The screen or dialog that uses the component calls `useThemeColors()` once and passes resolved color strings into `style` props.

4. **`StyleSheet.create` for static styles only.** Dynamic values (colors, sizes that depend on props/theme) go in the inline `style` array, not in `StyleSheet.create`.

5. **Always type style props** as `ViewStyle`, `TextStyle`, or `ImageStyle` from `react-native` — never `object` or `any`.

6. **Document every component.** Add a JSDoc header to every shared component listing: where it is used, its variants, usage examples, and Modal safety status.

---

## Component prop checklist

Every new shared component must have:

- [ ] `style?: ViewStyle` — container style override
- [ ] `labelStyle?: TextStyle` — text style override (if it renders text)
- [ ] `disabled?: boolean` — with `opacity: 0.45` in disabled style
- [ ] No `useThemeColors()`, `useIsDark()`, or any context hook
- [ ] `StyleSheet.create` for base layout only (borderRadius, padding, flexDirection)
- [ ] All color props resolved by the parent and passed via `style`
- [ ] JSDoc header with: usage locations, variants, examples, Modal safety note

---

## Component catalogue

Keep this table updated whenever a component is added or its usage changes.

| Component | File | Has hooks? | Modal-safe? | Used in |
|---|---|---|---|---|
| `DialogButton` | `actions/DialogButton.tsx` | ❌ No | ✅ Yes | `AdminFormModal`, `AlertDialog`, `ConfirmDeleteDialog` |
| `AppButton` | `forms/AppButton.tsx` | ✅ Yes (`useThemeColors`, `useIsDark`) | ⚠️ Pass `resolvedColors` prop | `AdminFormPage`, screens |
| `AppTextInput` | `forms/AppTextInput.tsx` | ✅ Yes (`useThemeColors`, `useIsDark`, `useDirection`, `useTranslation`) | ❌ No — screens only | All admin forms |
| `AppBadge` | `forms/AppBadge.tsx` | ❌ No | ✅ Yes (no hooks — colors from static token maps) | `TicketsScreen`, `TenantsScreen`, `TemplatesScreen` |
| `ChipSelector` | `forms/ChipSelector.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `CustomerForm`, `DateFormatPanel`, `PaginationSettingsPanel`, `CalloutEditor` |
| `ChipRows` | `forms/ChipRows.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ChipSelector` (layout="rows"), `DateFormatPanel`, `CustomerForm` |
| `ChipTiles` | `forms/ChipTiles.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ChipSelector` (layout="tiles") |
| `AppSearchInput` | `forms/AppSearchInput.tsx` | ✅ Yes (`useThemeColors`, `useDirection`, `useTranslation`) | ❌ No — screens only | `AdminCrudScreen` |
| `AppDatePicker` | `forms/AppDatePicker.tsx` | ✅ Yes (`useThemeColors`, `useDirection`, `useTranslation`) | ❌ No — screens only | `CustomerForm` (subscriptionStartDate, subscriptionEndDate) |
| `AlertDialog` | `dialogs/AlertDialog.tsx` | ✅ Yes (`useThemeColors`) | ✅ Yes — `useThemeColors()` called at component level, before `<Modal>` renders | Standalone modal |
| `ConfirmDeleteDialog` | `dialogs/ConfirmDeleteDialog.tsx` | ✅ Yes (`useThemeColors`, `useTranslation`) | ❌ No | `AdminCrudScreen`, feature screens |
| `ForceDeleteConfirmDialog` | `dialogs/ForceDeleteConfirmDialog.tsx` | ✅ Yes (`useThemeColors`, `useTranslation`) | ❌ No | `UsersScreen` (force-delete), feature screens |
| `FormSection` | `forms/FormSection.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | All admin feature forms (CustomerForm, UserForm, etc.) — page context only |
| `AppForm` | `forms/AppForm.tsx` | ❌ No | ✅ Yes (no hooks) | `AdminFormPage` (when `form` prop is passed). Provides `FormProvider` + `FormFocusProvider` + `ScrollView`. Exposes `focusFirst` via `onFocusRef` callback. |
| `AppFormField` | `forms/AppFormField.tsx` | ✅ Yes (`useFormContext`, `useFormFocus`) | ❌ No — screens only | `CustomerForm` (all text input fields) |
| `FormFocusContext` | `forms/FormFocusContext.tsx` | ❌ No (context only — `useRef`, `useCallback`) | ✅ Yes | `AppForm` (provides `FormFocusProvider`), `AppFormField` (calls `useFormFocus`) |
| `SegmentedControl` | `forms/SegmentedControl.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `LanguageSwitcher` |
| `LanguageSwitcher` | `navigation/LanguageSwitcher.tsx` | ✅ Yes (`useTranslation` via `i18n`) | ❌ No — screens only | Login screen, Profile screen |
| `ToggleButton` | `navigation/ToggleButton.tsx` | ❌ No | ✅ Yes | Not yet used — available for pill-button rows |
| `AppScreenHeader` | `layout/AppScreenHeader.tsx` | ✅ Yes (`useTranslation`) | ❌ No — screens only | `AdminCrudScreen`, `TicketsScreen`, `ReportsHeader` |
| `HeaderTitle` | `layout/HeaderTitle.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `AppScreenHeader` — renders optional badge chip + optional subtitle; title text is rendered directly by `AppScreenHeader` |
| `HeaderActionGroup` | `layout/HeaderActionGroup.tsx` | ✅ Yes (`useTranslation`) | ❌ No — screens only | `AppScreenHeader` |
| `VerticalDivider` | `layout/VerticalDivider.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `HeaderActionGroup` |
| `ViewToggle` | `layout/ViewToggle.tsx` | ✅ Yes (`useThemeColors`, `useTranslation`) | ❌ No — screens only | `AppScreenHeader` |
| `HeaderIconButton` | `actions/HeaderIconButton.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `HeaderActionGroup` |
| `PanelCard` | `layout/PanelCard.tsx` | ✅ Yes (`useThemeColors`, `useTranslation`) | ❌ No — screens only | Expandable option panels inside dialogs or bottom sheets |
| `DataCard` | `data/DataCard.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `AdminCrudScreen`, `ReportCard` |
| `CompactListRow` | `data/CompactListRow.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ReportCompactRow` |
| `AppDataTable` | `data/AppDataTable.tsx` | ✅ Yes (`useThemeColors`, `useWindowDimensions`) | ❌ No — screens only | `AdminCrudScreen` |
| `AppPagination` | `data/AppPagination.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `DataCard`, `PaginatedView` |
| `PaginatedView` | `data/PaginatedView.tsx` | ❌ No (no hooks — delegates to `AppPagination`) | ✅ Yes | `DataCard` (table view with pagination) |
| `FilterChipGroup` | `data/FilterChipGroup.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ReportTypeSelector`, `ActivityPeriodSelector` (reports feature) |
| `SectionHeader` | `display/SectionHeader.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `DataCard`, `ReportCardHeader`, `AdminDashboardScreen` |
| `StatBadge` | `display/StatBadge.tsx` | ❌ No | ✅ Yes | `StatCard` |
| `StatCard` | `display/StatCard.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `ReportGridCard.tsx` — grid view card for report rows |
| `PaletteSelector` | `display/PaletteSelector.tsx` | ✅ Yes (`useUiStore`) | ⚠️ Pass `resolvedColors` prop — `useUiStore` is Zustand (global, safe in Modals); does NOT call `useThemeColors()` | `profile.tsx` |
| `AppEmptyState` | `feedback/AppEmptyState.tsx` | ✅ Yes (`useThemeColors`) | ✅ Yes — `useThemeColors()` called at component level, before any `<Modal>` renders | `DataCard` (`ListEmptyComponent` for grid and compact views), `ReportCard`, `CustomerVisitsScreen` |
| `AppToast` | `feedback/AppToast.tsx` | ✅ Yes (`useIsDark`) | ❌ No — root layout only | `app/_layout.tsx` via `<Toast config={toastConfig} />` |
| `BottomNavItem` | `navigation/BottomNavItem.tsx` | ✅ Yes (`useThemeColors`) | ❌ No — screens only | `AppBottomNav` |
| `NavItem` | `navigation/NavItem.tsx` | ❌ No | ✅ Yes | `DrawerNavList` — requires `iconBg` (badge bg color) and `iconColor` (icon color) props; all colors resolved by parent |
| `IconButton` | `navigation/IconButton.tsx` | ❌ No | ✅ Yes | `AppHeaderBar` |
| `HapticTab` | `platform/HapticTab.tsx` | ❌ No | ✅ Yes | Bottom tab navigator via `tabBarButton` screen option |
| `IconSymbol` (iOS) | `platform/IconSymbol.ios.tsx` | ❌ No | ✅ Yes | Any component needing an icon on iOS — Metro auto-selects over `IconSymbol.tsx` |
| `SlaTimerBadge` | `display/SlaTimerBadge.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; uses `setInterval` for live countdown | `TicketCardBadgeRow` (badge row chip), `TicketDetailScreen` (header area) |
| `ActivityFeedItem` | `display/ActivityFeedItem.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; uses `ACTIVITY_TYPE_CONFIG` for type→color/icon mapping | `ActivityFeedPanel` (Dashboard), `ActivityTab` (Ticket Detail) |
| `ChecklistItem` | `display/ChecklistItem.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls | `SolutionChecklistSection` (Programming Panel) |
| `FileAttachmentList` | `display/FileAttachmentList.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; uses `expo-document-picker` for file selection | `AttachmentsTab` (Ticket Detail) |
| `MentionTextInput` | `forms/MentionTextInput.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; shows suggestion overlay when `@` is typed | `CommentsTab` (Ticket Detail), `TicketCardComments` (inline feed comments) |
| `TicketCard` | `display/TicketCard/index.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; composes all TicketCard sub-components; manages `commentsExpanded`, `seeMoreExpanded`, `overflowMenuOpen` local state; supports `viewMode: 'feed' \| 'grid' \| 'compact'` | `DashboardScreen` (TicketFeed), `TicketsScreen` (AdminCrudScreen row renderer) |
| `TicketCardHeader` | `display/TicketCard/TicketCardHeader.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls | `TicketCard/index.tsx` |
| `TicketCardBadgeRow` | `display/TicketCard/TicketCardBadgeRow.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls | `TicketCard/index.tsx` |
| `TicketCardContent` | `display/TicketCard/TicketCardContent.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls | `TicketCard/index.tsx` |
| `TicketCardMeta` | `display/TicketCard/TicketCardMeta.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls | `TicketCard/index.tsx` |
| `TicketCardActionBar` | `display/TicketCard/TicketCardActionBar.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls | `TicketCard/index.tsx` |
| `TicketCardComments` | `display/TicketCard/TicketCardComments.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; calls `ticketsApi` directly for comment CRUD; exposes `focusCommentInput()` via `forwardRef` (`TicketCardCommentsHandle`) | `TicketCard/index.tsx` |
| `TicketCardOverflowMenu` | `display/TicketCard/TicketCardOverflowMenu.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; rendered via `Modal`, consumes `buildOverflowMenuEntries` from `TicketCardActionBar` for role/state guards | `TicketCard/index.tsx` |
| `TicketCardCompact` | `display/TicketCard/TicketCardCompact.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; single-row layout with priority dot, title, status badge, and overflow menu trigger | `TicketCard/index.tsx` (when `viewMode === 'compact'`) |
| `TicketCardGrid` | `display/TicketCard/TicketCardGrid.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal hook calls; 2-column compact card layout (no share, no inline comments) | `TicketCard/index.tsx` (when `viewMode === 'grid'`) |
| `TicketCommentsModal` | `display/TicketCard/TicketCommentsModal.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal theme/context hook calls; full-screen slide-up Modal with scrollable comment list, `@mention`-aware input pinned above keyboard (auto-scrolls to bottom on keyboard show), and per-comment delete; fetches comments via `ticketsApi.getTicket` on open | `TicketCard/index.tsx` (comment button in feed mode) |
| `TicketActivityModal` | `display/TicketCard/TicketActivityModal.tsx` | ❌ No | ✅ Yes — receives `resolvedColors` prop, no internal theme/context hook calls; full-screen slide-up Modal with timeline activity feed; fetches activities via `ticketsApi.getActivities` on open; applies `direction: 'ltr'` on root View (outside `DirectionProvider`) | Not yet used — available for activity button in `TicketCard` |

---

## AppBadge — component note

`AppBadge` (`mobile/src/shared/components/forms/AppBadge.tsx`) is a colored pill badge.

**Variants:**
- `'status'` — auto-resolves color from `StatusColors` (OPEN, IN_PROGRESS, RESOLVED, CLOSED, etc.)
- `'priority'` — auto-resolves color from `PriorityColors` (LOW, MEDIUM, HIGH, URGENT)
- `'role'` — reserved for future role badges
- `'custom'` — pass explicit `color` prop

**Current usages:**
1. `TicketsScreen` — status + priority columns in the data table
2. `TenantsScreen` — subscription status column
3. `TemplatesScreen` — priority column

**⚠️ Modal rule:** `AppBadge` is Modal-safe — it has no hooks. Colors are resolved from static `StatusColors` / `PriorityColors` token maps. You can render it directly inside a `<Modal>` without any extra steps.

---

## AppEmptyState — component note

`AppEmptyState` (`mobile/src/shared/components/feedback/AppEmptyState.tsx`) is a centered placeholder for empty lists and screens.

**Icon options (mutually exclusive — `ionicon` takes priority):**
- `ionicon` + `ioniconColor` + `ioniconSize` — renders an Ionicons icon inside a tinted circular badge. **Preferred for new code.**
- `icon` (emoji string) — legacy fallback, shown only when `ionicon` is not set

**Action button:**
- `actionLabel` + `onAction` — renders a primary `AppButton`
- `actionIcon` — optional `IoniconName` shown inside the action button (white icon, 16px)
- The button receives `resolvedColors={c}` automatically — Modal-safe

**Current usages:**
1. `DataCard` — `ListEmptyComponent` for grid and compact views
2. `ReportCard` — empty state when report has no rows
3. `CustomerVisitsScreen` — empty state when no visits exist

**⚠️ Modal rule:** `AppEmptyState` is Modal-safe — `useThemeColors()` is called at the component level (before any `<Modal>` renders). The `resolvedColors` prop is passed internally to `AppButton`, so callers do not need to pass it.

```tsx
// ✅ Ionicons icon (preferred)
<AppEmptyState
  ionicon="calendar-outline"
  ioniconColor={c.interactive.primary}
  message={t('visits.emptyMessage')}
  actionLabel={t('visits.logFirst')}
  actionIcon="add-circle-outline"
  onAction={handleLogVisit}
  fill
/>

// ✅ Legacy emoji icon
<AppEmptyState
  icon="📭"
  message={t('customers.emptyMessage')}
  fill
/>
```

---

## SlaTimerBadge — component note

`SlaTimerBadge` (`mobile/src/shared/components/display/SlaTimerBadge.tsx`) is a live SLA countdown/elapsed chip.

**Behavior:**
- Calls `computeSlaState(ticket, now)` to derive display text and color token
- Updates every 60 seconds via `setInterval` for a live countdown
- Returns `null` when no `slaDeadline` is set
- Color tokens: `'error'` → `c.intent.error` (red), `'warning'` → `c.intent.warning` (amber), `'success'` → `c.intent.success` (green)
- Icon: `warning-outline` when overdue, `time-outline` otherwise

**Sizes:**
- `'sm'` — compact chip (10px icon, `FontSize.xs` text, 6px horizontal padding) — used in badge rows
- `'md'` — standard chip (12px icon, `FontSize.sm` text, 8px horizontal padding) — default

**Current usages:**
1. `TicketCardBadgeRow` — badge row chip showing SLA time remaining or overdue
2. `TicketDetailScreen` — header area SLA indicator

**⚠️ Modal rule:** `SlaTimerBadge` is Modal-safe — receives `resolvedColors` prop, no internal hook calls.

```tsx
// In a ticket card badge row
{ticket.slaDeadline && (
  <SlaTimerBadge
    slaDeadline={ticket.slaDeadline}
    status={ticket.status}
    resolvedColors={c}
    size="sm"
  />
)}
```

---

## ActivityFeedItem — component note

`ActivityFeedItem` (`mobile/src/shared/components/display/ActivityFeedItem.tsx`) is a single activity item in the real-time activity feed.

**Layout:**
- 4px left accent bar (colored by type, visible for unread items only)
- Colored circular avatar with type-specific Ionicons icon
- Primary text: type-specific message (e.g. "New ticket: Login crash")
- Secondary text: actor name + "•" + relative timestamp
- Chips row: priority chip + status chip when ticket data is present; `@mentioned you` chip for `COMMENT_MENTION`
- Pulsing dot (8px, type accent color) for unread items
- Read items rendered at 0.7 opacity

**Interactions:**
- Press → calls `onPress(activity)` and marks item as read (if unread and has `ticketId`)
- Long press → toggles read/unread state

**Loading state:** Pass `isLoading={true}` to show a skeleton placeholder row.

**Current usages:**
1. `ActivityFeedPanel` — FlatList of activity items in the Dashboard
2. `ActivityTab` — Timeline list in the Ticket Detail screen

**⚠️ Modal rule:** `ActivityFeedItem` is Modal-safe — receives `resolvedColors` prop, no internal hook calls. Uses `ACTIVITY_TYPE_CONFIG` (module-level map) for type→color/icon resolution.

```tsx
<ActivityFeedItem
  activity={item}
  resolvedColors={c}
  onPress={(activity) => navigateToTicket(activity.data.ticket?.id)}
  onMarkRead={(id) => markRead(id)}
  onMarkUnread={(id) => markUnread(id)}
/>
```

---

## ChecklistItem — component note

`ChecklistItem` (`mobile/src/shared/components/display/ChecklistItem.tsx`) is a solution step row with checkbox, strikethrough text, and optional delete button.

**Layout:**
- Step number badge (order + 1, tinted with `c.interactive.primary`)
- Checkbox (filled green when done, outlined when pending)
- Step text (strikethrough + muted when done)
- Delete button (trash icon, shown only when `canEdit && onDelete` provided)

**Props:**
- `step: SolutionStep` — `{ order: number; text: string; done: boolean }`
- `canEdit: boolean` — disables toggle and hides delete when false
- `onToggle(order)` — called when checkbox is pressed
- `onDelete?(order)` — called when delete button is pressed

**Current usages:**
1. `SolutionChecklistSection` — list of solution steps in the Programming Panel

**⚠️ Modal rule:** `ChecklistItem` is Modal-safe — receives `resolvedColors` prop, no internal hook calls.

```tsx
// Editable step
<ChecklistItem
  step={{ order: 0, text: 'Write unit tests', done: false }}
  canEdit
  onToggle={(order) => handleToggle(order)}
  onDelete={(order) => handleDelete(order)}
  resolvedColors={c}
/>

// Read-only step
<ChecklistItem
  step={{ order: 1, text: 'Deploy to staging', done: true }}
  canEdit={false}
  onToggle={() => {}}
  resolvedColors={c}
/>
```

---

## FileAttachmentList — component note

`FileAttachmentList` (`mobile/src/shared/components/display/FileAttachmentList.tsx`) is a file list panel with an upload zone and file rows.

**Layout:**
- "Files (N)" header with count badge
- Dashed upload zone (hidden in `readonly` mode) — uses `expo-document-picker`
- Linear progress bar during upload
- Scrollable list of file rows: thumbnail (image preview or type icon), file name, file size, delete button
- Empty state when no files attached

**Constraints:**
- Max 5 files per upload
- Max 10 MB per file
- Files exceeding size limit are silently filtered out

**Props:**
- `readonly: boolean` — hides upload zone and delete buttons
- `uploading?: boolean` — shows progress bar
- `uploadProgress?: number` — 0–100 for the progress bar
- `onUpload?(files)` — called with `DocumentPickerAsset[]` after file selection
- `onDelete?(attachmentId)` — called when delete button is pressed
- `onSelect(attachment)` — called when a file row is pressed (for preview)
- `selectedId?: string` — highlights the selected file with a left accent border

**Current usages:**
1. `AttachmentsTab` — file list panel in the Ticket Detail screen

**⚠️ Modal rule:** `FileAttachmentList` is Modal-safe — receives `resolvedColors` prop, no internal hook calls.

```tsx
<FileAttachmentList
  attachments={attachments}
  onUpload={handleUpload}
  onDelete={handleDelete}
  onSelect={setSelectedAttachment}
  selectedId={selectedAttachment?.id}
  readonly={false}
  uploading={isUploading}
  uploadProgress={uploadProgress}
  resolvedColors={c}
/>
```

---

## MentionTextInput — component note

`MentionTextInput` (`mobile/src/shared/components/forms/MentionTextInput.tsx`) is an `@name` mention-aware text input with a suggestion list overlay.

**Behavior:**
- Detects `@` prefix in the current word being typed
- Shows a suggestion list overlay (max 6 users) filtered by the typed prefix
- Tapping a suggestion inserts `@name ` at the cursor position
- Send button submits when `value.trim().length > 0` and not disabled
- Disabled state shows a read-only placeholder

**Props:**
- `value: string` + `onChange(text)` — controlled input
- `onSubmit()` — called when send button is pressed or Enter is triggered
- `users: MentionUser[]` — `{ id: string; name: string }[]` for suggestions
- `disabled?: boolean` — disables input and send button
- `placeholder?: string` — defaults to "Write a comment... use @ to mention someone"

**Current usages:**
1. `CommentsTab` — comment input with @mention support in Ticket Detail
2. `TicketCardComments` — inline comment input in the feed card

**⚠️ Modal rule:** `MentionTextInput` is Modal-safe — receives `resolvedColors` prop, no internal hook calls.

```tsx
<MentionTextInput
  value={commentText}
  onChange={setCommentText}
  onSubmit={handleSubmitComment}
  users={ticketUsers}
  placeholder="Write a comment... use @ to mention someone"
  resolvedColors={c}
/>

// Disabled (suspended tenant)
<MentionTextInput
  value=""
  onChange={() => {}}
  onSubmit={() => {}}
  users={[]}
  placeholder="Subscription ended — read only"
  disabled
  resolvedColors={c}
/>
```

---

## TicketCard — component note

`TicketCard` (`mobile/src/shared/components/display/TicketCard/index.tsx`) is the root social-post style ticket card component.

**View modes:**
- `'feed'` — Full social-post layout (default). Shows Share button and inline expandable comments.
- `'grid'` — 2-column compact card. No share, no inline comments.
- `'compact'` — Dense single-line row. Header + title only.

**Local state managed internally:**
- `commentsExpanded` — whether the inline comment section is open (feed mode only)
- `seeMoreExpanded` — whether the description "See more" is expanded
- `overflowMenuOpen` — whether the `TicketCardOverflowMenu` bottom sheet is open

**Key props:**
- `viewMode: 'feed' | 'grid' | 'compact'`
- `canUpdateStatus: boolean` — controls which status options appear in the overflow menu
- `isAdmin: boolean` — shows admin-only actions (delete, reassign, edit due date, assign programmer)
- `isEmployee?: boolean` — shows the "Take" button when ticket is unassigned
- `tenantSuspended?: boolean` — disables all write actions
- `isSelected?: boolean` + `onSelect?` — bulk selection support (admin only)
- `mentionUsers?` — users available for @mention in inline comments
- `sharingAvailable?` — hides Share button when `expo-sharing` is unavailable

**Current usages:**
1. `DashboardScreen` — `TicketFeed` component (Feed/Grid/Compact modes)
2. `TicketsScreen` — `AdminCrudScreen` row renderer (Feed mode)

**⚠️ Modal rule:** `TicketCard` is Modal-safe — receives `resolvedColors` prop, no internal hook calls. The `TicketCardOverflowMenu` it renders is a `<Modal>` — all color resolution happens in the parent before passing `resolvedColors` down.

```tsx
const c = useThemeColors();

<TicketCard
  ticket={ticket}
  resolvedColors={c}
  viewMode="feed"
  onPress={(t) => navigateToDetail(t.id)}
  onShare={(t) => handleShare(t)}
  onStatusChange={(id, status) => updateStatus(id, status)}
  onDelete={(id) => deleteTicket(id)}
  canUpdateStatus={canUpdateStatus}
  isAdmin={isAdmin}
  isEmployee={isEmployee}
  currentUserId={currentUser.id}
  tenantSuspended={tenantSuspended}
  mentionUsers={ticketUsers}
  sharingAvailable={sharingAvailable}
/>
```

---

## TicketCommentsModal — component note

`TicketCommentsModal` (`mobile/src/shared/components/display/TicketCard/TicketCommentsModal.tsx`) is a full-screen slide-up comments modal, Facebook-style.

**Behavior:**
- Opens as a `<Modal animationType="slide" presentationStyle="pageSheet">` covering the full screen
- Fetches all comments via `ticketsApi.getTicket(ticketId)` every time the modal opens; resets comment list and input text on each open
- Comments are sorted oldest-first and rendered as chat bubbles with colored initials avatars
- `@mention` tokens are highlighted inline using `parseCommentSegments`
- `MentionTextInput` is pinned above the keyboard via `KeyboardAvoidingView`; auto-focuses on open
- Automatically scrolls to the bottom of the comment list when the keyboard opens (`Keyboard.addListener` on `keyboardWillShow` / `keyboardDidShow`)
- Per-comment delete button visible to admins and the comment's own author
- Applies `direction: 'ltr'` on the root `View` — Modal sits outside `DirectionProvider`

**Props:**
- `visible: boolean` + `onClose()` — controlled visibility
- `ticketId: string` + `ticketTitle: string` — identifies the ticket
- `commentCount: number` — initial count (display only; actual list is fetched)
- `currentUserId: string` — used to show delete button on own comments
- `isAdmin: boolean` — allows deleting any comment
- `tenantSuspended?: boolean` — disables the input when true
- `mentionUsers?` — `{ id, name }[]` passed to `MentionTextInput` for suggestions
- `onCommentAdded?()` / `onCommentDeleted?()` — callbacks to notify parent of count changes

**Current usages:**
1. `TicketCard/index.tsx` — opened when the comment button is pressed in feed mode

**⚠️ Modal rule:** `TicketCommentsModal` is Modal-safe — receives `resolvedColors` prop, no internal theme/context hook calls. Uses `Keyboard` listener and `useEffect` for scroll-to-bottom on keyboard show, but these are React/RN built-ins, not context-dependent.

```tsx
<TicketCommentsModal
  visible={commentsModalOpen}
  onClose={() => setCommentsModalOpen(false)}
  ticketId={ticket.id}
  ticketTitle={ticket.title}
  commentCount={ticket._count?.comments ?? 0}
  resolvedColors={c}
  currentUserId={currentUserId}
  isAdmin={isAdmin}
  tenantSuspended={tenantSuspended}
  mentionUsers={mentionUsers}
  onCommentAdded={() => { /* refresh parent count if needed */ }}
  onCommentDeleted={() => { /* refresh parent count if needed */ }}
/>
```

---

## Reference implementation

`mobile/src/shared/components/actions/DialogButton.tsx` — canonical example of this pattern.

```tsx
const DialogButton: React.FC<DialogButtonProps> = ({
  label, onPress, style, labelStyle, disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={[styles.base, style, disabled && styles.disabled]}
  >
    <Text style={[styles.label, labelStyle]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base:     { width: '100%', borderRadius: Radius.xl, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, letterSpacing: 0.3 },
  disabled: { opacity: 0.45 },
});
```

---

## Localization (i18n)

> **Always update both `en.json` and `ar.json` together.** A key missing in one language will fall back to the key string, not the English text.

### Setup

- Library: `i18next` + `react-i18next`
- Languages: `en` (default) + `ar` (Arabic, RTL)
- Files: `mobile/src/i18n/locales/en.json` and `ar.json`
- Init: `mobile/src/i18n/index.ts` — synchronous init at module load, async language restore from `AsyncStorage`

### How to use in components

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <Text>{t('common.save')}</Text>;
};
```

### Key structure — namespace map

All keys live under a flat namespace (no sub-namespaces). Top-level sections:

| Section | Purpose | Example key |
|---|---|---|
| `common.*` | Shared UI labels (Save, Cancel, Back…) | `t('common.save')` |
| `validation.*` | Form validation messages | `t('validation.required', { field: 'Name' })` |
| `nav.*` | Navigation labels | `t('nav.adminPanel')` |
| `applications.*` | Applications feature | `t('applications.addTitle')` |
| `customers.*` | Customers feature | `t('customers.form.name')` |
| `users.*` | Users feature | `t('users.roles.employee')` |
| `tenants.*` | Tenants feature | `t('tenants.columns.status')` |
| `templates.*` | Templates feature | `t('templates.messages.created')` |
| `tickets.*` | Tickets feature | `t('tickets.title')` |
| `dashboard.*` | Dashboard screen | `t('dashboard.title')` |
| `adminDashboard.*` | Admin dashboard stats | `t('adminDashboard.totalCustomers')` |
| `settings.*` | Settings panels | `t('settings.pagination.title')` |
| `errors.*` | Error boundary messages | `t('errors.network.message')` |
| `deviceInfo.*` | Device info screen | `t('deviceInfo.labels.osVersion')` |

### Feature key pattern

Every admin feature follows this structure:

```json
"featureName": {
  "title":               "Feature Name",
  "itemType":            "item",
  "addTitle":            "Add Item",
  "editTitle":           "Edit Item",
  "notFound":            "Item not found",
  "searchPlaceholder":   "Search items…",
  "emptyMessage":        "No items yet",
  "emptyFilteredMessage":"No items match your search",
  "columns": { "name": "Name", "created": "Created" },
  "form":    { "name": "Name *", "namePlaceholder": "Item name" },
  "messages": {
    "created":         "Item created successfully",
    "updated":         "Item updated successfully",
    "deleted":         "Item deleted successfully",
    "errorCreate":     "Error creating item",
    "errorUpdate":     "Error updating item",
    "errorDelete":     "Error deleting item",
    "validationError": "Please fix the errors before saving"
  }
}
```

### Interpolation

```tsx
// Variable substitution
t('validation.required', { field: 'Name' })
// → "Name is required"

// Plural (not yet used — use explicit keys instead)
t('users.forceDelete.message', { name: user.name })
// → '"John" has tickets or comments...'
```

### RTL support

Direction is controlled by `uiStore.direction` (`'ltr'` | `'rtl'`), set automatically when language changes.

- **Do NOT use `marginLeft`/`marginRight`** — use `marginStart`/`marginEnd` (logical properties that flip with RTL)
- **Text alignment** — always set explicitly: `textAlign: isRtl ? 'right' : 'left'`
- **`TextInput`** — set `writingDirection` and `textAlign` explicitly (not inherited)
- **`flexDirection: 'row'`** — inherits from `DirectionProvider` root View, flips automatically

```tsx
// ✅ RTL-safe
const { isRtl } = useDirection();
<Text style={{ textAlign: isRtl ? 'right' : 'left' }}>{t('common.save')}</Text>
<View style={{ marginStart: 8 }} />   // flips automatically

// ❌ Not RTL-safe
<Text style={{ textAlign: 'left' }} />
<View style={{ marginLeft: 8 }} />
```

### Adding a new feature — checklist

When adding a new admin feature, add keys to **both** locale files:

- [ ] `en.json` — English strings
- [ ] `ar.json` — Arabic strings (same structure, translated values)
- [ ] Follow the feature key pattern above
- [ ] Add `sections.*` keys if the form uses `<FormSection>` grouping
- [ ] Add `pdf.*` keys if the feature has PDF export
- [ ] Use `t()` for ALL user-visible strings — no hardcoded English in JSX

### Locale file location

```
mobile/src/i18n/
├── index.ts              ← init + changeLanguage + getCurrentLanguage
└── locales/
    ├── en.json           ← English (source of truth)
    └── ar.json           ← Arabic (must mirror en.json structure exactly)
```

### Language switching

```ts
import { changeLanguage } from '@/src/i18n';

// Switch to Arabic — updates i18n + uiStore.direction + AsyncStorage
await changeLanguage('ar');

// Switch to English
await changeLanguage('en');
```

No app reload needed. `DirectionProvider` re-renders instantly when `uiStore.direction` changes.

---

## Common Patterns — Admin Feature Development

> These patterns are used in every admin feature. Follow them exactly for consistency.

---

### Pattern 1 — Feature Folder Structure

Every admin feature follows this exact layout:

```
features/admin/<feature>/
├── api/
│   └── <feature>.ts              ← BaseApiService subclass + singleton + query keys
├── components/
│   ├── <feature>Columns.tsx      ← ColDef[] factory: get<Feature>Columns(t)
│   ├── <Entity>Form.tsx          ← Dual-mode form (page + modal)
│   └── <Entity>DetailScreen.tsx  ← Read-only detail view
├── hooks/
│   ├── use<Feature>.ts           ← useAdminFeature wrapper + export/selectedId
│   └── use<Feature>Form.ts       ← Form state, validation, submit
├── schemas/
│   └── <feature>Schema.ts        ← Zod factory: createXSchema(t)
├── utils/
│   └── export<Entity>Pdf.ts      ← PDF export function
└── <Feature>Screen.tsx           ← Orchestration: list / detail / edit
```

---

### Pattern 2 — API Service Class

```typescript
// ✅ Correct pattern
export class CustomersApiService extends BaseApiService {
  getCustomers   = (params?: Record<string, string>) => this.get<Customer[]>(API.CUSTOMERS.LIST, { params });
  getCustomer    = (id: string)                      => this.get<Customer>(API.CUSTOMERS.BY_ID(id));
  createCustomer = (data: CreateCustomerData)        => this.post<Customer>(API.CUSTOMERS.LIST, data);
  updateCustomer = (id: string, data: Partial<...>)  => this.put<Customer>(API.CUSTOMERS.BY_ID(id), data);
  deleteCustomer = (id: string)                      => this.delete<{ message: string }>(API.CUSTOMERS.BY_ID(id));
}

export const customersApi  = new CustomersApiService();
export const customersKeys = QUERY_KEYS.CUSTOMERS;  // ← always from constants/api
```

**Rules:**
- All methods are arrow function class properties (not class methods)
- All paths use `API.*` constants — never hardcoded strings
- Query keys from `QUERY_KEYS.*` — never defined locally
- `getAll` method accepts `params?: Record<string, string>` for pagination

---

### Pattern 3 — useAdminFeature Hook

```typescript
export function useCustomers() {
  const { t } = useTranslation();
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const columns = useMemo(() => getCustomerColumns(t), [t]);

  const f = useAdminFeature<Customer, CreateCustomerData>({
    entityName: 'customers',
    queryKey:   customersKeys.all,
    api: {
      getAll:  customersApi.getCustomers.bind(customersApi),
      create:  customersApi.createCustomer.bind(customersApi),
      update:  customersApi.updateCustomer.bind(customersApi),
      delete:  customersApi.deleteCustomer.bind(customersApi),
    },
    messages: {
      success: { created: t('customers.messages.created'), updated: t('...'), deleted: t('...') },
      error:   { create:  t('customers.messages.errorCreate'), update: t('...'), delete: t('...') },
      titles:  { create:  t('customers.addTitle'), edit: t('customers.editTitle') },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportCustomerPdf(f.entities, t); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport, selectedId, setSelectedId };
}
```

**`f` object contains:** `entities`, `loading`, `refetch`, `create`, `update`, `remove`, `ui`, `apiMeta`, `openDialog`, `closeDialog`, `messages`, `handleSubmit`, `handleDeleteConfirm`

---

### Pattern 4 — Column Definitions Factory

```typescript
export function getCustomerColumns(t: TFunction): ColDef<Customer>[] {
  return [
    { field: 'name',  headerName: t('customers.columns.name'),  flex: 1, sortable: true },
    { field: 'email', headerName: t('customers.columns.email'), width: 160 },
    {
      field: '_count', headerName: t('customers.columns.tickets'), width: 70, align: 'center',
      valueGetter: (row) => row._count?.tickets ?? 0,
      renderCell:  (row) => <CountBadge count={row._count?.tickets ?? 0} />,
    },
  ];
}
```

**Rules:**
- Signature: `(t: TFunction): ColDef<T>[]`
- All header names use `t()`
- Empty values shown as `'—'`
- Memoized in feature hook: `useMemo(() => getXColumns(t), [t])`

---

### Pattern 5 — Zod Schema Factory

```typescript
export const createCustomerFormSchema = (t: TFunction) =>
  z.object({
    name:  z.string().trim().min(2, t('validation.minLength', { field: t('common.name'), min: 2 })),
    email: z.string().trim().check(z.email(t('validation.invalidEmail'))),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    maintenanceType: z.enum(MAINTENANCE_TYPES).nullable().optional(),
  })
  .refine(
    (d) => !d.maintenanceType || !!d.subscriptionStartDate,
    { message: t('validation.required', { field: '...' }), path: ['subscriptionStartDate'] },
  );

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerFormSchema>>;
```

**Rules:**
- Signature: `(t: TFunction) => ZodSchema`
- Always `.trim()` before `.min()` / `.max()`
- Optional string fields: `.optional().or(z.literal(''))`
- Cross-field validation: `.refine()` with `path: [fieldName]`
- Export inferred type: `z.infer<ReturnType<typeof schema>>`

---

### Pattern 6 — Form Hook (use\<Feature\>Form)

```typescript
export function useCustomerForm({ item, onSave, onClose }) {
  const getInitial = useCallback((): FormFields => ({
    name:  item?.name  ?? '',
    email: item?.email ?? '',
  }), [item?.id]); // ← dep on id only, not full object

  const [fields,       setFields]       = useState(getInitial);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [isDirty,      setIsDirty]      = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setFields(getInitial()); setErrors({}); setIsDirty(false); }, [getInitial]);

  const handleChange = useCallback((field: keyof FormFields, value: string) => {
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(checkDirty(next));
      return next;
    });
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, [checkDirty]);

  const handleSubmit = useCallback(async () => {
    const result = schema.safeParse(fields);
    if (!result.success) { /* set errors, toast */ return; }
    setIsSubmitting(true);
    try {
      await onSave(result.data);
      toast.success(item ? t('...updated') : t('...created'));
      onClose(); // ← toast BEFORE onClose
    } catch { toast.error('...'); }
    finally { setIsSubmitting(false); }
  }, [fields, ...]);

  return { fields, errors, isDirty, isSubmitting, handleChange, handleClear, handleSubmit };
}
```

**Rules:**
- `getInitial` deps: `[item?.id]` only — not `[item]`
- Date fields normalized to `YYYY-MM-DD` via `toISOString().split('T')[0]`
- Errors deleted (not set to `''`) on field change
- Toast called **before** `onClose()` — page unmounts on close
- Return shape: `{ fields, errors, isDirty, isSubmitting, handleChange, handleClear, handleSubmit }`

---

### Pattern 7 — Screen Orchestration (3 view states)

```typescript
const CustomersScreen: React.FC = () => {
  const { f, columns, selectedId, setSelectedId } = useCustomers();
  const [editingFromDetail, setEditingFromDetail] = useState<Customer | null>(null);

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedId && !editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Customers">
        <CustomerDetailScreen
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditingFromDetail(f.entities.find(c => c.id === selectedId) ?? null)}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── Edit from detail ─────────────────────────────────────────────────────
  if (editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Customers">
        <CustomerForm
          item={editingFromDetail}
          onClose={() => { setEditingFromDetail(null); setSelectedId(editingFromDetail.id); }}
          onSave={async (data) => {
            await f.update(editingFromDetail.id, data);
            setEditingFromDetail(null);
            setSelectedId(editingFromDetail.id); // ← return to detail
          }}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── List view (default) ──────────────────────────────────────────────────
  return (
    <FeatureErrorBoundary featureName="Customers">
      <AdminCrudScreen<Customer>
        title={t('customers.title')}
        entities={f.entities}
        loading={f.loading}
        columns={columns}
        onRowPress={(c) => setSelectedId(c.id)}
        renderForm={(item, onClose) => <CustomerForm item={item} onClose={onClose} ... />}
      />
    </FeatureErrorBoundary>
  );
};
```

**State machine:** `list` → `detail` (selectedId set) → `edit` (editingFromDetail set)
After edit save → return to detail. After detail close → return to list.

---

### Pattern 8 — AdminCrudScreen Props

Required props:

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | `t('feature.title')` |
| `entities` | `T[]` | From `f.entities` |
| `loading` | `boolean` | From `f.loading` |
| `columns` | `ColDef<T>[]` | From `getXColumns(t)` |
| `searchFields` | `(keyof T)[]` | Fields to search |
| `onDelete` | `(id) => Promise<void>` | `f.remove` |
| `renderForm` | `(item, onClose) => ReactNode` | Form component |

Optional but common:

| Prop | Notes |
|---|---|
| `onRowPress` | Shows View button, navigates to detail |
| `onExport` | Shows Export button |
| `onRefresh` | Shows Refresh button |
| `apiTotal` | SERVER pagination: total from API |
| `onPageChange` | SERVER pagination: called on page change |

---

### Pattern 9 — Detail Screen Layout

Standard layout for every detail screen:

```tsx
<AdminDetailScreen title={entity?.name} subtitle={entity?.company} isLoading={isLoading} ...>

  {/* 1. Hero card — accent bar + avatar + name + badge */}
  <View style={heroCardStyle}>
    <View style={[accentBar, { backgroundColor: accentColor }]} />
    <InitialsAvatar name={entity.name} color={accentColor} />
    <Text>{entity.name}</Text>
    <StatusBadge />
  </View>

  {/* 2. Stats row — _count relations */}
  <DetailStatRow stats={[
    { value: entity._count?.tickets ?? 0, label: t('...'), color: '#1d4ed8', bgColor: '#eff6ff' },
  ]} />

  {/* 3. Info cards — metadata */}
  <DetailInfoCard title={t('...')} fields={[
    { icon: '✉️', label: t('common.email'), value: entity.email },
    { icon: '📅', label: t('common.created'), value: formatDate(entity.createdAt) },
  ]} />

</AdminDetailScreen>
```

---

### Pattern 10 — PDF Export

```typescript
export async function exportEntityPdf(items: Entity[], t: TFunction): Promise<void> {
  const head = `<tr><th>${esc(t('entity.columns.name'))}</th>...</tr>`;
  const body = items.map((item) => `<tr><td>${esc(item.name)}</td>...</tr>`).join('');
  const html = buildPdfPage(`${t('entity.title')} (${items.length})`,
    `<table><thead>${head}</thead><tbody>${body}</tbody></table>`);

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
}
```

**Helpers:** `buildPdfPage(title, body)` from `@/src/shared/utils/pdfTemplate` · `esc(s)` from `@/src/shared/utils/htmlUtils`

---

### New Feature Checklist

When adding a new admin feature, complete all steps:

**Files to create:**
- [ ] `api/<feature>.ts` — service + singleton + query keys
- [ ] `components/<feature>Columns.tsx` — `get<Feature>Columns(t)` factory
- [ ] `components/<Entity>Form.tsx` — dual-mode form (page + modal)
- [ ] `components/<Entity>DetailScreen.tsx` — read-only detail
- [ ] `hooks/use<Feature>.ts` — `useAdminFeature` wrapper
- [ ] `hooks/use<Feature>Form.ts` — form state + validation
- [ ] `schemas/<feature>Schema.ts` — Zod factory
- [ ] `utils/export<Entity>Pdf.ts` — PDF export
- [ ] `<Feature>Screen.tsx` — 3-state orchestration

**Constants to add:**
- [ ] `API.<FEATURE>.*` paths in `mobile/src/constants/api.ts`
- [ ] `QUERY_KEYS.<FEATURE>` in `mobile/src/constants/api.ts`

**i18n keys to add (both `en.json` and `ar.json`):**
- [ ] `<feature>.title`, `itemType`, `addTitle`, `editTitle`, `notFound`
- [ ] `<feature>.searchPlaceholder`, `emptyMessage`, `emptyFilteredMessage`
- [ ] `<feature>.columns.*`
- [ ] `<feature>.form.*`
- [ ] `<feature>.messages.*` (created, updated, deleted, errorCreate, errorUpdate, errorDelete, validationError)
- [ ] `<feature>.pdf.*` (if PDF export)
- [ ] `<feature>.sections.*` (if FormSection used)

**Wire into AdminPanel:**
- [ ] Import screen in `mobile/src/features/admin/AdminPanel.tsx`
- [ ] Add menu item to `MENU_ITEMS` array with `id`, `label`, `icon`, optional `roles`
- [ ] Add `case` in `renderContent()` switch
