import React, { useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

interface ResetPasswordDialogProps {
  open: boolean;
  userName?: string;
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open, userName, value, loading, onChange, onClose, onConfirm,
}) => {
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 100);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock>
      <DialogTitle>Reset Password — {userName}</DialogTitle>
      <DialogContent>
        <TextField
          inputRef={firstFieldRef}
          label="New Password"
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          sx={{ mt: 1 }}
          helperText="Minimum 6 characters"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} disabled={value.length < 6 || loading} variant="contained">
          {loading ? 'Resetting…' : 'Reset'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResetPasswordDialog;
