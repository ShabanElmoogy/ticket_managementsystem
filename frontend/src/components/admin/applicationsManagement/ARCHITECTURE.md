# Applications Management Architecture

## Overview
The Applications Management module follows a clean, modular architecture pattern that separates concerns into distinct layers. This structure can be replicated for any CRUD feature in the application.

## Directory Structure
```
applicationsManagement/
├── components/           # UI Components
│   ├── ApplicationFormDialog.tsx
│   ├── ApplicationsColumns.tsx
│   └── ApplicationsTable.tsx
├── hooks/               # Business Logic Hooks
│   ├── useApplicationForm.ts
│   ├── useApplicationsData.ts
│   ├── useApplicationsManagement.ts
│   └── useApplicationsUI.ts
├── services/            # API Layer
│   ├── applicationsService.ts
│   └── keys.ts
├── types/               # Type Definitions
│   └── types.ts
├── utils/               # Utilities
│   ├── errorUtils.ts
│   ├── messages.ts
│   └── validation.ts
└── index.ts            # Public API
```

## Architecture Layers

### 1. Services Layer (`services/`)
**Purpose**: API communication and data fetching
- **applicationsService.ts**: React Query hooks for CRUD operations
- **keys.ts**: Query key factory for cache management

```typescript
// Pattern: useEntityQuery, useCreateEntityMutation, etc.
export const useApplicationsQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: applicationsKeys.all,
    queryFn: () => applicationsApi.getApplications(),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
};
```

### 2. Data Layer (`hooks/useApplicationsData.ts`)
**Purpose**: Data operations abstraction
- Wraps service layer mutations
- Provides consistent callback interface
- Handles authentication state

```typescript
export interface ApplicationsDataReturn {
  applications: Application[];
  loading: boolean;
  create: (data: CreateApplicationData, opts?: CallbackOpts) => void;
  update: (id: string, data: CreateApplicationData, opts?: CallbackOpts) => void;
  remove: (id: string, opts?: CallbackOpts) => void;
  refetch: () => void;
}
```

### 3. UI State Layer (`hooks/useApplicationsUI.ts`)
**Purpose**: UI state management
- Dialog states (open/close, editing mode)
- Form data state
- Snackbar notifications
- Delete confirmation dialogs

```typescript
export interface ApplicationsUIReturn {
  dialogOpen: boolean;
  editingApplication: Application | null;
  formData: CreateApplicationData;
  snackbar: SnackbarState;
  deleteDialog: DeleteDialogState;
  // ... handlers
}
```

### 4. Simplified Hook Layer (`hooks/useApplications.ts`) ✅
**Purpose**: Single hook combining data operations and UI state
- Consolidates data operations with UI state management
- Handles business logic flow inline
- Error handling and user feedback
- Eliminates hook orchestration complexity

```typescript
export function useApplications() {
  const { applications, loading, create, update, remove, refetch } = useApplicationsData();
  const [ui, setUI] = useState<UIState>(initialUIState);
  
  // Business logic with inline UI state management
  const handleSubmit = useCallback(async (values) => {
    setUI(prev => ({ ...prev, submitting: true }));
    // Direct create/update with UI feedback
  }, []);
  
  return { applications, loading, ...ui, handleSubmit, /* other handlers */ };
}
```

### 5. Component Layer (`components/`)
**Purpose**: Presentation and user interaction
- **ApplicationsTable.tsx**: Data grid wrapper
- **ApplicationsColumns.tsx**: Column definitions factory
- **ApplicationFormDialog.tsx**: Form dialog (now using reusable components)

### 6. Supporting Layers

#### Types (`types/types.ts`)
- Interface definitions
- Component props
- Hook return types

#### Utils (`utils/`)
- **validation.ts**: Zod schemas
- **messages.ts**: UI text constants
- **errorUtils.ts**: Error handling utilities

#### Public API (`index.ts`)
- Exports public components and types
- Defines module boundaries

## Key Patterns

