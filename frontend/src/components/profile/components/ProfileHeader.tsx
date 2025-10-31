import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  phone?: string;
}

interface ProfileHeaderProps {
  user: User | null;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
      <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
        {user?.name ? getInitials(user.name) : <PersonIcon />}
      </Avatar>
      <Box>
        <Typography variant="h5">{user?.name}</Typography>
        <Typography variant="body2" color="textSecondary">
          {user?.role}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileHeader;