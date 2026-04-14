import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '../types/roles';

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  name?: string;
  role: UserRole;
  exp: number;
  iat: number;
  iss?: string;
  sub?: string;
}

// Possible tenant restriction statuses returned by the backend
export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED' | 'EXPIRED' | null;

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantSuspended: boolean;   // true when actions must be disabled
  tenantStatus: TenantStatus; // exact status for contextual messages
  login: (userData: User, authToken: string, refreshToken?: string, tenantSuspended?: boolean, tenantStatus?: TenantStatus) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isTokenExpired: () => boolean;
  getTokenPayload: () => TokenPayload | null;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
}

// ============================================================================
// Token Utilities
// ============================================================================

function decodeToken(token: string): TokenPayload | null {
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

function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return payload.exp - Date.now() / 1000 < 60;
}

function getTokenExpiresIn(token: string): number {
  const payload = decodeToken(token);
  if (!payload) return 0;
  return Math.max(0, payload.exp - Date.now() / 1000);
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
        if (!payload) { console.error('Invalid token received during login'); return; }

        localStorage.setItem('token', authToken);
        localStorage.setItem('tenantSuspended', tenantSuspended ? '1' : '0');
        localStorage.setItem('tenantStatus', tenantStatus ?? '');
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

        set({ user: userData, token: authToken, refreshToken: refreshToken || null,
              isAuthenticated: true, isLoading: false, tenantSuspended, tenantStatus });

        if (import.meta.env.DEV) console.log('✅ User logged in:', userData.email);
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantSuspended');
        localStorage.removeItem('tenantStatus');
        set({ user: null, token: null, refreshToken: null,
              isAuthenticated: false, isLoading: false,
              tenantSuspended: false, tenantStatus: null });
        if (import.meta.env.DEV) console.log('🚪 User logged out');
      },

      setToken: (token) => { localStorage.setItem('token', token); set({ token }); },
      setRefreshToken: (refreshToken) => { localStorage.setItem('refreshToken', refreshToken); set({ refreshToken }); },
      setLoading: (loading) => set({ isLoading: loading }),

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) set({ user: { ...currentUser, ...userData } });
      },

      isTokenExpired: () => { const t = get().token; return t ? isTokenExpired(t) : true; },
      getTokenPayload: () => { const t = get().token; return t ? decodeToken(t) : null; },

      initializeAuth: async () => {
        try {
          const token       = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          const storedStatus    = (localStorage.getItem('tenantStatus') || null) as TenantStatus;
          const storedSuspended = localStorage.getItem('tenantSuspended') === '1';

          // No token at all — not logged in
          if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          const payload = decodeToken(token);
          if (!payload) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Token still valid — restore session from persisted state (already done by Zustand persist)
          // Just ensure isLoading is false and user is set from payload if missing
          if (!isTokenExpired(token)) {
            const currentUser = get().user;
            const expiresIn = getTokenExpiresIn(token);
            set({
              user: currentUser ?? { id: payload.userId, email: payload.email, name: payload.name ?? payload.email, role: payload.role },
              token,
              refreshToken: refreshToken || get().refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
              tenantSuspended: storedSuspended,
              tenantStatus: storedStatus,
            });
            if (import.meta.env.DEV) console.log(`✅ Auth restored from storage. Expires in ${Math.round(expiresIn / 60)}m`);
            return;
          }

          // Token expired but we have a refresh token.
          // Don't refresh here — the HTTP interceptor will handle it on the first API call.
          // Restoring the session now prevents the login redirect while the interceptor refreshes.
          const rt = refreshToken || get().refreshToken;
          if (!rt) {
            localStorage.removeItem('token');
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Restore session with expired token — interceptor will swap it on first request
          const currentUser = get().user;
          set({
            user: currentUser ?? { id: payload.userId, email: payload.email, name: payload.name ?? payload.email, role: payload.role },
            token,
            refreshToken: rt,
            isAuthenticated: true,
            isLoading: false,
            tenantSuspended: storedSuspended,
            tenantStatus: storedStatus,
          });
          if (import.meta.env.DEV) console.log('⏰ Token expired — session restored, interceptor will refresh on first request');
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token:           state.token,
        refreshToken:    state.refreshToken,   // ← persist refresh token too
        user:            state.user,           // ← persist user so ProtectedRoute works instantly
        isAuthenticated: state.isAuthenticated,
        tenantSuspended: state.tenantSuspended,
        tenantStatus:    state.tenantStatus,
      }),
      // On rehydration, if we have a token set isLoading=false immediately
      // so the spinner doesn't flash on every page load with a valid session
      onRehydrateStorage: () => (state) => {
        if (state && state.token && state.user) {
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
export const useUser = () => useAuthStore((s) => s.user);
export const useToken = () => useAuthStore((s) => s.token);
export const useIsLoading = () => useAuthStore((s) => s.isLoading);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'SUPER_ADMIN' || s.user?.role === 'TENANT_ADMIN');
export const useTenantSuspended = () => useAuthStore((s) => s.tenantSuspended);
export const useTenantStatus = () => useAuthStore((s) => s.tenantStatus);
