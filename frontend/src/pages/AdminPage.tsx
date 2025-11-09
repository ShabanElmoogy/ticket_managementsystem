import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../components/dashboard/Header';
import AdminPanel from '../components/admin/AdminPanel';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header onTicketClick={() => {}} />
      <AdminPanel onBackToDashboard={() => navigate('/')} />
    </Box>
  );
};

export default AdminPage;