---
inclusion: always
---

# Mobile — Error Handling & Toast Pattern

**Reference implementation:** `mobile/src/features/admin/customers/components/CustomerForm.tsx`

This rule defines the single, unified approach to errors and toasts across the entire mobile app.
Do not invent a new approach — follow this exactly.

---

## Architecture Overview

```
API Request
    │
    ▼
httpClient interceptor  ← catches ALL errors automatically
    │
    ├── Network error  → networkEvents.emit()  → NetworkErrorDialog (automatic)
    ├── 401            → token refresh queue   → retry, then NetworkErrorDialog
    ├── 4xx / 5xx      → networkEvents.emitApiError() → NetworkErrorDialog (automatic)
    └── Success (2xx)  → passes through cleanly
                                │
                                ▼
                    Feature code (form / screen)
                                │
                    ┌───────────┴───────────┐
                    │                       │
              Success path            Error path
                    │                       │
            toast.success()     Check: is it a specific
            THEN onClose()      business error?
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                  YES (duplicate,          NO (generic)
                  validation, etc.)             │
                        │                  NetworkErrorDialog
                  toast.error()           already showed it
                  (specific message)      DO NOT toast again
```

---

## Rule 1 — NetworkErrorDialog is the default error UI

The `httpClient` interceptor automatically shows `NetworkErrorDialog` for **every** API error.
You do not need to handle generic errors manually.

```ts
// ✅ Correct — empty catch, NetworkErrorDialog handles it
const doSave = async (data: any) => {
  try {
    await onSave(data);
    toast.success(t('entity.messages.created'));
    onClose();
  } catch (err: any) {
    // Only handle specific business errors here
    const serverMsg = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';
    if (serverMsg.toLowerCase().includes('already exists')) {
      isDuplicateError.current = true;
      toast.error(t('entity.duplicateError.title'), t('entity.duplicateError.message'));
    }
    // All other errors: NetworkErrorDialog already showed — do NOT toast
  }
};

// ❌ Wrong — double-shows the error (NetworkErrorDialog + toast)
} catch {
  toast.error(t('entity.messages.errorCreate'));
}
```

---

## Rule 2 — Toast success BEFORE onClose

The component unmounts when `onClose()` is called. Toast must fire first.

```ts
// ✅ Correct
toast.success(item ? t('entity.messages.updated') : t('entity.messages.created'));
onClose();

// ❌ Wrong — component unmounts, toast never renders
onClose();
toast.success(t('entity.messages.created'));
```

---

## Rule 3 — Specific errors get specific toasts

Only show `toast.error()` when the error is **actionable** — the user needs to know what to fix.

| Error type | Action |
|---|---|
| Duplicate email / name / slug | `toast.error(t('entity.duplicateError.title'), t('entity.duplicateError.message'))` |
| Business rule violation | `toast.error(specificMessage)` |
| Network timeout | ❌ Do NOT toast — NetworkErrorDialog shows |
| 500 server error | ❌ Do NOT toast — NetworkErrorDialog shows |
| 401 unauthorized | ❌ Do NOT toast — httpClient handles with retry |
| Generic API error | ❌ Do NOT toast — NetworkErrorDialog shows |

---

## Rule 4 — Duplicate error pattern (forms)

Every form that creates/updates a unique-field entity must implement this:

```ts
// 1. Ref to track duplicate state
const isDuplicateError = useRef(false);

// 2. Subscribe to NetworkErrorDialog OK press — close form after user acknowledges
useEffect(() => {
  const unsub = networkEvents.onOkPress(() => {
    if (isDuplicateError.current) {
      isDuplicateError.current = false;
      onClose();
    }
  });
  return () => { unsub(); };
}, [onClose]);

// 3. In doSave catch block
const serverMsg: string =
  err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';

if (serverMsg.toLowerCase().includes('already exists')) {
  isDuplicateError.current = true;
  toast.error(t('entity.duplicateError.title'), t('entity.duplicateError.message'));
  return;
}
// All other errors: NetworkErrorDialog handles — do NOT add more code here
```

**Why `networkEvents.onOkPress()`?**
When a duplicate error occurs, `NetworkErrorDialog` shows automatically (via httpClient interceptor).
The form needs to close after the user dismisses it. `onOkPress` fires when the user presses OK on the dialog — that's the right moment to close the form.

---

## Rule 5 — Delete error pattern (screens)

