# Zustand Stores

This directory contains the Zustand stores that replace the previous React Context implementations.

## Migration from Context to Zustand

The application has been migrated from React Context to Zustand for better performance and simpler state management.

### Auth Store (`authStore.ts`)

Replaces `AuthContext.tsx` and provides:
- User authentication state
- JWT token management
- Login/logout functionality
- Automatic token validation and expiration handling
- Persistent storage using Zustand's persist middleware

**Usage:**
```typescript
import { useAuthStore } from '../stores/authStore';

const { user, token, login, logout, isLoading } = useAuthStore();
```

### Theme Store (`themeStore.ts`)

Replaces `ThemeContext.tsx` and provides:
- Theme mode (light/dark) management
- Theme toggling functionality
- Persistent storage using Zustand's persist middleware

**Usage:**
```typescript
import { useThemeStore } from '../stores/themeStore';

const { mode, toggleTheme } = useThemeStore();
```

## Benefits of Zustand over Context

1. **Better Performance**: No unnecessary re-renders due to context value changes
2. **Simpler API**: No need for providers and complex context setup
3. **Built-in Persistence**: Easy localStorage integration with persist middleware
4. **TypeScript Support**: Excellent TypeScript integration out of the box
5. **Smaller Bundle Size**: Lighter than React Context + useReducer patterns
6. **Devtools Support**: Built-in Redux DevTools integration

## Store Structure

Each store follows a consistent pattern:
- State properties
- Actions (functions that modify state)
- Persistence configuration (where applicable)
- TypeScript interfaces for type safety

## Initialization

The auth store requires initialization to check for existing tokens and validate them. This is handled by the `AuthInitializer` component in the component tree.