import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';

// Block shell with actions + drag and drop
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
    <Card
      variant="outlined"
      draggable={draggable}
      onDragStart={dragHandlers?.onDragStart}
      onDragOver={dragHandlers?.onDragOver}
      onDrop={dragHandlers?.onDrop}
      sx={{
        mb: 2,
        borderRadius: 2,
        borderColor: alpha(theme.palette.text.primary, 0.1),
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.4),
        },
      }}
    >
      <CardContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mb: 1 }}>
          {onMoveUp && (
            <Tooltip title="Move up">
              <IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={onMoveUp}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onMoveDown && (
            <Tooltip title="Move down">
              <IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={onMoveDown}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete block">
              <IconButton size="small" color="error" onMouseDown={(e) => e.stopPropagation()} onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
};

export default BlockContainer;