### Normal delete
```ts
const handleDelete = async (id: string) => {
  try {
    await f.remove(id);
    toast.success(t('entity.messages.deleted'));
    setSelectedId(null);
  } catch (error) {
    if (isAssociatedDataError(error)) {
      // httpClient already showed NetworkErrorDialog with reason:'associated_data'
      // Store pending target — ForceDeleteConfirmDialog opens on OK press
      pendingForceTarget.current = targetItem;
    }
    // All other errors: NetworkErrorDialog already showed — do NOT toast
  }
};
```

### Force-delete escalation
```ts
// 1. Ref for pending target
const pendingForceTarget = useRef<Entity | null>(null);

// 2. Subscribe to OK press — open force-delete after user acknowledges error
useEffect(() => {
  const unsub = networkEvents.onOkPress(() => {
    if (pendingForceTarget.current) {
      setForceTarget(pendingForceTarget.current);
      pendingForceTarget.current = null;
    }
  });
  return () => { unsub(); };
}, []);

// 3. In delete catch block
if (isAssociatedDataError(error)) {
  pendingForceTarget.current = targetItem;
  // NetworkErrorDialog already showed — do NOT toast here
} else {
  handleError(error, { feature: 'entity', operation: 'delete' });
}

// 4. Force-delete handler
const handleForceDelete = async () => {
  try {
    await entityApi.forceDelete(forceTarget.id);
    toast.success(t('entity.messages.forceDeleted'));
    setForceTarget(null);
    f.refetch();
  } catch {
    // NetworkErrorDialog handles
  }
};
```

**Import `isAssociatedDataError` from the correct location:**
```ts
import { isAssociatedDataError } from '@/src/services/api/errorCodes';
```
Never inline `error.message.includes('associated')` — use the typed helper.

---

## Rule 6 — useErrorHandler for non-form async operations

Use `useErrorHandler` for fetch, export, and non-form mutations in screens:

```ts
const { handleError } = useErrorHandler();

// ✅ Correct — structured error handling for screen-level operations
try {
  await f.update(id, data);
} catch (error) {
  handleError(error, { feature: 'customers', operation: 'update' });
}

// ✅ Correct — export operation
const handleExport = async () => {
  try {
    await exportEntityPdf(entities, t);
  } catch (error) {
    handleError(error, { feature: 'customers', operation: 'export' });
  }
};
```

**Do NOT use `useErrorHandler` inside forms** — forms use the `doSave` pattern with specific duplicate detection.

---

## Rule 7 — FeatureErrorBoundary on every view state

Every view state (list, detail, edit) must be wrapped:

```tsx
// ✅ Correct
<FeatureErrorBoundary featureName="Customers" onError={handleFeatureError}>
  <CustomerDetailScreen ... />
</FeatureErrorBoundary>

// handleFeatureError wires into useErrorHandler
const handleFeatureError = (error: Error, errorInfo: any, errorId: string) => {
  handleError(error, {
    feature: 'customers',
    operation: 'feature-boundary',
    metadata: { errorId, componentStack: errorInfo.componentStack },
  });
};
```

---

## Rule 8 — queryEnabled during delete

Prevent background refetch of a detail query while delete is in progress:

```tsx
<EntityDetailScreen
  entityId={selectedId}
  queryEnabled={!deletingFromDetail}   // ← prevents stale refetch during delete
/>
```

After delete completes, remove the stale detail cache entry:
```ts
queryClient.removeQueries({ queryKey: entityKeys.detail(deletedId) });
```

---

## Complete doSave Template

Copy this exactly for every new form:

```ts
// ── Duplicate detection ────────────────────────────────────────────────────
const isDuplicateError = useRef(false);

useEffect(() => {
  const unsub = networkEvents.onOkPress(() => {
    if (isDuplicateError.current) {
      isDuplicateError.current = false;
      onClose();
    }
  });
  return () => { unsub(); };
}, [onClose]);

// ── Submit ─────────────────────────────────────────────────────────────────
const doSave = async (data: any) => {
  try {
    await onSave({ /* transform data */ } as CreateEntityData);

    // ✅ Toast BEFORE onClose
    toast.success(item ? t('entity.messages.updated') : t('entity.messages.created'));
    onClose();

  } catch (err: any) {
    const serverMsg: string =
      err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';

    if (serverMsg.toLowerCase().includes('already exists')) {
      isDuplicateError.current = true;
      toast.error(t('entity.duplicateError.title'), t('entity.duplicateError.message'));
      return;
    }
    // Re-throw so react-hook-form resets isSubmitting → submit button becomes active again
    // NetworkErrorDialog handles display automatically — do NOT toast here
    throw err;
  }
};
```

