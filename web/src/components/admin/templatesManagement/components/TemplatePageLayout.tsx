import React from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton,
  Tooltip, CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

export interface TemplateItem {
  id: string;
  name: string;
  description?: string | null;
  /** Rendered below the name/description as metadata chips */
  meta?: React.ReactNode;
  /** Rendered as an expandable detail section */
  detail?: React.ReactNode;
}

interface Props {
  title: string;
  icon: React.ElementType;
  items: TemplateItem[];
  loading: boolean;
  isAdmin: boolean;
  emptyMessage?: string;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Reusable template list layout — same chrome for both Ticket and Epic templates.
 * Callers map their domain type to TemplateItem and pass action handlers.
 */
const TemplatePageLayout: React.FC<Props> = ({
  title, icon: Icon, items, loading, isAdmin,
  emptyMessage = 'No templates yet.',
  onCreate, onEdit, onDelete,
}) => {
  if (loading) {
    return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Icon color="primary" />
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <Chip label={items.length} size="small" variant="outlined" />
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} sx={{ borderRadius: 2 }}>
            New Template
          </Button>
        )}
      </Box>

      {/* Empty state */}
      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
          <Icon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" mb={2}>{emptyMessage}</Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} sx={{ borderRadius: 2 }}>
              Create First Template
            </Button>
          )}
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {items.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}
            >
              {/* Info */}
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>{item.name}</Typography>
                {item.description && (
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {item.description}
                  </Typography>
                )}
                {item.meta && (
                  <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                    {item.meta}
                  </Box>
                )}
                {item.detail && <Box mt={1}>{item.detail}</Box>}
              </Box>

              {/* Actions */}
              {isAdmin && (
                <Box display="flex" gap={0.5} flexShrink={0}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(item.id)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TemplatePageLayout;
