# Architecture Alignment - Component Location

## Question
Should reusable components be in `mobile/src/components/common/` or `mobile/src/shared/components/`?

## Answer
**`mobile/src/shared/components/`** ✅

## Reasoning

### 1. Architecture Document (REPLICATION_PLAN.md)
The replication plan explicitly defines the mobile structure:

```
mobile/src/
├── shared/                       # Cross-feature reusables
│   ├── components/               # ← was components/common/
│   ├── hooks/                    # ← was shared/hooks/
│   └── utils/                    # ← was shared/utils/
```

The comment "← was components/common/" indicates that `components/common/` is the **old web pattern**, and `shared/components/` is the **correct mobile pattern**.

### 2. Consistency with Existing Structure
The mobile app already has:
- `mobile/src/shared/hooks/` (with `useAuxData.ts`)
- `mobile/src/shared/utils/` (empty but defined)

Adding `shared/components/` maintains consistency.

### 3. Web vs Mobile Patterns
**Web structure:**
```
web/src/
├── components/
│   ├── common/          # Shared UI components
│   └── admin/           # Feature components
```

**Mobile structure:**
```
mobile/src/
├── components/
│   └── layout/          # Layout-specific components only
├── features/            # Feature modules
└── shared/              # Cross-feature reusables
    ├── components/      # Shared UI components
    ├── hooks/
    └── utils/
```

The mobile app uses a **feature-based architecture** where:
- `components/` is for layout/infrastructure components
- `features/` is for domain-specific features
- `shared/` is for cross-cutting concerns

### 4. Semantic Clarity
- `components/common/` suggests "common components within the components folder"
- `shared/components/` suggests "components shared across features"

The latter is clearer and aligns with the feature-based architecture.

---

## Migration Performed

### Files Moved
```
mobile/src/components/common/Avatar.tsx
  → mobile/src/shared/components/Avatar.tsx

mobile/src/components/common/Badge.tsx
  → mobile/src/shared/components/Badge.tsx

mobile/src/components/common/IconButton.tsx
  → mobile/src/shared/components/IconButton.tsx

mobile/src/components/common/ToggleButton.tsx
  → mobile/src/shared/components/ToggleButton.tsx

mobile/src/components/common/NavItem.tsx
  → mobile/src/shared/components/NavItem.tsx

mobile/src/components/common/index.ts
  → mobile/src/shared/components/index.ts
```

### Import Paths Updated
```tsx
// Before
import { Avatar, IconButton } from '../../common';

// After
import { Avatar, IconButton } from '../../../shared/components';
```

Updated in:
- `mobile/src/components/layout/header/AppHeaderBar.tsx`
- `mobile/src/components/layout/header/DrawerUserCard.tsx`
- `mobile/src/components/layout/header/DrawerNavList.tsx`

### Documentation Updated
- `mobile/COMMON_COMPONENTS.md` - Updated all paths and examples
- `mobile/COMPONENT_EXTRACTION_SUMMARY.md` - Updated file locations

---

## Final Structure

```
mobile/src/
├── components/
│   ├── layout/
│   │   └── header/
│   │       ├── AppHeaderBar.tsx
│   │       ├── DrawerUserCard.tsx
│   │       ├── DrawerNavList.tsx
│   │       ├── AppDrawerOverlay.tsx
│   │       ├── DrawerContext.tsx
│   │       └── navItems.ts
│   └── LanguageSwitcher.tsx
│
├── features/
│   └── device-info/
│       ├── DeviceInfoScreen.tsx
│       ├── hooks/
│       ├── components/
│       ├── types.ts
│       └── utils.ts
│
└── shared/
    ├── components/              # ✅ Reusable UI components
    │   ├── Avatar.tsx
    │   ├── Badge.tsx
    │   ├── IconButton.tsx
    │   ├── ToggleButton.tsx
    │   ├── NavItem.tsx
    │   ├── AppButton.tsx
    │   ├── AppCard.tsx
    │   ├── MetricCard.tsx
    │   └── index.ts
    ├── hooks/                   # ✅ Reusable hooks
    │   └── useAuxData.ts
    └── utils/                   # ✅ Reusable utilities
```

---

## Benefits of This Structure

### 1. Clear Separation of Concerns
- `components/layout/` - Layout infrastructure
- `features/` - Domain features
- `shared/` - Cross-cutting concerns

### 2. Scalability
As the app grows:
- New features go in `features/`
- New shared components go in `shared/components/`
- No confusion about where things belong

### 3. Import Clarity
```tsx
// Layout component
import { AppHeaderBar } from '../../components/layout/header/AppHeaderBar';

// Feature component
import { DeviceInfoScreen } from '../../features/device-info/DeviceInfoScreen';

// Shared component
import { Avatar, Badge } from '../../shared/components';
```

The import path immediately tells you what type of component it is.

### 4. Alignment with Web Architecture
While the web uses `components/common/`, the mobile app's feature-based architecture is more modern and scalable. The replication plan acknowledges this by explicitly mapping:

```
web/src/components/common/  →  mobile/src/shared/components/
```

---

## Verification

All files pass TypeScript diagnostics:
```
✅ mobile/src/shared/components/Avatar.tsx
✅ mobile/src/shared/components/Badge.tsx
✅ mobile/src/shared/components/IconButton.tsx
✅ mobile/src/shared/components/ToggleButton.tsx
✅ mobile/src/shared/components/NavItem.tsx
✅ mobile/src/components/layout/header/AppHeaderBar.tsx
✅ mobile/src/components/layout/header/DrawerUserCard.tsx
✅ mobile/src/components/layout/header/DrawerNavList.tsx
```

---

## Conclusion

**`mobile/src/shared/components/`** is the correct location because:
1. ✅ Explicitly defined in REPLICATION_PLAN.md
2. ✅ Consistent with existing `shared/hooks/` and `shared/utils/`
3. ✅ Aligns with feature-based architecture
4. ✅ Clearer semantic meaning
5. ✅ Better scalability

The migration is complete and all files are in the correct location.
