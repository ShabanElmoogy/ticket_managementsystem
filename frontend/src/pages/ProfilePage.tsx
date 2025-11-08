import React from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from '../components/dashboard/Header';
import AdvancedProfile from '../components/profile/AdvancedProfile';

const ProfilePage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64, md: 70 } }} />
      <Box sx={{ p: 3 }}>
        <AdvancedProfile />
      </Box>
    </Box>
  );
};

export default ProfilePage;