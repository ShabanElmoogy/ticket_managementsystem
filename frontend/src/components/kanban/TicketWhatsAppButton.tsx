import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

interface TicketWhatsAppButtonProps {
  ticket: {
    id: string;
    title: string;
    priority?: string;
    status?: string;
    assignedTo?: {
      name: string;
      phone?: string;
    };
    customer?: {
      name: string;
      phone?: string;
    };
    createdBy?: {
      name: string;
      phone?: string;
    };
  };
  defaultRecipient?: 'assignee' | 'customer' | 'creator';
  size?: 'small' | 'medium' | 'large';
  onSent?: (result: any) => void;
  onError?: (error: string) => void;
}

const TicketWhatsAppButton: React.FC<TicketWhatsAppButtonProps> = ({
  ticket,
  defaultRecipient = 'assignee',
  size = 'small',
  onSent,
  onError,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{ isReady: boolean } | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
    notificationType: 'updated'
  });
  const [error, setError] = useState<string | null>(null);

  // Get default phone number based on recipient type
  const getDefaultPhone = () => {
    switch (defaultRecipient) {
      case 'assignee':
        return ticket.assignedTo?.phone || '';
      case 'customer':
        return ticket.customer?.phone || '';
      case 'creator':
        return ticket.createdBy?.phone || '';
      default:
        return '';
    }
  };

  // Generate default message
  const generateDefaultMessage = () => {
    return `🎫 *Ticket Update*\n\n` +
           `*ID:* ${ticket.id}\n` +
           `*Title:* ${ticket.title}\n` +
           `*Priority:* ${ticket.priority || 'Normal'}\n` +
           `*Status:* ${ticket.status || 'Open'}\n\n` +
           `Please check the ticket management system for more details.`;
  };

  const handleClick = async () => {
    // Check WhatsApp status first
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
      const data = await response.json();
      
      if (data.success) {
        setWhatsappStatus(data.status);
        
        if (!data.status.isReady) {
          setError('WhatsApp is not connected. Please connect WhatsApp first from the WhatsApp Test page.');
          return;
        }
      } else {
        setError('WhatsApp service is not available.');
        return;
      }
    } catch (error) {
      setError('Failed to check WhatsApp status. Make sure the backend service is running.');
      return;
    }

    // Initialize form data
    setFormData({
      phone: getDefaultPhone(),
      message: generateDefaultMessage(),
      notificationType: 'updated'
    });
    
    setOpen(true);
    setError(null);
  };

  const sendMessage = async () => {
    if (!formData.phone || !formData.message) {
      setError('Phone number and message are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.phone,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
        onSent?.(data.result);
      } else {
        setError(data.message);
        onError?.(data.message);
      }
    } catch (error) {
      const errorMessage = 'Failed to send WhatsApp message';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendTicketNotification = async () => {
    if (!formData.phone) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketData: {
            id: ticket.id,
            title: ticket.title,
            priority: ticket.priority,
            status: ticket.status,
            assignee: ticket.assignedTo?.name,
            customer: ticket.customer?.name,
          },
          recipients: [
            { name: 'User', phone: formData.phone }
          ],
          notificationType: formData.notificationType
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
        onSent?.(data);
      } else {
        setError(data.message);
        onError?.(data.message);
      }
    } catch (error) {
      const errorMessage = 'Failed to send ticket notification';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  // Don't show button if no potential recipients
  const hasRecipients = ticket.assignedTo?.phone || ticket.customer?.phone || ticket.createdBy?.phone;
  
  if (!hasRecipients) {
    return null;
  }

  return (
    <>
      <Tooltip title="Send WhatsApp Message">
        <IconButton
          onClick={handleClick}
          size={size}
          sx={{ 
            color: '#25D366',
            '&:hover': {
              backgroundColor: 'rgba(37, 211, 102, 0.1)',
            }
          }}
        >
          <WhatsAppIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WhatsAppIcon sx={{ color: '#25D366' }} />
            Send WhatsApp Message
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {whatsappStatus && !whatsappStatus.isReady && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              WhatsApp is not connected. Please connect WhatsApp first from the WhatsApp Test page.
            </Alert>
          )}

          <Box sx={{ pt: 1 }}>
            {/* Ticket Info */}
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ticket Information
              </Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {ticket.id}
              </Typography>
              <Typography variant="body2">
                <strong>Title:</strong> {ticket.title}
              </Typography>
              <Typography variant="body2">
                <strong>Priority:</strong> {ticket.priority || 'Normal'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {ticket.status || 'Open'}
              </Typography>
            </Box>

            {/* Quick recipient selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Select Recipient
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {ticket.assignedTo?.phone && (
                  <Chip
                    label={`Assignee: ${ticket.assignedTo.name}`}
                    onClick={() => setFormData(prev => ({ ...prev, phone: ticket.assignedTo?.phone || '' }))}
                    variant={formData.phone === ticket.assignedTo.phone ? 'filled' : 'outlined'}
                    size="small"
                  />
                )}
                {ticket.customer?.phone && (
                  <Chip
                    label={`Customer: ${ticket.customer.name}`}
                    onClick={() => setFormData(prev => ({ ...prev, phone: ticket.customer?.phone || '' }))}
                    variant={formData.phone === ticket.customer.phone ? 'filled' : 'outlined'}
                    size="small"
                  />
                )}
                {ticket.createdBy?.phone && (
                  <Chip
                    label={`Creator: ${ticket.createdBy.name}`}
                    onClick={() => setFormData(prev => ({ ...prev, phone: ticket.createdBy?.phone || '' }))}
                    variant={formData.phone === ticket.createdBy.phone ? 'filled' : 'outlined'}
                    size="small"
                  />
                )}
              </Box>
            </Box>

            <TextField
              label="Phone Number"
              placeholder="+1234567890"
              fullWidth
              margin="normal"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              helperText="Include country code (e.g., +1 for US/Canada)"
            />

            <TextField
              label="Message"
              multiline
              rows={6}
              fullWidth
              margin="normal"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Type your message here..."
            />

            <Typography variant="caption" color="text.secondary">
              Message will be sent via WhatsApp Web integration
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={sendTicketNotification}
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            disabled={loading || !formData.phone || !whatsappStatus?.isReady}
            sx={{ mr: 1 }}
          >
            Send Formatted Notification
          </Button>
          <Button
            onClick={sendMessage}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            disabled={loading || !formData.phone || !formData.message || !whatsappStatus?.isReady}
            sx={{
              backgroundColor: '#25D366',
              '&:hover': {
                backgroundColor: '#128C7E',
              },
            }}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketWhatsAppButton;