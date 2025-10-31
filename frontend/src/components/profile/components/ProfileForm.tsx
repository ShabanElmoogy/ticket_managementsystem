import React from 'react';
import { Grid, TextField } from '@mui/material';

interface ProfileFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ formData, onInputChange }) => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Full Name"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Phone"
          value={formData.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
        />
      </Grid>
    </Grid>
  );
};

export default ProfileForm;