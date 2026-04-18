import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRole } from '../types/roles';
import { tokenManager } from '../services/api/tokenManager';
import { startTokenRefreshCycle, stopTokenRefreshCycle } from '../services/api/httpClient';

// ============================================================================
// Types  — identical to web/src/stores/authStore.ts
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  name?: string;
  role: UserRole;
  exp: number;
  iat: number;
  iss?: string;
  sub?: string;
}

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED' | 'EXPIRED' | null;

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantSuspended: boolean;
  tenantStatus: TenantStatus;

  login: (userData: AuthUser, authToken: string, refreshToken?: string, tenantSuspended?: boolean, tenantStatus?: TenantStatus) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => void;
  isTokenExpired: () => boolean;
  getTokenPayload: () => TokenPayload | null;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
}

// ============================================================================
// Shared token helpers — identical logic to web/src/stores/authStore.ts
// ============================================================================

export function decodeToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.userId || !payload.email || !payload.role) return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/** Returns true if token is expired or expires within 60 seconds. */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return payload.exp - Date.now() / 1000 < 60;
}

export function getTokenExpiresIn(token: string): number {
  const payload = decodeToken(token);
  if (!payload) return 0;
  return Math.max(0, payload.exp - Date.now() / 1000);
}

/** Build a minimal User from a JWT payload (used when full user object is unavailable). */
export function buildUserFromPayload(payload: TokenPayload): AuthUser {
  return {
    id:    payload.userId,
    email: payload.email,
    name:  payload.name ?? payload.email,
    role:  payload.role,
  };
}

