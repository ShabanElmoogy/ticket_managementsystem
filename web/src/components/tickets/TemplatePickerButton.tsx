import React, { useState, useEffect } from 'react';
import {
  Button, Popover, Box, Typography, Divider,
  CircularProgress, List, ListItemButton, ListItemText,
} from '@mui/material';
import { Label as TemplateIcon } from '@mui/icons-material';
import { ticketTemplatesApi } from '../admin/templatesManagement';
import type { TicketTemplate } from '../../services/api/types';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626',
};

interface Props {
  onSelect: (t: TicketTemplate) => void;
}

const TemplatePickerButton: React.FC<Props> = ({ onSelect }) => {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ticketTemplatesApi.list()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const handlePick = (t: TicketTemplate) => {
    setAnchor(null);
    onSelect(t);
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<TemplateIcon fontSize="small" />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: 'text.secondary', textTransform: 'none' }}
      >
        Use Template
      </Button>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 240, maxHeight: 320 } } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block' }}>
          Ticket Templates
        </Typography>
        <Divider sx={{ mt: 0.5 }} />

        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={20} />
          </Box>
        )}

        {!loading && templates.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
            No templates available
          </Typography>
        )}

        {!loading && (
          <List dense disablePadding>
            {templates.map((t) => (
              <ListItemButton key={t.id} onClick={() => handlePick(t)}>
                <Box
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIORITY_COLORS[t.priority], mr: 1.5, flexShrink: 0 }}
                />
                <ListItemText
                  primary={t.name}
                  secondary={t.estimatedHours ? `${t.estimatedHours}h · ${t.priority}` : t.priority}
                  slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
};

export default TemplatePickerButton;
