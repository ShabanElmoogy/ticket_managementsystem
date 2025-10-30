import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,

      login: (userData: User, authToken: string) => {
        set({ user: userData, token: authToken });
        localStorage.setItem('token', authToken);
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Decode JWT token to get user info
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (payload.exp > currentTime) {
              set({
                user: {
                  id: payload.userId,
                  email: payload.email,
                  name: payload.name || payload.email,
                  role: payload.role
                },
                token,
                isLoading: false
              });
            } else {
              // Token expired
              localStorage.removeItem('token');
              set({ user: null, token: null, isLoading: false });
            }
          } catch (error) {
            console.error('Error decoding token:', error);
            localStorage.removeItem('token');
            set({ user: null, token: null, isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);