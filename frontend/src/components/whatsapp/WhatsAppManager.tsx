import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  QrCode as QrCodeIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface WhatsAppStatus {
  isReady: boolean;
  hasQRCode: boolean;
  qrCode?: string;
  isScanning?: boolean;
}

interface WhatsAppManagerProps {
  onStatusChange?: (status: WhatsAppStatus) => void;
}

const WhatsAppManager: React.FC<WhatsAppManagerProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<WhatsAppStatus>({ isReady: false, hasQRCode: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');

  // Get API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to check WhatsApp status. Please ensure the service is running.');
    }
  };

  const initializeWhatsApp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Use Baileys service for production (most reliable)
      await fetch(`${API_BASE_URL}/whatsapp/use-baileys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Initialize WhatsApp
      const response = await fetch(`${API_BASE_URL}/whatsapp/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('WhatsApp initialization started. Waiting for QR code...');
        setStatus(data.status);
        pollStatusForQR();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to initialize WhatsApp. Please check the service.');
    } finally {
      setLoading(false);
    }
  };

  const pollStatusForQR = () => {
    let pollCount = 0;
    const maxPolls = 40;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
        const data = await response.json();
        
        if (data.success) {
          setStatus(data.status);
          
          if (data.status.hasQRCode && !qrDialogOpen) {
            setQrDialogOpen(true);
            setSuccess('QR code ready! Please scan with your WhatsApp mobile app.');
          }
          
          if (data.status.isReady) {
            clearInterval(interval);
            setSuccess('WhatsApp connected successfully! 🎉');
            setQrDialogOpen(false);
            return;
          }
        }
        
        pollCount++;
        
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          if (!status.isReady && !status.hasQRCode) {
            setError('Connection timeout. Please try again.');
          }
        }
      } catch (error) {
        clearInterval(interval);
        setError('Connection lost. Please check the service.');
      }
    }, 500);

    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
      }
    }, 30000);
  };

  const sendMessage = async () => {
    if (!phoneNumber || !message) {
      setError('Phone number and message are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: message
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Message sent successfully!');
        setMessage(''); // Clear message after sending
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const sendTicketNotification = async (ticketData: any, recipients: Array<{name: string, phone: string}>, notificationType: string = 'created') => {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketData,
          recipients,
          notificationType
        })
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, summary: data.summary };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  };

  const disconnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/clear-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('WhatsApp disconnected successfully.');
        setStatus({ isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const resetService = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('WhatsApp service reset successfully. Try connecting again.');
        setStatus(data.status || { isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to reset service');
    } finally {
      setLoading(false);
    }
  };

  const forceRestart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/force-restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('WhatsApp service restarted. Try connecting again.');
        setStatus(data.status || { isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to restart service');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (status.isReady) return 'success';
    if (status.isScanning) return 'info';
    if (status.hasQRCode) return 'warning';
    return 'error';
  };

  const getStatusText = () => {
    if (status.isReady) return 'Connected';
    if (status.isScanning) return 'Connecting...';
    if (status.hasQRCode) return 'Waiting for QR Scan';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (status.isReady) return <CheckCircleIcon />;
    if (status.isScanning) return <CircularProgress size={20} />;
    if (status.hasQRCode) return <QrCodeIcon />;
    return <ErrorIcon />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WhatsAppIcon color="success" />
        WhatsApp Integration
      </Typography>

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Connection Status</Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={checkStatus}
              size="small"
              variant="outlined"
            >
              Refresh
            </Button>
          </Box>

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Chip
              icon={getStatusIcon()}
              label={getStatusText()}
              color={getStatusColor()}
              variant="filled"
            />
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap">
            {!status.isReady ? (
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={initializeWhatsApp}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect WhatsApp'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={disconnect}
                disabled={loading}
              >
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            )}

            {status.hasQRCode && (
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
                onClick={() => setQrDialogOpen(true)}
              >
                Show QR Code
              </Button>
            )}

            {/* Troubleshooting buttons */}
            {(status as any).connectionAttempts > 5 && (
              <Button
                variant="outlined"
                color="warning"
                onClick={resetService}
                disabled={loading}
              >
                Reset Service
              </Button>
            )}

            <Button
              variant="outlined"
              color="secondary"
              onClick={forceRestart}
              disabled={loading}
              size="small"
            >
              Force Restart
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Send Message Card */}
      {status.isReady && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Send Message
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Phone Number"
                  placeholder="+1234567890"
                  fullWidth
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  helperText="Include country code"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Message"
                  multiline
                  rows={2}
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={sendMessage}
                  disabled={loading || !phoneNumber || !message}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  Send
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={() => setQrDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {status.isScanning 
            ? 'Connecting to WhatsApp...' 
            : status.qrCode 
              ? 'Scan QR Code with WhatsApp' 
              : 'Generating QR Code...'
          }
          <IconButton onClick={() => setQrDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={2}>
            {status.isScanning ? (
              <>
                <CircularProgress size={80} sx={{ mb: 3 }} />
                <Typography variant="h6" textAlign="center" sx={{ mb: 2 }}>
                  QR Code Scanned Successfully! 📱
                </Typography>
                <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
                  Connecting to WhatsApp...
                </Typography>
                <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                  Please wait while your phone connects to WhatsApp Web. 
                  Keep your phone connected to the internet.
                </Alert>
              </>
            ) : status.qrCode ? (
              <>
                <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, mb: 2 }}>
                  <QRCode value={status.qrCode} size={256} />
                </Box>
                
                <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
                  <strong>QR Code Ready!</strong> Scan with your WhatsApp mobile app.
                </Alert>
                
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                  <strong>Steps to connect:</strong><br/>
                  1. Open WhatsApp on your phone<br/>
                  2. Go to Settings → Linked Devices<br/>
                  3. Tap "Link a Device"<br/>
                  4. Scan this QR code
                </Typography>
                
                <Alert severity="warning" sx={{ width: '100%' }}>
                  <strong>Important:</strong> Close WhatsApp Web in other browser tabs first! 
                  WhatsApp only allows one web session at a time.
                </Alert>
              </>
            ) : (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
                  Generating QR code...
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  This may take a few seconds. Please wait...
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>
            Close
          </Button>
          <Button 
            onClick={checkStatus}
            variant="outlined"
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Export the sendTicketNotification function for use in other components
export const useWhatsAppNotifications = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  
  const sendTicketNotification = async (
    ticketData: any, 
    recipients: Array<{name: string, phone: string}>, 
    notificationType: string = 'created'
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketData,
          recipients,
          notificationType
        })
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, summary: data.summary };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  };

  return { sendTicketNotification };
};

export default WhatsAppManager;