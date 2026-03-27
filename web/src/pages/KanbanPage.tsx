import React from 'react';
import { Box } from '@mui/material';
import KanbanPageComponent from '../components/kanban/KanbanPage';

const KanbanPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <KanbanPageComponent />
    </Box>
  );
};

export default KanbanPage;