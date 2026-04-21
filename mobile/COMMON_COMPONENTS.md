# Common Reusable Components

Extracted from header components for reuse across the app.

## Location
`mobile/src/shared/components/`

---

## Components

### 1. Avatar
**File:** `Avatar.tsx`

**Purpose:** Displays user initials in a colored circle

**Props:**
- `text: string` - Text to display (converted to initials if > 2 chars)
- `backgroundColor?: string` - Background color (default: `#10b981`)
- `size?: number` - Size in pixels (default: `32`)
- `textColor?: string` - Text color (default: `#fff`)
- `fontSize?: number` - Font size (default: `size/3`)

**Usage:**
```tsx
import { Avatar } from '../../shared/components';

<Avatar
  text="John Doe"
  backgroundColor="#ef4444"
  size={44}
/>
// Displays: "JD" in a red circle
```

**Used in:**
- `AppHeaderBar.tsx` - user avatar in header
- `DrawerUserCard.tsx` - user avatar in drawer

---

### 2. Badge
**File:** `Badge.tsx`

**Purpose:** Colored pill with text (for role badges, status indicators)

**Props:**
- `label: string` - Badge text
- `backgroundColor?: string` - Background color with alpha (default: `rgba(16, 185, 129, 0.27)`)
- `textColor?: string` - Text color (default: `#fff`)
- `fontSize?: number` - Font size (default: `11`)
- `style?: ViewStyle` - Custom container style

**Usage:**
```tsx
import { Badge } from '../../shared/components';

<Badge
  label="TENANT_ADMIN"
  backgroundColor="rgba(239, 68, 68, 0.27)"
  textColor="#fff"
/>
```

**Used in:**
- `DrawerUserCard.tsx` - role badge below user name

---

### 3. IconButton
**File:** `IconButton.tsx`

**Purpose:** Circular button with icon and optional badge count

**Props:**
- `icon: string` - Icon emoji or text
- `iconSize?: number` - Icon size (default: `16`)
- `size?: number` - Button size (default: `36`)
- `backgroundColor?: string` - Background color (default: `rgba(255,255,255,0.1)`)
- `iconColor?: string` - Icon color (default: `#fff`)
- `badgeCount?: number` - Badge count (shows red badge with number)
- `badgeColor?: string` - Badge background color (default: `#ef4444`)
- `onPress?: () => void` - On press handler
- `style?: ViewStyle` - Custom container style

**Usage:**
```tsx
import { IconButton } from '../../shared/components';

// Notification bell with badge
<IconButton
  icon="🔔"
  badgeCount={5}
  onPress={() => router.push('/notifications')}
/>

// Hamburger menu
<IconButton
  icon="☰"
  iconSize={18}
  onPress={() => setOpen(true)}
/>
```

**Used in:**
- `AppHeaderBar.tsx` - notification bell, hamburger menu

---

### 4. ToggleButton
**File:** `ToggleButton.tsx`

**Purpose:** Button with icon/text and loading state (for theme/language toggles)

**Props:**
- `icon?: string` - Icon emoji or text
- `label: string` - Button label
- `backgroundColor?: string` - Background color (default: `rgba(255,255,255,0.1)`)
- `textColor?: string` - Text color (default: `#fff`)
- `loading?: boolean` - Loading state (shows spinner)
- `disabled?: boolean` - Disabled state
- `onPress?: () => void` - On press handler
- `style?: ViewStyle` - Custom container style

**Usage:**
```tsx
import { ToggleButton } from '../../shared/components';

// Theme toggle
<ToggleButton
  icon={isDark ? '☀️' : '🌙'}
  label={isDark ? 'Light' : 'Dark'}
  onPress={toggleTheme}
/>

// Language toggle with loading
<ToggleButton
  label={lang === 'en' ? 'عربي' : 'EN'}
  loading={switching}
  onPress={switchLanguage}
/>
```

**Used in:**
- `DrawerUserCard.tsx` - theme toggle, language toggle

