import { Box, TextField, Button, Alert, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface LoginFormFieldsProps {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginFormFields: React.FC<LoginFormFieldsProps> = ({
  email, password, showPassword, error, loading,
  onEmailChange, onPasswordChange, onTogglePassword, onSubmit,
}) => (
  <Box component="form" onSubmit={onSubmit} noValidate>
    <TextField
      fullWidth
      label="Email address"
      type="email"
      value={email}
      onChange={(e) => onEmailChange(e.target.value)}
      margin="normal"
      required
      autoFocus
      disabled={loading}
    />
    <TextField
      fullWidth
      label="Password"
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={(e) => onPasswordChange(e.target.value)}
      margin="normal"
      required
      disabled={loading}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={onTogglePassword} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <Button
      type="submit"
      fullWidth
      variant="contained"
      size="large"
      disabled={loading}
      sx={{
        mt: 3, mb: 2, py: 1.5,
        textTransform: 'none', fontWeight: 700, fontSize: '1rem',
        background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
        boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
        '&:hover': {
          background: 'linear-gradient(45deg, #1565c0, #7b1fa2)',
          boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.3s ease',
      }}
    >
      {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in to Dashboard'}
    </Button>
  </Box>
);

export default LoginFormFields;
