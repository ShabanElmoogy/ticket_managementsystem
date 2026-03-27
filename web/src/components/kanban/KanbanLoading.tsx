import React from 'react';
import { Box, CircularProgress, Typography, Skeleton } from '@mui/material';

interface KanbanLoadingProps {
  message?: string;
  showSkeleton?: boolean;
}

const KanbanLoading: React.FC<KanbanLoadingProps> = ({ 
  message = "Loading Kanban board...", 
  showSkeleton = false 
}) => {
  if (showSkeleton) {
    return (
      <Box sx={{ p: 2 }}>
        {/* Header skeleton */}
        <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
        
        {/* Columns skeleton */}
        <Box display="flex" gap={2}>
          {[1, 2, 3, 4].map((col) => (
            <Box key={col} sx={{ flex: 1 }}>
              <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
              {[1, 2, 3].map((card) => (
                <Skeleton 
                  key={card} 
                  variant="rectangular" 
                  height={120} 
                  sx={{ mb: 1, borderRadius: 1 }} 
                />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight="400px"
      gap={2}
    >
      <CircularProgress size={48} />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default KanbanLoading;