---

## Complete Delete Template

Copy this for every screen with delete:

```ts
// ── Delete from detail ─────────────────────────────────────────────────────
const [deletingFromDetail, setDeletingFromDetail] = useState<Entity | null>(null);
const [deleting,           setDeleting]           = useState(false);
const pendingForceTarget = useRef<Entity | null>(null);

useEffect(() => {
  const unsub = networkEvents.onOkPress(() => {
    if (pendingForceTarget.current) {
      setForceTarget(pendingForceTarget.current);
      pendingForceTarget.current = null;
    }
  });
  return () => { unsub(); };
}, []);

const handleDeleteFromDetail = async () => {
  if (!deletingFromDetail) return;
  setDeleting(true);
  try {
    await f.remove(deletingFromDetail.id);
    queryClient.removeQueries({ queryKey: entityKeys.detail(deletingFromDetail.id) });
    toast.success(t('entity.messages.deleted'));
    setSelectedId(null);
    setDeletingFromDetail(null);
  } catch (error) {
    setDeletingFromDetail(null);
    if (isAssociatedDataError(error)) {
      pendingForceTarget.current = deletingFromDetail;
    } else {
      handleError(error, { feature: 'entity', operation: 'delete' });
    }
  } finally {
    setDeleting(false);
  }
};
```

---

## i18n Keys Required for Every Entity

```json
"entity": {
  "messages": {
    "created":     "Entity created successfully",
    "updated":     "Entity updated successfully",
    "deleted":     "Entity deleted successfully",
    "forceDeleted":"Entity and all related data deleted"
  },
  "duplicateError": {
    "title":   "Name/Email Already Exists",
    "message": "An entity with this value already exists. Fix it or dismiss to cancel."
  }
}
```

---

## Decision Table — Which Error Mechanism to Use

| Situation | Mechanism | Code |
|---|---|---|
| Form save succeeds | `toast.success()` before `onClose()` | `toast.success(t('...')); onClose();` |
| Form save fails — duplicate | `toast.error()` + `isDuplicateError` ref | See Rule 4 |
| Form save fails — any other error | Nothing — NetworkErrorDialog shows | Empty catch |
| Delete succeeds | `toast.success()` | `toast.success(t('...'))`  |
| Delete fails — associated data | `pendingForceTarget` ref + `onOkPress` | See Rule 5 |
| Delete fails — any other error | `handleError()` | `handleError(error, { feature, operation })` |
| Screen fetch fails | `handleError()` | `handleError(error, { feature, operation: 'fetch' })` |
| Export fails | `handleError()` | `handleError(error, { feature, operation: 'export' })` |
| React render error | `FeatureErrorBoundary` | Wrap every view state |
| Network timeout | Nothing — NetworkErrorDialog shows | No code needed |
| 500 server error | Nothing — NetworkErrorDialog shows | No code needed |
| 401 unauthorized | Nothing — httpClient retries | No code needed |

---

## Checklist — New Screen or Form

### Form
- [ ] `isDuplicateError` ref declared
- [ ] `networkEvents.onOkPress()` subscription in `useEffect`
- [ ] `doSave` catch: checks `already exists`, shows specific toast, returns early
- [ ] `doSave` catch: no `toast.error()` for generic errors
- [ ] `toast.success()` called BEFORE `onClose()`
- [ ] i18n keys: `messages.created`, `messages.updated`, `duplicateError.title`, `duplicateError.message`

### Screen (list + detail)
- [ ] `FeatureErrorBoundary` wraps every view state
- [ ] `handleFeatureError` wired to `useErrorHandler`
- [ ] Delete catch: uses `isAssociatedDataError()` from `@/src/services/api/errorCodes`
- [ ] Delete catch: `pendingForceTarget` ref + `networkEvents.onOkPress()` for force-delete
- [ ] Delete catch: `handleError()` for non-associated errors
- [ ] `queryEnabled={!deletingFromDetail}` on detail screen during delete
- [ ] `queryClient.removeQueries()` after successful delete
- [ ] i18n keys: `messages.deleted`, `messages.forceDeleted`
