import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  type ChipProps,
} from '@mui/material';
import { Close as CloseIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useAuthStore } from '../../../stores/authStore';
import { profileApi, ticketsApi, type Ticket, type ReminderSettings } from '../../../services/api';

interface TicketReminderProps {
  onTicketClick: (ticket: Ticket) => void;
}

const TicketReminder: React.FC<TicketReminderProps> = ({ onTicketClick }) => {
  const { user, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReminderSettings>({ reminderEnabled: true, reminderInterval: 60 });
  const [tempSettings, setTempSettings] = useState<ReminderSettings>({ reminderEnabled: true, reminderInterval: 60 });

  // Load settings on mount
  useEffect(() => {
    if (!token || user?.role !== 'EMPLOYEE') return;

    const loadSettings = async () => {
      try {
        const reminderSettings = await profileApi.getReminderSettings();
        setSettings(reminderSettings);
        setTempSettings(reminderSettings);
      } catch (error) {
        console.error('Error loading reminder settings:', error);
      }
    };

    loadSettings();
  }, [token, user]);

  // Set up reminder interval
  useEffect(() => {
    if (!token || user?.role !== 'EMPLOYEE' || !settings.reminderEnabled) {
      console.log('TicketReminder: Skipping - token:', !!token, 'role:', user?.role, 'enabled:', settings.reminderEnabled);
      return;
    }

    const fetchDelayedTickets = async () => {
      try {
        console.log('TicketReminder: Fetching delayed tickets...');
        const delayedTickets = await ticketsApi.getDelayedTickets();
        console.log('TicketReminder: Found delayed tickets:', delayedTickets.length, delayedTickets);
        
        if (delayedTickets.length > 0) {
          setOpenTickets(delayedTickets);
          setOpen(true);
        }
      } catch (error) {
        console.error('Error fetching delayed tickets:', error);
      }
    };

    // Show immediately on mount
    fetchDelayedTickets();

    // Set up interval based on user settings
    const interval = setInterval(fetchDelayedTickets, settings.reminderInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, user, settings]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleTicketClick = (ticket: Ticket) => {
    onTicketClick(ticket);
    setOpen(false);
  };

  const handleSaveSettings = async () => {
    if (!token) return;
    
    try {
      const updatedSettings = await profileApi.updateReminderSettings(tempSettings);
      setSettings(updatedSettings);
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating reminder settings:', error);
    }
  };

  const getStatusColor = (status: string): ChipProps['color'] => {
    switch (status) {
      case 'OPEN': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'RESOLVED': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string): ChipProps['color'] => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  // Debug: Force show dialog (remove this in production)
  const forceShow = () => {
    setOpenTickets([{
      id: 'test',
      title: 'Test Delayed Ticket',
      status: 'OPEN',
      priority: 'HIGH',
      dueDate: new Date().toISOString(),
      customer: { name: 'Test Customer' },
      application: { name: 'Test App' }
    } as any]);
    setOpen(true);
  };

  return (
    <>
      {/* Debug Button - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={forceShow}
          style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, background: 'red', color: 'white' }}
        >
          Test Reminder
        </button>
      )}
      
      {/* Main Reminder Dialog */}
      <Dialog
        open={open && openTickets.length > 0}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          ⏰ Reminder: You have {openTickets.length} delayed ticket{openTickets.length > 1 ? 's' : ''}
          <Box>
            <IconButton onClick={() => setShowSettings(true)} size="small" sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Please complete these tickets to keep your workload up to date:
        </Typography>
        <List>
          {openTickets.map((ticket) => (
            <ListItem
              key={ticket.id}
              component="button"
              onClick={() => handleTicketClick(ticket)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                textAlign: 'left',
                backgroundColor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  boxShadow: 1,
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {ticket.title}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={ticket.status.replace('_', ' ')}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                      <Chip
                        label={ticket.priority}
                        color={getPriorityColor(ticket.priority)}
                        variant="outlined"
                        size="small"
                      />
                      {ticket.dueDate && (
                        <Chip
                          label={`Due: ${new Date(ticket.dueDate).toLocaleDateString()}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                      {ticket.customer && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          <strong>Customer:</strong> {ticket.customer.name}
                        </Typography>
                      )}
                      {ticket.application && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          <strong>Application:</strong> {ticket.application.name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reminder Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={tempSettings.reminderEnabled}
                  onChange={(e) => setTempSettings({ ...tempSettings, reminderEnabled: e.target.checked })}
                />
              }
              label="Enable ticket reminders"
            />
            
            <Divider sx={{ my: 2 }} />
            
            <TextField
              fullWidth
              label="Reminder interval (minutes)"
              type="number"
              value={tempSettings.reminderInterval}
              onChange={(e) => setTempSettings({ ...tempSettings, reminderInterval: parseInt(e.target.value) || 60 })}
              disabled={!tempSettings.reminderEnabled}
              helperText="How often to check for delayed tickets"
              inputProps={{ min: 1, max: 1440 }}
            />
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Reminders will show tickets that are overdue or haven't been updated within the specified interval.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketReminder;