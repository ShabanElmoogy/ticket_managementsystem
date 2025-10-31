# CORS Configuration Guide

## Overview
CORS (Cross-Origin Resource Sharing) is configured in the backend to allow requests from the frontend application. This document explains the current configuration and how to customize it.

## Current Configuration

### Location
`backend/app/middleware/index.js` - `registerCoreMiddleware()` function

### Settings

```javascript
cors({
  origin: CORS_ORIGINS,                    // Allowed origins
  credentials: true,                       // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',                        // Standard header
    'Authorization',                       // JWT token
    'X-Request-ID',                        // Request tracing
    'X-Requested-With',                    // AJAX requests
  ],
  exposedHeaders: ['X-Request-ID'],        // Headers visible to client
  maxAge: 86400,                           // Preflight cache (24 hours)
})
```

## Configuration Details

### `origin`
Specifies which origins are allowed to access the API.

**Value:** `CORS_ORIGINS` from environment configuration

**Examples:**
- Development: `http://localhost:5173`
- Production: `https://yourdomain.com`
- Multiple origins: `['http://localhost:5173', 'https://yourdomain.com']`

### `credentials`
Allows requests with credentials (cookies, authorization headers).

**Value:** `true`

**Why:** Required for JWT authentication via Authorization header

### `methods`
HTTP methods allowed in CORS requests.

**Value:** `['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`

**Explanation:**
- `GET` - Retrieve data
- `POST` - Create data
- `PUT` - Replace entire resource
- `PATCH` - Partial update
- `DELETE` - Remove data
- `OPTIONS` - Preflight requests (automatic)

### `allowedHeaders`
Headers that clients can send in requests.

**Value:**
```javascript
[
  'Content-Type',      // JSON content type
  'Authorization',     // Bearer token
  'X-Request-ID',      // Request tracing ID
  'X-Requested-With',  // AJAX indicator
]
```

**Why each header:**
- `Content-Type` - Tells server the request body format
- `Authorization` - Sends JWT token for authentication
- `X-Request-ID` - Custom header for request tracing and debugging
- `X-Requested-With` - Indicates AJAX request

### `exposedHeaders`
Headers that the browser allows JavaScript to access in responses.

**Value:** `['X-Request-ID']`

**Why:** Allows frontend to read request ID from response headers for tracing

### `maxAge`
How long (in seconds) the browser caches preflight responses.

**Value:** `86400` (24 hours)

**Why:** Reduces preflight requests for better performance

## Environment Configuration

### Development

Set in `backend/.env`:
```env
CORS_ORIGINS=http://localhost:5173
```

### Production

Set in `backend/.env.production`:
```env
CORS_ORIGINS=https://yourdomain.com
```

### Multiple Origins

For multiple allowed origins:
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

The environment configuration is parsed in `backend/app/config/env.js`.

## Common CORS Errors and Solutions

### Error: "Request header field X-Request-ID is not allowed"

**Cause:** Custom header not in `allowedHeaders`

**Solution:** Add the header to `allowedHeaders` array:
```javascript
allowedHeaders: [
  'Content-Type',
  'Authorization',
  'X-Request-ID',      // Add this
  'X-Requested-With',
]
```

### Error: "Access to XMLHttpRequest has been blocked by CORS policy"

**Cause:** Origin not in allowed origins

**Solution:** Add origin to `CORS_ORIGINS` environment variable:
```env
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### Error: "Credentials mode is 'include' but Access-Control-Allow-Credentials is missing"

**Cause:** `credentials` not set to `true`

**Solution:** Ensure CORS config has:
```javascript
credentials: true
```

### Error: "Method not allowed in CORS policy"

**Cause:** HTTP method not in `methods` array

**Solution:** Add method to `methods` array:
```javascript
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
```

## Frontend Configuration

### Development

Set in `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Production

Set in `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

## Request Flow with CORS

### Simple Request (no preflight)
```
1. Browser sends request with allowed headers
2. Server responds with CORS headers
3. Browser allows response to be read by JavaScript
```

### Complex Request (with preflight)
```
1. Browser sends OPTIONS preflight request
2. Server responds with allowed methods/headers
3. Browser caches response (maxAge)
4. Browser sends actual request
5. Server responds with data
```

**Preflight is triggered by:**
- Custom headers (e.g., X-Request-ID)
- Content-Type: application/json
- Methods other than GET/POST
- Credentials mode

## Security Considerations

### ✅ Best Practices

1. **Whitelist specific origins** - Don't use `*` in production
   ```javascript
   // ❌ Avoid in production
   origin: '*'
   
   // ✅ Correct
   origin: 'https://yourdomain.com'
   ```

2. **Use HTTPS in production** - Ensure secure communication
   ```env
   CORS_ORIGINS=https://yourdomain.com  # Not http://
   ```

3. **Limit allowed methods** - Only allow what's needed
   ```javascript
   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
   ```

4. **Limit allowed headers** - Only allow what's needed
   ```javascript
   allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
   ```

5. **Set reasonable maxAge** - Balance between security and performance
   ```javascript
   maxAge: 86400  // 24 hours
   ```

### ⚠️ Security Risks

1. **Wildcard origin** - Allows any website to access your API
   ```javascript
   // ❌ Never do this in production
   origin: '*'
   ```

2. **Overly permissive headers** - Allows unexpected headers
   ```javascript
   // ❌ Avoid
   allowedHeaders: '*'
   ```

3. **Credentials with wildcard** - Impossible combination
   ```javascript
   // ❌ Invalid
   origin: '*',
   credentials: true
   ```

## Testing CORS Configuration

### Using curl

```bash
# Test preflight request
curl -X OPTIONS http://localhost:3001/api/tickets \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Request-ID" \
  -v

# Check response headers:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID, X-Requested-With
```

### Using browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Make a request to the API
4. Look for preflight OPTIONS request
5. Check Response Headers for CORS headers

### Using online tools

- [CORS Tester](https://www.test-cors.org/)
- [CORS Checker](https://www.webtoolkitcentral.com/cors-checker.html)

## Troubleshooting Checklist

- [ ] Frontend origin is in `CORS_ORIGINS`
- [ ] Backend is running on correct port
- [ ] Custom headers are in `allowedHeaders`
- [ ] HTTP methods are in `methods` array
- [ ] `credentials: true` is set
- [ ] Frontend is using correct API base URL
- [ ] No typos in environment variables
- [ ] Backend restarted after env changes
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Check browser console for exact error message

## Related Files

- `backend/app/middleware/index.js` - CORS configuration
- `backend/app/config/env.js` - Environment configuration
- `backend/.env` - Development environment variables
- `backend/.env.production` - Production environment variables
- `frontend/.env` - Frontend development configuration
- `frontend/.env.production` - Frontend production configuration

## References

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Package](https://www.npmjs.com/package/cors)
- [CORS Specification](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [OWASP CORS](https://owasp.org/www-community/Cross-Origin_Resource_Sharing_(CORS))
