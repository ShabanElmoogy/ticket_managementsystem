import React from 'react';
import { Box, IconButton, Tooltip, Snackbar } from '@mui/material';
import { LightMode as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';
import { useLoginForm } from '../hook/useLoginForm';
import LoginBranding from './LoginBranding';
import LoginCard from './LoginCard';

const LoginForm: React.FC = () => {
  const {
    loading,
    snack, setSnack,
    isSystemLogin, setIsSystemLogin,
    tenantSlug, tenants, tenantsLoading,
    mode, toggleTheme,
    handleTenantChange, handleDemoLogin,
  } = useLoginForm();

  return (
    <>
      <Box
        minHeight="100vh"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          position: 'relative',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 60%, #1f2937 100%)'
            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #f59e0b 60%, #f0f9ff 100%)',
          '&::before': {
            content: '""',
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton
            onClick={toggleTheme}
            sx={{
              position: 'absolute', top: 16, right: 16,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: (t) => t.palette.mode === 'dark' ? '#fff' : '#111',
              backdropFilter: 'blur(6px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        <LoginBranding />

        <LoginCard
          loading={loading}
          isSystemLogin={isSystemLogin}
          tenantSlug={tenantSlug}
          tenants={tenants}
          tenantsLoading={tenantsLoading}
          onToggleSystemLogin={() => setIsSystemLogin((v) => !v)}
          onTenantChange={handleTenantChange}
          onDemoLogin={handleDemoLogin}
        />
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={2000}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default LoginForm;
