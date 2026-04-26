/**
 * authEvents — zero-import event bus for auth side-effects.
 *
 * Breaks the circular dependency:
 *   authStore → httpClient → authStore  ← cycle
 *
 * httpClient calls authEvents.logout() / authEvents.setTokens().
 * authStore registers the handlers after it initializes.
 *
 * circuitBreaker.onSessionExpired() is also registered here so the UI
 * can respond to the circuit opening (show session expired screen).
 */

type LogoutHandler         = () => void;
type SetTokensHandler      = (token: string, refreshToken: string) => void;
type SessionExpiredHandler = () => void;

let _logoutHandler:         LogoutHandler         | null = null;
let _setTokensHandler:      SetTokensHandler      | null = null;
let _sessionExpiredHandler: SessionExpiredHandler | null = null;

export const authEvents = {
  setLogoutHandler:         (fn: LogoutHandler)         => { _logoutHandler         = fn; },
  setTokensHandler:         (fn: SetTokensHandler)      => { _setTokensHandler      = fn; },
  /** Called when the circuit breaker opens — show session expired UI */
  setSessionExpiredHandler: (fn: SessionExpiredHandler) => { _sessionExpiredHandler = fn; },

  logout:       ()                      => { _logoutHandler?.(); },
  setTokens:    (t: string, rt: string) => { _setTokensHandler?.(t, rt); },
  sessionExpired: ()                    => { _sessionExpiredHandler?.(); },
};
