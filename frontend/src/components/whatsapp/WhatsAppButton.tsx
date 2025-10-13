import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
} from '@mui/icons-material';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  ticketData?: {
    id: string;
    title: string;
    priority?: string;
    status?: string;
  };
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onSent?: (result: any) => void;
  onError?: (error: string) => void;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '',
  message = '',
  ticketData,
  variant = 'button',
  size = 'medium',
  disabled = false,
  onSent,
  onError,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: phoneNumber,
    message: message || (ticketData ? generateTicketMessage(ticketData) : ''),
  });
  const [error, setError] = useState<string | null>(null);

  const generateTicketMessage = (ticket: any) => {
    return `🎫 *Ticket Update*\n\n` +
           `*ID:* ${ticket.id}\n` +
           `*Title:* ${ticket.title}\n` +
           `*Priority:* ${ticket.priority || 'Normal'}\n` +
           `*Status:* ${ticket.status || 'Open'}\n\n` +
           `Please check the ticket management system for more details.`;
  };

  const handleClick = () => {
    if (phoneNumber && message) {
      // Direct send if both phone and message are provided
      sendMessage();
    } else {
      // Open dialog for input
      setOpen(true);
    }
  };

  const sendMessage = async () => {
    if (!formData.phone || !formData.message) {
      setError('Phone number and message are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.API_BASE_URL}/whatsapp/send-message`, {
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

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const ButtonComponent = variant === 'icon' ? (
    <Tooltip title="Send WhatsApp Message">
      <IconButton
        onClick={handleClick}
        disabled={disabled}
        size={size}
        sx={{ color: '#25D366' }}
      >
        <WhatsAppIcon />
      </IconButton>
    </Tooltip>
  ) : (
    <Button
      startIcon={<WhatsAppIcon />}
      onClick={handleClick}
      disabled={disabled}
      size={size}
      sx={{
        backgroundColor: '#25D366',
        color: 'white',
        '&:hover': {
          backgroundColor: '#128C7E',
        },
      }}
    >
      WhatsApp
    </Button>
  );

  return (
    <>
      {ButtonComponent}

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

          <Box sx={{ pt: 1 }}>
            <TextField
              label="Phone Number"
              placeholder="+1234567890"
              fullWidth
              margin="normal"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              helperText="Include country code (e.g., +1 for US/Canada)"
            />

            <TextField
              label="Message"
              multiline
              rows={6}
              fullWidth
              margin="normal"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
            onClick={sendMessage}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            disabled={loading || !formData.phone || !formData.message}
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

export default WhatsAppButton;