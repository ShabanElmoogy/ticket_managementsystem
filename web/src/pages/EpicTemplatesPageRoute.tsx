import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/dashboard/Header';
import EpicTemplatesPage from '../components/epics/EpicTemplatesPage';

const EpicTemplatesPageRoute: React.FC = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Header />
    <Box sx={{ pt: { xs: 8, sm: 9, md: 10 } }}>
      <EpicTemplatesPage />
    </Box>
  </Box>
);

export default EpicTemplatesPageRoute;
