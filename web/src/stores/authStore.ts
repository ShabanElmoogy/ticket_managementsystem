import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '../types/roles';

// ============================================================================
// Types
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
// Shared token helpers — identical logic to mobile/src/stores/authStore.ts
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
          console.error('Invalid token received during login');
          return;
        }
        // Start proactive refresh cycle for web
        import('../services/api/httpClient').then(({ scheduleWebRefresh }) => {
          const exp = payload.exp - Date.now() / 1000;
          if (exp > 0) scheduleWebRefresh(exp);
        }).catch(() => {});
        set({
          user: userData,
          token: authToken,
          refreshToken: refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          tenantSuspended,
          tenantStatus,
        });
        if (import.meta.env.DEV) console.log('✅ User logged in:', userData.email);
      },

      logout: () => {
        import('../services/api/httpClient').then(({ stopWebRefresh }) => stopWebRefresh()).catch(() => {});
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          tenantSuspended: false,
          tenantStatus: null,
        });
        if (import.meta.env.DEV) console.log('🚪 User logged out');
      },

      setToken:        (token)        => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setLoading:      (isLoading)    => set({ isLoading }),

      updateUser: (userData) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...userData } });
      },

      isTokenExpired:  () => { const t = get().token; return t ? isTokenExpired(t) : true; },
      getTokenPayload: () => { const t = get().token; return t ? decodeToken(t) : null; },

      initializeAuth: async () => {
        try {
          // Read from Zustand store (already rehydrated by persist middleware)
          const token        = get().token;
          const refreshToken = get().refreshToken;

          if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          const payload = decodeToken(token);
          if (!payload) {
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Token valid — restore session
          if (!isTokenExpired(token)) {
            const expiresIn = getTokenExpiresIn(token);
            // Start proactive refresh cycle on page reload
            import('../services/api/httpClient').then(({ scheduleWebRefresh }) => {
              scheduleWebRefresh(expiresIn);
            }).catch(() => {});
            set({
              user: get().user ?? buildUserFromPayload(payload),
              isAuthenticated: true,
              isLoading: false,
            });
            if (import.meta.env.DEV) console.log(`✅ Auth restored. Expires in ${Math.round(expiresIn / 60)}m`);
            return;
          }

          // Token expired — restore session with expired token.
          // HTTP interceptor will refresh on the first API call.
          if (!refreshToken) {
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
            return;
          }

          set({
            user: get().user ?? buildUserFromPayload(payload),
            isAuthenticated: true,
            isLoading: false,
          });
          if (import.meta.env.DEV) console.log('⏰ Token expired — session restored, interceptor will refresh');
        } catch {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token:           state.token,
        refreshToken:    state.refreshToken,
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        tenantSuspended: state.tenantSuspended,
        tenantStatus:    state.tenantStatus,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && state?.user) {
          state.isLoading = false;
        }
      },
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useUser            = () => useAuthStore((s) => s.user);
export const useToken           = () => useAuthStore((s) => s.token);
export const useIsLoading       = () => useAuthStore((s) => s.isLoading);
export const useIsAdmin         = () => useAuthStore((s) => s.user?.role === 'SUPER_ADMIN' || s.user?.role === 'TENANT_ADMIN');
export const useTenantSuspended = () => useAuthStore((s) => s.tenantSuspended);
export const useTenantStatus    = () => useAuthStore((s) => s.tenantStatus);
