/**
 * circuitBreaker — tracks consecutive token refresh failures.
 *
 * States:
 *   CLOSED  — normal operation, refresh attempts allowed
 *   OPEN    — too many consecutive failures, refresh blocked
 *
 * Transitions:
 *   CLOSED → OPEN   : after MAX_FAILURES consecutive failures
 *   OPEN   → CLOSED : after a successful refresh (manual reset)
 *
 * When OPEN, the circuit emits a 'sessionExpired' event so the UI can
 * show a "session expired" screen instead of silently queuing requests.
 *
 * Network errors do NOT count as failures — the circuit only opens on
 * auth errors (401) or server errors (5xx) from the refresh endpoint.
 * This prevents the circuit from opening just because the user is offline.
 */

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_FAILURES    = 3;   // open after 3 consecutive non-network failures
const RESET_AFTER_MS  = 5 * 60 * 1000; // auto-reset after 5 min (safety valve)

// ── Types ─────────────────────────────────────────────────────────────────────

type CircuitState          = 'CLOSED' | 'OPEN';
type SessionExpiredHandler = () => void;

// ── State ─────────────────────────────────────────────────────────────────────

let state:            CircuitState          = 'CLOSED';
let failureCount:     number                = 0;
let openedAt:         number | null         = null;
let resetTimer:       ReturnType<typeof setTimeout> | null = null;
let expiredHandler:   SessionExpiredHandler | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function openCircuit(): void {
  state    = 'OPEN';
  openedAt = Date.now();

  if (__DEV__) {
    console.warn(`🔴 [CircuitBreaker] OPEN after ${failureCount} consecutive failures`);
  }

  // Auto-reset after timeout — prevents permanent lockout if the handler
  // was never registered or the app is in the background
  resetTimer = setTimeout(() => {
    if (__DEV__) console.log('🟡 [CircuitBreaker] Auto-reset after timeout');
    circuitBreaker.reset();
  }, RESET_AFTER_MS);

  // Notify UI — show session expired screen
  try { expiredHandler?.(); } catch { }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const circuitBreaker = {
  /**
   * Register the handler called when the circuit opens.
   * Typically navigates to the login screen or shows a modal.
   */
  onSessionExpired: (fn: SessionExpiredHandler) => {
    expiredHandler = fn;
  },

  /** Returns true if the circuit is open (refresh should be blocked). */
  isOpen: (): boolean => {
    return state === 'OPEN';
  },

  /**
   * Record a refresh failure.
   * Network errors are excluded — pass isNetworkError=true to skip counting.
   */
  recordFailure: (isNetworkError = false): void => {
    if (isNetworkError) return; // offline ≠ auth failure

    failureCount++;
    if (__DEV__) {
      console.warn(`⚠️ [CircuitBreaker] Failure ${failureCount}/${MAX_FAILURES}`);
    }

    if (failureCount >= MAX_FAILURES && state === 'CLOSED') {
      openCircuit();
    }
  },

  /**
   * Record a successful refresh — resets the failure counter and closes
   * the circuit if it was open.
   */
  recordSuccess: (): void => {
    if (failureCount === 0 && state === 'CLOSED') return; // nothing to reset

    if (__DEV__ && failureCount > 0) {
      console.log(`🟢 [CircuitBreaker] Reset after success (was at ${failureCount} failures)`);
    }

    failureCount = 0;
    state        = 'CLOSED';
    openedAt     = null;

    if (resetTimer !== null) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
  },

  /**
   * Manually reset the circuit (e.g. after user logs in again).
   */
  reset: (): void => {
    circuitBreaker.recordSuccess();
  },

  /** Current state — for debugging / monitoring. */
  getState: (): { state: CircuitState; failureCount: number; openedAt: number | null } => ({
    state,
    failureCount,
    openedAt,
  }),
};
