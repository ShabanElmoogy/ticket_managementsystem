# Quick Reference - Authentication & API

## Problem: 401 Unauthorized on Profile Update

### Root Cause
Token not being sent with request because:
1. Token not in localStorage
2. Token not synced to API client
3. Request interceptor not adding Authorization header

### Solution
1. **Restart backend:** `npm start`
2. **Clear browser cache:** `Ctrl+Shift+Delete`
3. **Reload page:** `F5`
4. **Log in again**
5. **Try request again**

### Verify Fix
In browser console:
```javascript
// 1. Check token exists
localStorage.getItem('token')  // Should not be null

// 2. Check auth store
import { useAuthStore } from './stores/authStore';
useAuthStore.getState().token  // Should match localStorage

// 3. Check API headers
import { api } from './services/api';
api.getHttpClient().defaults.headers.common.Authorization  // Should have Bearer token

// 4. Test request
api.get('/users/profile').then(u => console.log('✅', u)).catch(e => console.error('❌', e))
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/utils/tokenService.js` | Generate & verify JWT tokens |
| `backend/middleware/auth.js` | Extract & validate tokens |
| `backend/app/middleware/index.js` | CORS configuration |
| `frontend/src/services/api/base.ts` | HTTP client with token injection |
| `frontend/src/stores/authStore.ts` | Auth state management |
| `frontend/src/components/AuthInitializer.tsx` | Token sync on app load |

## Configuration

### Backend (.env)
```env
JWT_SECRET="your-secret-key"
ACCESS_TOKEN_EXPIRES_IN="15m"
CORS_ORIGINS="http://localhost:5173,https://localhost:5173"
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Common Commands

```bash
# Backend
npm start                    # Start server
npm run dev                  # Development mode

# Frontend
npm run dev                  # Start dev server
npm run build                # Build for production
npm run preview              # Preview production build
```

## Console Logs (Development)

### Successful Login
```
✅ User logged in: user@example.com
✅ Auth initialized. Token expires in 14 minutes
✅ Token synced to API client
```

### Successful Request
```
📤 [request-id] PUT /users/profile {data: {...}}
📥 [request-id] 200 PUT /users/profile
```

### Failed Request
```
❌ [request-id] 401 PUT /users/profile {error: 'User not authenticated'}
```

## Network Tab Checklist

When debugging, verify:
- [ ] Authorization header present: `Bearer eyJhbGc...`
- [ ] X-Request-ID header present
- [ ] Content-Type: application/json
- [ ] Response status 200 (not 401)

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token not sent | Check localStorage, auth store, API headers |
| Token expired | Token exp time passed | Log in again |
| Invalid token | Token corrupted | Clear localStorage, log in again |
| CORS error | Header not allowed | Restart backend |
| 403 Forbidden | User not admin | Check user role |

## API Usage

### Login
```typescript
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const { login } = useAuthStore();
const response = await authApi.login({ email, password });
login(response.user, response.token);
```

### Protected Request
```typescript
import { profileApi } from '../services/api';

// Token automatically included
const user = await profileApi.updateProfile({ name, email, phone });
```

### Error Handling
```typescript
import { api, type ApiError } from '../services/api';

try {
  await api.put('/users/profile', data);
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message);
}
```

## Auth Store Selectors

```typescript
import {
  useAuthStore,
  useIsAuthenticated,
  useUser,
  useToken,
  useIsAdmin,
} from '../stores/authStore';

// Full state
const { user, token, login, logout } = useAuthStore();

// Selectors
const isAuthenticated = useIsAuthenticated();
const user = useUser();
const token = useToken();
const isAdmin = useIsAdmin();
```

## Debugging Steps

1. **Check token exists**
   ```javascript
   localStorage.getItem('token')
   ```

2. **Check auth store**
   ```javascript
   import { useAuthStore } from './stores/authStore';
   useAuthStore.getState()
   ```

3. **Check API headers**
   ```javascript
   import { api } from './services/api';
   api.getHttpClient().defaults.headers.common.Authorization
   ```

4. **Check Network tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Make request
   - Check Headers for Authorization

5. **Check backend logs**
   - Look for "Update profile request" log
   - Verify req.user is set

## Documentation

- `AUTHENTICATION_SETUP_COMPLETE.md` - Full setup guide
- `DEBUG_401_ERRORS.md` - Detailed debugging
- `JWT_REFACTOR.md` - Backend JWT details
- `FRONTEND_API_REFACTOR.md` - Frontend API details
- `CORS_CONFIGURATION.md` - CORS setup

## Quick Fixes

### 401 Errors
```bash
# 1. Clear cache
Ctrl+Shift+Delete

# 2. Clear localStorage
localStorage.clear()

# 3. Reload
F5

# 4. Log in again
```

### CORS Errors
```bash
# Restart backend
npm start
```

### Token Not Sent
```bash
# 1. Check browser console for errors
# 2. Check Network tab for Authorization header
# 3. Clear cache and reload
# 4. Log in again
```

## Token Structure

JWT tokens have 3 parts: `header.payload.signature`

### Payload Example
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "role": "ADMIN",
  "exp": 1234567890,
  "iat": 1234567800,
  "iss": "ticket-management-system"
}
```

### Check Expiration
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresIn = (payload.exp - Date.now() / 1000) / 60;
console.log('Expires in:', Math.round(expiresIn), 'minutes');
```

## Environment Variables

### Backend
```env
DATABASE_URL=mysql://root:password@localhost:3306/ticket_management
JWT_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,https://localhost:5173
PORT=3001
HOST=0.0.0.0
```

### Frontend
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Ports

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API: `http://localhost:3001/api`

## Support

If issues persist:
1. Check `DEBUG_401_ERRORS.md`
2. Review browser console
3. Check Network tab
4. Check backend logs
5. Verify configuration
6. Restart services
