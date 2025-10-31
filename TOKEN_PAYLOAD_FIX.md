# Token Payload Fix - userId vs id

## Problem

The backend was receiving the token correctly but failing to extract the user ID because:

**Token Payload Structure:**
```javascript
{
  userId: 'cmhf5lotw0000doic4ftnc89l',  // ← Token has userId
  email: 'admin@company.com',
  role: 'ADMIN',
  iat: 1761934463,
  exp: 1761935363,
  iss: 'ticket-management-system',
  sub: 'cmhf5lotw0000doic4ftnc89l'
}
```

**Controller Check:**
```javascript
if (!req.user || !req.user.id) {  // ← But checking for id
  return res.status(401).json({ error: 'User not authenticated' });
}
```

This mismatch caused the controller to reject valid tokens.

## Root Cause

The token service generates tokens with `userId` field:
```javascript
// backend/utils/tokenService.js
generateAccessToken({
  userId: user.id,      // ← Uses userId
  email: user.email,
  role: user.role
})
```

But the controller was checking for `req.user.id` instead of `req.user.userId`.

## Solution

Updated all user controllers to handle both `userId` and `id`:

```javascript
// Before
if (!req.user || !req.user.id) {
  return res.status(401).json({ error: 'User not authenticated' });
}
const userId = req.user.id;

// After
const userId = req.user?.userId || req.user?.id;
if (!userId) {
  return res.status(401).json({ error: 'User not authenticated' });
}
```

This approach:
- ✅ Accepts both `userId` and `id` (backward compatible)
- ✅ Handles missing user gracefully
- ✅ Works with current token structure
- ✅ Supports future changes

## Files Updated

### `backend/controllers/userController.js`

Updated two functions:

1. **getCurrentProfile**
   - Changed: `req.user.id` → `req.user?.userId || req.user?.id`
   - Effect: Can now read profile with current token structure

2. **updateOwnProfile**
   - Changed: `req.user.id` → `req.user?.userId || req.user?.id`
   - Effect: Can now update profile with current token structure

## Verification

After the fix, the flow works correctly:

```
1. Frontend sends token with userId
   ↓
2. Backend middleware verifies token
   ↓
3. Backend middleware sets req.user = payload
   ↓
4. req.user now has: { userId, email, role, ... }
   ↓
5. Controller extracts userId: req.user?.userId || req.user?.id
   ↓
6. ✅ Profile update succeeds
```

## Testing

### Before Fix
```
Update profile request: { user: { userId: '...', ... }, body: {...} }
No user in request: { userId: '...', ... }
❌ 401 User not authenticated
```

### After Fix
```
Update profile request: { user: { userId: '...', ... }, body: {...} }
Using userId: cmhf5lotw0000doic4ftnc89l
Update data: { name: '...', email: '...', phone: '...' }
Updated user: { id: '...', name: '...', ... }
✅ 200 Success
```

## Best Practices

### Token Payload Consistency

The token service should use consistent field names:

```javascript
// ✅ Good - Consistent naming
generateAccessToken({
  userId: user.id,      // Primary identifier
  email: user.email,
  role: user.role,
  sub: user.id          // JWT standard subject claim
})
```

### Controller Flexibility

Controllers should handle both formats:

```javascript
// ✅ Good - Handles both formats
const userId = req.user?.userId || req.user?.id;

// ❌ Bad - Only handles one format
const userId = req.user.id;
```

### Documentation

Always document the token structure:

```javascript
/**
 * Token Payload Structure
 * {
 *   userId: string,      // User ID (primary)
 *   email: string,       // User email
 *   role: string,        // User role
 *   exp: number,         // Expiration time
 *   iat: number,         // Issued at time
 *   iss: string,         // Issuer
 *   sub: string          // Subject (JWT standard)
 * }
 */
```

## Related Changes

This fix complements the earlier JWT refactoring:

- `backend/utils/tokenService.js` - Generates tokens with userId
- `backend/middleware/auth.js` - Verifies tokens and sets req.user
- `backend/controllers/userController.js` - Uses userId from req.user

## Future Improvements

### Option 1: Standardize on `id`
Change token service to use `id` instead of `userId`:
```javascript
generateAccessToken({
  id: user.id,          // Use id instead
  email: user.email,
  role: user.role
})
```

### Option 2: Use JWT Standard Claims
Use `sub` (subject) claim as primary identifier:
```javascript
// Token payload
{
  sub: user.id,         // JWT standard
  email: user.email,
  role: user.role
}

// Controller
const userId = req.user.sub;
```

### Option 3: Add Both Fields
Include both for maximum compatibility:
```javascript
generateAccessToken({
  id: user.id,          // For compatibility
  userId: user.id,      // For current code
  sub: user.id,         // JWT standard
  email: user.email,
  role: user.role
})
```

## Summary

The fix resolves the token payload mismatch by:
1. ✅ Accepting both `userId` and `id` fields
2. ✅ Maintaining backward compatibility
3. ✅ Supporting current token structure
4. ✅ Allowing future changes

Profile updates now work correctly with the refactored JWT token system.
