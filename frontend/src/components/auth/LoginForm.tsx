import React, { useState } from 'react';
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
  Snackbar
} from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RocketLaunch as RocketLaunchIcon,
  ContentCopy as ContentCopyIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { apiService } from '../../services/api';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const { login } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.login({ email, password });
      login(response.user, response.token);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');

    try {
      const response = await apiService.login({ email: demoEmail, password: demoPassword });
      login(response.user, response.token);
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
          ? 'linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)'
          : 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 60%, #f0f9ff 100%)',
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
        {/* Decorative blobs */}
        <Box sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          top: 40,
          left: 80,
          bgcolor: 'primary.main',
          filter: 'blur(80px)',
          borderRadius: '50%',
          opacity: 0.25,
        }} />
        <Box sx={{
          position: 'absolute',
          width: 280,
          height: 280,
          bottom: 40,
          right: 60,
          bgcolor: 'secondary.main',
          filter: 'blur(90px)',
          borderRadius: '50%',
          opacity: 0.25,
        }} />

        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <RocketLaunchIcon sx={{ fontSize: 72, color: 'primary.main' }} />
          <Typography variant="h3" fontWeight={800} sx={{ mt: 2 }}>
            Ticket Management
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', mt: 1 }}>
            Streamline your support workflow with real‑time updates, Kanban boards and notifications.
          </Typography>
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
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)'),
            border: (t) => `1px solid ${t.palette.divider}`,
            boxShadow: (t) => t.shadows[8],
            backdropFilter: 'blur(10px)',
            animation: 'fadeInUp 600ms ease',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(8px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="overline" color="primary">Welcome back</Typography>
              <Typography variant="h4" fontWeight={700}>Sign in</Typography>
              <Typography variant="body2" color="text.secondary">Use your credentials to access dashboard</Typography>
            </Stack>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
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
                sx={{ mt: 3, mb: 2, py: 1.2, textTransform: 'none', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
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
                  onClick={() => handleDemoLogin('admin@company.com', 'admin123')}
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
                          admin@company.com
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label="Admin" size="small" color="primary" variant="filled" />
                        <Tooltip title="Copy credentials">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCreds('admin@company.com', 'admin123');
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
                  onClick={() => handleDemoLogin('john@company.com', 'employee123')}
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