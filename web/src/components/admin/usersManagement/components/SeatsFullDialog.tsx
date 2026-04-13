import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';

interface SeatsFullDialogProps {
  open: boolean;
  onClose: () => void;
  used: number;
  total: number;
}

const SeatsFullDialog: React.FC<SeatsFullDialogProps> = ({ open, onClose, used, total }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock>
    <DialogTitle>Seats limit reached</DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mt: 1 }}>
        Your tenant has reached the maximum number of users for the current subscription.
        {total > 0 ? ` (${used}/${total} seats used)` : ''}
      </Alert>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">OK</Button>
    </DialogActions>
  </Dialog>
);

export default SeatsFullDialog;
