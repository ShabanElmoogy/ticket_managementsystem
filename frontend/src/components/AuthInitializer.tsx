import React, { useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthInitializerProps {
  children: ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
};