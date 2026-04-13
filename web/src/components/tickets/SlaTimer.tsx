import React, { useState, useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Timer as TimerIcon } from '@mui/icons-material';
import { formatDateTime } from '../../shared/utils/dateUtils';

interface SlaTimerProps {
  slaDeadline: string;
  status: string;
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) {
    const abs = Math.abs(ms);
    const h = Math.floor(abs / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    return `-${h}h ${m}m`;
  }
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const SlaTimer: React.FC<SlaTimerProps> = ({ slaDeadline, status }) => {
  const [remaining, setRemaining] = useState(() => new Date(slaDeadline).getTime() - Date.now());

  const resolved = ['RESOLVED', 'CLOSED'].includes(status);

  useEffect(() => {
    if (resolved) return;
    const id = setInterval(() => {
      setRemaining(new Date(slaDeadline).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [slaDeadline, resolved]);

  const breached = remaining <= 0;
  const warning = !breached && remaining < 3600000; // < 1h

  const color = resolved ? 'text.disabled' : breached ? '#ef4444' : warning ? '#f59e0b' : '#10b981';
  const bg = resolved
    ? 'rgba(0,0,0,0.04)'
    : breached
    ? 'rgba(239,68,68,0.1)'
    : warning
    ? 'rgba(245,158,11,0.1)'
    : 'rgba(16,185,129,0.1)';

  const label = resolved ? 'SLA: Resolved' : breached ? `SLA Breached ${formatDuration(remaining)}` : `SLA: ${formatDuration(remaining)}`;

  return (
    <Tooltip title={`SLA deadline: ${formatDateTime(slaDeadline)}`}>
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          bgcolor: bg,
          border: '1px solid',
          borderColor: color,
          animation: breached && !resolved ? 'slaPulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes slaPulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.6 },
          },
        }}
      >
        <TimerIcon sx={{ fontSize: 16, color }} />
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default SlaTimer;
