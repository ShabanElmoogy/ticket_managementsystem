import { Box, Card, CardContent, Stack, Typography, Chip, FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material';
import type { Tenant } from '../../../services/api';
import DemoLoginSection from './DemoLoginSection';

interface LoginCardProps {
  loading: boolean;
  isSystemLogin: boolean;
  tenantSlug: string;
  tenants: Tenant[];
  tenantsLoading: boolean;
  onToggleSystemLogin: () => void;
  onTenantChange: (slug: string) => void;
  onDemoLogin: (email: string, password: string, options?: { tenantSlug?: string | null }) => void;
}

const LoginCard: React.FC<LoginCardProps> = ({
  loading, isSystemLogin, tenantSlug, tenants, tenantsLoading,
  onToggleSystemLogin, onTenantChange, onDemoLogin,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 6 } }}>
    <Card
      elevation={0}
      sx={{
        width: '100%', maxWidth: 440, borderRadius: 4, p: 1,
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)',
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
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.5, fontWeight: 600 }}>
            Welcome back
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{
            background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Sign in to TicketFlow
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, textAlign: 'center' }}>
            Access your professional ticket management dashboard
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Chip
            label={isSystemLogin ? 'System login (SUPER_ADMIN)' : 'Tenant login'}
            color={isSystemLogin ? 'primary' : 'default'}
            variant={isSystemLogin ? 'filled' : 'outlined'}
            onClick={onToggleSystemLogin}
            disabled={loading}
            sx={{ cursor: loading ? 'default' : 'pointer' }}
          />
          <Typography variant="caption" color="text.secondary">
            {isSystemLogin ? 'Tenant context will be cleared.' : 'Provide tenant slug for tenant-scoped users.'}
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
            onChange={(e) => onTenantChange(e.target.value)}
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
            {isSystemLogin ? 'Disabled for system login.' : 'Required for tenant users (TENANT_ADMIN / EMPLOYEE).'}
          </Typography>
        </FormControl>

        <Divider sx={{ my: 2 }}>or</Divider>

        <DemoLoginSection
          tenantSlug={tenantSlug}
          tenants={tenants}
          loading={loading}
          onDemoLogin={onDemoLogin}
        />
      </CardContent>
    </Card>
  </Box>
);

export default LoginCard;
