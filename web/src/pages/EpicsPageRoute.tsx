import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/dashboard/Header';
import EpicsPage from '../components/epics/EpicsPage';

const EpicsPageRoute: React.FC = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Header />
    <Box sx={{ pt: { xs: 8, sm: 9, md: 10 } }}>
      <EpicsPage />
    </Box>
  </Box>
);

export default EpicsPageRoute;