---

### 5. NavItem
**File:** `NavItem.tsx`

**Purpose:** Navigation item with icon and label (RTL-aware)

**Props:**
- `icon: string` - Icon emoji or text
- `label: string` - Item label
- `color?: string` - Text color (default: `#fff`)
- `isRtl?: boolean` - RTL mode (default: `false`)
- `dividerBefore?: boolean` - Show divider before item (default: `false`)
- `onPress?: () => void` - On press handler

**RTL Behavior:**
- Icon is always BEFORE text (same order in LTR and RTL)
- In RTL mode, the entire item is aligned to the right side
- Uses `justifyContent: 'flex-end'` in RTL instead of `flexDirection: 'row-reverse'`

**Usage:**
```tsx
import { NavItem } from '../../shared/components';

<NavItem
  icon="📊"
  label="Dashboard"
  isRtl={isRtl}
  onPress={() => navigate('/dashboard')}
/>

// With divider and custom color
<NavItem
  icon="🚪"
  label="Logout"
  color="#ef4444"
  dividerBefore
  onPress={handleLogout}
/>
```

**Used in:**
- `DrawerNavList.tsx` - all navigation items in drawer

---

## Design Patterns

### 1. RTL-Aware Layout
All components use RTL-safe patterns:
- `marginStart`/`marginEnd` instead of `marginLeft`/`marginRight`
- `textAlign: isRtl ? 'right' : 'left'` for text alignment
- `justifyContent: isRtl ? 'flex-end' : 'flex-start'` for layout alignment
- **Never** use `flexDirection: 'row-reverse'` (flips order)

### 2. Theme-Aware Colors
Components accept color props but provide sensible defaults:
- Background: `rgba(255,255,255,0.1)` for glass effect
- Text: `#fff` for dark backgrounds
- Badge: `#ef4444` for error/danger states

### 3. Loading States
Components with async actions (ToggleButton) show `ActivityIndicator` during loading:
```tsx
{loading ? (
  <ActivityIndicator size="small" color={textColor} />
) : (
  <Text>{label}</Text>
)}
```

### 4. Accessibility
- All pressable components use `Pressable` (not `TouchableOpacity`)
- Disabled states reduce opacity to `0.5`
- Badge counts show "9+" for values > 9

---

## Migration Guide

### Before (inline code):
```tsx
<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
  <Text style={{ fontSize: 16 }}>🔔</Text>
  {unreadCount > 0 && (
    <View style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
    </View>
  )}
</View>
```

### After (reusable component):
```tsx
<IconButton
  icon="🔔"
  badgeCount={unreadCount}
  onPress={() => router.push('/notifications')}
/>
```

---

## Files Updated

### Created:
- `mobile/src/shared/components/Avatar.tsx`
- `mobile/src/shared/components/Badge.tsx`
- `mobile/src/shared/components/IconButton.tsx`
- `mobile/src/shared/components/ToggleButton.tsx`
- `mobile/src/shared/components/NavItem.tsx`
- `mobile/src/shared/components/index.ts` (barrel export)

### Updated to use common components:
- `mobile/src/components/layout/header/AppHeaderBar.tsx`
- `mobile/src/components/layout/header/DrawerUserCard.tsx`
- `mobile/src/components/layout/header/DrawerNavList.tsx`

---

## Benefits

1. **Code Reusability** - Components can be used anywhere in the app
2. **Consistency** - Same UI patterns across all screens
3. **Maintainability** - Fix bugs in one place, affects all usages
4. **RTL Support** - All components are RTL-aware by design
5. **Type Safety** - Full TypeScript interfaces for all props
6. **Documentation** - Clear props and usage examples

---

## Next Steps

These components can now be used in:
- Profile screen (Avatar, Badge)
- Settings screens (ToggleButton)
- Any navigation menu (NavItem)
- Action buttons throughout the app (IconButton)
- Status indicators (Badge)
