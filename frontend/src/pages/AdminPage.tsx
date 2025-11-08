import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/dashboard/Header';
import AdminPanel from '../components/admin/AdminPanel';

const AdminPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <AdminPanel />
    </Box>
  );
};

export default AdminPage;