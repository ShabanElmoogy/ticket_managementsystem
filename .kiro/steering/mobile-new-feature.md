---
inclusion: always
---

# Mobile — Building a New Admin Feature

Step-by-step guide for adding a new admin feature to `mobile/src/features/admin/`. Follow this order — each step unblocks the next.

> **Reference implementation:** `mobile/src/features/admin/customers/`

---

## Step 1 — Add API constants

In `mobile/src/constants/api.ts`:

```ts
// Add endpoint paths
export const API = {
  // ...existing...
  WIDGETS: {
    LIST:    '/widgets',
    BY_ID:   (id: string) => `/widgets/${id}`,
  },
};

// Add query keys
export const QUERY_KEYS = {
  // ...existing...
  WIDGETS: {
    all:    ['widgets'] as const,
    detail: (id: string) => ['widgets', id] as const,
  },
};
```

---

## Step 2 — Create the API service

`features/admin/widgets/api/widgets.ts`:

```ts
import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { Widget, CreateWidgetData } from '@/src/services/api/types';

export class WidgetsApiService extends BaseApiService {
  getWidgets   = (params?: Record<string, string>) => this.get<Widget[]>(API.WIDGETS.LIST, { params });
  getWidget    = (id: string)                      => this.get<Widget>(API.WIDGETS.BY_ID(id));
  createWidget = (data: CreateWidgetData)          => this.post<Widget>(API.WIDGETS.LIST, data);
  updateWidget = (id: string, data: Partial<CreateWidgetData>) => this.put<Widget>(API.WIDGETS.BY_ID(id), data);
  deleteWidget = (id: string)                      => this.delete<{ message: string }>(API.WIDGETS.BY_ID(id));
}

export const widgetsApi  = new WidgetsApiService();
export const widgetsKeys = QUERY_KEYS.WIDGETS;
```

---

## Step 3 — Create the Zod schema

`features/admin/widgets/schemas/widgetSchema.ts`:

```ts
import { z } from 'zod';
import type { TFunction } from 'i18next';

export const createWidgetFormSchema = (t: TFunction) =>
  z.object({
    name:  z.string().trim().min(2, t('validation.minLength', { field: t('common.name'), min: 2 })).max(100),
    email: z.string().trim().check(z.email(t('validation.invalidEmail'))),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
  });

export type WidgetFormValues = z.infer<ReturnType<typeof createWidgetFormSchema>>;
```

---

## Step 4 — Create the column definitions

`features/admin/widgets/components/widgetColumns.tsx`:

```ts
import { Palette } from '@/src/constants/tokens';
import type { TFunction } from 'i18next';
import type { ColDef } from '@/src/shared/components';
import type { Widget } from '@/src/services/api/types';

export function getWidgetColumns(t: TFunction): ColDef<Widget>[] {
  return [
    { field: 'name',  headerName: t('widgets.columns.name'),  flex: 1 },
    { field: 'email', headerName: t('widgets.columns.email'), width: 160 },
    {
      field: '_count', headerName: t('widgets.columns.tickets'), width: 70, align: 'center',
      valueGetter: (row) => row._count?.tickets ?? 0,
    },
  ];
}
```

---

## Step 5 — Create the form

`features/admin/widgets/components/WidgetForm.tsx` — follow `mobile-form-pattern.md` exactly:

```tsx
interface Props {
  item:       Widget | null;
  onClose:    () => void;
  onSave:     (data: CreateWidgetData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';
}

const WidgetForm: React.FC<Props> = ({ item, onClose, onSave, submitting, mode = 'page' }) => {
  // 1. useForm + zodResolver
  // 2. useFocusInput + useRef chain
  // 3. doSave with duplicate detection
  // 4. fields_jsx shared between page and modal
  // 5. AdminFormPage (page) or AdminFormModal (modal)
};
```

Key rules:
- `AppFormField` for text inputs — never manual `value`/`onChangeText`
- `Controller` for `ChipSelector`, `AppDatePicker`, custom pickers
- `FormSection` to group fields — `hasError` on every collapsible section
- `toast.success()` BEFORE `onClose()`
- `isDuplicateError` ref + `networkEvents.onOkPress` subscription

---

## Step 6 — Create the detail screen

`features/admin/widgets/components/WidgetDetailScreen.tsx`:

