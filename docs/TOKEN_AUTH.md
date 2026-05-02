# Token & Refresh Token — Complete Reference

How authentication tokens work end-to-end across the API and mobile app.

---

## Table of Contents

1. [Token Types](#1-token-types)
2. [API — Token Generation](#2-api--token-generation)
3. [API — Refresh Token Storage](#3-api--refresh-token-storage)
4. [API — Endpoints](#4-api--endpoints)
5. [API — Rate Limiting](#5-api--rate-limiting)
6. [Mobile — Storage Architecture](#6-mobile--storage-architecture)
7. [Mobile — Refresh Strategy](#7-mobile--refresh-strategy)
8. [Mobile — Proactive Refresh Cycle](#8-mobile--proactive-refresh-cycle)
9. [Mobile — Pre-Validate Interceptor](#9-mobile--pre-validate-interceptor)
10. [Mobile — Reactive 401 Handler](#10-mobile--reactive-401-handler)
11. [Mobile — Circuit Breaker](#11-mobile--circuit-breaker)
12. [Mobile — Offline & Connectivity](#12-mobile--offline--connectivity)
13. [Mobile — Cold Start](#13-mobile--cold-start)
14. [Decision Table — Which Path Fires](#14-decision-table--which-path-fires)
15. [Configuration Reference](#15-configuration-reference)
16. [Common Problems & Fixes](#16-common-problems--fixes)

---

## 1. Token Types

The system uses two completely different token types that serve different purposes.

### Access Token

| Property | Value |
|---|---|
| Format | Signed JWT (HS256) |
| Signed with | `JWT_SECRET` env var |
| Lifetime | `ACCESS_TOKEN_EXPIRES_IN` (default `15m`) |
| Payload | `userId`, `email`, `role`, `tenantId` (tenant-scoped roles only), `iat`, `exp`, `iss`, `sub` |
| Sent as | `Authorization: Bearer <token>` header on every API request |
| Verified by | `verifyAccessToken()` in `api/src/utils/tokenService.js` |
| Stored on mobile | `tokenManager` (in-memory) + Zustand persist (AsyncStorage) |

### Refresh Token

| Property | Value |
|---|---|
| Format | Random 64-character hex string (`randomBytes(32).toString('hex')`) |
| NOT a JWT | Cannot be decoded — has no payload |
| Lifetime | `REFRESH_TOKEN_EXPIRES_IN` (default `7d`) |
| Stored | In the `refresh_tokens` database table |
| Sent as | JSON body `{ refreshToken: "..." }` to `POST /auth/refresh` |
| Stored on mobile | `tokenManager` (in-memory) + Zustand persist (AsyncStorage) |

> **Why is the refresh token a random string and not a JWT?**
> A JWT refresh token can be decoded client-side, which leaks information about when it expires. A random opaque string forces the server to be the single source of truth for validity — the server checks the DB row for `revokedAt` and `expiresAt` on every use.

---

## 2. API — Token Generation

**File:** `api/src/utils/tokenService.js`

```
Login / Register / Dev-Login
        │
        ▼
  issueTokens(user)                    ← api/src/modules/auth/auth.service.js
        │
        ├─ generateAccessToken(payload) ← jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
        │                                  payload = { userId, email, role, tenantId? }
        │
        └─ generateRefreshToken()       ← randomBytes(32).toString('hex')
                │
                └─ insertRefreshToken(token, userId)  ← persists to DB with expiresAt
```

The access token payload always contains:

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "tenantId": "uuid",
  "iat": 1746000000,
  "exp": 1746000900,
  "iss": "ticket-management-system",
  "sub": "uuid"
}
```

`tenantId` is only included for `TENANT_ADMIN`, `EMPLOYEE`, and `PROGRAMMER` roles. `SUPER_ADMIN` tokens have no `tenantId`.

---

## 3. API — Refresh Token Storage

**File:** `api/src/modules/auth/auth.schema.js`

```sql
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT NOT NULL UNIQUE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,           -- NULL = active, non-NULL = revoked
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Rotation on refresh

When `POST /auth/refresh` is called, the old token is **not deleted** — it is marked `revokedAt = NOW()` and a new row is inserted, both inside a single database transaction.

```
POST /auth/refresh { refreshToken: "old_token" }
        │
        ▼
  refreshAccessToken(rawRefreshToken)
        │
        ├─ findRefreshToken(token)      → check row exists
        ├─ check revokedAt IS NULL      → not already revoked
        ├─ check expiresAt > NOW()      → not expired
        ├─ findUserById(stored.userId)  → user still exists
        │
        ├─ generateAccessToken(payload) → new JWT
        ├─ generateRefreshToken()       → new random hex
        │
        └─ rotateRefreshToken(old, new, userId)
                │
                └─ DB TRANSACTION:
                     UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = old
                     INSERT refresh_tokens (new_token, userId, expiresAt)
```

The transaction guarantees atomicity — if the server crashes between the revoke and the insert, the old token remains valid and the client can retry.

---

## 4. API — Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | None | Login, returns `{ token, refreshToken, user, tenant? }` |
| `POST` | `/api/v1/auth/register` | None | Register, returns same shape |
| `POST` | `/api/v1/auth/refresh` | None | Exchange refresh token for new pair |
| `POST` | `/api/v1/auth/logout` | None | Revoke refresh token |
| `POST` | `/api/v1/auth/dev-login` | None | Dev only — login without password |

### `POST /auth/refresh` — request & response

```json
// Request body
{ "refreshToken": "bc8f9b1a4873a274d744..." }

// Success response 200
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "59b4ccfea22237286390...",
  "user": { "id": "uuid", "email": "...", "name": "...", "role": "EMPLOYEE" }
}

// Error responses
401  { "error": "Refresh token not found" }
401  { "error": "Refresh token has been revoked" }
401  { "error": "Refresh token has expired" }
401  { "error": "User not found" }
429  { "error": "Too many refresh attempts, please try again later." }
```

---

## 5. API — Rate Limiting

**File:** `api/src/middleware/index.js`

### Login / Register — IP-based

```
20 requests per 15 minutes per IP
Env: AUTH_RATE_LIMIT_MAX (default 20)
```

### Refresh — token-based (not IP-based)

```
10 requests per 15 minutes per refresh token
Env: REFRESH_RATE_LIMIT_MAX (default 10)
```

The refresh limiter keys by the **first 16 characters of the refresh token**, not by IP. This is intentional:

- On shared/hosted servers all users share one egress IP. An IP-based limit would be exhausted by ~2 concurrent users.
- Keying by token means each token has its own counter. A legitimate client refreshes once per token lifetime and never hits the limit. A stolen token being hammered hits the limit after 10 attempts.

---

## 6. Mobile — Storage Architecture

Three layers hold token state simultaneously. They must always be in sync.

```
┌─────────────────────────────────────────────────────────────┐
│  tokenManager  (in-memory, synchronous)                     │
│  mobile/src/services/api/tokenManager.ts                    │
│                                                             │
│  _token        = "eyJhbGci..."   ← read by request interceptor │
│  _refreshToken = "bc8f9b1a..."   ← read by callRefreshEndpoint │
│  _tenantSlug   = "acme"          ← sent as X-Tenant-Slug header │
└─────────────────────────────────────────────────────────────┘
         ▲ set synchronously before any retry fires
         │
┌─────────────────────────────────────────────────────────────┐
│  Zustand authStore  (reactive, persisted)                   │
│  mobile/src/stores/authStore.ts                             │
│                                                             │
│  token, refreshToken, user, isAuthenticated, ...            │
│  → persisted to AsyncStorage via zustand/middleware/persist │
└─────────────────────────────────────────────────────────────┘
         ▲ updated via authEvents.setTokens() to avoid circular import
         │
┌─────────────────────────────────────────────────────────────┐
│  AsyncStorage  (persistent, async)                          │
│  key: "auth-storage"                                        │
│                                                             │
│  Survives app restarts. Read on cold start by Zustand.      │
└─────────────────────────────────────────────────────────────┘
```

### Why three layers?

- **tokenManager** is synchronous — the Axios request interceptor runs synchronously and cannot `await` AsyncStorage.
- **Zustand** provides reactive UI updates and persists to AsyncStorage automatically.
- **AsyncStorage** survives app restarts.

### Update order on refresh

```
callRefreshEndpoint() succeeds
        │
        ▼
applyNewTokens(newToken, newRefreshToken)
        │
        ├─ tokenManager.setToken(newToken)          ← SYNC, immediate
        ├─ tokenManager.setRefreshToken(newRT)      ← SYNC, immediate
        │
        └─ authEvents.setTokens(newToken, newRT)    ← triggers Zustand
                │
                └─ authStore.setToken()             ← Zustand → AsyncStorage
                   authStore.setRefreshToken()
```

`tokenManager` is always updated first. Any retry that fires immediately after will read the new token from `tokenManager`, not from Zustand (which may still be writing to AsyncStorage).

---

## 7. Mobile — Refresh Strategy

The mobile app uses **three independent refresh paths** that cover every scenario. They are ordered by preference — earlier paths prevent later ones from needing to fire.

```
┌──────────────────────────────────────────────────────────────────┐
│  Path 1 — Proactive cycle (best case)                            │
│  Fires on a timer, 25% before token expiry.                      │
│  User never sees a delay. No 401 ever sent to the server.        │
├──────────────────────────────────────────────────────────────────┤
│  Path 2 — Pre-validate interceptor (request interceptor)         │
│  Fires when a request is about to be sent with an expiring token.│
│  Refreshes inline before the request goes out. No 401 sent.      │
├──────────────────────────────────────────────────────────────────┤
│  Path 3 — Reactive 401 handler (response interceptor)            │
│  Fires when the server returns 401. Refreshes and retries.       │
│  Last resort — only fires if paths 1 and 2 both missed.          │
└──────────────────────────────────────────────────────────────────┘
```

All three paths call the same `callRefreshEndpoint()` function, which integrates the circuit breaker and 429 backoff.

---

## 8. Mobile — Proactive Refresh Cycle

**File:** `mobile/src/services/api/httpClient.ts` — `startTokenRefreshCycle()`

### Thresholds (relative to token lifetime)

All thresholds are computed as a **fraction of the token's actual lifetime** (`exp - iat`), not as hardcoded absolute values. This makes the system work correctly regardless of what the server issues.

| Constant | Value | Meaning |
|---|---|---|
| `PROACTIVE_RATIO` | `0.25` | Fire proactive refresh when 25% of lifetime remains |
| `PRE_VALIDATE_RATIO` | `0.10` | Fire inline refresh when 10% of lifetime remains |
| `MIN_PROACTIVE_LIFETIME_MS` | `30_000` | Don't schedule proactive for tokens with < 30s lifetime |
| `MIN_SCHEDULE_MS` | `5_000` | Never fire sooner than 5s (loop prevention floor) |

### Examples

| Token lifetime | Proactive fires at | Pre-validate fires at |
|---|---|---|
| 15 minutes (production) | 3m 45s remaining | 90s remaining |
| 1 minute | 15s remaining | 6s remaining |
| 17 seconds | ❌ skipped (< 30s lifetime) | 1.7s remaining |

### Scheduling logic

```
startTokenRefreshCycle(token)
        │
        ├─ decode claims (exp, iat, lifetimeMs)
        │
        ├─ Guard 1: token already expired?          → return (nothing to schedule)
        ├─ Guard 2: lifetimeMs < 30s?               → return (pre-validate handles it)
        ├─ Guard 3: msUntilExpiry ≤ proactiveMs?    → return (already in window, pre-validate handles it)
        │
        └─ setTimeout(refresh, max(msUntilExpiry - proactiveMs, 5s))
                │
                └─ on fire:
                     ├─ skip if isRefreshing (reactive owns it)
                     ├─ callRefreshEndpoint()
                     ├─ applyNewTokens()
                     └─ startTokenRefreshCycle(newToken)  ← reschedule
```

### When the cycle is started / stopped

| Event | Action |
|---|---|
| `login()` | `startTokenRefreshCycle(token)` |
| `initializeAuth()` — valid token | `startTokenRefreshCycle(token)` |
| `initializeAuth()` — cold start refresh succeeds | `startTokenRefreshCycle(newToken)` |
| Reactive 401 refresh succeeds | `startTokenRefreshCycle(newToken)` |
| Pre-validate refresh succeeds | `startTokenRefreshCycle(newToken)` |
| Reactive 401 fires | `stopTokenRefreshCycle()` (prevents race) |
| `logout()` | `stopTokenRefreshCycle()` |
| Circuit breaker opens | `stopTokenRefreshCycle()` |

---

## 9. Mobile — Pre-Validate Interceptor

**File:** `mobile/src/services/api/httpClient.ts` — request interceptor

Runs before every outgoing request. If the token is within `PRE_VALIDATE_RATIO` (10%) of its lifetime, it refreshes inline before the request is sent.

```
Every outgoing request
        │
        ▼
  Request interceptor
        │
        ├─ Skip if: _preValidated flag set (prevents re-entry)
        ├─ Skip if: isRefreshing (reactive handler owns it)
        ├─ Skip if: circuit is OPEN
        ├─ Skip if: URL contains /auth/refresh
        │
        ├─ decode token claims
        ├─ compute preValidateMs = lifetimeMs × 0.10
        │
        ├─ msRemaining > preValidateMs?  → attach headers, send request normally
        │
        └─ msRemaining ≤ preValidateMs?
                │
                ├─ isRefreshing = true
                ├─ _preValidated = true  (marks this config)
                ├─ callRefreshEndpoint()
                ├─ applyNewTokens()
                ├─ startTokenRefreshCycle(newToken)
                └─ isRefreshing = false
                        │
                        └─ request continues with new token in Authorization header
```

The `_preValidated` flag on the request config prevents the interceptor from re-entering on the retry after a refresh.

---

## 10. Mobile — Reactive 401 Handler

**File:** `mobile/src/services/api/httpClient.ts` — response interceptor

Fires when the server returns `401`. This is the last resort — it means both the proactive cycle and pre-validate interceptor missed the expiry.

### Concurrent 401 deduplication

If multiple requests fail with 401 simultaneously (e.g. 3 React Query hooks mount at the same time), only **one** refresh call is made. The others wait in a queue.

```
Request A → 401
Request B → 401  (arrives while A's refresh is in flight)
Request C → 401  (arrives while A's refresh is in flight)

        ├─ A: isRefreshing = false → becomes the "owner"
        │       isRefreshing = true
        │       stopTokenRefreshCycle()
        │       callRefreshEndpoint()
        │
        ├─ B: isRefreshing = true → joins failedQueue
        ├─ C: isRefreshing = true → joins failedQueue
        │
        └─ A's refresh succeeds:
                applyNewTokens()
                startTokenRefreshCycle(newToken)
                drainQueue(null)   ← B and C resolve
                http.request(A's config)
                http.request(B's config)   ← retried with new token
                http.request(C's config)   ← retried with new token
```

Queue is capped at `MAX_QUEUE_SIZE = 20`. Oldest entry is dropped if the queue is full.

### Refresh failure paths

| Failure type | Action |
|---|---|
| Network error (no response) | `isWaitingForConnectivity = true`, queue stays, retry when online |
| `401` from refresh endpoint | Session expired — drain queue with error, clear tokens, logout |
| `429` from refresh endpoint | Wait `Retry-After`, retry once. If still 429, reschedule proactive cycle |
| `5xx` from refresh endpoint | Do not logout — let next request trigger another attempt |

---

## 11. Mobile — Circuit Breaker

**File:** `mobile/src/services/api/circuitBreaker.ts`

Prevents hammering the refresh endpoint after repeated genuine auth failures.

```
States:  CLOSED (normal) ←→ OPEN (blocked)

CLOSED → OPEN:  after 3 consecutive non-network, non-429 failures
OPEN   → CLOSED: after a successful refresh (recordSuccess)
OPEN   → CLOSED: auto-reset after 5 minutes (safety valve)
```

### What counts as a failure

| Error type | Counts? | Reason |
|---|---|---|
| `401` from refresh endpoint | ✅ Yes | Genuine auth failure |
| `5xx` from refresh endpoint | ✅ Yes | Server error |
| Network error (no response) | ❌ No | Offline ≠ auth failure |
| `429` Too Many Requests | ❌ No | Rate limit ≠ auth failure |

When the circuit opens:
1. `circuitBreaker.onSessionExpired()` fires
2. `tokenManager.clear()` — removes tokens from memory
3. `stopTokenRefreshCycle()` — cancels the timer
4. `authEvents.sessionExpired()` → `authStore.logout()` — navigates to login

---

## 12. Mobile — Offline & Connectivity

**File:** `mobile/src/services/api/networkEvents.ts`

### Network error on a normal request

```
Request fails with network error (ECONNABORTED / ERR_NETWORK)
        │
        ├─ networkEvents.emit('Network error...')   ← shows NetworkErrorDialog
        └─ networkEvents.enqueue(config)            ← saves request for retry
                │
                └─ when connectivity restored:
                        drainQueue() → retries all queued requests
```

### Network error during a 401 refresh

```
401 fires → callRefreshEndpoint() → network error
        │
        ├─ isWaitingForConnectivity = true
        ├─ isRefreshing stays true (blocks new refresh attempts)
        └─ failedQueue stays populated
                │
                └─ networkEvents.setConnectivityCallback fires when online
                        │
                        └─ retryQueuedAuthRequests()
                                ├─ callRefreshEndpoint()  ← try refresh again
                                ├─ applyNewTokens()
                                ├─ startTokenRefreshCycle(newToken)
                                └─ drainQueue(null)       ← retry all 401'd requests
```

---

## 13. Mobile — Cold Start

**File:** `mobile/src/stores/authStore.ts` — `initializeAuth()`

Called once from `app/_layout.tsx` on app mount, after Zustand rehydrates from AsyncStorage.

```
initializeAuth()
        │
        ├─ no token in storage?          → set isAuthenticated=false, done
        ├─ token malformed?              → clear storage, done
        │
        ├─ sync tokenManager (must happen before any API call)
        │
        ├─ compute coldStartShouldRefresh:
        │       lifetimeMs < 30s?        → always refresh (too short to schedule)
        │       expiresIn ≤ 25% of lifetime? → refresh (within proactive window)
        │
        ├─ coldStartShouldRefresh = true AND refreshToken exists?
        │       │
        │       ├─ callRefreshEndpoint()   ← goes through circuit breaker
        │       │
        │       ├─ success:
        │       │       applyNewTokens()
        │       │       startTokenRefreshCycle(newToken)
        │       │       set({ isAuthenticated: true, isLoading: false })
        │       │
        │       └─ failure:
        │               network error  → keep session, startTokenRefreshCycle(oldToken)
        │               401            → clear tokens, logout
        │               5xx            → keep session, startTokenRefreshCycle(oldToken)
        │
        └─ coldStartShouldRefresh = false:
                startTokenRefreshCycle(token)
                set({ isAuthenticated: true, isLoading: false })
```

---

## 14. Decision Table — Which Path Fires

| Situation | Path that fires |
|---|---|
| App running normally, token fresh | Proactive cycle (scheduled timer) |
| App in background for a while, token near expiry, user makes a request | Pre-validate interceptor |
| App in background for a long time, token expired, user makes a request | Pre-validate interceptor (refreshes before request) |
| Multiple requests fire simultaneously with expired token | Reactive 401 handler (first request owns refresh, others queue) |
| App cold-started with near-expired token | `initializeAuth()` cold-start refresh |
| App cold-started with valid token | Proactive cycle scheduled from `initializeAuth()` |
| Refresh endpoint returns 429 | `callRefreshEndpoint()` waits `Retry-After`, retries once |
| Refresh endpoint returns 401 | Circuit breaker records failure, logout after 3 consecutive |
| Device goes offline | Requests queued in `networkEvents`, retried on reconnect |
| Device comes back online with queued 401s | `retryQueuedAuthRequests()` refreshes then drains queue |

---

## 15. Configuration Reference

### API environment variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — | **Required.** Secret for signing access tokens. Must be strong and unique. |
| `REFRESH_TOKEN_SECRET` | — | **Required.** Must be different from `JWT_SECRET`. |
| `ACCESS_TOKEN_EXPIRES_IN` | `15m` | Access token lifetime. Use `15m` for production. |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Refresh token lifetime. Stored in DB. |
| `AUTH_RATE_LIMIT_MAX` | `20` | Max login/register attempts per IP per 15 min. |
| `REFRESH_RATE_LIMIT_MAX` | `10` | Max refresh attempts per token per 15 min. |

### Mobile constants

| Constant | Value | File |
|---|---|---|
| `PROACTIVE_RATIO` | `0.25` | `httpClient.ts` |
| `PRE_VALIDATE_RATIO` | `0.10` | `httpClient.ts` |
| `MIN_PROACTIVE_LIFETIME_MS` | `30_000` (30s) | `httpClient.ts` |
| `MIN_SCHEDULE_MS` | `5_000` (5s) | `httpClient.ts` |
| `MAX_QUEUE_SIZE` | `20` | `httpClient.ts` |
| `MAX_FAILURES` (circuit breaker) | `3` | `circuitBreaker.ts` |
| `RESET_AFTER_MS` (circuit breaker) | `300_000` (5 min) | `circuitBreaker.ts` |
| `REQUEST_TIMEOUT` | `30_000` (30s) | `httpClient.ts` |

---

## 16. Common Problems & Fixes

### Refresh loop — token refreshes every few seconds

**Symptom:**
```
⏱ Proactive cycle scheduled in 5s (token lifetime: 3600s, fires at 900s before expiry)
✅ Token proactively refreshed. Expires in: 0m (17s)
⏱ Proactive cycle scheduled in 5s ...  ← repeats forever
```

**Cause:** `ACCESS_TOKEN_EXPIRES_IN` is set to a very short value (e.g. `1m` or less) on the server. The token lifetime is short but `iat` from a previous session makes the computed lifetime appear large (e.g. 3600s), so the proactive threshold (900s) is larger than the actual remaining time (17s). The cycle fires immediately, gets another short token, and loops.

**Fix:**
1. Set `ACCESS_TOKEN_EXPIRES_IN=15m` in `api/.env` and restart the API server.
2. The mobile guards against this: tokens with lifetime < 30s skip proactive scheduling entirely.

---

### 429 on refresh — rate limited

**Symptom:**
```
⚠️ CircuitBreaker Failure 1/3
⚠️ Proactive refresh failed: Request failed with status code 429
```

**Cause (old):** The refresh rate limiter was keyed by IP. On a shared server, all users shared one IP and exhausted the limit together.

**Fix (applied):** The refresh rate limiter is now keyed by the refresh token itself. Each token has its own counter. The mobile also handles 429 with a `Retry-After` backoff retry before giving up.

---

### Session lost after going offline

**Symptom:** User goes offline, comes back online, is logged out.

**Cause:** The reactive 401 handler was treating network errors as auth failures and logging out.

**Fix (applied):** Network errors set `isWaitingForConnectivity = true` and keep the queue populated. When connectivity is restored, `retryQueuedAuthRequests()` attempts a single refresh and drains the queue. The circuit breaker does not count network errors as failures.

---

### "Token expiring too soon for proactive cycle" warning (old behaviour)

**Symptom:**
```
⚠️ Token expiring too soon for proactive cycle — skipping (expires in 17s, need >70s)
```

**Cause:** The old code used a hardcoded 70s minimum. Any token with less than 70s remaining would skip proactive scheduling, even if it was a fresh 1-minute token with 45s left.

**Fix (applied):** The threshold is now relative (`25% of lifetime`). A fresh 1-minute token schedules proactive refresh at 15s remaining. The 70s hardcoded value is gone.

---

### Cold start always refreshes even with a valid token

**Cause:** The cold-start threshold was computed as `25% of (exp - iat)`. If the stored token was issued in a previous session (large `iat` gap), the computed lifetime was large and the threshold was large, causing an unnecessary refresh on every cold start.

**Fix (applied):** The cold-start check now also guards against tokens with lifetime < 30s (always refresh) and correctly computes the threshold from the actual `exp - iat` of the stored token, not from the current time.
