import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Send as SendIcon
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappNotifications: boolean;
  role: string;
  createdAt: string;
}

const WhatsAppUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Get API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    user: User | null;
    phone: string;
  }>({
    open: false,
    user: null,
    phone: ''
  });
  const [testDialog, setTestDialog] = useState<{
    open: boolean;
    user: User | null;
    message: string;
  }>({
    open: false,
    user: null,
    message: 'Hello! This is a test message from the ticket management system.'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/users`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhone = (user: User) => {
    setEditDialog({
      open: true,
      user,
      phone: user.phone || ''
    });
  };

  const handleSavePhone = async () => {
    if (!editDialog.user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/users/${editDialog.user.id}/phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: editDialog.phone })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Phone number updated successfully');
        setUsers(users.map(u => 
          u.id === editDialog.user!.id 
            ? { ...u, phone: editDialog.phone }
            : u
        ));
        setEditDialog({ open: false, user: null, phone: '' });
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (user: User) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/users/${user.id}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !user.whatsappNotifications })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`WhatsApp notifications ${!user.whatsappNotifications ? 'enabled' : 'disabled'}`);
        setUsers(users.map(u => 
          u.id === user.id 
            ? { ...u, whatsappNotifications: !user.whatsappNotifications }
            : u
        ));
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNumber = async (phone: string) => {
    if (!phone) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/check-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to check number');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = (user: User) => {
    setTestDialog({
      open: true,
      user,
      message: 'Hello! This is a test message from the ticket management system.'
    });
  };

  const handleSendTestMessage = async () => {
    if (!testDialog.user || !testDialog.user.phone) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: testDialog.user.phone, 
          message: testDialog.message 
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Test message sent successfully');
        setTestDialog({ open: false, user: null, message: '' });
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to send test message');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' ? 'error' : 'primary';
  };

  const getPhoneStatus = (user: User) => {
    if (!user.phone) {
      return <Chip label="No Phone" color="default" size="small" />;
    }
    if (!user.whatsappNotifications) {
      return <Chip label="Disabled" color="warning" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                  <WhatsAppIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  WhatsApp User Management
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchUsers}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Manage user phone numbers and WhatsApp notification preferences. Users need valid phone numbers to receive WhatsApp notifications for tickets.
              </Typography>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Phone Number</TableCell>
                      <TableCell>WhatsApp Status</TableCell>
                      <TableCell>Notifications</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2">{user.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={getRoleColor(user.role)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {user.phone ? (
                              <>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2">{user.phone}</Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not set
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getPhoneStatus(user)}
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={user.whatsappNotifications}
                                onChange={() => handleToggleNotifications(user)}
                                disabled={!user.phone || loading}
                              />
                            }
                            label=""
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Phone Number">
                              <IconButton
                                size="small"
                                onClick={() => handleEditPhone(user)}
                                disabled={loading}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            {user.phone && (
                              <>
                                <Tooltip title="Check WhatsApp">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCheckNumber(user.phone!)}
                                    disabled={loading}
                                  >
                                    <CheckIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Send Test Message">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTestMessage(user)}
                                    disabled={loading || !user.whatsappNotifications}
                                  >
                                    <SendIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Phone Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null, phone: '' })}>
        <DialogTitle>Edit Phone Number</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update phone number for {editDialog.user?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Phone Number"
            type="tel"
            fullWidth
            variant="outlined"
            value={editDialog.phone}
            onChange={(e) => setEditDialog({ ...editDialog, phone: e.target.value })}
            placeholder="+1234567890"
            helperText="Include country code (e.g., +1 for US, +91 for India)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null, phone: '' })}>
            Cancel
          </Button>
          <Button onClick={handleSavePhone} variant="contained" disabled={loading}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Message Dialog */}
      <Dialog open={testDialog.open} onClose={() => setTestDialog({ open: false, user: null, message: '' })}>
        <DialogTitle>Send Test Message</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Send a test WhatsApp message to {testDialog.user?.name} ({testDialog.user?.phone})
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Test Message"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={testDialog.message}
            onChange={(e) => setTestDialog({ ...testDialog, message: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog({ open: false, user: null, message: '' })}>
            Cancel
          </Button>
          <Button onClick={handleSendTestMessage} variant="contained" disabled={loading}>
            Send Test Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppUsersPage;