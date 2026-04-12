import React from 'react';
import { Box, Tooltip, IconButton, useTheme, alpha } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const BlockContainer: React.FC<{
  children: React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  draggable?: boolean;
  dragHandlers?: {
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}> = ({ children, onMoveUp, onMoveDown, onDelete, draggable, dragHandlers }) => {
  const theme = useTheme();

  return (
    <Box
      draggable={draggable}
      onDragStart={dragHandlers?.onDragStart}
      onDragOver={dragHandlers?.onDragOver}
      onDrop={dragHandlers?.onDrop}
      sx={{
        position: 'relative',
        mb: 1.5,
        borderRadius: 1.5,
        border: '1px solid transparent',
        transition: 'border-color 0.15s',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.2),
          '& .block-actions': { opacity: 1 },
        },
        '&:hover .drag-handle': { opacity: 1 },
      }}
    >
      {/* Drag handle */}
      <Box
        className="drag-handle"
        sx={{
          position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)',
          opacity: 0, transition: 'opacity 0.15s', cursor: 'grab', color: 'text.disabled',
          display: 'flex', alignItems: 'center',
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 18 }} />
      </Box>

      {/* Block actions */}
      <Box
        className="block-actions"
        sx={{
          position: 'absolute', top: 6, right: 6, zIndex: 1,
          opacity: 0, transition: 'opacity 0.15s',
          display: 'flex', gap: 0.25,
          bgcolor: 'background.paper',
          border: '1px solid', borderColor: 'divider',
          borderRadius: 1, p: 0.25,
          boxShadow: 1,
        }}
      >
        {onMoveUp && (
          <Tooltip title="Move up" placement="top">
            <IconButton size="small" sx={{ p: 0.25 }} onMouseDown={e => e.stopPropagation()} onClick={onMoveUp}>
              <ArrowUpwardIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
        {onMoveDown && (
          <Tooltip title="Move down" placement="top">
            <IconButton size="small" sx={{ p: 0.25 }} onMouseDown={e => e.stopPropagation()} onClick={onMoveDown}>
              <ArrowDownwardIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete" placement="top">
            <IconButton size="small" sx={{ p: 0.25 }} color="error" onMouseDown={e => e.stopPropagation()} onClick={onDelete}>
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ p: 1.5 }}>
        {children}
      </Box>
    </Box>
  );
};

export default BlockContainer;
