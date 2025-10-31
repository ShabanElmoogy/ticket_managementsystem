# JWT Token Refactoring - Best Practices Implementation

## Overview
The JWT token logic has been refactored to follow industry best practices, eliminating the "Invalid Signature" errors and providing a centralized, maintainable token management system.

## Key Improvements

### 1. **Centralized Token Service** (`utils/tokenService.js`)
- **Single Source of Truth**: All token operations (sign, verify, extract) are handled in one module
- **Consistent Configuration**: Algorithm, expiry times, and issuer are defined once
- **Error Handling**: Specific error messages for different failure scenarios
- **Validation**: Input validation on all functions to prevent invalid operations

### 2. **Separation of Concerns**
- **Token Generation**: `generateAccessToken()`, `generateRefreshToken()`, `generateTokenPair()`
- **Token Verification**: `verifyAccessToken()`, `verifyRefreshToken()`
- **Token Extraction**: `extractBearerToken()` - safely extracts token from Authorization header
- **Token Inspection**: `decodeToken()` - for debugging without verification

### 3. **Enhanced Security**
- **Strict Algorithm Enforcement**: Only HS256 is allowed (configurable)
- **Bearer Token Validation**: Proper parsing of "Bearer <token>" format
- **Issuer Claim**: Tokens include issuer claim for additional validation
- **Subject Claim**: User ID is included as subject for audit trails
- **Fail-Fast**: Missing secrets cause immediate startup failure

### 4. **Better Error Messages**
- Distinguishes between expired tokens and invalid signatures
- Provides clear, actionable error messages
- Logs detailed errors for debugging

## Configuration

### Environment Variables
```env
# JWT Secret (required)
JWT_SECRET="your-secret-key-here"

# Token Expiry Times (optional, defaults shown)
ACCESS_TOKEN_EXPIRES_IN="15m"      # Short-lived access token
REFRESH_TOKEN_EXPIRES_IN="7d"      # Long-lived refresh token
```

### Token Expiry Strategy
- **Access Token**: 15 minutes (short-lived, frequent refresh)
- **Refresh Token**: 7 days (long-lived, used to get new access tokens)

This prevents security risks from stolen tokens while maintaining good UX.

## Usage Examples

### Generating Tokens
```javascript
import { generateAccessToken, generateTokenPair } from '../utils/tokenService.js';

// Generate single access token
const token = generateAccessToken({
  userId: user.id,
  email: user.email,
  role: user.role
});

// Generate both access and refresh tokens
const { accessToken, refreshToken } = generateTokenPair({
  userId: user.id,
  email: user.email,
  role: user.role
});
```

### Verifying Tokens
```javascript
import { verifyAccessToken, verifyRefreshToken } from '../utils/tokenService.js';

try {
  const payload = verifyAccessToken(token);
  console.log(payload.userId); // Access verified payload
} catch (error) {
  console.error(error.message); // "Token expired" or "Invalid token signature"
}
```

### Extracting Tokens from Headers
```javascript
import { extractBearerToken } from '../utils/tokenService.js';

const authHeader = req.headers.authorization; // "Bearer eyJhbGc..."
const token = extractBearerToken(authHeader);
// Returns: "eyJhbGc..." or null if invalid format
```

## Refactored Files

### 1. `backend/utils/tokenService.js` (NEW)
Centralized token management with all JWT operations.

### 2. `backend/middleware/auth.js` (UPDATED)
- Uses `extractBearerToken()` for safe header parsing
- Uses `verifyAccessToken()` for verification
- Improved error handling with specific messages
- Removed direct jwt imports and env variable access

### 3. `backend/controllers/authController.js` (UPDATED)
- Uses `generateAccessToken()` instead of `jwt.sign()`
- Consistent token generation in both register and login
- Removed direct jwt imports
- Cleaner, more maintainable code

### 4. `backend/.env` (UPDATED)
- Added `ACCESS_TOKEN_EXPIRES_IN` and `REFRESH_TOKEN_EXPIRES_IN`
- Organized JWT configuration section

## Solving "Invalid Signature" Errors

The refactoring eliminates common causes of "Invalid Signature" errors:

1. **Consistent Secret Usage**: Single secret is used for all operations
2. **Proper Bearer Extraction**: Token is correctly extracted from "Bearer <token>" format
3. **Algorithm Enforcement**: Only HS256 is used (no algorithm confusion)
4. **No Token Mutation**: Token is never modified during extraction or verification
5. **Validation on Startup**: Missing secrets are caught immediately

## Migration Guide

If you have other controllers or services using JWT:

### Before
```javascript
import jwt from 'jsonwebtoken';

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
```

### After
```javascript
import { generateAccessToken } from '../utils/tokenService.js';

const token = generateAccessToken(payload);
```

## Testing Token Generation

```bash
# Start the server
npm start

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"pass123"}'

# Response includes token
# {
#   "user": {...},
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# Use token in subsequent requests
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Future Enhancements

1. **Refresh Token Rotation**: Implement refresh token rotation for enhanced security
2. **Token Blacklist**: Add Redis-based token blacklist for logout functionality
3. **Rate Limiting**: Implement rate limiting on token generation endpoints
4. **Audit Logging**: Log all token operations for security audits
5. **Multi-Secret Support**: Support key rotation with multiple secrets

## Best Practices Implemented

✅ Single source of truth for token configuration
✅ Consistent algorithm and expiry times
✅ Proper error handling and messages
✅ Input validation on all functions
✅ Secure Bearer token extraction
✅ Fail-fast on missing configuration
✅ Clear separation of concerns
✅ Comprehensive documentation
✅ Easy to test and maintain
✅ Follows JWT RFC 7519 standards

## References

- [JWT Best Practices (RFC 7519)](https://tools.ietf.org/html/rfc7519)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [jsonwebtoken npm package](https://www.npmjs.com/package/jsonwebtoken)