// ============================================================================
// Auth Store
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,
      tenantSuspended: false,
      tenantStatus: null,

      login: (userData, authToken, refreshToken, tenantSuspended = false, tenantStatus = null) => {
        const payload = decodeToken(authToken);
        if (!payload) {
          if (__DEV__) console.error('Invalid token received during login');
          return;
        }
        tokenManager.setToken(authToken);
        if (refreshToken) tokenManager.setRefreshToken(refreshToken);
        // Start proactive refresh cycle — refreshes token 60s before expiry
        startTokenRefreshCycle(authToken);
        set({
          user: userData,
          token: authToken,
          refreshToken: refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          tenantSuspended,
          tenantStatus,
        });
        if (__DEV__) console.log('✅ User logged in:', userData.email);
      },

      logout: () => {
        tokenManager.clear();
        stopTokenRefreshCycle();
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          tenantSuspended: false,
          tenantStatus: null,
        });
        if (__DEV__) console.log('🚪 User logged out');
      },

      setToken: (token) => {
        tokenManager.setToken(token);
        set({ token });
      },
      setRefreshToken: (refreshToken) => {
        tokenManager.setRefreshToken(refreshToken);
        set({ refreshToken });
      },
      setLoading:      (isLoading)    => set({ isLoading }),

      updateUser: (userData) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...userData } });
      },

      isTokenExpired:  () => { const t = get().token; return t ? isTokenExpired(t) : true; },
      getTokenPayload: () => { const t = get().token; return t ? decodeToken(t) : null; },

      initializeAuth: async () => {
        try {
          const token        = get().token;
          const refreshToken = get().refreshToken;

          if (__DEV__) {
            console.log('🔐 initializeAuth called');
            console.log('📦 Stored token:', token ? '✅' : '❌');
          }

          if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          const payload = decodeToken(token);

          if (!payload) {
            if (__DEV__) console.warn('❌ Invalid token in storage');
            tokenManager.clear();
            stopTokenRefreshCycle();
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Sync tokenManager — must happen before any API call
          tokenManager.setToken(token);
          if (refreshToken) tokenManager.setRefreshToken(refreshToken);

          if (__DEV__) console.log('🔑 tokenManager ready, token:', token.slice(0, 20) + '...');

          const expiresIn = getTokenExpiresIn(token);

          if (expiresIn <= 0 && refreshToken) {
            // Token already expired — use the bare refreshClient (no interceptors)
            // to avoid the 401 handler firing and causing a loop
            if (__DEV__) console.log('⏰ Token expired on cold start, refreshing...');
            try {
              const { refreshClient } = await import('../services/api/httpClient');
              const response = await refreshClient.post<{ token: string; refreshToken: string }>(
                '/auth/refresh', { refreshToken }
              );
              const newToken        = response.data.token;
              const newRefreshToken = response.data.refreshToken;
              tokenManager.setToken(newToken);
              tokenManager.setRefreshToken(newRefreshToken);
              startTokenRefreshCycle(newToken);
              const newPayload = decodeToken(newToken);
              set({
                token: newToken,
                refreshToken: newRefreshToken,
                user: get().user ?? (newPayload ? buildUserFromPayload(newPayload) : null),
                isAuthenticated: true,
                isLoading: false,
              });
              if (__DEV__) {
                const logPayload = decodeToken(newToken);
                const mins = logPayload ? Math.round((logPayload.exp - Date.now() / 1000) / 60) : 0;
                console.log(`✅ [REFRESH] Cold start token refreshed. Expires in ${mins}m`);
              }
              return;
            } catch (refreshErr: any) {
              const status = refreshErr?.response?.status;
              const isNetworkError = !refreshErr?.response && (
                refreshErr?.code === 'ECONNABORTED' ||
                refreshErr?.code === 'ERR_NETWORK' ||
                refreshErr?.message === 'Network Error'
              );

              if (isNetworkError) {
                // Network unavailable on cold start — keep session alive.
                // The reactive 401 interceptor will refresh when the first
                // real API call fails. Don't logout the user.
                if (__DEV__) console.warn('⚠️ Cold start refresh failed (network) — keeping session, will retry on next request');
                // Keep the expired token in tokenManager — the 401 interceptor
                // will trigger a refresh when the first API call returns 401
                startTokenRefreshCycle(token); // schedule proactive refresh for later
                set({
                  user: get().user ?? buildUserFromPayload(payload),
                  isAuthenticated: true,
                  isLoading: false,
                });
              } else if (status === 401) {
                // Refresh token is genuinely revoked/expired — logout
                if (__DEV__) console.warn('❌ Cold start refresh failed: refresh token revoked — logging out');
                tokenManager.clear();
                stopTokenRefreshCycle();
                set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
              } else {
                // Other server error (500 etc.) — keep session, retry later
                if (__DEV__) console.warn('⚠️ Cold start refresh failed (server error) — keeping session');
                startTokenRefreshCycle(token);
                set({
                  user: get().user ?? buildUserFromPayload(payload),
                  isAuthenticated: true,
                  isLoading: false,
                });
              }
              return;
            }
          }

          // Token still valid — start proactive refresh cycle
          startTokenRefreshCycle(token);

          // Restore session
          set({
            user: get().user ?? buildUserFromPayload(payload),
            isAuthenticated: true,
            isLoading: false,
          });

          if (__DEV__) {
            const expiresIn = getTokenExpiresIn(token);
            console.log(`✅ Auth restored. Expires in ${Math.round(expiresIn / 60)} minutes`);
          }
        } catch (error) {
          if (__DEV__) console.error('❌ initializeAuth failed:', error);
          tokenManager.clear();
          stopTokenRefreshCycle();
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token:           state.token,
        refreshToken:    state.refreshToken,
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        tenantSuspended: state.tenantSuspended,
        tenantStatus:    state.tenantStatus,
      }),
      onRehydrateStorage: () => (state) => {
        if (__DEV__) console.log('🔄 Rehydrating auth store, token:', state?.token ? '✅' : '❌');
        if (state) {
          state.isLoading = false;
          if (state.token) {
            tokenManager.setToken(state.token);
            if (state.refreshToken) tokenManager.setRefreshToken(state.refreshToken);
            if (__DEV__) console.log('🔑 tokenManager synced from rehydration');
          }
        }
      },
    }
  )
);

// ============================================================================
// Selectors — identical to web/src/stores/authStore.ts
// ============================================================================

export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useUser            = () => useAuthStore((s) => s.user);
export const useToken           = () => useAuthStore((s) => s.token);
export const useIsLoading       = () => useAuthStore((s) => s.isLoading);
export const useIsAdmin         = () => useAuthStore((s) => s.user?.role === 'SUPER_ADMIN' || s.user?.role === 'TENANT_ADMIN');
export const useTenantSuspended = () => useAuthStore((s) => s.tenantSuspended);
export const useTenantStatus    = () => useAuthStore((s) => s.tenantStatus);
