import { Box, Typography, Stack, Card, CardContent, Avatar, Chip, Button } from '@mui/material';
import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonOutline as PersonOutlineIcon,
  SupportAgent as SupportAgentIcon,
} from '@mui/icons-material';
import type { Tenant } from '../../../services/api';

interface DemoLoginSectionProps {
  tenantSlug: string;
  tenants: Tenant[];
  loading: boolean;
  onDemoLogin: (email: string, password: string, options?: { tenantSlug?: string | null }) => void;
}

const DemoLoginSection: React.FC<DemoLoginSectionProps> = ({ tenantSlug, tenants, loading, onDemoLogin }) => {
  const tenant = tenants.find((t) => t.slug === tenantSlug);

  const tenantRoles = tenant
    ? [
        { label: 'Admin',      email: tenant.adminEmail,      color: 'primary'   as const, icon: <AdminPanelSettingsIcon /> },
        { label: 'Employee',   email: tenant.employeeEmail,   color: 'secondary' as const, icon: <PersonOutlineIcon /> },
        { label: 'Programmer', email: tenant.programmerEmail, color: 'warning'   as const, icon: <SupportAgentIcon /> },
      ].filter((r) => r.email)
    : [];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ textAlign: 'center' }}>
        Quick demo login
      </Typography>

      {tenantSlug && tenantRoles.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }} justifyContent="center">
          {tenantRoles.map((r) => (
            <Button
              key={r.label}
              variant="outlined"
              color={r.color}
              size="small"
              startIcon={r.icon}
              disabled={loading}
              onClick={() => onDemoLogin(r.email!, 'password123', { tenantSlug })}
              sx={{ textTransform: 'none', fontWeight: 600, flex: 1 }}
            >
              {r.label}
            </Button>
          ))}
        </Stack>
      )}

      <Stack spacing={2} sx={{ mt: 1 }}>
        <Card
          variant="outlined"
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 4, borderColor: 'primary.main' },
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)',
          }}
          onClick={() => onDemoLogin('manager@company.com', 'shabanelmogy')}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <AdminPanelSettingsIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>System Administrator</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>manager@company.com</Typography>
              </Box>
              <Chip label="Admin" size="small" color="primary" variant="filled" />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default DemoLoginSection;
