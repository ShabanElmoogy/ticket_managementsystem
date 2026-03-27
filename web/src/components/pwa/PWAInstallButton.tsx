import React, { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

interface PWAInstallButtonProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  showTooltip?: boolean;
  onVisible?: () => void;
}

const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'icon',
  size = 'medium',
  color = 'inherit',
  showTooltip = true,
  onVisible,
}) => {
  const theme = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (iOS Safari)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for PWA mode (Android Chrome)
      const isPWA = window.navigator.standalone === true;
      
      setIsInstalled(isStandalone || isPWA);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      showMessage('App installed successfully! 🎉', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showMessage = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Provide manual installation instructions for iOS
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        showMessage(
          'To install: Tap the Share button and select "Add to Home Screen"',
          'info'
        );
      } else {
        showMessage(
          'Installation not available. Try using Chrome or Edge browser.',
          'info'
        );
      }
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        showMessage('Installing app...', 'info');
      } else {
        showMessage('Installation cancelled', 'info');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during installation:', error);
      showMessage('Installation failed. Please try again.', 'error');
    }
  };

  // Don't show button if app is already installed
  if (isInstalled) {
    return null;
  }

  // Call onVisible if the button will be rendered (in effect, not render phase)
  React.useEffect(() => {
    if ((isInstallable || /iPad|iPhone|iPod/.test(navigator.userAgent)) && onVisible) {
      onVisible();
    }
    // Only run when installable state or onVisible changes
  }, [isInstallable, onVisible]);

  // Don't show button if not installable (except on iOS where we show manual instructions)
  if (!isInstallable && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return null;
  }

  const buttonContent = variant === 'icon' ? (
    <IconButton
      onClick={handleInstallClick}
      size={size}
      sx={{
        color: color === 'inherit' ? 'inherit' : theme.palette[color].main,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <InstallIcon />
    </IconButton>
  ) : (
    <Button
      onClick={handleInstallClick}
      startIcon={<InstallIcon />}
      variant="outlined"
      size={size}
      color={color}
      sx={{
        borderColor: 'rgba(255, 255, 255, 0.3)',
        color: 'white',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      Install App
    </Button>
  );

  const content = showTooltip ? (
    <Tooltip title="Install App" arrow>
      {buttonContent}
    </Tooltip>
  ) : (
    buttonContent
  );

  return (
    <>
      {content}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity={snackbarSeverity}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setShowSnackbar(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallButton;