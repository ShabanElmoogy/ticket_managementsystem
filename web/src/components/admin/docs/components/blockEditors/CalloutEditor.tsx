import React from 'react';
import { Box, TextField, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { CalloutBlock, CalloutType, BlockSettings } from '../../types';

const TYPES: { value: CalloutType; icon: React.ReactNode; color: string; label: string }[] = [
  { value: 'info',    icon: <InfoIcon sx={{ fontSize: 16 }} />,         color: '#3b82f6', label: 'Info' },
  { value: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,  color: '#10b981', label: 'Success' },
  { value: 'warning', icon: <WarningIcon sx={{ fontSize: 16 }} />,      color: '#f59e0b', label: 'Warning' },
  { value: 'error',   icon: <ErrorIcon sx={{ fontSize: 16 }} />,        color: '#ef4444', label: 'Error' },
];

const CalloutEditor: React.FC<{
  block: CalloutBlock;
  onChange: (p: Partial<CalloutBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (p: Partial<BlockSettings>) => void;
}> = ({ block, onChange }) => {
  const ct = block.calloutType ?? 'info';
  const color = TYPES.find(t => t.value === ct)?.color ?? '#3b82f6';
  return (
    <Box>
      <ToggleButtonGroup exclusive size="small" value={ct} onChange={(_, v) => v && onChange({ calloutType: v })} sx={{ mb: 1.5 }}>
        {TYPES.map(t => (
          <Tooltip key={t.value} title={t.label}>
            <ToggleButton value={t.value} sx={{ px: 1.5, color: t.color, '&.Mui-selected': { bgcolor: `${t.color}18`, color: t.color } }}>
              {t.icon}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
      <Box sx={{ borderLeft: `4px solid ${color}`, borderRadius: 1, bgcolor: `${color}0d`, p: 1.5 }}>
        <TextField multiline minRows={2} fullWidth size="small" placeholder="Callout message…"
          value={block.text ?? ''} onChange={e => onChange({ text: e.target.value })}
          sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiOutlinedInput-root': { p: 0 } }} />
      </Box>
    </Box>
  );
};

export default CalloutEditor;