```tsx
<AdminDetailScreen title={widget?.name} isLoading={isLoading} onClose={onClose} onEdit={onEdit} onDelete={onDelete}>
  {/* Hero card */}
  <View style={[styles.heroCard, { borderTopColor: accentColor }]}>
    <InitialsAvatar name={widget.name} color={accentColor} size={52} />
    <Text style={{ color: c.text.primary, fontWeight: '700' }}>{widget.name}</Text>
  </View>

  {/* Stats row */}
  <DetailStatRow stats={[
    { value: widget._count?.tickets ?? 0, label: t('widgets.columns.tickets'), color: Palette.blue700, bgColor: '#eff6ff' },
  ]} />

  {/* Info card */}
  <DetailInfoCard title={t('common.details')} fields={[
    { icon: 'mail-outline', label: t('common.email'), value: widget.email },
    { icon: 'calendar-outline', label: t('common.created'), value: formatDate(widget.createdAt) },
  ]} />
</AdminDetailScreen>
```

---

## Step 7 — Create the feature hook

`features/admin/widgets/hooks/useWidgets.ts`:

```ts
export function useWidgets() {
  const { t } = useTranslation();
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const columns = useMemo(() => getWidgetColumns(t), [t]);

  const f = useAdminFeature<Widget, CreateWidgetData>({
    entityName: 'widgets',
    queryKey:   widgetsKeys.all,
    api: {
      getAll:  widgetsApi.getWidgets.bind(widgetsApi),
      create:  widgetsApi.createWidget.bind(widgetsApi),
      update:  widgetsApi.updateWidget.bind(widgetsApi),
      delete:  widgetsApi.deleteWidget.bind(widgetsApi),
    },
    messages: {
      success: { created: t('widgets.messages.created'), updated: t('widgets.messages.updated'), deleted: t('widgets.messages.deleted') },
      error:   { create: t('widgets.messages.errorCreate'), update: t('widgets.messages.errorUpdate'), delete: t('widgets.messages.errorDelete') },
      titles:  { create: t('widgets.addTitle'), edit: t('widgets.editTitle') },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportWidgetPdf(f.entities, t); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport, selectedId, setSelectedId };
}
```

---

## Step 8 — Create the screen (3 view states)

`features/admin/widgets/WidgetsScreen.tsx`:

```tsx
const WidgetsScreen: React.FC = () => {
  const { f, columns, selectedId, setSelectedId } = useWidgets();
  const [editingFromDetail, setEditingFromDetail] = useState<Widget | null>(null);

  // Detail view
  if (selectedId && !editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Widgets">
        <WidgetDetailScreen
          widgetId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditingFromDetail(f.entities.find(w => w.id === selectedId) ?? null)}
        />
      </FeatureErrorBoundary>
    );
  }

  // Edit from detail
  if (editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Widgets">
        <WidgetForm
          item={editingFromDetail}
          onClose={() => { setEditingFromDetail(null); setSelectedId(editingFromDetail.id); }}
          onSave={async (data) => {
            await f.update(editingFromDetail.id, data);
            setEditingFromDetail(null);
            setSelectedId(editingFromDetail.id);
          }}
          submitting={false}
        />
      </FeatureErrorBoundary>
    );
  }

  // List view (default)
  return (
    <FeatureErrorBoundary featureName="Widgets">
      <AdminCrudScreen<Widget>
        title={t('widgets.title')}
        entities={f.entities}
        loading={f.loading}
        columns={columns}
        searchFields={['name', 'email']}
        onDelete={f.remove}
        onRowPress={(w) => setSelectedId(w.id)}
        onExport={handleExport}
        onRefresh={f.refetch}
        renderForm={(item, onClose) => (
          <WidgetForm item={item} onClose={onClose} onSave={item ? (d) => f.update(item.id, d) : f.create} submitting={false} />
        )}
        deleteSuccessMessage={t('widgets.messages.deleted')}
        searchPlaceholder={t('widgets.searchPlaceholder')}
        emptyMessage={t('widgets.emptyMessage')}
        emptyFilteredMessage={t('widgets.emptyFilteredMessage')}
      />
    </FeatureErrorBoundary>
  );
};
```

---

## Step 9 — Add i18n keys