### 1. Separation of Concerns
- **Services**: Pure API calls
- **Data**: Business data operations
- **UI**: Pure UI state
- **Controller**: Orchestration
- **Components**: Presentation

### 2. Consistent Interfaces
```typescript
// All data hooks follow this pattern
interface EntityDataReturn {
  entities: Entity[];
  loading: boolean;
  create: (data: CreateData, opts?: CallbackOpts) => void;
  update: (id: string, data: UpdateData, opts?: CallbackOpts) => void;
  remove: (id: string, opts?: CallbackOpts) => void;
  refetch: () => void;
}
```

### 3. Error Handling Strategy
- Centralized error normalization
- Consistent user feedback
- Graceful degradation

### 4. State Management
- Local state for UI concerns
- React Query for server state
- Zustand for global app state

## Implementation Guide

### Step 1: Define Types
```typescript
// types/types.ts
export interface Entity {
  id: string;
  name: string;
  // ... other fields
}

export interface CreateEntityData {
  name: string;
  // ... other fields
}
```

### Step 2: Create Services
```typescript
// services/entityService.ts
export const useEntitiesQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: entityKeys.all,
    queryFn: () => entityApi.getEntities(),
    enabled,
  });
};
```

### Step 3: Build Data Hook
```typescript
// hooks/useEntitiesData.ts
export function useEntitiesData(): EntitiesDataReturn {
  const { data: entities = [], isLoading: loading } = useEntitiesQuery(!!token);
  // ... implement CRUD operations
  return { entities, loading, create, update, remove, refetch };
}
```

### Step 4: Create UI Hook
```typescript
// hooks/useEntitiesUI.ts
export function useEntitiesUI(): EntitiesUIReturn {
  // ... implement UI state management
  return { dialogOpen, formData, snackbar, /* handlers */ };
}
```

### Step 5: Build Controller
```typescript
// hooks/useEntitiesManagement.ts
export function useEntitiesManagement(): EntitiesControllerReturn {
  const data = useEntitiesData();
  const ui = useEntitiesUI();
  // ... orchestrate business logic
  return { ...data, ...ui, /* combined handlers */ };
}
```

### Step 6: Create Components
```typescript
// components/EntitiesTable.tsx
const EntitiesTable: React.FC<EntitiesTableProps> = ({ entities, loading, onEdit, onDelete }) => {
  const columns = getEntitiesColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={entities} columns={columns} loading={loading} />;
};
```

## Benefits

### 1. Maintainability
- Clear separation of concerns
- Predictable structure
- Easy to locate and modify code

### 2. Reusability
- Hooks can be composed differently
- Components are decoupled
- Utilities are shared

### 3. Testability
- Each layer can be tested independently
- Mock boundaries are well-defined
- Business logic is isolated

### 4. Scalability
- Pattern scales to complex features
- New developers can follow established patterns
- Consistent architecture across modules

## Usage Example - Simplified ✅

```typescript
// In a page component - Now using single consolidated hook
function ApplicationsPage() {
  const {
    // Data
    applications, loading,
    // UI State
    dialogOpen, editingApplication, submitting, snackbar, deleteDialog,
    // Handlers
    handleOpenDialog, handleCloseDialog, handleSubmit,
    handleDeleteClick, handleDeleteConfirm, handleDeleteCancel, handleSnackbarClose,
  } = useApplications(); // Single hook instead of useApplicationsManagement

  return (
    <>
      <ApplicationsTable
        applications={applications}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDeleteClick}
      />
      
      <ApplicationFormDialog
        open={dialogOpen}
        editing={!!editingApplication}
        initialValues={editingApplication}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
      
      {/* Snackbar and Delete Dialog components */}
    </>
  );
}
```

**Improvements:**
- Single hook import instead of multiple
- Cleaner destructuring with logical grouping
- Direct access to all state and handlers
- Reduced cognitive overhead

This architecture provides a solid foundation for building any CRUD feature with consistent patterns, clear separation of concerns, and excellent maintainability.