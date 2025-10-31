# Frontend API Refactoring - Best Practices Implementation

## Overview
The frontend API service layer has been refactored to follow industry best practices, providing a centralized, type-safe, and maintainable HTTP client with comprehensive error handling, automatic retry logic, and improved token management.

## Architecture

### Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Components/Hooks                          │
│              (useTickets, useDashboard, etc.)               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌─────────────���──────▼────────────────────────────────────────┐
│                  Domain Services                             │
│    (ticketsApi, usersApi, customersApi, etc.)              │
│              extends BaseApiService                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Base API Service                            │
│              (src/services/api/base.ts)                     │
│  - HTTP methods (get, post, put, patch, delete)            │
│  - Token injection                                          │
│  - Error normalization                                      │
│  - Retry logic                                              │
│  - Request/response logging                                 │
└────────────────────┬───────────────────────��────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Axios Instance                              │
│              (Configured with interceptors)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Backend API                                 │
│              (http://localhost:3001/api)                    │
└─────────────────────────────────────────────────────────────┘
```

## Key Improvements

### 1. **Centralized HTTP Client** (`src/services/api/base.ts`)

#### Features
- **Single Axios Instance**: All HTTP requests go through one configured instance
- **Automatic Token Injection**: Bearer token automatically added from localStorage
- **Request ID Tracking**: Each request gets a unique ID for tracing
- **Comprehensive Error Handling**: Normalized error responses with status, message, and details
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Development Logging**: Detailed request/response logging in development mode

#### Configuration
```typescript
const REQUEST_TIMEOUT = 15000;      // 15 seconds
const MAX_RETRIES = 3;              // Retry up to 3 times
const RETRY_DELAY = 1000;           // Start with 1 second delay
```

### 2. **Enhanced Auth Store** (`src/stores/authStore.ts`)

#### Features
- **Safe Token Decoding**: Validates JWT structure and required fields
- **Token Expiration Checking**: Detects expired tokens and clears them
- **User Session Restoration**: Automatically restores user session on app load
- **Partial User Updates**: Update user info without full re-login
- **Convenient Selectors**: Pre-built selectors for common queries
- **Development Logging**: Helpful debug messages in development

#### Token Validation
```typescript
// Validates:
// - Token format (3 parts separated by dots)
// - Required payload fields (userId, email, role)
// - Token expiration (considers < 1 minute as expired)
```

### 3. **Error Handling**

#### Error Structure
```typescript
type ApiError = {
  status?: number;           // HTTP status code
  message: string;           // User-friendly error message
  details?: unknown;         // Full error response from server
  code?: string;            // Error code (e.g., 'ECONNABORTED')
  isRetryable?: boolean;    // Whether request should be retried
};
```

#### Retryable Errors
- Network errors (no response)
- 408 Request Timeout
- 429 Too Many Requests
- 5xx Server Errors

#### Non-Retryable Errors
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 422 Unprocessable Entity

### 4. **Request/Response Logging**

In development mode, all requests are logged with:
- Request ID (for tracing)
- HTTP method and URL
- Request payload (if any)
- Response status
- Error details (if failed)

Example output:
```
📤 [1234567890-abc123] POST /auth/login { data: {...} }
📥 [1234567890-abc123] 200 POST /auth/login
```

## Usage Examples

### Basic API Calls

```typescript
import { api } from '../services/api';

// GET request
const users = await api.get<User[]>('/users');

// POST request
const newUser = await api.post<User>('/users', {
  email: 'user@example.com',
  name: 'John Doe',
});

// PUT request
const updated = await api.put<User>('/users/123', {
  name: 'Jane Doe',
});

// PATCH request
const patched = await api.patch<User>('/users/123', {
  name: 'Jane Smith',
});

// DELETE request
await api.delete('/users/123');
```

### Domain Service Usage

```typescript
import { usersApi, ticketsApi } from '../services/api';

// Use domain-specific services
const users = await usersApi.getAll();
const user = await usersApi.getById('123');
const tickets = await ticketsApi.getAll();
```

### Error Handling

```typescript
import { api, type ApiError } from '../services/api';

try {
  const user = await api.get<User>('/users/123');
} catch (error) {
  const apiError = error as ApiError;
  
  if (apiError.status === 404) {
    console.log('User not found');
  } else if (apiError.status === 401) {
    console.log('Unauthorized - please login');
  } else if (apiError.isRetryable) {
    console.log('Request failed but will be retried');
  } else {
    console.error('Error:', apiError.message);
  }
}
```

### Auth Store Usage

```typescript
import { useAuthStore, useIsAuthenticated, useUser, useIsAdmin } from '../stores/authStore';

// In a component
const { user, token, login, logout, isTokenExpired } = useAuthStore();

// Using selectors
const isAuthenticated = useIsAuthenticated();
const currentUser = useUser();
const isAdmin = useIsAdmin();

// Check token expiration
if (useAuthStore.getState().isTokenExpired()) {
  console.log('Token expired, please login again');
}

// Get token payload
const payload = useAuthStore.getState().getTokenPayload();
console.log('Token expires at:', new Date(payload.exp * 1000));
```

### Token Management

```typescript
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

// Programmatically set token
api.setAuthToken(newToken);

// Clear token
api.clearAuthToken();

// Get current base URL
const baseUrl = api.getBaseUrl();

// Get axios instance for advanced usage
const httpClient = api.getHttpClient();
```

## Refactored Files

### 1. `src/services/api/base.ts` (REFACTORED)
- Added retry logic with exponential backoff
- Enhanced error handling with retryable flag
- Added request ID tracking
- Improved logging with request IDs
- Added `clearAuthToken()` method
- Added `getHttpClient()` for advanced usage
- Better documentation and comments

### 2. `src/stores/authStore.ts` (REFACTORED)
- Improved token decoding with validation
- Added token expiration checking
- Added `isTokenExpired()` method
- Added `getTokenPayload()` method
- Added `updateUser()` method
- Added `isAuthenticated` state
- Added convenient selectors
- Better error handling and logging

### 3. `src/config/axios.ts` (DEPRECATED)
- Marked as deprecated
- Kept for backward compatibility
- Recommends using `src/services/api/base.ts` instead

## Migration Guide

### For New Code
Always use the centralized API service:

```typescript
// ✅ Correct
import { api, ticketsApi } from '../services/api';

// ❌ Avoid
import axios from 'axios';
```

### For Existing Code
If you have code using the old axios config:

```typescript
// Before
import axios from '../config/axios';
const response = await axios.get('/tickets');

// After
import { api } from '../services/api';
const tickets = await api.get('/tickets');
```

## Environment Configuration

### Development
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Production
```env
VITE_API_BASE_URL=/api
```

If `VITE_API_BASE_URL` is not set:
- Development: `http://localhost:3001/api`
- Production: `/api`

## Best Practices

### ✅ Do's

1. **Use domain services** for type safety and organization
   ```typescript
   import { ticketsApi } from '../services/api';
   const tickets = await ticketsApi.getAll();
   ```

2. **Handle errors properly** with try-catch
   ```typescript
   try {
     await api.post('/tickets', data);
   } catch (error) {
     const apiError = error as ApiError;
     // Handle error
   }
   ```

3. **Use auth store selectors** for cleaner code
   ```typescript
   const isAdmin = useIsAdmin();
   ```

4. **Check token expiration** before sensitive operations
   ```typescript
   if (useAuthStore.getState().isTokenExpired()) {
     // Redirect to login
   }
   ```

### ❌ Don'ts

1. **Don't use raw axios** for new code
   ```typescript
   // ❌ Avoid
   import axios from 'axios';
   ```

2. **Don't manually add Bearer token** - it's automatic
   ```typescript
   // ❌ Avoid
   api.get('/tickets', {
     headers: { Authorization: `Bearer ${token}` }
   });
   
   // ✅ Correct
   api.get('/tickets');
   ```

3. **Don't decode tokens manually** - use the store
   ```typescript
   // ❌ Avoid
   const payload = JSON.parse(atob(token.split('.')[1]));
   
   // ✅ Correct
   const payload = useAuthStore.getState().getTokenPayload();
   ```

4. **Don't store sensitive data in localStorage** except token
   ```typescript
   // ❌ Avoid
   localStorage.setItem('password', password);
   
   // ✅ Correct
   localStorage.setItem('token', token);
   ```

## Testing

### Mock API Responses

```typescript
import { vi } from 'vitest';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
    post: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
  },
}));
```

### Test Error Handling

```typescript
import { api, type ApiError } from '../services/api';

test('handles API errors', async () => {
  const error: ApiError = {
    status: 404,
    message: 'Not found',
    isRetryable: false,
  };
  
  vi.mocked(api.get).mockRejectedValueOnce(error);
  
  await expect(api.get('/tickets/999')).rejects.toEqual(error);
});
```

## Troubleshooting

### "Invalid token" errors
- Check that token is properly stored in localStorage
- Verify token format (should have 3 parts separated by dots)
- Check token expiration: `useAuthStore.getState().isTokenExpired()`

### "CORS" errors
- Ensure backend is running and accessible
- Check `VITE_API_BASE_URL` environment variable
- Verify backend CORS configuration

### "Request timeout" errors
- Check network connectivity
- Verify backend is responding
- Increase timeout if needed (modify `REQUEST_TIMEOUT` in base.ts)

### "Too many retries" errors
- Check if backend is experiencing issues
- Verify request payload is valid
- Check server logs for errors

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Request Caching**: Add caching layer for GET requests
3. **Offline Support**: Queue requests when offline, sync when online
4. **Rate Limiting**: Client-side rate limiting for API calls
5. **Analytics**: Track API performance metrics
6. **WebSocket Support**: Add real-time communication layer

## References

- [Axios Documentation](https://axios-http.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
- [Retry Strategies](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
