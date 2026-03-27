import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';

interface AuthInitializerProps {
  children: ReactNode;
}

/**
 * AuthInitializer Component
 * 
 * Responsibilities:
 * 1. Initialize authentication from localStorage on app mount
 * 2. Sync token to API client whenever it changes
 * 3. Ensure all requests include the Authorization header
 */
export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const init = async () => {
      if (import.meta.env.DEV) {
        console.log('🔄 AuthInitializer mounted, initializing auth from localStorage...');
      }
      await initializeAuth();
    };
    init();
  }, [initializeAuth]);

  // Sync token to API client whenever it changes
  // This ensures all requests include the Authorization header
  useEffect(() => {
    if (token) {
      // Set token in axios default headers
      api.setAuthToken(token);
      
      if (import.meta.env.DEV) {
        console.log('✅ Token synced to API client', {
          tokenLength: token.length,
          userEmail: user?.email,
          isAuthenticated,
          expiresIn: Math.round((JSON.parse(atob(token.split('.')[1])).exp - Date.now() / 1000) / 60) + ' minutes',
        });
      }
    } else {
      // Clear token from axios default headers
      api.clearAuthToken();
      
      if (import.meta.env.DEV) {
        console.log('🚪 Token cleared from API client');
      }
    }
  }, [token, user, isAuthenticated]);

  return <>{children}</>;
};
