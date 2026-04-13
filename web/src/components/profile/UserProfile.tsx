import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ProfileSettings from './ProfileSettings';

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableScrollLock>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        User Profile
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Settings" />
            <Tab label="Security" disabled />
            <Tab label="Notifications" disabled />
            <Tab label="Activity" disabled />
          </Tabs>
        </Box>

        <Box>
          {activeTab === 0 && <ProfileSettings />}
          {activeTab === 1 && <Typography>Security settings coming soon...</Typography>}
          {activeTab === 2 && <Typography>Notification settings coming soon...</Typography>}
          {activeTab === 3 && <Typography>Activity log coming soon...</Typography>}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;