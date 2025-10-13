import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

export interface UsersHeaderProps {
  onAdd: () => void;
}

const UsersHeader: React.FC<UsersHeaderProps> = ({ onAdd }) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h4" component="h1">
        User Management
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        Add User
      </Button>
    </Box>
  );
};

export default UsersHeader;
