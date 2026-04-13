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
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface WhatsAppButtonProps {
  ticket?: {
    id: string;
    title: string;
    priority?: string;
    status?: string;
  };
  defaultPhone?: string;
  defaultMessage?: string;
  size?: 'small' | 'medium' | 'large';
  onSent?: (result: any) => void; // called after opening WhatsApp
  onError?: (error: string) => void;
}

// Simple, backend-free WhatsApp sharing using wa.me deep link.
// This opens WhatsApp (Web/Desktop/Mobile) with a prefilled message.
// User completes the send in WhatsApp. No QR, no polling, no backend.
const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  ticket,
  defaultPhone = '',
  defaultMessage = '',
  size = 'small',
  onSent,
  onError,
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone: defaultPhone,
    message: defaultMessage,
  });
  const [error, setError] = useState<string | null>(null);

  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(true);
    setError(null);
    // Initialize form each open to use latest defaults
    setFormData({ phone: defaultPhone, message: defaultMessage });
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const openWhatsApp = () => {
    try {
      setError(null);

      const digits = (formData.phone || '').replace(/\D/g, '');
      if (!digits) {
        setError('Enter a valid phone number with country code (e.g., +1...)');
        onError?.('Invalid phone number');
        return;
      }

      const text = formData.message?.trim() || '';
      if (!text) {
        setError('Message is required');
        onError?.('Message is required');
        return;
      }

      const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;

      // Open in new tab/window (works for Web/Desktop/Mobile)
      window.open(url, '_blank', 'noopener');

      // Optionally notify caller
      onSent?.({ to: digits, message: text, method: 'wa.me' });

      // Close dialog
      setOpen(false);
    } catch (e: any) {
      const msg = e?.message || 'Failed to open WhatsApp';
      setError(msg);
      onError?.(msg);
    }
  };

  const copyToClipboard = async () => {
    try {
      const text = formData.message?.trim() || '';
      if (!text) {
        setError('Nothing to copy');
        return;
      }
      await navigator.clipboard.writeText(text);
      setError(null);
    } catch (e) {
      setError('Failed to copy');
    }
  };

  return (
    <>
      <Tooltip title="Send via WhatsApp (opens WhatsApp)">
        <IconButton
          onClick={(e) => handleClick(e)}
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableScrollLock>
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

          {ticket && (
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
          )}

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
            This opens WhatsApp with your message prefilled. You will press Send in WhatsApp.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={copyToClipboard}
            startIcon={<CopyIcon />}
            variant="text"
          >
            Copy Message
          </Button>
          <Button
            onClick={openWhatsApp}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!formData.phone || !formData.message}
            sx={{
              backgroundColor: '#25D366',
              '&:hover': {
                backgroundColor: '#128C7E',
              },
            }}
          >
            Open WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WhatsAppButton;
