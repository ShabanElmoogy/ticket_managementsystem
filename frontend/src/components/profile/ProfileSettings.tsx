import React from "react";
import { Box, Button, Card, CardContent, Alert } from "@mui/material";
import { useProfileSettings } from "./hooks/useProfileSettings";
import ProfileHeader from "./components/ProfileHeader";
import ProfileForm from "./components/ProfileForm";
import ReminderSettings from "./components/ReminderSettings";

import { Role } from "../../types/roles";

const ProfileSettings: React.FC = () => {
  const {
    user,
    formData,
    reminderSettings,
    loading,
    message,
    handleInputChange,
    handleReminderChange,
    handleSave,
  } = useProfileSettings();

  return (
    <Box>
      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ProfileHeader user={user} />
          <ProfileForm formData={formData} onInputChange={handleInputChange} />
        </CardContent>
      </Card>

      {user?.role === Role.EMPLOYEE && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <ReminderSettings
              reminderSettings={reminderSettings}
              onReminderChange={handleReminderChange}
            />
          </CardContent>
        </Card>
      )}

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={loading}
        size="large"
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </Box>
  );
};

export default ProfileSettings;
