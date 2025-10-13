import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import LoginForm from './auth/LoginForm';
import Dashboard from './dashboard/Dashboard';

const AppRouter: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return user ? <Dashboard /> : <LoginForm />;
};

export default AppRouter;