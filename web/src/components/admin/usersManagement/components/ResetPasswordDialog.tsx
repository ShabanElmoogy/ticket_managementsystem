import React, { useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import AppTextField from '../../../../shared/components/inputs/AppTextField';

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
        <AppTextField
          fieldType="password"
          inputRef={firstFieldRef}
          label="New Password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={32}
          fullWidth
          sx={{ mt: 1 }}
          helperText="Minimum 6 characters"
          showClearButton
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
