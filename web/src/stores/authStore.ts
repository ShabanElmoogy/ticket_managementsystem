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
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          const storedStatus = (localStorage.getItem('tenantStatus') || null) as TenantStatus;
          const storedSuspended = localStorage.getItem('tenantSuspended') === '1';

          if (!token) { set({ isAuthenticated: false, isLoading: false }); return; }

          const payload = decodeToken(token);
          if (!payload) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          if (isTokenExpired(token)) {
            if (refreshToken) {
              try {
                if (import.meta.env.DEV) console.log('⏰ Token expired, attempting refresh...');
                const { api } = await import('../services/api');
                const data = await api.post<{ token: string; refreshToken?: string; user?: any }>('/auth/refresh', { refreshToken });
                localStorage.setItem('token', data.token);
                if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                const newPayload = decodeToken(data.token);
                if (!newPayload) throw new Error('Invalid refreshed token');
                const expiresIn = getTokenExpiresIn(data.token);
                set({ user: data.user, token: data.token,
                      refreshToken: data.refreshToken || refreshToken,
                      isAuthenticated: true, isLoading: false,
                      tenantSuspended: storedSuspended, tenantStatus: storedStatus });
                if (import.meta.env.DEV) console.log(`✅ Auth refreshed. Expires in ${Math.round(expiresIn / 60)}m`);
                return;
              } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                set({ isAuthenticated: false, isLoading: false });
                return;
              }
            } else {
              localStorage.removeItem('token');
              set({ isAuthenticated: false, isLoading: false });
              return;
            }
          }

          const expiresIn = getTokenExpiresIn(token);
          set({ user: { id: payload.userId, email: payload.email, name: payload.email, role: payload.role },
                token, refreshToken: refreshToken || null,
                isAuthenticated: true, isLoading: false,
                tenantSuspended: storedSuspended, tenantStatus: storedStatus });
          if (import.meta.env.DEV) console.log(`✅ Auth initialized. Expires in ${Math.round(expiresIn / 60)}m`);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({ isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        tenantSuspended: state.tenantSuspended,
        tenantStatus: state.tenantStatus,
      }),
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
