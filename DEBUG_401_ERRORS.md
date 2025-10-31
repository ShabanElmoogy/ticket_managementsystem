# Debug 401 Unauthorized Errors

## Quick Diagnosis

Run these commands in your browser console to diagnose the issue:

### 1. Check Token in localStorage
```javascript
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
console.log('Token preview:', token?.substring(0, 50) + '...');
```

**Expected:** Token should exist and be ~200+ characters

### 2. Check Auth Store
```javascript
import { useAuthStore } from './stores/authStore';
const state = useAuthStore.getState();
console.log('Auth Store:', {
  token: !!state.token,
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
});
```

**Expected:**
```
Auth Store: {
  token: true,
  user: { id: "...", email: "user@example.com", ... },
  isAuthenticated: true,
  isLoading: false,
}
```

### 3. Check API Client Headers
```javascript
import { api } from './services/api';
const httpClient = api.getHttpClient();
console.log('Authorization Header:', httpClient.defaults.headers.common.Authorization);
```

**Expected:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Check Token Expiration
```javascript
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresAt = new Date(payload.exp * 1000);
  const expiresIn = (payload.exp - Date.now() / 1000) / 60;
  console.log('Token Expiration:', {
    expiresAt: expiresAt.toLocaleString(),
    expiresInMinutes: Math.round(expiresIn),
    isExpired: expiresIn < 0,
  });
}
```

**Expected:** Token should not be expired (expiresInMinutes > 0)

## Step-by-Step Debugging

### Step 1: Verify Login Works

1. Open DevTools (F12)
2. Go to Console tab
3. Go to login page
4. Enter credentials and click login
5. Check console for logs:
   ```
   ✅ User logged in: user@example.com
   🔄 AuthInitializer mounted, initializing auth from localStorage...
   ✅ Auth initialized. Token expires in 14 minutes
   ✅ Token synced to API client
   ```

**If you don't see these logs:**
- Check for JavaScript errors in console
- Verify login endpoint is working (check Network tab)
- Check backend logs for login errors

### Step 2: Verify Token is Stored

After login, run in console:
```javascript
console.log('localStorage.token:', localStorage.getItem('token'));
```

**If token is null:**
- Login response didn't include token
- Check backend login endpoint
- Check Network tab for login response

### Step 3: Verify Token is Synced

After login, run in console:
```javascript
import { api } from './services/api';
console.log('API Authorization:', api.getHttpClient().defaults.headers.common.Authorization);
```

**If Authorization is undefined:**
- AuthInitializer didn't sync token
- Check if AuthInitializer is mounted
- Check for errors in useEffect

### Step 4: Make a Test Request

After login, run in console:
```javascript
import { api } from './services/api';
api.get('/users/profile')
  .then(user => console.log('✅ Success:', user))
  .catch(error => console.error('❌ Error:', error));
```

**If this works:**
- Token is being sent correctly
- Issue is specific to certain endpoints
- Check endpoint-specific middleware

**If this fails with 401:**
- Token is not being sent
- Go back to Step 3

### Step 5: Check Network Request

1. Open Network tab
2. Make a request (e.g., update profile)
3. Click on the request
4. Go to "Headers" tab
5. Look for `Authorization: Bearer ...`

**If Authorization header is missing:**
- Request interceptor not working
- Token not in default headers
- Go back to Step 3

**If Authorization header is present:**
- Check backend logs
- Verify backend JWT_SECRET
- Check token signature

## Common Issues and Solutions

### Issue 1: "User not authenticated" on Protected Routes

**Symptoms:**
- Login works
- Token is in localStorage
- But protected routes return 401

**Diagnosis:**
```javascript
// Check if token is being sent
import { api } from './services/api';
const httpClient = api.getHttpClient();
console.log('Default Authorization:', httpClient.defaults.headers.common.Authorization);

// Check request interceptor
// Make a request and check Network tab for Authorization header
```

**Solutions:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload page (F5)
3. Log in again
4. Try request again

### Issue 2: Token Exists but Not Synced to API

**Symptoms:**
- Token in localStorage
- Token in auth store
- But not in API default headers

