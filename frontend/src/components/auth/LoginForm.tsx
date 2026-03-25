import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Divider,
  Stack,
  Chip,
  Avatar,
  Snackbar,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as ContentCopyIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonOutline as PersonOutlineIcon,
  Assignment as AssignmentIcon,
  SupportAgent as SupportAgentIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { authApi, tenantsApi, type Tenant } from '../../services/api';

const LoginForm: React.FC = () => {
  const [tenantSlug, setTenantSlug] = useState('');
  const [isSystemLogin, setIsSystemLogin] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const { login } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();

  // Load tenants for the dropdown on mount
  useEffect(() => {
    setTenantsLoading(true);
    tenantsApi.listPublic()
      .then(setTenants)
      .catch(() => setTenants([]))
      .finally(() => setTenantsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Best practice (multi-tenant):
      // - System/SUPER_ADMIN login must be global and must not send tenant context.
      // - Tenant users (TENANT_ADMIN/EMPLOYEE) are tenant-scoped and should send tenant context.
      //
      // Use an explicit toggle instead of inferring from an empty tenant field.
      // This avoids accidental tenant leakage from previous sessions.
      const normalizedTenant = tenantSlug.trim().toLowerCase();
      if (isSystemLogin) {
        localStorage.removeItem('tenantSlug');
      } else if (normalizedTenant) {
        localStorage.setItem('tenantSlug', normalizedTenant);
      } else {
        // Strict behavior: do not reuse a previous tenant.
        localStorage.removeItem('tenantSlug');
      }

      const response = await authApi.login({ email, password });

      // Persist tenant context returned by backend (best practice)
      // This ensures tenant-scoped pages (like Users grid) always have X-Tenant-Slug.
      const responseTenantSlug = (response as any)?.tenant?.slug || (response as any)?.user?.tenantSlug;
      if (responseTenantSlug) {
        localStorage.setItem('tenantSlug', String(responseTenantSlug));
      }

      login(response.user, response.token, response.refreshToken);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (
    demoEmail: string,
    demoPassword: string,
    options?: { tenantSlug?: string | null }
  ) => {
    const demoTenant = (options?.tenantSlug ?? '').trim().toLowerCase();

    setIsSystemLogin(!demoTenant);
    setTenantSlug(demoTenant);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');

    try {
    if (!demoTenant) {
    localStorage.removeItem('tenantSlug');
    } else {
    localStorage.setItem('tenantSlug', demoTenant);
    }

      const response = await authApi.login({ email: demoEmail, password: demoPassword });

      const responseTenantSlug = (response as any)?.tenant?.slug || (response as any)?.user?.tenantSlug;
      if (responseTenantSlug) {
        localStorage.setItem('tenantSlug', String(responseTenantSlug));
      }

      login(response.user, response.token, response.refreshToken);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const copyCreds = async (email: string, password: string) => {
    try {
      await navigator.clipboard.writeText(`${email} / ${password}`);
      setSnack('Credentials copied to clipboard');
    } catch {
      setSnack('Could not copy credentials');
    }
  };

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
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Theme toggle */}
      <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: (t) => (t.palette.mode === 'dark' ? '#fff' : '#111'),
            backdropFilter: 'blur(6px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
          }}
        >
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>

      {/* Left panel with branding / illustration */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box sx={{
          position: 'absolute',
          width: 350,
          height: 350,
          top: 20,
          left: 60,
          bgcolor: 'primary.main',
          filter: 'blur(100px)',
          borderRadius: '50%',
          opacity: 0.15,
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }} />
        <Box sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          bottom: 20,
          right: 40,
          bgcolor: 'warning.main',
          filter: 'blur(120px)',
          borderRadius: '50%',
          opacity: 0.12,
          animation: 'float 8s ease-in-out infinite reverse',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          },
        }} />

        {/* Floating ticket icons */}
        <Box sx={{
          position: 'absolute',
          top: '30%',
          left: '15%',
          animation: 'bounce 4s ease-in-out infinite',
          '@keyframes bounce': {
            '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
            '40%': { transform: 'translateY(-10px)' },
            '60%': { transform: 'translateY(-5px)' },
          },
        }}>
          <AssignmentIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.6)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
        </Box>
        <Box sx={{
          position: 'absolute',
          bottom: '25%',
          right: '20%',
          animation: 'bounce 5s ease-in-out infinite 1s',
          '@keyframes bounce': {
            '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
            '40%': { transform: 'translateY(-10px)' },
            '60%': { transform: 'translateY(-5px)' },
          },
        }}>
          <SupportAgentIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.5)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
        </Box>

        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <AssignmentIcon sx={{
              fontSize: 80,
              color: 'primary.main',
              filter: 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.3))'
            }} />
            <SupportAgentIcon sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              fontSize: 32,
              color: 'secondary.main',
              bgcolor: 'background.paper',
              borderRadius: '50%',
              p: 0.5,
              boxShadow: 2
            }} />
          </Box>
          <Typography variant="h3" fontWeight={800} sx={{ mt: 3, background: 'linear-gradient(45deg, #1976d2, #9c27b0)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TicketFlow Pro
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', mt: 2, lineHeight: 1.6 }}>
            Professional ticket management system with real-time collaboration, advanced analytics, and seamless workflow automation.
          </Typography>

          {/* Feature highlights */}
          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <DashboardIcon sx={{ fontSize: 28, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Dashboard
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <TimelineIcon sx={{ fontSize: 28, color: 'secondary.main', mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Kanban
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 28, color: 'warning.main', mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Alerts
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Right panel: login card */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 6 } }}>
        <Card
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            borderRadius: 4,
            p: 1,
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)'),
            border: (t) => `1px solid ${t.palette.divider}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(20px)',
            animation: 'slideInFromRight 700ms ease-out',
            '@keyframes slideInFromRight': {
              from: { opacity: 0, transform: 'translateX(30px)' },
              to: { opacity: 1, transform: 'translateX(0)' },
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
            },
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.5, fontWeight: 600 }}>Welcome back</Typography>
              <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(45deg, #1976d2, #9c27b0)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sign in to TicketFlow
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, textAlign: 'center' }}>
                Access your professional ticket management dashboard
              </Typography>
            </Stack>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Chip
                  label={isSystemLogin ? 'System login (SUPER_ADMIN)' : 'Tenant login'}
                  color={isSystemLogin ? 'primary' : 'default'}
                  variant={isSystemLogin ? 'filled' : 'outlined'}
                  onClick={() => setIsSystemLogin((v) => !v)}
                  disabled={loading}
                  sx={{ cursor: loading ? 'default' : 'pointer' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {isSystemLogin
                    ? 'Tenant context will be cleared.'
                    : 'Provide tenant slug for tenant-scoped users.'}
                </Typography>
              </Stack>

              <FormControl fullWidth margin="normal" disabled={loading || isSystemLogin}>
                <InputLabel id="tenant-select-label">
                  {tenantsLoading ? 'Loading tenants…' : 'Tenant'}
                </InputLabel>
                <Select
                  labelId="tenant-select-label"
                  label={tenantsLoading ? 'Loading tenants…' : 'Tenant'}
                  value={tenantSlug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    setTenantSlug(slug);
                    const found = tenants.find((t) => t.slug === slug);
                    if (found?.adminEmail) setEmail(found.adminEmail);
                  }}
                  displayEmpty={false}
                >
                  {tenants.map((t) => (
                    <MenuItem key={t.id} value={t.slug}>
                      {t.name}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({t.slug}){t.adminEmail ? ` — ${t.adminEmail}` : ''}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                  {isSystemLogin
                    ? 'Disabled for system login.'
                    : 'Required for tenant users (TENANT_ADMIN / EMPLOYEE).'}
                </Typography>
              </FormControl>

              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={() => setShowPassword((s) => !s)} aria-label="toggle password visibility">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in to Dashboard'}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }}>or</Divider>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
                Quick demo login
              </Typography>

              <Stack spacing={2} sx={{ mt: 1 }}>
                {/* Admin demo card */}
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                      borderColor: 'primary.main',
                    },
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)',
                  }}
                  onClick={() => handleDemoLogin('manager@company.com', 'shabanelmogy', { tenantSlug: 'default' })}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <AdminPanelSettingsIcon />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          System Administrator
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          manager@company.com
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label="Admin" size="small" color="primary" variant="filled" />
                        <Tooltip title="Copy credentials">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCreds('manager@company.com', 'shabanelmogy');
                            }}
                            disabled={loading}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Employee demo card */}
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                      borderColor: 'secondary.main',
                    },
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.08)' : 'rgba(156, 39, 176, 0.04)',
                  }}
                  onClick={() => handleDemoLogin('john@company.com', 'employee123', { tenantSlug: 'default' })}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                        <PersonOutlineIcon />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          Support Agent
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          john@company.com
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label="Employee" size="small" color="secondary" variant="filled" />
                        <Tooltip title="Copy credentials">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCreds('john@company.com', 'employee123');
                            }}
                            disabled={loading}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
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