import { Box, Typography, Stack } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  SupportAgent as SupportAgentIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

const LoginBranding: React.FC = () => (
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
    <Box sx={{
      position: 'absolute', width: 350, height: 350, top: 20, left: 60,
      bgcolor: 'primary.main', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.15,
      animation: 'float 6s ease-in-out infinite',
      '@keyframes float': { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
    }} />
    <Box sx={{
      position: 'absolute', width: 300, height: 300, bottom: 20, right: 40,
      bgcolor: 'warning.main', filter: 'blur(120px)', borderRadius: '50%', opacity: 0.12,
      animation: 'float 8s ease-in-out infinite reverse',
      '@keyframes float': { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } },
    }} />

    <Box sx={{
      position: 'absolute', top: '30%', left: '15%',
      animation: 'bounce 4s ease-in-out infinite',
      '@keyframes bounce': { '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-10px)' }, '60%': { transform: 'translateY(-5px)' } },
    }}>
      <AssignmentIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.6)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
    </Box>
    <Box sx={{
      position: 'absolute', bottom: '25%', right: '20%',
      animation: 'bounce 5s ease-in-out infinite 1s',
      '@keyframes bounce': { '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-10px)' }, '60%': { transform: 'translateY(-5px)' } },
    }}>
      <SupportAgentIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.5)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
    </Box>

    <Box sx={{ position: 'relative', textAlign: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <AssignmentIcon sx={{ fontSize: 80, color: 'primary.main', filter: 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.3))' }} />
        <SupportAgentIcon sx={{
          position: 'absolute', top: -8, right: -8, fontSize: 32,
          color: 'secondary.main', bgcolor: 'background.paper', borderRadius: '50%', p: 0.5, boxShadow: 2,
        }} />
      </Box>
      <Typography variant="h3" fontWeight={800} sx={{
        mt: 3,
        background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
        backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        TicketFlow Pro
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', mt: 2, lineHeight: 1.6 }}>
        Professional ticket management system with real-time collaboration, advanced analytics, and seamless workflow automation.
      </Typography>

      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <DashboardIcon sx={{ fontSize: 28, color: 'primary.main', mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary" display="block">Dashboard</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <TimelineIcon sx={{ fontSize: 28, color: 'secondary.main', mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary" display="block">Kanban</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 28, color: 'warning.main', mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary" display="block">Alerts</Typography>
        </Box>
      </Stack>
    </Box>
  </Box>
);

export default LoginBranding;
