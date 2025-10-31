# Token Sync Fix - 401 Unauthorized Resolution

## Problem
When updating profile, the request returns 401 "User not authenticated" because:
1. Token is not being sent with the PUT request
2. Backend middleware cannot extract `req.user.id` from the token
3. Profile update fails because `req.user` is undefined

## Root Cause Analysis

### Frontend Issue
The token is stored in localStorage but not being sent with requests because:
1. AuthInitializer syncs token to API client asynchronously
2. Race condition: requests may be made before token is synced
3. Request interceptor reads from localStorage but token might not be there yet

### Backend Issue
The backend middleware correctly expects:
```javascript
// Backend expects this in req.user
{
  userId: "user-id",
  email: "user@example.com",
  role: "ADMIN",
  exp: 1234567890,
  iat: 1234567800
}
```

But receives `undefined` because token is not in Authorization header.

## Solution

### Step 1: Verify Token is in localStorage

Add this to your browser console after login:
```javascript
// Check localStorage
console.log('Token in localStorage:', localStorage.getItem('token'));

// Check auth store
import { useAuthStore } from './stores/authStore';
const state = useAuthStore.getState();
console.log('Auth Store State:', {
  token: state.token,
  user: state.user,
  isAuthenticated: state.isAuthenticated
});
```

**Expected Output:**
```
Token in localStorage: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Auth Store State: {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { id: "123", email: "user@example.com", ... },
  isAuthenticated: true
}
```

### Step 2: Verify Token is Synced to API Client

Add this to your browser console:
```javascript
// Check if token is in axios default headers
import { api } from './services/api';
const httpClient = api.getHttpClient();
console.log('Authorization Header:', httpClient.defaults.headers.common.Authorization);
```

**Expected Output:**
```
Authorization Header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Verify Token is Sent with Request

1. Open DevTools (F12)
2. Go to Network tab
3. Click on profile update request
4. Go to Headers tab
5. Look for `Authorization: Bearer ...`

**Expected:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Request-ID: 1234567890-abc123
Content-Type: application/json
```

### Step 4: Check Backend Receives Token

Backend logs should show:
```
Update profile request: { 
  user: { userId: "123", email: "user@example.com", role: "ADMIN", ... },
  body: { name: "John", email: "john@example.com", phone: "123456" }
}
Update data: { name: "John", email: "john@example.com", phone: "123456" }
Updated user: { id: "123", name: "John", ... }
```

## Implementation Checklist

### Frontend Changes

- [x] AuthInitializer syncs token to API client
- [x] Request interceptor reads from localStorage (fallback)
- [x] Token is set in axios default headers
- [x] Token is sent with every request

### Backend Changes

- [x] Auth middleware extracts Bearer token
- [x] Auth middleware verifies token signature
- [x] Auth middleware sets req.user from token payload
- [x] Profile route has authenticateToken middleware
- [x] updateOwnProfile uses req.user.id

## Troubleshooting

### Issue: Token Not in localStorage

**Check:**
```javascript
localStorage.getItem('token')  // Should not be null
```

**Solution:**
1. Log in again
2. Check login response includes token
3. Check browser console for errors

### Issue: Token in localStorage but Not in Auth Store

**Check:**
```javascript
import { useAuthStore } from './stores/authStore';
useAuthStore.getState().token  // Should match localStorage
```

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload page
3. Log in again

### Issue: Token in Auth Store but Not in API Headers

**Check:**
```javascript
import { api } from './services/api';
api.getHttpClient().defaults.headers.common.Authorization
```

**Solution:**
1. Check AuthInitializer is mounted
2. Check browser console for sync logs
3. Verify useEffect is running

### Issue: Token in Headers but Still 401

**Check:**
1. Token is valid (not expired)
2. Backend JWT_SECRET matches frontend
3. Backend middleware is working

**Solution:**
```javascript
// Check token expiration
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires at:', new Date(payload.exp * 1000));
console.log('Expired?', Date.now() / 1000 > payload.exp);
```

## Debug Flow

```
1. User logs in
   ↓
2. Frontend receives token in response
   ↓
3. authStore.login() stores token in localStorage
   ↓
4. Auth store state updated with token
   ↓
5. AuthInitializer watches token change
   ↓
6. api.setAuthToken(token) called
   ↓
7. Token added to axios default headers
   ↓
8. User makes request (e.g., update profile)
   ↓
9. Request interceptor adds token to headers (if not already there)
   ↓
10. Request sent with Authorization header
    ↓
11. Backend middleware extracts token
    ↓
12. Backend middleware verifies token
    ↓
13. req.user set from token payload
    ↓
14. Controller uses req.user.id
    ↓
15. ✅ Profile updated successfully
```

## Console Logs to Look For

### Successful Flow
```
✅ User logged in: user@example.com
✅ Auth initialized. Token expires in 14 minutes
✅ Token synced to API client
📤 [1234567890-abc123] PUT /users/profile {data: {...}}
📥 [1234567890-abc123] 200 PUT /users/profile
```

### Failed Flow
```
❌ [1234567890-abc123] 401 PUT /users/profile {error: 'User not authenticated'}
```

## Quick Fix Steps

If you're still getting 401 errors:

1. **Clear everything:**
   ```bash
   # Clear browser cache
   Ctrl+Shift+Delete
   
   # Clear localStorage
   localStorage.clear()
   
   # Reload page
   F5
   ```

2. **Log in again:**
   - Go to login page
   - Enter credentials
   - Check console for sync logs

3. **Try profile update:**
   - Go to profile page
   - Make a change
   - Check Network tab for Authorization header

4. **Check backend logs:**
   - Look for "Update profile request" log
   - Verify req.user is set

## Files Modified

- `frontend/src/components/AuthInitializer.tsx` - Token sync
- `frontend/src/services/api/base.ts` - Dual token injection
- `backend/middleware/auth.js` - Token verification
- `backend/controllers/userController.js` - Profile update

## Testing

### Test 1: Login and Check Token
```bash
1. Open frontend
2. Go to login
3. Enter credentials
4. Check console: ✅ User logged in
5. Check localStorage: token should exist
6. Check auth store: token should be set
```

### Test 2: Check Token Sync
```bash
1. After login, open DevTools
2. Go to Console
3. Run: import { api } from './services/api'
4. Run: api.getHttpClient().defaults.headers.common.Authorization
5. Should show: Bearer eyJhbGc...
```

### Test 3: Update Profile
```bash
1. Go to profile page
2. Change name
3. Click save
4. Check Network tab for PUT /users/profile
5. Check Headers for Authorization
6. Should return 200 with updated user
```

## References

- `FRONTEND_API_REFACTOR.md` - Frontend API setup
- `JWT_REFACTOR.md` - Backend JWT setup
- `CORS_CONFIGURATION.md` - CORS setup
- `AUTHENTICATION_TROUBLESHOOTING.md` - Auth troubleshooting
