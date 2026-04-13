import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import AppTextField from './inputs/AppTextField';

export interface AppConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  /** Word the user must type to enable confirm */
  confirmWord?: string;
  loading?: boolean;
  /** Optional extra warning text */
  errorText?: string;
  /** Custom confirm button label. Default: 'Delete Related Data' */
  confirmLabel?: string;
  /** Custom cancel button label. Default: 'Cancel' */
  cancelLabel?: string;
  /** Custom confirm button color. Default: 'error' */
  confirmColor?: 'error' | 'warning' | 'primary';
}

const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  confirmWord = 'DELETE',
  loading = false,
  errorText,
  confirmLabel = 'Delete Related Data',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
}) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setValue('');
      setIsValid(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    setIsValid(value.trim() === confirmWord);
  }, [value, confirmWord]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'error.light',
              color: 'error.contrastText',
            }}
          >
            <WarningIcon />
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {typeof message === 'string' ? (
          <Typography variant="body1" sx={{ mb: 2 }}>
            {message}
          </Typography>
        ) : (
          <Box sx={{ mb: 2 }}>{message}</Box>
        )}

        {errorText && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errorText}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          This action will also delete related data and cannot be undone.
        </Typography>

        <AppTextField
          inputRef={firstFieldRef}
          fullWidth
          label={`Type ${confirmWord} to confirm`}
          placeholder={confirmWord}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          showClearButton={false}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={!isValid || loading}
          startIcon={loading ? undefined : <DeleteIcon />}
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          {loading ? `${confirmLabel}ing…` : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppConfirmDialog;

// Legacy alias
export { AppConfirmDialog as ConfirmTextDialog };
