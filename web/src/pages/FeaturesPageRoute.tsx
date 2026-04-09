import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/dashboard/Header';
import FeaturesPage from '../components/features/FeaturesPage';

const FeaturesPageRoute: React.FC = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Header />
    <Box sx={{ pt: { xs: 8, sm: 9, md: 10 } }}>
      <FeaturesPage />
    </Box>
  </Box>
);

export default FeaturesPageRoute;
