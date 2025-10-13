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
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  QrCode as QrCodeIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface WhatsAppStatus {
  isReady: boolean;
  hasQRCode: boolean;
  qrCode?: string;
  isScanning?: boolean;
  scanStartTime?: number;
  connectionTime?: number;
}

const WhatsAppTestPage: React.FC = () => {
  // Get API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  const [status, setStatus] = useState<WhatsAppStatus>({ isReady: false, hasQRCode: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  
  // Test form states
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from the ticket management system 🎫');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [qrRefreshCount, setQrRefreshCount] = useState(0);

  useEffect(() => {
    checkStatus();
  }, []);

  // Auto-refresh QR code if dialog is open but no QR code after some time
  useEffect(() => {
    if (qrDialogOpen && !status.qrCode && !status.isReady) {
      const timeout = setTimeout(() => {
        console.log('QR code not available, attempting refresh...');
        refreshQRCode();
      }, 10000); // Wait 10 seconds then try to refresh

      return () => clearTimeout(timeout);
    }
  }, [qrDialogOpen, status.qrCode, status.isReady]);

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
      setError('Failed to check WhatsApp status. Make sure the backend service is running.');
    }
  };

  const refreshQRCode = async () => {
    if (qrRefreshCount >= 3) {
      setError('QR code refresh limit reached. Please try "Force Restart" or "Use Reliable Mode".');
      return;
    }

    setQrRefreshCount(prev => prev + 1);
    setError(null);
    setSuccess(`Refreshing QR code... (attempt ${qrRefreshCount + 1}/3)`);

    try {
      // Force restart to generate new QR code
      await fetch(`${API_BASE_URL}/whatsapp/force-restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Wait a moment then reinitialize
      setTimeout(async () => {
        await initializeWhatsApp();
      }, 2000);
    } catch (error) {
      setError('Failed to refresh QR code. Please try manually.');
    }
  };

  const initializeWhatsApp = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('WhatsApp initialization started. Waiting for QR code...');
        setStatus(data.status);
        
        // Start polling immediately for QR code
        pollStatusForQR();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to initialize WhatsApp. Check if backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  const pollStatusForQR = () => {
    let pollCount = 0;
    const maxPolls = 40; // 40 polls * 500ms = 20 seconds
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
        const data = await response.json();
        
        if (data.success) {
          setStatus(data.status);
          
          // If QR code is available and dialog isn't open yet, open it
          if (data.status.hasQRCode && !qrDialogOpen) {
            setQrDialogOpen(true);
            setSuccess('QR code ready! Please scan with your WhatsApp mobile app.');
          }
          
          // If connected, stop polling and close dialog
          if (data.status.isReady) {
            clearInterval(interval);
            setSuccess('WhatsApp connected successfully! 🎉');
            setQrDialogOpen(false);
            setQrRefreshCount(0); // Reset refresh count on success
            return;
          }
          
          // If no QR code after some time, show helpful message
          if (!data.status.hasQRCode && !data.status.isReady && pollCount > 10) {
            setError('QR code not generated yet. Try using "Reliable Mode" or "Force Restart".');
          }
        }
        
        pollCount++;
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          if (!status.isReady && !status.hasQRCode) {
            setError('QR code generation timeout. Please try "Use Reliable Mode" or "Force Restart".');
          }
        }
      } catch (error) {
        clearInterval(interval);
        setError('Connection lost. Please check if backend service is running.');
      }
    }, 500); // Poll every 500ms for faster QR code detection

    // Also set a backup timeout
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
      }
    }, 30000); // 30 seconds total timeout
  };

  const sendTestMessage = async () => {
    if (!testPhone || !testMessage) {
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
          to: testPhone,
          message: testMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Message sent successfully! Check your WhatsApp.');
        setTestResults(prev => [...prev, {
          type: 'message',
          timestamp: new Date(),
          phone: testPhone,
          message: testMessage,
          success: true,
          result: data.result
        }]);
      } else {
        setError(data.message);
        setTestResults(prev => [...prev, {
          type: 'message',
          timestamp: new Date(),
          phone: testPhone,
          message: testMessage,
          success: false,
          error: data.message
        }]);
      }
    } catch (error) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const sendTestTicketNotification = async () => {
    if (!testPhone) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError(null);

    const testTicket = {
      id: `TEST-${Date.now()}`,
      title: 'Test Ticket from App',
      priority: 'HIGH',
      status: 'OPEN',
      assignee: 'Test User',
      customer: 'Test Customer',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketData: testTicket,
          recipients: [{ name: 'Test User', phone: testPhone }],
          notificationType: 'created'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Ticket notification sent! ${data.summary.successful} successful, ${data.summary.failed} failed`);
        setTestResults(prev => [...prev, {
          type: 'notification',
          timestamp: new Date(),
          phone: testPhone,
          ticket: testTicket,
          success: true,
          result: data
        }]);
      } else {
        setError(data.message);
        setTestResults(prev => [...prev, {
          type: 'notification',
          timestamp: new Date(),
          phone: testPhone,
          ticket: testTicket,
          success: false,
          error: data.message
        }]);
      }
    } catch (error) {
      setError('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/clear-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Session cleared successfully! You can now scan a new QR code.');
        setStatus({ isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
        
        // Wait a moment then check status
        setTimeout(() => {
          checkStatus();
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to clear session');
    } finally {
      setLoading(false);
    }
  };

  const forceRestart = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/force-restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('WhatsApp client force restarted! Wait a moment and try connecting again.');
        setStatus({ isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
        
        // Wait longer for force restart
        setTimeout(() => {
          checkStatus();
        }, 5000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to force restart');
    } finally {
      setLoading(false);
    }
  };

  const useReliableService = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/use-reliable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Switched to Reliable Mode! This mode has better error handling and automatic recovery. Try connecting now.');
        setStatus({ isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
        
        // Wait a moment then check status
        setTimeout(() => {
          checkStatus();
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to switch to reliable mode');
    } finally {
      setLoading(false);
    }
  };

  const useSimpleService = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/use-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Switched to Simple Mode! This mode is faster but requires scanning QR code each time. Try connecting now.');
        setStatus({ isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
        
        // Wait a moment then check status
        setTimeout(() => {
          checkStatus();
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to switch to simple mode');
    } finally {
      setLoading(false);
    }
  };

  const useBaileysService = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/use-baileys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Switched to Baileys Mode! This is the most modern and stable WhatsApp library. No Puppeteer, better connection reliability. Try connecting now.');
        setStatus({ isReady: false, hasQRCode: false });
        setQrDialogOpen(false);
        setQrRefreshCount(0); // Reset refresh count
        
        // Wait a moment then check status
        setTimeout(() => {
          checkStatus();
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to switch to Baileys mode');
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
        WhatsApp Integration Test
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
            {status.isScanning && status.scanStartTime && (
              <Typography variant="caption" color="text.secondary">
                Connecting for {Math.round((Date.now() - status.scanStartTime) / 1000)}s...
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap">
            {!status.isReady && (
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={initializeWhatsApp}
                disabled={loading}
              >
                {loading ? 'Initializing...' : 'Connect WhatsApp'}
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

            <Button
              variant="outlined"
              color="warning"
              onClick={clearSession}
              disabled={loading}
            >
              {loading ? 'Clearing...' : 'Clear Session'}
            </Button>

            <Button
              variant="outlined"
              color="error"
              onClick={forceRestart}
              disabled={loading}
            >
              {loading ? 'Restarting...' : 'Force Restart'}
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={useBaileysService}
              disabled={loading}
              sx={{ 
                background: 'linear-gradient(45deg, #25D366 30%, #128C7E 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #128C7E 30%, #25D366 90%)',
                }
              }}
            >
              {loading ? 'Switching...' : 'Use Baileys (Recommended)'}
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={useReliableService}
              disabled={loading}
            >
              {loading ? 'Switching...' : 'Use Reliable Mode'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={useSimpleService}
              disabled={loading}
            >
              {loading ? 'Switching...' : 'Try Simple Mode'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts */}
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

      {status.isScanning && status.scanStartTime && (Date.now() - status.scanStartTime) > 15000 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Connection is taking longer than usual...</strong> This can happen if:
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li>Your phone has a slow internet connection</li>
            <li>WhatsApp servers are busy</li>
            <li>WhatsApp Web is open in another browser</li>
          </ul>
          Please wait a bit longer or try "Force Restart" if it doesn't connect within 60 seconds.
        </Alert>
      )}

      {/* Test Controls */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MessageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Send Test Message
              </Typography>
              
              <TextField
                label="Phone Number"
                placeholder="+1234567890"
                fullWidth
                margin="normal"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                helperText="Include country code (e.g., +1 for US)"
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <TextField
                label="Message"
                multiline
                rows={3}
                fullWidth
                margin="normal"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
              
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={sendTestMessage}
                disabled={loading || !status.isReady}
                fullWidth
                sx={{ mt: 2 }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Send Ticket Notification
              </Typography>
              
              <TextField
                label="Phone Number"
                placeholder="+1234567890"
                fullWidth
                margin="normal"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                helperText="Will send a formatted ticket notification"
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  This will send a formatted ticket notification with:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                  <li>Ticket ID and title</li>
                  <li>Priority and status</li>
                  <li>Assignee and customer info</li>
                  <li>Professional formatting with emojis</li>
                </Typography>
              </Paper>
              
              <Button
                variant="contained"
                startIcon={<NotificationsIcon />}
                onClick={sendTestTicketNotification}
                disabled={loading || !status.isReady}
                fullWidth
                sx={{ mt: 2 }}
                color="secondary"
              >
                {loading ? 'Sending...' : 'Send Ticket Notification'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            
            <List>
              {testResults.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {result.success ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">
                            {result.type === 'message' ? 'Test Message' : 'Ticket Notification'}
                          </Typography>
                          <Chip
                            label={result.success ? 'Success' : 'Failed'}
                            size="small"
                            color={result.success ? 'success' : 'error'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            To: {result.phone} • {result.timestamp.toLocaleTimeString()}
                          </Typography>
                          {result.success && result.result?.messageId && (
                            <Typography variant="caption" color="text.secondary">
                              Message ID: {result.result.messageId.substring(0, 20)}...
                            </Typography>
                          )}
                          {!result.success && (
                            <Typography variant="caption" color="error">
                              Error: {result.error}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < testResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={() => setQrDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={status.qrCode ? false : true} // Prevent closing while loading
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          {status.isScanning 
            ? 'Connecting to WhatsApp...' 
            : status.qrCode 
              ? 'Scan QR Code with WhatsApp' 
              : 'Generating QR Code...'
          }
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
                {status.scanStartTime && (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Connection time: {Math.round((Date.now() - status.scanStartTime) / 1000)} seconds
                  </Typography>
                )}
                <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                  <strong>Please wait...</strong> Your phone is connecting to WhatsApp Web. 
                  This usually takes 10-30 seconds. Keep your phone connected to the internet.
                </Alert>
              </>
            ) : status.qrCode ? (
              <>
                <Box sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, mb: 2 }}>
                  <QRCode value={status.qrCode} size={256} />
                </Box>
                
                <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
                  <strong>✅ QR Code Ready!</strong> Scan now with your WhatsApp mobile app.
                </Alert>
                
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                  <strong>Steps to connect:</strong><br/>
                  1. Open WhatsApp on your phone<br/>
                  2. Go to Settings → Linked Devices<br/>
                  3. Tap "Link a Device"<br/>
                  4. Scan this QR code quickly (expires in 20 seconds)
                </Typography>
                
                <Alert severity="warning" sx={{ mb: 2, width: '100%' }}>
                  <strong>⚠️ Important:</strong> Close WhatsApp Web in other browser tabs first! 
                  WhatsApp only allows one web session at a time.
                </Alert>
                
                <Alert severity="info" sx={{ width: '100%' }}>
                  Keep this dialog open while scanning. It will close automatically when connected.
                  If the QR code expires, a new one will be generated automatically.
                </Alert>
              </>
            ) : (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
                  {qrRefreshCount > 0 ? `Refreshing QR code... (attempt ${qrRefreshCount + 1}/3)` : 'Generating QR code...'}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {qrRefreshCount > 0 
                    ? 'Attempting to generate a new QR code. Please wait...'
                    : 'This may take a few seconds. If it takes too long, try clicking "Use Reliable Mode" or "Force Restart" and then "Connect WhatsApp" again.'
                  }
                </Typography>
                {qrRefreshCount > 0 && (
                  <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                    Auto-refreshing QR code due to loading timeout. This should resolve the issue.
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button 
            onClick={() => setQrDialogOpen(false)}
            color="inherit"
          >
            Close
          </Button>
          <Box>
            {!status.qrCode && (
              <Button 
                onClick={refreshQRCode}
                variant="outlined"
                startIcon={<RefreshIcon />}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Refresh QR Code
              </Button>
            )}
            <Button 
              onClick={checkStatus}
              variant="outlined"
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              Check Status
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Test
          </Typography>
          <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
            <li>Click "Connect WhatsApp" to initialize the service</li>
            <li>Scan the QR code with your WhatsApp mobile app</li>
            <li>Enter your phone number in the test form</li>
            <li>Send a test message or ticket notification</li>
            <li>Check your WhatsApp to see the messages</li>
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Note:</strong> Make sure the backend WhatsApp service is running. 
            If you see connection errors, start the service with: 
            <code style={{ marginLeft: 8 }}>cd backend && npm run dev</code>
          </Alert>

          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>⚠️ IMPORTANT:</strong> Close WhatsApp Web before scanning!
            <Typography variant="body2" sx={{ mt: 1 }}>
              WhatsApp only allows ONE web session at a time. If you have WhatsApp Web 
              open in another browser tab/window, close it first before scanning the QR code.
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>🚀 RECOMMENDED:</strong> Use "Baileys (Recommended)" for best results!
            <Typography variant="body2" sx={{ mt: 1 }}>
              Baileys is a modern, lightweight WhatsApp library that doesn't use Puppeteer. 
              It's more stable, faster, and has better connection reliability than the older libraries.
              This is the most advanced option available.
            </Typography>
          </Alert>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>📚 Library Comparison:</strong>
            <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
              <li><strong>Baileys (Recommended):</strong> Modern, no Puppeteer, WebSocket-based, most stable</li>
              <li><strong>Reliable Mode:</strong> Enhanced whatsapp-web.js with better error handling</li>
              <li><strong>Simple Mode:</strong> Basic whatsapp-web.js, requires QR scan each time</li>
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Troubleshooting Connection Issues:</strong>
            <Typography variant="body2" component="ol" sx={{ mt: 1, pl: 2 }}>
              <li><strong>QR code not appearing:</strong> Click "Use Baileys (Recommended)" first, then "Force Restart"</li>
              <li><strong>QR code loading forever:</strong> Close WhatsApp Web in other browser tabs first</li>
              <li><strong>QR code expires quickly:</strong> Scan within 60 seconds (Baileys has longer timeout)</li>
              <li><strong>Scanned but won't connect:</strong> 
                <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                  <li>Try "Use Baileys (Recommended)" - it's more reliable</li>
                  <li>Close WhatsApp Web in ALL other browsers/tabs</li>
                  <li>Check your phone's internet connection</li>
                  <li>Wait 30 seconds - connection can take time</li>
                  <li>Don't scan multiple times quickly</li>
                </ul>
              </li>
              <li><strong>Connection timeout:</strong> Try "Clear Session" → "Use Baileys" → "Connect WhatsApp"</li>
              <li><strong>Authentication failed:</strong> Wait 2 minutes, then try "Force Restart"</li>
              <li><strong>Backend errors:</strong> Make sure backend service is running with <code>cd backend && npm run dev</code></li>
            </Typography>
          </Alert>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>🔄 Auto-Refresh Feature:</strong> The QR code will automatically refresh if it doesn't appear within 10 seconds. 
            You can also manually refresh using the button in the QR dialog.
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default WhatsAppTestPage;