Add to **both** `en.json` and `ar.json`:

```json
"widgets": {
  "title":               "Widgets",
  "itemType":            "widget",
  "addTitle":            "Add Widget",
  "editTitle":           "Edit Widget",
  "notFound":            "Widget not found",
  "searchPlaceholder":   "Search widgets…",
  "emptyMessage":        "No widgets yet",
  "emptyFilteredMessage":"No widgets match your search",
  "columns": {
    "name":    "Name",
    "email":   "Email",
    "tickets": "Tickets"
  },
  "form": {
    "name":             "Name *",
    "namePlaceholder":  "Widget name",
    "email":            "Email *",
    "emailPlaceholder": "email@example.com",
    "phone":            "Phone",
    "phonePlaceholder": "+1 234 567 8900"
  },
  "sections": {
    "basicInfo": "Basic Info",
    "contact":   "Contact"
  },
  "messages": {
    "created":         "Widget created successfully",
    "updated":         "Widget updated successfully",
    "deleted":         "Widget deleted successfully",
    "errorCreate":     "Error creating widget",
    "errorUpdate":     "Error updating widget",
    "errorDelete":     "Error deleting widget",
    "validationError": "Please fix the errors before saving"
  },
  "duplicateError": {
    "title":   "Email Already Exists",
    "message": "A widget with this email already exists."
  }
}
```

---

## Step 10 — Wire into AdminPanel

In `mobile/src/features/admin/AdminPanel.tsx`:

```ts
// 1. Import the screen
import WidgetsScreen from './widgets/WidgetsScreen';

// 2. Add to MENU_ITEMS
const MENU_ITEMS = [
  // ...existing...
  { id: 'widgets', label: t('widgets.title'), icon: 'cube-outline' as IoniconName },
];

// 3. Add case in renderContent()
case 'widgets': return <WidgetsScreen />;
```

---

## Complete Checklist

### Files
- [ ] `api/widgets.ts` — service + singleton + query keys
- [ ] `components/widgetColumns.tsx` — `getWidgetColumns(t)` factory
- [ ] `components/WidgetForm.tsx` — dual-mode form (page + modal)
- [ ] `components/WidgetDetailScreen.tsx` — read-only detail
- [ ] `hooks/useWidgets.ts` — `useAdminFeature` wrapper
- [ ] `schemas/widgetSchema.ts` — Zod factory
- [ ] `utils/exportWidgetPdf.ts` — PDF export
- [ ] `WidgetsScreen.tsx` — 3-state orchestration

### Constants
- [ ] `API.WIDGETS.*` in `constants/api.ts`
- [ ] `QUERY_KEYS.WIDGETS` in `constants/api.ts`

### Form (see `mobile-form-pattern.md`)
- [ ] `useFocusInput` on first field, `useRef` on all others
- [ ] `nextRef` chain — every field except last has `blurOnSubmit`
- [ ] All text inputs use `AppFormField` — no manual wiring
- [ ] Non-text inputs use `Controller`
- [ ] `FormSection` groups fields — `hasError` on collapsible sections
- [ ] `doSave`: toast before `onClose`, duplicate check, empty catch for others
- [ ] `isDuplicateError` ref + `networkEvents.onOkPress` subscription

### Screen
- [ ] `FeatureErrorBoundary` wraps all 3 view states
- [ ] Delete uses `isAssociatedDataError` + `pendingForceTarget` pattern
- [ ] `queryEnabled={!deletingFromDetail}` on detail screen
- [ ] `queryClient.removeQueries()` after successful delete

### i18n
- [ ] All keys in both `en.json` and `ar.json`
- [ ] `messages.created/updated/deleted/errorCreate/errorUpdate/errorDelete/validationError`
- [ ] `duplicateError.title/message`
- [ ] `sections.*` if using `FormSection`

### AdminPanel
- [ ] Screen imported
- [ ] Menu item added with `IoniconName` icon
- [ ] `case` added in `renderContent()`

### Colors & Theme (see `mobile-theme-system.md`)
- [ ] All colors use `c.*` tokens — no hardcoded hex
- [ ] `Palette.*` only at module level for domain maps
- [ ] `c.shadow` for shadow color with `shadowOpacity: 1`
- [ ] Icons use `<Ionicons>` — no emoji in UI
