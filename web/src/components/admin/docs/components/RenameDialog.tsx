import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface Props {
  open: boolean;
  initial: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

const RenameDialog: React.FC<Props> = ({ open, initial, onClose, onConfirm }) => {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setVal(initial); setTimeout(() => ref.current?.focus(), 80); }
  }, [open, initial]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock>
      <DialogTitle sx={{ pb: 1 }}>Rename</DialogTitle>
      <DialogContent>
        <TextField
          inputRef={ref} fullWidth size="small" value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onConfirm(val.trim()); onClose(); } }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button variant="contained" size="small" disabled={!val.trim()} onClick={() => { onConfirm(val.trim()); onClose(); }}>
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameDialog;
