import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface ConfirmTextDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmWord?: string; // Word the user must type to enable confirm
  loading?: boolean;
  errorText?: string; // Optional extra warning text
}

const ConfirmTextDialog: React.FC<ConfirmTextDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  confirmWord = 'DELETE',
  loading = false,
  errorText,
}) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Reset when opened/closed
    if (!open) {
      setValue('');
      setIsValid(false);
    }
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

        <TextField
          fullWidth
          label={`Type ${confirmWord} to confirm`}
          placeholder={confirmWord}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={!isValid || loading}
          startIcon={loading ? undefined : <DeleteIcon />}
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          {loading ? 'Deleting...' : 'Delete Related Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmTextDialog;
