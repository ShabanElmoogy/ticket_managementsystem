# Customers Management Architecture

## Overview
Clean CRUD module with HOC composition, separated schemas, and optimized performance for large datasets.

## Directory Structure
```
customersManagement/
├── api/                 # API Layer
│   └── customers.ts
├── components/          # UI Components
│   ├── CustomerFormDialog.tsx
│   ├── CustomersColumns.tsx
│   └── CustomersTable.tsx
├── schemas/             # Validation Schemas
│   └── customerSchema.ts
├── types/               # Type Definitions
│   └── types.ts
└── index.ts            # Public API
```

## Architecture Layers

### 1. API Layer (`api/`)
**Purpose**: Data fetching and mutations
```typescript
// customers.ts
export const useCustomersQuery = () => useQuery({
  queryKey: ['customers'],
  queryFn: () => customersApi.getCustomers(),
});

export const useCreateCustomerMutation = () => useMutation({
  mutationFn: customersApi.createCustomer,
});
```

### 2. Schema Layer (`schemas/`)
**Purpose**: Validation and type safety
```typescript
// customerSchema.ts
export const customerFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  applicationIds: z.array(z.string()).optional(),
});
```

### 3. Component Layer (`components/`)
**Purpose**: Presentation with performance optimization

#### CustomersTable.tsx
```typescript
const CustomersTable: React.FC<CustomersTableProps> = ({
  customers, loading, onEdit, onDelete,
}) => {
  const columns = getCustomersColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={customers} columns={columns} loading={loading} />;
};
```

#### CustomerFormDialog.tsx
```typescript
const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open, editing, initialValues, applications, onClose, onSubmit,
}) => {
  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(customerFormSchema),
    mode: "onChange",
    defaultValues: initialValues || { name: "", email: "", phone: "", address: "", description: "", applicationIds: [] },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      {/* Form fields with validation */}
    </Dialog>
  );
};
```

### 4. Performance Layer
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
function CustomersPage() {
  // HOC provides all CRUD functionality
  return (
    <CustomersPageWithHOC>
      {({ customers, loading, handlers }) => (
        <>
          <CustomersTable
            customers={customers}
            loading={loading}
            onEdit={handlers.handleEdit}
            onDelete={handlers.handleDelete}
          />
          
          <CustomerFormDialog
            open={handlers.dialogOpen}
            editing={handlers.editing}
            initialValues={handlers.initialValues}
            applications={handlers.applications}
            onClose={handlers.handleClose}
            onSubmit={handlers.handleSubmit}
          />
        </>
      )}
    </CustomersPageWithHOC>
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