**Diagnosis:**
```javascript
import { useAuthStore } from './stores/authStore';
const token = useAuthStore.getState().token;
console.log('Token in store:', !!token);

import { api } from './services/api';
console.log('Token in API:', !!api.getHttpClient().defaults.headers.common.Authorization);
```

**Solutions:**
1. Check AuthInitializer is mounted
2. Check browser console for errors
3. Verify useEffect is running
4. Check for circular dependencies

### Issue 3: Token Expired

**Symptoms:**
- Token was working
- Now returns 401
- Token is in localStorage

**Diagnosis:**
```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresIn = (payload.exp - Date.now() / 1000) / 60;
console.log('Token expires in:', Math.round(expiresIn), 'minutes');
```

**Solutions:**
1. Log in again to get new token
2. Implement token refresh mechanism
3. Check system clock is correct

### Issue 4: Backend Not Recognizing Token

**Symptoms:**
- Token is sent with request
- Authorization header is present
- But backend returns 401

**Diagnosis:**
1. Check backend logs for token verification errors
2. Verify backend JWT_SECRET matches frontend
3. Check token signature

**Solutions:**
1. Verify JWT_SECRET in backend/.env
2. Check backend middleware is using correct secret
3. Restart backend server
4. Check token was signed with same secret

## Console Logs Reference

### Successful Flow
```
🔄 AuthInitializer mounted, initializing auth from localStorage...
✅ Auth initialized. Token expires in 14 minutes
✅ Token synced to API client {
  tokenLength: 234,
  userEmail: "user@example.com",
  isAuthenticated: true,
  expiresIn: "14 minutes"
}
📤 [1234567890-abc123] PUT /users/profile {data: {...}}
📥 [1234567890-abc123] 200 PUT /users/profile
```

### Failed Flow
```
🔄 AuthInitializer mounted, initializing auth from localStorage...
❌ [1234567890-abc123] 401 PUT /users/profile {error: 'User not authenticated'}
```

## Network Tab Checklist

When debugging, check the Network tab for:

- [ ] Request URL is correct
- [ ] Request method is correct (GET, POST, PUT, etc.)
- [ ] Authorization header is present
- [ ] Authorization header has correct format: `Bearer <token>`
- [ ] Content-Type is application/json
- [ ] X-Request-ID header is present
- [ ] Response status is 200 (not 401, 403, 500)
- [ ] Response includes expected data

## Backend Logs Checklist

Check backend console for:

- [ ] "Update profile request:" log appears
- [ ] req.user is set (not undefined)
- [ ] req.user.id is present
- [ ] "Update data:" log shows correct fields
- [ ] "Updated user:" log shows updated data
- [ ] No "Token verification error" logs

## Quick Fix Checklist

If you're getting 401 errors:

- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Reload page (F5)
- [ ] Log in again
- [ ] Try request again
- [ ] Check browser console for errors
- [ ] Check Network tab for Authorization header
- [ ] Check backend logs
- [ ] Restart backend server
- [ ] Verify JWT_SECRET in backend/.env

## Testing Script

Run this in browser console to test the entire flow:

```javascript
// 1. Check token
const token = localStorage.getItem('token');
console.log('1. Token exists:', !!token);

// 2. Check auth store
import { useAuthStore } from './stores/authStore';
const state = useAuthStore.getState();
console.log('2. Auth store:', {
  token: !!state.token,
  user: state.user?.email,
  isAuthenticated: state.isAuthenticated,
});

// 3. Check API headers
import { api } from './services/api';
const httpClient = api.getHttpClient();
console.log('3. API headers:', {
  authorization: !!httpClient.defaults.headers.common.Authorization,
});

// 4. Test request
try {
  const result = await api.get('/users/profile');
  console.log('4. ✅ Request successful:', result);
} catch (error) {
  console.log('4. ❌ Request failed:', error);
}
```

## Files to Check

- `frontend/src/components/AuthInitializer.tsx` - Token sync
- `frontend/src/services/api/base.ts` - API client
- `frontend/src/stores/authStore.ts` - Auth state
- `backend/middleware/auth.js` - Backend auth
- `backend/controllers/authController.js` - Login/Register
- `backend/.env` - JWT_SECRET

## Support

If you're still having issues:

1. Run the testing script above
2. Share the output
3. Check backend logs
4. Verify JWT_SECRET matches
5. Restart both frontend and backend
