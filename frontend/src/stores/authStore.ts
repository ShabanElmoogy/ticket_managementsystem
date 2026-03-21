import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth Store - Centralized authentication state management
 * Features:
 * - JWT token storage and validation
 * - User information caching
 * - Token expiration checking
 * - Safe token decoding with error handling
 * - Persistent storage with Zustand
 */

// ============================================================================
// Types
// ============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EMPLOYEE';
  phone?: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'EMPLOYEE';
  exp: number;
  iat: number;
  iss?: string;
  sub?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, authToken: string, refreshToken?: string) => void;
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

/**
 * Safely decode JWT token without verification
 * Returns null if token is invalid
 */
function decodeToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format: expected 3 parts');
      return null;
    }

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Validate required fields
    if (!payload.userId || !payload.email || !payload.role) {
      console.warn('Token missing required fields');
      return null;
    }

    return payload as TokenPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) {
    return true;
  }

  const currentTime = Date.now() / 1000;
  const expiresIn = payload.exp - currentTime;

  // Consider token expired if less than 1 minute remaining
  return expiresIn < 60;
}

/**
 * Get time until token expiration in seconds
 */
function getTokenExpiresIn(token: string): number {
  const payload = decodeToken(token);
  if (!payload) {
    return 0;
  }

  const currentTime = Date.now() / 1000;
  return Math.max(0, payload.exp - currentTime);
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

      /**
       * Login - Set user and token
       */
      login: (userData: User, authToken: string, refreshToken?: string) => {
        // Validate token before storing
        const payload = decodeToken(authToken);
        if (!payload) {
          console.error('Invalid token received during login');
          return;
        }

        // Store tokens in localStorage
        localStorage.setItem('token', authToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Update store
        set({
          user: userData,
          token: authToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          isLoading: false,
        });

        if (import.meta.env.DEV) {
          console.log('✅ User logged in:', userData.email);
        }
      },

      /**
       * Logout - Clear user and token
       */
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });

        if (import.meta.env.DEV) {
          console.log('🚪 User logged out');
        }
      },

      /**
       * Set access token
       */
      setToken: (token: string) => {
        localStorage.setItem('token', token);
        set({ token });
      },

      /**
       * Set refresh token
       */
      setRefreshToken: (refreshToken: string) => {
        localStorage.setItem('refreshToken', refreshToken);
        set({ refreshToken });
      },

      /**
       * Set loading state
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Update user information
       */
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              ...userData,
            },
          });
        }
      },

      /**
       * Check if current token is expired
       */
      isTokenExpired: () => {
        const token = get().token;
        return token ? isTokenExpired(token) : true;
      },

      /**
       * Get decoded token payload
       */
      getTokenPayload: () => {
        const token = get().token;
        return token ? decodeToken(token) : null;
      },

      /**
       * Initialize authentication from stored token
       */
      initializeAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');

          if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          // Decode and validate token
          const payload = decodeToken(token);
          if (!payload) {
            // Invalid token, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          // Check if token is expired
          if (isTokenExpired(token)) {
            // Token expired, try to refresh if refresh token exists
            if (refreshToken) {
              try {
                if (import.meta.env.DEV) {
                  console.log('⏰ Token expired, attempting refresh...');
                }

                // Use axios directly to avoid circular dependency and protected method issues
                const axios = (await import('axios')).default;
                const apiUrl = import.meta.env.PROD ? '/api/auth/refresh' : 'https://localhost:3001/api/auth/refresh';
                const response = await axios.post(apiUrl, { refreshToken });
                const responseData = response.data as any;

                const newToken = responseData.token;
                const newRefreshToken = responseData.refreshToken;

                // Update localStorage
                localStorage.setItem('token', newToken);
                if (newRefreshToken) {
                  localStorage.setItem('refreshToken', newRefreshToken);
                }

                // Decode new token
                const newPayload = decodeToken(newToken);
                if (!newPayload) {
                  throw new Error('Invalid refreshed token');
                }

                // Update store
                const expiresIn = getTokenExpiresIn(newToken);
                set({
                  user: responseData.user,
                  token: newToken,
                  refreshToken: newRefreshToken || refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
                });

                if (import.meta.env.DEV) {
                  console.log(
                    `✅ Auth initialized with refresh. Token expires in ${Math.round(expiresIn / 60)} minutes`
                  );
                }
                return;
              } catch (refreshError) {
                console.error('Refresh failed during initialization:', refreshError);
                // Refresh failed, clear tokens
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                set({ isAuthenticated: false, isLoading: false });
                return;
              }
            } else {
              // No refresh token, clear token
              localStorage.removeItem('token');
              set({ isAuthenticated: false, isLoading: false });

              if (import.meta.env.DEV) {
                console.warn('⏰ Token expired and no refresh token available');
              }
              return;
            }
          }

          // Token is valid, restore user session
          const expiresIn = getTokenExpiresIn(token);
          set({
            user: {
              id: payload.userId,
              email: payload.email,
              name: payload.email, // Name not in token, use email as fallback
              role: payload.role,
            },
            token,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
          });

          if (import.meta.env.DEV) {
            console.log(
              `✅ Auth initialized. Token expires in ${Math.round(expiresIn / 60)} minutes`
            );
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
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
      }),
    }
  )
);

// ============================================================================
// Selectors (for convenience)
// ============================================================================

export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsAdmin = () =>
  useAuthStore(
    (state) => state.user?.role === 'SUPER_ADMIN' || state.user?.role === 'TENANT_ADMIN'
  );
