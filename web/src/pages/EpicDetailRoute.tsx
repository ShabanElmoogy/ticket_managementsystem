import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/dashboard/Header';
import EpicDetailPage from '../components/epics/detail/EpicDetailPage';

const EpicDetailRoute: React.FC = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Header />
    <Box sx={{ pt: { xs: 8, sm: 9, md: 10 } }}>
      <EpicDetailPage />
    </Box>
  </Box>
);

export default EpicDetailRoute;
