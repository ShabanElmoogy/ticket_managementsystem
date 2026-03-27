import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Chip, MenuItem, Menu } from '@mui/material';
import {
  CheckCircle as ResolvedIcon,
  Cancel as ClosedIcon,
  Close as ClearIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import type { Ticket } from '../../services/api';

interface BulkActionBarProps {
  selectedIds: string[];
  onBulkStatus: (status: Ticket['status']) => Promise<void>;
  onClear: () => void;
}

const STATUSES: { label: string; value: Ticket['status']; color: string }[] = [
  { label: 'Open', value: 'OPEN', color: '#3b82f6' },
  { label: 'In Progress', value: 'IN_PROGRESS', color: '#f59e0b' },
  { label: 'Resolved', value: 'RESOLVED', color: '#10b981' },
  { label: 'Closed', value: 'CLOSED', color: '#6b7280' },
];

const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedIds, onBulkStatus, onClear }) => {
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleStatus = async (status: Ticket['status']) => {
    setAnchorEl(null);
    setLoading(true);
    try {
      await onBulkStatus(status);
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 16,
        zIndex: 100,
        mx: 1,
        mb: 2,
        px: 2,
        py: 1.5,
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : 'linear-gradient(135deg, #1e40af, #1d4ed8)',
        boxShadow: '0 4px 20px rgba(29,78,216,0.4)',
      }}
    >
      <Chip
        label={`${selectedIds.length} selected`}
        size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}
      />

      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', flex: 1 }}>
        Update status:
      </Typography>

      <Button
        variant="contained"
        size="small"
        endIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <ArrowDownIcon />}
        disabled={loading}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          bgcolor: 'rgba(255,255,255,0.15)',
          color: '#fff',
          fontWeight: 600,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' },
        }}
      >
        Set Status
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} disableScrollLock>
        {STATUSES.map((s) => (
          <MenuItem key={s.value} onClick={() => handleStatus(s.value)}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, mr: 1.5 }} />
            {s.label}
          </MenuItem>
        ))}
      </Menu>

      <Button
        size="small"
        startIcon={<ClearIcon />}
        onClick={onClear}
        disabled={loading}
        sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
      >
        Clear
      </Button>
    </Box>
  );
};

export default BulkActionBar;
