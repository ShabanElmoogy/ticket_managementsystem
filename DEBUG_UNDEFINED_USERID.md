# Debug: Undefined userId Error

## Error Message
```
Invalid `prisma.user.findUnique()` invocation:
{
  where: {
    id: undefined,  // ← userId is undefined
    ...
  }
}
```

## Root Cause
The `userId` field is `undefined` when trying to query the database. This happens when:

1. Token is not being verified correctly
2. Token payload doesn't have `userId` field
3. `req.user` is not being set by middleware
4. `req.user` is set but `userId` is missing

## Debugging Steps

### Step 1: Check Backend Logs

After restarting the backend, look for these logs:

**Good (Token verified):**
```
✅ Token verified. Payload: {
  userId: 'cmhf5lotw0000doic4ftnc89l',
  email: 'admin@company.com',
  role: 'ADMIN',
  hasUserId: true
}
```

**Bad (Token not verified):**
```
Token verification error: Invalid access token signature
```

### Step 2: Check Update Profile Logs

When updating profile, look for:

**Good (userId extracted):**
```
Update profile request: {
  user: {
    userId: 'cmhf5lotw0000doic4ftnc89l',
    email: 'admin@company.com',
    role: 'ADMIN',
    ...
  },
  body: { name: '...', email: '...', phone: '...' },
  userKeys: ['userId', 'email', 'role', 'iat', 'exp', 'iss', 'sub']
}
Extracted userId: cmhf5lotw0000doic4ftnc89l from req.user: {...}
✅ Using userId: cmhf5lotw0000doic4ftnc89l
```

**Bad (userId undefined):**
```
Update profile request: {
  user: undefined,  // ← No user in request
  body: {...},
  userKeys: 'no user'
}
Extracted userId: undefined from req.user: undefined
❌ No user ID found. req.user: undefined
```

## Common Issues and Solutions

### Issue 1: Token Not Being Sent

**Symptom:**
```
Update profile request: {
  user: undefined,
  ...
}
```

**Cause:** Authorization header not being sent with request

**Solution:**
1. Check frontend is syncing token to API client
2. Check Network tab for Authorization header
3. Verify token is in localStorage
4. Clear browser cache and reload

### Issue 2: Token Invalid/Expired

**Symptom:**
```
Token verification error: Invalid access token signature
```

**Cause:** Token signature doesn't match JWT_SECRET

**Solution:**
1. Verify JWT_SECRET in backend/.env
2. Check token was signed with same secret
3. Log in again to get new token
4. Restart backend server

### Issue 3: Token Verified but userId Missing

**Symptom:**
```
✅ Token verified. Payload: {
  userId: undefined,  // ← Missing userId
  email: 'admin@company.com',
  ...
}
```

**Cause:** Token was generated without userId field

**Solution:**
1. Check token service is generating userId
2. Check auth controller is passing userId to token service
3. Log in again to get new token with userId

### Issue 4: req.user Not Set

**Symptom:**
```
Update profile request: {
  user: undefined,
  ...
}
```

**Cause:** Middleware not setting req.user

**Solution:**
1. Check authenticateToken middleware is applied to route
2. Check middleware is calling next()
3. Check middleware is setting req.user = payload
4. Restart backend server

## Verification Checklist

- [ ] Backend logs show "✅ Token verified"
- [ ] Token payload includes userId
- [ ] req.user is set in controller
- [ ] userId is extracted correctly
- [ ] Prisma query uses valid userId (not undefined)
- [ ] Profile update succeeds

## Quick Fix

1. **Restart backend:**
   ```bash
   npm start
   ```

2. **Clear browser cache:**
   ```
   Ctrl+Shift+Delete
   ```

3. **Log in again:**
   - Go to login page
   - Enter credentials
   - Check backend logs for "✅ Token verified"

4. **Try update profile:**
   - Go to profile page
   - Make a change
   - Check backend logs for "✅ Using userId"

## Backend Logs Reference

### Successful Flow
```
✅ Token verified. Payload: {
  userId: 'cmhf5lotw0000doic4ftnc89l',
  email: 'admin@company.com',
  role: 'ADMIN',
  hasUserId: true
}
Update profile request: {
  user: { userId: '...', email: '...', role: '...', ... },
  body: { name: '...', email: '...', phone: '...' },
  userKeys: ['userId', 'email', 'role', 'iat', 'exp', 'iss', 'sub']
}
Extracted userId: cmhf5lotw0000doic4ftnc89l from req.user: {...}
✅ Using userId: cmhf5lotw0000doic4ftnc89l
Update data: { name: '...', email: '...', phone: '...' }
Updated user: { id: '...', name: '...', email: '...', ... }
```

### Failed Flow
```
Token verification error: Invalid access token signature
```

Or:

```
Update profile request: {
  user: undefined,
  body: {...},
  userKeys: 'no user'
}
Extracted userId: undefined from req.user: undefined
❌ No user ID found. req.user: undefined
```

## Files to Check

- `backend/middleware/auth.js` - Token verification
- `backend/controllers/userController.js` - userId extraction
- `backend/utils/tokenService.js` - Token generation
- `backend/.env` - JWT_SECRET configuration

## Testing

### Test 1: Verify Token Generation
```bash
# 1. Log in
# 2. Check backend logs for "✅ Token verified"
# 3. Verify userId is present in payload
```

### Test 2: Verify Token Sent
```bash
# 1. Open DevTools (F12)
# 2. Go to Network tab
# 3. Make profile update request
# 4. Check Headers for Authorization: Bearer ...
```

### Test 3: Verify userId Extraction
```bash
# 1. Make profile update request
# 2. Check backend logs for "✅ Using userId"
# 3. Verify userId is not undefined
```

### Test 4: Verify Database Query
```bash
# 1. Make profile update request
# 2. Check backend logs for "Updated user"
# 3. Verify profile was updated successfully
```

## Environment Variables

Verify these are set in `backend/.env`:

```env
JWT_SECRET="your-secret-key"
ACCESS_TOKEN_EXPIRES_IN="15m"
DATABASE_URL="mysql://root:password@localhost:3306/ticket_management"
```

## Next Steps

1. Restart backend server
2. Check backend logs for "✅ Token verified"
3. Try updating profile
4. Check backend logs for "✅ Using userId"
5. Verify profile update succeeds

If still having issues:
1. Check all environment variables are set
2. Verify JWT_SECRET is correct
3. Check database connection
4. Review backend logs for errors
5. Restart both frontend and backend
