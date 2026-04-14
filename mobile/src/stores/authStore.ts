import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRole } from '../types/roles';

// ── Types ──────────────────────────────────────────────────────────────────

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
}

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED' | 'EXPIRED' | null;

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantSuspended: boolean;
  tenantStatus: TenantStatus;

  login: (
    userData: User,
    authToken: string,
    refreshToken?: string,
    tenantSuspended?: boolean,
    tenantStatus?: TenantStatus,
  ) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isTokenExpired: () => boolean;
  getTokenPayload: () => TokenPayload | null;
  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
}

// ── Token helpers ──────────────────────────────────────────────────────────

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

function isExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return payload.exp - Date.now() / 1000 < 60;
}

// ── Store ──────────────────────────────────────────────────────────────────

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

      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setLoading: (isLoading) => set({ isLoading }),

      updateUser: (userData) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...userData } });
      },

      isTokenExpired: () => {
        const t = get().token;
        return t ? isExpired(t) : true;
      },

      getTokenPayload: () => {
        const t = get().token;
        return t ? decodeToken(t) : null;
      },

      initializeAuth: async () => {
        try {
          const token = get().token;
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

          if (!isExpired(token)) {
            const currentUser = get().user;
            set({
              user: currentUser ?? {
                id: payload.userId,
                email: payload.email,
                name: payload.name ?? payload.email,
                role: payload.role,
              },
              isAuthenticated: true,
              isLoading: false,
            });
            if (__DEV__) console.log('✅ Auth restored from storage');
            return;
          }

          // Token expired — restore session anyway, interceptor will refresh on first request
          if (!refreshToken) {
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const currentUser = get().user;
          set({
            user: currentUser ?? {
              id: payload.userId,
              email: payload.email,
              name: payload.name ?? payload.email,
              role: payload.role,
            },
            isAuthenticated: true,
            isLoading: false,
          });
          if (__DEV__) console.log('⏰ Token expired — session restored, interceptor will refresh');
        } catch {
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
        // If we have a valid persisted session, skip the loading spinner
        if (state?.token && state?.user) {
          state.isLoading = false;
        }
      },
    }
  )
);

// ── Selectors ──────────────────────────────────────────────────────────────

export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useUser             = () => useAuthStore((s) => s.user);
export const useToken            = () => useAuthStore((s) => s.token);
export const useIsLoading        = () => useAuthStore((s) => s.isLoading);
export const useTenantSuspended  = () => useAuthStore((s) => s.tenantSuspended);
export const useTenantStatus     = () => useAuthStore((s) => s.tenantStatus);
export const useIsAdmin          = () =>
  useAuthStore((s) => s.user?.role === 'SUPER_ADMIN' || s.user?.role === 'TENANT_ADMIN');
