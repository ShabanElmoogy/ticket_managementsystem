# Users Management Architecture

## Overview
Clean CRUD module with HOC composition, separated schemas, and optimized performance for large datasets.

## Directory Structure
```
usersManagement/
├── components/          # UI Components
│   ├── UserFormDialog.tsx
│   ├── UsersColumns.tsx
│   ├── UsersStatsCards.tsx
│   └── UsersTable.tsx
├── schemas/             # Validation Schemas
│   └── userSchema.ts
├── types/               # Type Definitions
│   └── types.ts
└── index.ts            # Public API
```

## Architecture Layers

### 1. Schema Layer (`schemas/`)
**Purpose**: Validation and type safety
```typescript
// userSchema.ts
export const userFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(150),
  password: z.string().min(6).max(100).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  phone: z.string().trim().regex(/^\+?[\d\s\-\(\)]+$/).optional().or(z.literal("")),
  whatsappNotifications: z.boolean().optional(),
});
```

### 2. Component Layer (`components/`)
**Purpose**: Presentation with performance optimization

#### UsersTable.tsx
```typescript
const UsersTable: React.FC<UsersTableProps> = ({
  users, loading, onEdit, onDelete,
}) => {
  const columns = getUsersColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={users} columns={columns} loading={loading} />;
};
```

#### UserFormDialog.tsx
```typescript
const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open, editing, initialValues, onClose, onSubmit,
}) => {
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(userFormSchema),
    mode: "onChange",
    defaultValues: initialValues || { name: "", email: "", password: "", role: "EMPLOYEE", phone: "", whatsappNotifications: false },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      {/* Form fields with validation */}
    </Dialog>
  );
};
```

### 3. Performance Layer
**AdminDataGrid with Virtualization**
```typescript
// Enhanced with virtualization for large datasets
<DataGrid
  rows={rows}
  columns={columns}
  loading={loading}
  rowBuffer={10}
  columnBuffer={2}
  disableVirtualization={false}
/>
```

## Key Patterns

### 1. HOC Composition Pattern
- **Business Logic**: Higher-Order Components handle CRUD operations
- **UI Components**: Pure presentation components
- **Benefit**: Better separation of concerns, reusable logic

### 2. Schema Separation
- **Before**: Inline Zod schemas in components
- **After**: Dedicated schemas directory
- **Benefit**: Reusability, better organization

### 3. Performance Optimization
- **Virtualization**: Built-in DataGrid virtualization for large lists
- **Buffer Configuration**: Optimized row/column buffers
- **Lazy Loading**: React Query with stale-while-revalidate

## Usage Example

```typescript
function UsersPage() {
  // HOC provides all CRUD functionality
  return (
    <UsersPageWithHOC>
      {({ users, loading, handlers }) => (
        <>
          <UsersStatsCards users={users} />
          
          <UsersTable
            users={users}
            loading={loading}
            onEdit={handlers.handleEdit}
            onDelete={handlers.handleDelete}
          />
          
          <UserFormDialog
            open={handlers.dialogOpen}
            editing={handlers.editing}
            initialValues={handlers.initialValues}
            onClose={handlers.handleClose}
            onSubmit={handlers.handleSubmit}
          />
        </>
      )}
    </UsersPageWithHOC>
  );
}
```

## Benefits

### 1. Simplified Architecture
- HOC composition for reusable logic
- Clean component separation
- Reduced boilerplate

### 2. Better Performance
- Virtualized tables for large datasets
- Optimized React Query caching
- Efficient re-renders

### 3. Maintainability
- Clear separation of concerns
- Reusable validation schemas
- Consistent patterns

### 4. Type Safety
- Full TypeScript coverage
- Zod schema validation
- Proper error handling

This streamlined architecture provides a solid foundation for CRUD operations with optimal performance and developer experience.